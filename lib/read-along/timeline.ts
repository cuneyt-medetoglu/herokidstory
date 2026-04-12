/**
 * Timeline orchestrator — generates and caches word-level timelines.
 * Strategy: Whisper if available, heuristic fallback.
 */

import crypto from "crypto"
import { uploadFile, getSignedObjectUrl, fileExists, getObjectBuffer } from "@/lib/storage/s3"
import { generateHeuristicTimeline } from "./timeline-heuristic"
import { generateWhisperTimeline, isWhisperAvailable } from "./timeline-whisper"
import { chunkWords } from "./chunker"
import type {
  PageTimeline,
  TimelineGenerateOptions,
  TimelineResult,
  TimelineStrategy,
  WordTiming,
} from "./types"

const TIMELINE_CACHE_PREFIX = "tts-cache"

/**
 * Cache key based on text content + language only.
 * Audio URL is excluded because S3 signed URLs change on every request,
 * which would cause perpetual cache misses.
 */
function timelineCacheKey(text: string, _audioUrl: string, language: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(`timeline_v2|${text}|${language}`)
    .digest("hex")
  return `${TIMELINE_CACHE_PREFIX}/${hash}_timeline.json`
}

async function getCachedTimeline(cacheKey: string): Promise<PageTimeline | null> {
  try {
    const exists = await fileExists(cacheKey)
    if (!exists) return null
    const obj = await getObjectBuffer(cacheKey)
    if (!obj) return null
    return JSON.parse(obj.buffer.toString("utf-8"))
  } catch {
    return null
  }
}

async function saveTimelineCache(cacheKey: string, timeline: PageTimeline): Promise<void> {
  try {
    const json = JSON.stringify(timeline)
    const buffer = Buffer.from(json, "utf-8")
    const fileName = cacheKey.split("/").pop()!
    await uploadFile(TIMELINE_CACHE_PREFIX, fileName, buffer, "application/json")
  } catch (err) {
    console.error("[Timeline] Cache save failed:", err)
  }
}

/**
 * Gets actual audio duration by downloading the MP3 and parsing frame headers.
 * MP3 frame duration = samples_per_frame / sample_rate.
 * Falls back to file-size estimate if parsing fails.
 */
async function getAudioDurationMs(audioUrl: string): Promise<number> {
  try {
    const response = await fetch(audioUrl)
    if (!response.ok) {
      console.warn(`[Timeline] Audio fetch failed: HTTP ${response.status}`)
      return 5000
    }

    const arrayBuffer = await response.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const fileSize = bytes.length

    console.log(`[Timeline] Audio downloaded: ${fileSize} bytes`)

    // Try to parse MP3 frames for accurate duration
    const durationMs = parseMp3Duration(bytes)
    if (durationMs > 0) {
      console.log(`[Timeline] MP3 parsed duration: ${durationMs}ms (${(durationMs / 1000).toFixed(1)}s)`)
      return durationMs
    }

    // Fallback: estimate from file size. Google TTS typically produces ~32kbps MP3.
    // Try multiple common bitrates and pick the middle ground.
    const estimatedMs = Math.round((fileSize / 24_000) * 1000)
    console.log(`[Timeline] MP3 parse failed, file-size estimate: ${estimatedMs}ms (${fileSize} bytes @ ~192kbps assumed)`)
    return Math.max(estimatedMs, 1000)
  } catch (err) {
    console.warn("[Timeline] Audio duration fetch failed:", err)
    return 5000
  }
}

/**
 * Parse MP3 frames to calculate total duration.
 * Supports MPEG1/2/2.5 Layer III (most common for TTS output).
 */
function parseMp3Duration(bytes: Uint8Array): number {
  const SAMPLE_RATES: Record<number, number[]> = {
    0: [11025, 12000, 8000],  // MPEG 2.5
    2: [22050, 24000, 16000], // MPEG 2
    3: [44100, 48000, 32000], // MPEG 1
  }

  const BITRATES_V1_L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
  const BITRATES_V2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0]

  let offset = 0
  let totalMs = 0
  let frameCount = 0

  // Skip ID3v2 tag if present
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    const tagSize =
      ((bytes[6] & 0x7f) << 21) |
      ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7) |
      (bytes[9] & 0x7f)
    offset = 10 + tagSize
  }

  while (offset < bytes.length - 4) {
    // Find sync word: 11 bits set (0xFF followed by 0xE0+)
    if (bytes[offset] !== 0xFF || (bytes[offset + 1] & 0xE0) !== 0xE0) {
      offset++
      continue
    }

    const header = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]

    const versionBits = (header >> 19) & 0x03
    const layerBits = (header >> 17) & 0x03
    const bitrateIdx = (header >> 12) & 0x0F
    const srIdx = (header >> 10) & 0x03
    const padding = (header >> 9) & 0x01

    if (versionBits === 1 || layerBits === 0 || bitrateIdx === 0 || bitrateIdx === 15 || srIdx === 3) {
      offset++
      continue
    }

    const sampleRates = SAMPLE_RATES[versionBits]
    if (!sampleRates) { offset++; continue }
    const sampleRate = sampleRates[srIdx]

    const isV1 = versionBits === 3
    const bitrate = (isV1 ? BITRATES_V1_L3[bitrateIdx] : BITRATES_V2_L3[bitrateIdx]) * 1000

    if (bitrate === 0 || sampleRate === 0) { offset++; continue }

    const samplesPerFrame = isV1 ? 1152 : 576
    const frameDurationMs = (samplesPerFrame / sampleRate) * 1000
    const frameSize = Math.floor((samplesPerFrame * (bitrate / 8)) / sampleRate) + padding

    if (frameSize < 1) { offset++; continue }

    totalMs += frameDurationMs
    frameCount++
    offset += frameSize
  }

  if (frameCount > 0) {
    console.log(`[Timeline] MP3 frames: ${frameCount}, total: ${Math.round(totalMs)}ms`)
  }

  return Math.round(totalMs)
}

/**
 * Generate word-level timeline for a page.
 * Tries Whisper first (if available), falls back to heuristic.
 */
export async function generateTimeline(
  options: TimelineGenerateOptions
): Promise<TimelineResult> {
  const { text, audioUrl, language, pageNumber, strategy: preferredStrategy, chunkSize = 3, forceRefresh = false } = options

  const wordCount = text.split(/\s+/).filter(Boolean).length
  console.log(`[Timeline] Page ${pageNumber}: ${wordCount} words, lang=${language}, forceRefresh=${forceRefresh}`)

  const cacheKey = timelineCacheKey(text, audioUrl, language)
  if (!forceRefresh) {
    const cached = await getCachedTimeline(cacheKey)
    if (cached) {
      console.log(`[Timeline] Page ${pageNumber}: CACHE HIT — duration=${cached.totalDurationMs}ms, chunks=${cached.chunks.length}`)
      return { timeline: cached, strategy: "heuristic", cached: true }
    }
  } else {
    console.log(`[Timeline] Page ${pageNumber}: FORCE REFRESH — skipping cache`)
  }

  let words: WordTiming[]
  let totalDurationMs: number
  let usedStrategy: TimelineStrategy = "heuristic"

  const shouldTryWhisper = preferredStrategy === "whisper" || !preferredStrategy
  if (shouldTryWhisper) {
    try {
      const available = await isWhisperAvailable()
      if (available) {
        const result = await generateWhisperTimeline(audioUrl, language)
        words = result.words
        totalDurationMs = result.durationMs
        usedStrategy = "whisper"
        console.log(`[Timeline] Page ${pageNumber}: Whisper — duration=${totalDurationMs}ms, words=${words.length}`)
      } else {
        totalDurationMs = await getAudioDurationMs(audioUrl)
        words = generateHeuristicTimeline(text, totalDurationMs)
        console.log(`[Timeline] Page ${pageNumber}: Heuristic — duration=${totalDurationMs}ms, words=${words.length}`)
      }
    } catch (err) {
      console.warn("[Timeline] Whisper failed, falling back to heuristic:", err)
      totalDurationMs = await getAudioDurationMs(audioUrl)
      words = generateHeuristicTimeline(text, totalDurationMs)
    }
  } else {
    totalDurationMs = await getAudioDurationMs(audioUrl)
    words = generateHeuristicTimeline(text, totalDurationMs)
    console.log(`[Timeline] Page ${pageNumber}: Heuristic (forced) — duration=${totalDurationMs}ms, words=${words.length}`)
  }

  const chunks = chunkWords(words, chunkSize)

  console.log(`[Timeline] Page ${pageNumber}: ${chunks.length} chunks, first=[${chunks[0]?.startMs}–${chunks[0]?.endMs}ms], last=[${chunks[chunks.length - 1]?.startMs}–${chunks[chunks.length - 1]?.endMs}ms]`)

  const timeline: PageTimeline = {
    pageNumber,
    totalDurationMs,
    words,
    chunks,
  }

  await saveTimelineCache(cacheKey, timeline)

  return { timeline, strategy: usedStrategy, cached: false }
}
