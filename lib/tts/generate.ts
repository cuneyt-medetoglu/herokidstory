/**
 * Server-side TTS generation: cache check + Google TTS + S3 cache.
 * Used by POST /api/tts/generate and by book creation prewarm.
 */

import { TextToSpeechClient } from "@google-cloud/text-to-speech"
import crypto from "crypto"
import { getLanguageCode, getPromptForLanguage } from "@/lib/prompts/tts/v1.0.0"
import { uploadFile, getSignedObjectUrl, fileExists } from "@/lib/storage/s3"
import { getTtsSettings } from "@/lib/db/tts-settings"
import { insertAIRequest } from "@/lib/db/ai-requests"
import { geminiTtsCostUsdEstimate } from "@/lib/pricing/google-gemini-tts-cost"

const TTS_CACHE_PREFIX = "tts-cache"

let ttsClient: TextToSpeechClient | null = null

function getTTSClient(): TextToSpeechClient {
  if (ttsClient) return ttsClient
  try {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
      ttsClient = new TextToSpeechClient({ projectId: credentials.project_id, credentials })
      return ttsClient
    }
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      ttsClient = new TextToSpeechClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      })
      return ttsClient
    }
    ttsClient = new TextToSpeechClient({ projectId: process.env.GOOGLE_CLOUD_PROJECT_ID })
  } catch (error) {
    console.error("Failed to initialize Google Cloud TTS client:", error)
    throw new Error("Google Cloud TTS client initialization failed")
  }
  return ttsClient!
}

function generateCacheHash(text: string, voiceId: string, speed: number, prompt: string, languageCode: string): string {
  const content = `${text}|${voiceId}|${speed}|${prompt}|${languageCode}`
  return crypto.createHash("sha256").update(content).digest("hex")
}

async function getCachedAudio(hash: string): Promise<string | null> {
  try {
    const key = `${TTS_CACHE_PREFIX}/${hash}.mp3`
    const exists = await fileExists(key)
    if (!exists) return null
    return getSignedObjectUrl(key)
  } catch (error) {
    console.error("[TTS Cache] Error checking cache:", error)
    return null
  }
}

async function saveCachedAudio(hash: string, audioBuffer: Buffer): Promise<string | null> {
  try {
    const fileName = `${hash}.mp3`
    const key = await uploadFile(TTS_CACHE_PREFIX, fileName, audioBuffer, "audio/mpeg")
    return getSignedObjectUrl(key)
  } catch (error) {
    console.error("[TTS Cache] Error saving to cache:", error)
    return null
  }
}

export interface GenerateTtsOptions {
  language?: string
  voiceId?: string
  speed?: number
  prompt?: string
  userId?: string
  bookId?: string
}

export interface GenerateTtsResult {
  audioUrl: string
  cached: boolean
  voiceId: string
  speed: number
  languageCode: string
  textLength: number
}

/**
 * Generate TTS for the given text using global defaults (or overrides).
 * Checks cache first; on miss, calls Google TTS and saves to S3.
 */
export async function generateTts(
  text: string,
  options: GenerateTtsOptions = {}
): Promise<GenerateTtsResult> {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Text is required")
  }
  if (text.length > 5000) {
    throw new Error("Text too long. Maximum 5000 characters.")
  }

  let ttsDefaults: Awaited<ReturnType<typeof getTtsSettings>> = null
  try {
    ttsDefaults = await getTtsSettings()
  } catch (_) {}

  // If caller explicitly specifies a language (e.g. book creation), that language wins.
  // DB defaults are only a fallback when no language is given.
  const hasExplicitLanguage =
    typeof options.language === "string" && options.language.trim().length > 0
  const language = hasExplicitLanguage
    ? options.language!.trim()
    : (ttsDefaults?.language_code ?? "en")

  const voiceId =
    (typeof options.voiceId === "string" && options.voiceId.trim() ? options.voiceId.trim() : null) ??
    ttsDefaults?.voice_name ??
    "Achernar"
  const rawSpeed =
    typeof options.speed === "number" ? options.speed : (ttsDefaults?.speaking_rate ?? 1.0)

  // When a specific language is provided by the caller, always use the language-appropriate
  // prompt so that DB global defaults (which may be in a different language) don't override.
  const prompt =
    (typeof options.prompt === "string" && options.prompt.trim() ? options.prompt.trim() : null) ??
    (hasExplicitLanguage ? getPromptForLanguage(language) : ttsDefaults?.prompt) ??
    getPromptForLanguage(language)
  const modelName = ttsDefaults?.model_name ?? "gemini-2.5-pro-tts"

  const languageCode = getLanguageCode(language)
  const validSpeed = Math.max(0.25, Math.min(4.0, Number(rawSpeed)))
  const cacheHash = generateCacheHash(text, voiceId, validSpeed, prompt, languageCode)

  const cachedUrl = await getCachedAudio(cacheHash)
  if (cachedUrl) {
    if (process.env.DEBUG_LOGGING === "true") {
      console.log("[TTS] Cache hit:", cacheHash.substring(0, 8))
    }
    // Cache hit: no API call made, no cost
    return {
      audioUrl: cachedUrl,
      cached: true,
      voiceId,
      speed: validSpeed,
      languageCode,
      textLength: text.length,
    }
  }

  const ttsStartedAt = Date.now()

  if (process.env.DEBUG_LOGGING === "true") {
    console.log("[TTS] Cache miss, generating audio:", cacheHash.substring(0, 8))
  }

  const client = getTTSClient()
  let ttsError: string | null = null
  let ttsResponse: { audioContent?: Uint8Array | string | null } | null = null

  try {
    const [res] = await client.synthesizeSpeech({
      input: { text, ...(prompt ? { prompt } : {}) },
      voice: { languageCode, name: voiceId, modelName },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: validSpeed,
        pitch: 0,
        volumeGainDb: 0,
      },
    })
    ttsResponse = res
  } catch (err) {
    ttsError = err instanceof Error ? err.message : String(err)
    if (options.userId && options.userId !== 'unknown') {
      void insertAIRequest({
        userId: options.userId,
        bookId: options.bookId,
        operationType: 'tts',
        provider: 'google',
        model: modelName,
        status: 'error',
        errorMessage: ttsError,
        charCount: text.length,
        durationMs: Date.now() - ttsStartedAt,
        requestMeta: { language, voiceId, speed: validSpeed },
      })
    }
    throw err
  }

  const response = ttsResponse
  if (!response?.audioContent) {
    throw new Error("Failed to generate audio")
  }

  const durationMs = Date.now() - ttsStartedAt
  const audioBuffer = Buffer.from(response.audioContent)
  const costUsd = geminiTtsCostUsdEstimate(modelName, text, audioBuffer)
  if (options.userId && options.userId !== 'unknown') {
    void insertAIRequest({
      userId: options.userId,
      bookId: options.bookId,
      operationType: 'tts',
      provider: 'google',
      model: modelName,
      status: 'success',
      charCount: text.length,
      costUsd,
      durationMs,
      requestMeta: { language, voiceId, speed: validSpeed },
      responseMeta: {
        pricing: 'cloud.google.com/text-to-speech/pricing (Gemini-TTS token rates; süre MP3 boyutundan tahmin)',
      },
    })
  }

  const savedUrl = await saveCachedAudio(cacheHash, audioBuffer)

  if (savedUrl) {
    return {
      audioUrl: savedUrl,
      cached: false,
      voiceId,
      speed: validSpeed,
      languageCode,
      textLength: text.length,
    }
  }

  const audioBase64 = audioBuffer.toString("base64")
  const dataUrl = `data:audio/mp3;base64,${audioBase64}`
  return {
    audioUrl: dataUrl,
    cached: false,
    voiceId,
    speed: validSpeed,
    languageCode,
    textLength: text.length,
  }
}
