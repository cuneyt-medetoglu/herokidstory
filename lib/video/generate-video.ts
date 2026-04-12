import { execFile } from "child_process"
import { promisify } from "util"
import * as fs from "fs/promises"
import * as path from "path"
import * as os from "os"
import { uploadFile, getPublicUrl } from "@/lib/storage/s3"
import { generateTimeline } from "@/lib/read-along/timeline"
import { generateAssFromTimeline } from "./generate-ass"
import type { VideoGenerationOptions, VideoGenerationResult } from "./types"
import type { PageTimeline } from "@/lib/read-along/types"

const execFileAsync = promisify(execFile)

const FFMPEG_BIN = process.env.FFMPEG_PATH || "ffmpeg"
const FFPROBE_BIN = process.env.FFPROBE_PATH || "ffprobe"
const VIDEO_FPS = 24
const DEFAULT_WIDTH = 720
const DEFAULT_HEIGHT = 1280
/** Sessiz ara: TTS üst üste binmesin, dinleyici nefes alsın (saniye). */
const PAGE_GAP_SEC = 0.55

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

async function checkBinaryExists(bin: string, label: string): Promise<boolean> {
  try {
    await execFileAsync(bin, ["-version"])
    return true
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      console.error(`[Video] ❌ ${label} bulunamadı: "${bin}". ${label === "ffprobe" ? "FFPROBE_PATH" : "FFMPEG_PATH"} env değişkenini ayarlayın.`)
      return false
    }
    return true
  }
}

async function downloadToFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(destPath, buffer)
}

async function getAudioDurationSec(audioPath: string): Promise<number> {
  const { stdout } = await execFileAsync(FFPROBE_BIN, [
    "-v", "quiet",
    "-print_format", "json",
    "-show_format",
    audioPath,
  ])
  const info = JSON.parse(stdout)
  return parseFloat(info.format?.duration || "0")
}

async function probeAudioSampleRate(mediaPath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync(FFPROBE_BIN, [
      "-v", "quiet",
      "-select_streams", "a:0",
      "-show_entries", "stream=sample_rate",
      "-of", "default=noprint_wrappers=1:nokey=1",
      mediaPath,
    ])
    const rate = parseInt(stdout.trim(), 10)
    return Number.isFinite(rate) && rate > 0 ? rate : 44100
  } catch {
    return 44100
  }
}

/** Kısa siyah kare + sessizlik — sayfalar arası nefes payı (TTS acrossfade kullanılmaz). */
async function createPageGapClip(
  outputPath: string,
  width: number,
  height: number,
  sampleRate: number,
): Promise<void> {
  const args = [
    "-y",
    "-f", "lavfi",
    "-i", `color=c=black:s=${width}x${height}:r=${VIDEO_FPS}:d=${PAGE_GAP_SEC}`,
    "-f", "lavfi",
    "-i", `anullsrc=r=${sampleRate}:cl=stereo:d=${PAGE_GAP_SEC}`,
    "-c:v", "libx264",
    "-tune", "stillimage",
    "-preset", "ultrafast",
    "-crf", "24",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "128k",
    "-shortest",
    outputPath,
  ]
  await execFileAsync(FFMPEG_BIN, args, { maxBuffer: 20 * 1024 * 1024 })
}

function escapeAssPath(p: string): string {
  return p.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "'\\''")
}

/**
 * Generate a single page segment:
 *   static image + audio + vignette + ASS subtitle → MP4
 *   No zoom/pan — static frame, clean encode.
 */
async function generatePageVideo(
  imagePath: string,
  audioPath: string,
  assPath: string,
  outputPath: string,
  width: number,
  height: number,
  pageIndex: number,
): Promise<void> {
  const filterComplex =
    `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black,` +
    `vignette=PI/4,` +
    `ass='${escapeAssPath(assPath)}'` +
    `[outv]`

  const args = [
    "-y",
    "-loop", "1",
    "-i", imagePath,
    "-i", audioPath,
    "-filter_complex", filterComplex,
    "-map", "[outv]",
    "-map", "1:a",
    "-c:v", "libx264",
    "-tune", "stillimage",
    "-preset", "fast",
    "-crf", "24",
    "-r", String(VIDEO_FPS),
    "-c:a", "aac",
    "-b:a", "128k",
    "-pix_fmt", "yuv420p",
    "-shortest",
    "-movflags", "+faststart",
    outputPath,
  ]

  console.log(`[Video] Encoding page ${pageIndex + 1}...`)
  const { stderr } = await execFileAsync(FFMPEG_BIN, args, { maxBuffer: 50 * 1024 * 1024 })
  if (process.env.DEBUG_LOGGING === "true") {
    console.log(`[Video] FFmpeg stderr (page ${pageIndex + 1}):`, stderr.slice(-500))
  }
}

/**
 * Sayfa segmentlerini sırayla birleştirir; aralara sessiz + siyah kare klibi koyar.
 * acrossfade kullanılmaz — iki TTS parçası üst üste binmez.
 */
async function concatSegmentsWithPageGaps(
  segmentPaths: string[],
  workDir: string,
  width: number,
  height: number,
  outputPath: string,
): Promise<void> {
  if (segmentPaths.length === 1) {
    await fs.copyFile(segmentPaths[0], outputPath)
    return
  }

  const sampleRate = await probeAudioSampleRate(segmentPaths[0])
  const gapPath = path.join(workDir, "page_gap.mp4")
  await createPageGapClip(gapPath, width, height, sampleRate)

  const listPath = path.join(workDir, "concat_with_gaps.txt")
  const lines: string[] = []
  for (let i = 0; i < segmentPaths.length; i++) {
    lines.push(`file '${segmentPaths[i].replace(/\\/g, "/")}'`)
    if (i < segmentPaths.length - 1) {
      lines.push(`file '${gapPath.replace(/\\/g, "/")}'`)
    }
  }
  await fs.writeFile(listPath, lines.join("\n"), "utf-8")

  const args = [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", listPath,
    "-c:v", "libx264",
    "-tune", "stillimage",
    "-preset", "fast",
    "-crf", "24",
    "-r", String(VIDEO_FPS),
    "-c:a", "aac",
    "-b:a", "128k",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    outputPath,
  ]

  console.log(
    `[Video] Concatenating ${segmentPaths.length} segments with ${PAGE_GAP_SEC}s gap between pages...`,
  )
  const { stderr } = await execFileAsync(FFMPEG_BIN, args, { maxBuffer: 100 * 1024 * 1024 })
  if (process.env.DEBUG_LOGGING === "true") {
    console.log(`[Video] Concat stderr:`, stderr.slice(-500))
  }
}

const ENCODE_CONCURRENCY = 3

interface PageResult {
  segmentPath: string
  durationSec: number
}

async function encodeOnePage(
  page: VideoGenerationOptions["pages"][number],
  i: number,
  workDir: string,
  language: string,
  width: number,
  height: number,
): Promise<PageResult | null> {
  const pageDir = path.join(workDir, `page_${i}`)
  await ensureDir(pageDir)

  const imgExt = page.imageUrl.includes(".png") ? "png" : "jpg"
  const imgPath = path.join(pageDir, `image.${imgExt}`)
  const audioPath = path.join(pageDir, "audio.mp3")
  const assPath = path.join(pageDir, "subtitle.ass")
  const segmentPath = path.join(pageDir, "segment.mp4")

  await Promise.all([
    downloadToFile(page.imageUrl, imgPath),
    downloadToFile(page.audioUrl, audioPath),
  ])

  const durationSec = await getAudioDurationSec(audioPath)
  if (durationSec <= 0) {
    console.warn(`[Video] Page ${i + 1}: audio duration is ${durationSec}s, skipping`)
    return null
  }

  let timeline: PageTimeline
  try {
    const result = await generateTimeline({
      text: page.text,
      audioUrl: page.audioUrl,
      language,
      pageNumber: page.pageNumber,
    })
    timeline = result.timeline
  } catch (err) {
    console.warn(`[Video] Page ${i + 1}: timeline failed, using simple subtitle`, err)
    timeline = {
      pageNumber: page.pageNumber,
      totalDurationMs: durationSec * 1000,
      words: [],
      chunks: [{
        words: [],
        displayText: page.text,
        startMs: 0,
        endMs: durationSec * 1000,
      }],
    }
  }

  const assContent = generateAssFromTimeline(timeline, width, height)
  await fs.writeFile(assPath, assContent, "utf-8")

  await generatePageVideo(imgPath, audioPath, assPath, segmentPath, width, height, i)
  console.log(`[Video] Page ${i + 1} encoded (${durationSec.toFixed(1)}s)`)
  return { segmentPath, durationSec }
}

/**
 * Main entry: generates an MP4 video for a book.
 *
 * 1. Encode each page as static image + audio + vignette + subtitle
 * 2. Merge segments: sayfalar arası sessiz ara (TTS çakışması yok)
 * 3. Upload to S3
 */
export async function generateBookVideo(
  options: VideoGenerationOptions,
): Promise<VideoGenerationResult> {
  const { bookId, userId, pages, language, onProgress } = options
  const width = options.width || DEFAULT_WIDTH
  const height = options.height || DEFAULT_HEIGHT

  const workDir = path.join(os.tmpdir(), `video-${bookId}-${Date.now()}`)
  await ensureDir(workDir)

  console.log(`[Video] Starting video generation for book ${bookId} (${pages.length} pages, ${width}x${height})`)

  const [hasFFmpeg, hasFFprobe] = await Promise.all([
    checkBinaryExists(FFMPEG_BIN, "ffmpeg"),
    checkBinaryExists(FFPROBE_BIN, "ffprobe"),
  ])
  if (!hasFFmpeg || !hasFFprobe) {
    throw new Error(
      `ffmpeg/ffprobe bulunamadı. FFMPEG_PATH="${FFMPEG_BIN}" FFPROBE_PATH="${FFPROBE_BIN}". ` +
      `Lütfen kurulum yapın veya env değişkenlerini ayarlayın.`
    )
  }

  try {
    const results: Array<PageResult | null> = new Array(pages.length).fill(null)
    let encodedCount = 0

    for (let batchStart = 0; batchStart < pages.length; batchStart += ENCODE_CONCURRENCY) {
      const batchEnd = Math.min(batchStart + ENCODE_CONCURRENCY, pages.length)
      const batchIndices = Array.from({ length: batchEnd - batchStart }, (_, k) => batchStart + k)

      const batchResults = await Promise.allSettled(
        batchIndices.map((i) => encodeOnePage(pages[i], i, workDir, language, width, height)),
      )

      for (let k = 0; k < batchResults.length; k++) {
        const idx = batchIndices[k]
        const result = batchResults[k]
        if (result.status === "fulfilled") {
          results[idx] = result.value
        } else {
          console.error(`[Video] Page ${idx + 1} encode failed:`, result.reason)
          results[idx] = null
        }
        encodedCount++
        const percent = Math.round((encodedCount / pages.length) * 80)
        onProgress?.(percent)
      }
    }

    const validResults = results.filter((r): r is PageResult => r !== null)
    if (validResults.length === 0) {
      throw new Error("No page segments were generated")
    }

    onProgress?.(85)

    const finalPath = path.join(workDir, "final.mp4")
    await concatSegmentsWithPageGaps(
      validResults.map((r) => r.segmentPath),
      workDir,
      width,
      height,
      finalPath,
    )
    onProgress?.(95)

    const finalBuffer = await fs.readFile(finalPath)
    const fileSizeBytes = finalBuffer.length
    const timestamp = Date.now()
    const s3Key = await uploadFile(
      "videos",
      `${userId}/books/${bookId}/video_${timestamp}.mp4`,
      finalBuffer,
      "video/mp4",
    )
    const publicUrl = getPublicUrl(s3Key)

    const totalDurationSec = await getAudioDurationSec(finalPath)

    onProgress?.(100)
    console.log(`[Video] Book ${bookId} video complete: ${(fileSizeBytes / 1024 / 1024).toFixed(1)}MB, ${totalDurationSec.toFixed(1)}s`)

    return {
      s3Key,
      publicUrl,
      durationMs: totalDurationSec * 1000,
      fileSizeBytes,
    }
  } finally {
    try {
      await fs.rm(workDir, { recursive: true, force: true })
    } catch {
      console.warn(`[Video] Failed to cleanup temp dir: ${workDir}`)
    }
  }
}
