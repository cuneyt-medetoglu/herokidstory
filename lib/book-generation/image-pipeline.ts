/**
 * Kitap görsel oluşturma pipeline'ı
 *
 * Bu dosya:
 *  - Master illüstrasyon üretimi (karakter + entity)
 *  - Kapak görsel üretimi
 *  - Sayfa görselleri üretimi (paralel batch)
 *  - TTS ses üretimi
 * adımlarını barındırır.
 *
 * Hem BullMQ worker (arka plan işlemi) hem de debug/admin senkron çağrılar tarafından kullanılır.
 */

import OpenAI from 'openai'
import { uploadFile, getPublicUrl, getObjectBuffer } from '@/lib/storage/s3'
import { updateBook, updateBookProgressAtLeast } from '@/lib/db/books'
import { generateStoryPrompt } from '@/lib/prompts/story/base'
import type { StoryGenerationInput } from '@/lib/prompts/types'
import { buildCharacterPrompt, buildMultipleCharactersPrompt } from '@/lib/prompts/image/character'
import {
  generateFullPagePrompt,
  analyzeSceneDiversity,
  detectRiskySceneElements,
  getSafeSceneAlternative,
  extractSceneElements,
  type SceneDiversityAnalysis,
} from '@/lib/prompts/image/scene'
import { getStyleDescription, getCinematicPack } from '@/lib/prompts/image/style-descriptions'
import { getLayoutSafeMasterDirectives } from '@/lib/prompts/image/master'
import { generateTts } from '@/lib/tts/generate'
import { imageEditWithLog, imageGenerateWithLog } from '@/lib/ai/images'
import { chatWithLog } from '@/lib/ai/chat'
import { appendAiDebugLog, sanitizeForDebugLog, summarizeFormData } from '@/lib/debug/ai-debug-log'

// ============================================================================
// Types
// ============================================================================

export type DebugTraceEntry = { step: string; request: unknown; response: unknown }

export interface PipelineContext {
  bookId: string
  userId: string
  /** Tüm karakterler (index 0 = ana karakter) */
  characters: any[]
  /** story_data: hikaye ve sayfa verisi (null ise pipeline ilk adımda hikayeyi üretir — P3 §10/C) */
  storyData: any | null
  illustrationStyle: string
  /** Normalize edilmiş tema anahtarı (normalizeThemeKey sonucu) */
  themeKey: string
  language: string
  customRequests?: string
  isFromExampleMode: boolean
  isCoverOnlyMode: boolean
  /** From-example modda örnek kitap verisi */
  exampleBook?: any | null
  /** Her adımda progress güncellemek için callback; sağlanmazsa sadece DB güncellenir */
  onProgress?: (percent: number, step: string) => Promise<void>
  /** Admin debug trace (üretimde null) */
  debugTrace?: DebugTraceEntry[] | null
  /**
   * Hikaye üretiminde kullanılacak model (storyData null ise zorunlu).
   * Varsayılan: gpt-4o-mini
   */
  storyModel?: string
  /** İstenen sayfa sayısı (storyData null ise hikaye üretimi için kullanılır) */
  pageCount?: number
  /**
   * Debug step-runner: önceden üretilmiş master URL'leri (varsa master generation atlanır).
   * Key: characterId, value: master image URL
   */
  preComputedMasterIllustrations?: Record<string, string>
  /**
   * Debug step-runner: önceden üretilmiş entity master URL'leri (varsa entity master generation atlanır).
   * Key: entityId, value: entity master image URL
   */
  preComputedEntityMasterIllustrations?: Record<string, string>
  /**
   * Debug step-runner: pipeline'ı belirli bir adımda durdur.
   * 'masters' = master generation sonrası dur
   * 'cover' = cover generation sonrası dur
   * 'pages' = page generation sonrası dur (tts atlanır)
   */
  debugStopAfterStep?: 'masters' | 'cover' | 'pages'
  /**
   * Debug step-runner: önceden üretilmiş cover URL (varsa cover generation atlanır).
   */
  preComputedCoverUrl?: string
}

// ============================================================================
// Sabitler
// ============================================================================

const IMAGE_MODEL = 'gpt-image-1.5'
const IMAGE_SIZE = '1024x1536'
const IMAGE_QUALITY = 'low'

// ============================================================================
// Yardımcı fonksiyonlar (route.ts'den taşındı)
// ============================================================================

export function stopAfter(step: string): void {
  if (process.env.STOP_AFTER === step) {
    console.log(`[Pipeline] ⏸️ STOP_AFTER=${step}`)
    throw new Error(`STOP_AFTER ${step}`)
  }
}

export function isRetryableError(status: number): boolean {
  return status === 502 || status === 503 || status === 504 || status === 429
}

export function isPermanentError(status: number): boolean {
  return status === 400 || status === 401 || status === 403 || status === 500
}

export function isModerationBlockedError(error: any): boolean {
  const status = error?.status
  const msg = (error?.message || '').toString()
  if (status !== 400) return false
  return msg.includes('moderation_blocked') || msg.includes('safety_violations')
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  context: string = 'API call'
): Promise<T> {
  let lastError: Error | null = null
  let lastStatus: number | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn()
      if (attempt > 1) {
        console.log(`[Retry] ✅ ${context} succeeded on attempt ${attempt}/${maxRetries}`)
      }
      return result
    } catch (error: any) {
      lastError = error
      const status = error.status || error.response?.status || null
      lastStatus = status

      if (status && isPermanentError(status)) {
        console.error(`[Retry] ❌ ${context} failed with permanent error (${status}) - not retrying`)
        throw error
      }
      if (status && !isRetryableError(status)) {
        console.error(`[Retry] ❌ ${context} failed with unknown error (${status}) - not retrying`)
        throw error
      }
      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000
        console.warn(`[Retry] ⚠️  ${context} failed (attempt ${attempt}/${maxRetries}, status: ${status || 'unknown'}) - retrying in ${backoffMs}ms...`)
        await new Promise((resolve) => setTimeout(resolve, backoffMs))
      } else {
        console.error(`[Retry] ❌ ${context} failed after ${maxRetries} attempts (last status: ${lastStatus || 'unknown'})`)
        throw error
      }
    }
  }
  throw lastError || new Error(`${context} failed after ${maxRetries} attempts`)
}

export async function retryFetch(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  context: string = 'API call',
  debugContext?: {
    operationType: 'story_generation' | 'image_cover' | 'image_page' | 'image_master' | 'image_entity' | 'image_edit' | 'image_regenerate' | 'character_analysis' | 'tts'
    model: string
    userId: string
    bookId?: string | null
    pageIndex?: number | null
  }
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = debugContext
      ? await fetchWithAiDebug(url, options, debugContext)
      : await fetch(url, options)
    if (!response.ok) {
      const status = response.status
      if (isPermanentError(status)) {
        const errorText = await response.text()
        const error = new Error(`API call failed with permanent error: ${status} - ${errorText}`) as any
        error.status = status
        error.response = response
        throw error
      }
      if (isRetryableError(status)) {
        const errorText = await response.text()
        const error = new Error(`API call failed with retryable error: ${status} - ${errorText}`) as any
        error.status = status
        error.response = response
        throw error
      }
      const errorText = await response.text()
      const error = new Error(`API call failed: ${status} - ${errorText}`) as any
      error.status = status
      error.response = response
      throw error
    }
    return response
  }, maxRetries, context)
}

async function fetchWithAiDebug(
  url: string,
  options: RequestInit,
  context: {
    operationType: 'story_generation' | 'image_cover' | 'image_page' | 'image_master' | 'image_entity' | 'image_edit' | 'image_regenerate' | 'character_analysis' | 'tts'
    model: string
    userId: string
    bookId?: string | null
    pageIndex?: number | null
  }
): Promise<Response> {
  const startedAt = Date.now()
  const endpoint = url.replace('https://api.openai.com', '')
  const requestBody =
    options.body instanceof FormData
      ? { formData: summarizeFormData(options.body) }
      : typeof options.body === 'string'
      ? { body: sanitizeForDebugLog(options.body) }
      : { bodyType: options.body ? typeof options.body : 'none' }

  void appendAiDebugLog({
    stage: 'request',
    operationType: context.operationType,
    provider: 'openai',
    endpoint,
    model: context.model,
    userId: context.userId,
    bookId: context.bookId ?? null,
    pageIndex: context.pageIndex ?? null,
    payload: sanitizeForDebugLog(requestBody),
  })

  const response = await fetch(url, options)
  const durationMs = Date.now() - startedAt
  const clone = response.clone()
  const contentType = response.headers.get('content-type') || ''
  const responsePayload = contentType.includes('application/json')
    ? sanitizeForDebugLog(await clone.json().catch(() => null))
    : sanitizeForDebugLog(await clone.text().catch(() => ''))

  void appendAiDebugLog({
    stage: response.ok ? 'response' : 'error',
    operationType: context.operationType,
    provider: 'openai',
    endpoint,
    model: context.model,
    userId: context.userId,
    bookId: context.bookId ?? null,
    pageIndex: context.pageIndex ?? null,
    status: response.status,
    durationMs,
    payload: responsePayload,
  })

  return response
}

/** Hikayeden kapak ortamı türet */
export function deriveCoverEnvironmentFromStory(
  customRequests: string | undefined,
  pages: Array<{ sceneDescription?: string; sceneContext?: string; text?: string; imagePrompt?: string }>
): string {
  const parts: string[] = [customRequests || '']
  for (const p of pages) {
    parts.push(p.sceneDescription || '', p.sceneContext || '', p.text || '', p.imagePrompt || '')
  }
  const combined = parts.join(' ').toLowerCase()
  if (/\b(glacier|ice|buz|frozen|snow|kar|snowy|karlı|buzul)\b/.test(combined)) {
    return 'glacier, ice cave, frozen landscape, soft snow and crystals'
  }
  if (/\b(space|uzay|stars|yıldız|planet|gezegen|cosmic|orbit)\b/.test(combined)) {
    return 'space, stars and planets, cosmic horizon'
  }
  if (/\b(ocean|deniz|sea|underwater|sualtı|coral|reef|aquatic)\b/.test(combined)) {
    return 'ocean, clear water, coral reef or underwater world'
  }
  if (/\b(cave|mağara|ice cave|buz mağara)\b/.test(combined)) {
    return 'cave, rocky interior, mysterious atmosphere'
  }
  if (/\b(forest|orman|clearing|açıklık|wildflowers|mushroom)\b/.test(combined)) {
    return 'lush forest, dappled sunlight, wildflowers'
  }
  if (/\b(mountain|dağ|path|yol|trail|patika|peak|zirve)\b/.test(combined)) {
    return 'mountain path, distant peaks, natural landscape'
  }
  if (/\b(beach|sahil|plaj|sand)\b/.test(combined)) {
    return 'sandy beach, ocean horizon, soft waves'
  }
  if (/\b(garden|bahçe|flower|çiçek)\b/.test(combined)) {
    return 'colorful garden, flowers and greenery'
  }
  return ''
}

/**
 * Kapak sahne metni: story JSON önceliği — coverImagePrompt → coverDescription → coverSetting → derive.
 * Worker ve API (senkron kapak) aynı mantığı kullanır.
 */
export function resolveCoverEnvironment(
  storyData: {
    coverImagePrompt?: string
    coverDescription?: string
    coverSetting?: string
    pages?: Array<{ sceneDescription?: string; sceneContext?: string; text?: string; imagePrompt?: string }>
  } | null | undefined,
  customRequests?: string
): string {
  if (typeof storyData?.coverImagePrompt === 'string' && storyData.coverImagePrompt.trim()) {
    return storyData.coverImagePrompt.trim()
  }
  if (typeof storyData?.coverDescription === 'string' && storyData.coverDescription.trim()) {
    return storyData.coverDescription.trim()
  }
  if (typeof storyData?.coverSetting === 'string' && storyData.coverSetting.trim()) {
    return storyData.coverSetting.trim()
  }
  if (storyData?.pages?.length) {
    return deriveCoverEnvironmentFromStory(customRequests, storyData.pages)
  }
  return ''
}

/** From-example: örnek kapak görselinden sahne betimi alır */
async function describeCoverSceneForPrompt(
  imageUrl: string,
  logCtx?: { userId: string; bookId: string }
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const visionParams = {
      model: 'gpt-4o-mini' as const,
      messages: [{
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: "Describe this children's book cover in 1-2 short sentences for an image generation prompt. Include: setting (e.g. path, cottage, trees, flowers), key objects (e.g. ball, bunny, toys), and composition. English only, concise. No character description.",
          },
          { type: 'image_url' as const, image_url: { url: imageUrl } },
        ],
      }],
      max_tokens: 150,
    }
    const completion = logCtx
      ? await chatWithLog(openai, visionParams, {
          userId: logCtx.userId,
          bookId: logCtx.bookId,
          operationType: 'story_generation',
          requestMeta: { step: 'vision_example_cover_scene' },
        })
      : await openai.chat.completions.create(visionParams)
    const text = completion.choices[0]?.message?.content?.trim()
    return text ? ` Scene must include these key elements: ${text}` : ''
  } catch (e) {
    console.warn('[Pipeline] From-example cover description (Vision) failed:', (e as Error).message)
    return ''
  }
}

function detectCharactersInPageText(
  pageText: string,
  characters: Array<{ id: string; name: string }>
): string[] {
  const foundCharacterIds: string[] = []
  const lowerText = pageText.toLowerCase()
  for (const char of characters) {
    const charName = char.name.toLowerCase()
    if (lowerText.includes(charName)) {
      foundCharacterIds.push(char.id)
    }
  }
  return foundCharacterIds.length > 0 ? foundCharacterIds : [characters[0].id]
}

// ============================================================================
// Master illüstrasyon üretimi
// ============================================================================

export async function generateMasterCharacterIllustration(
  characterPhoto: string,
  characterDescription: any,
  characterId: string,
  illustrationStyle: string,
  userId: string,
  includeAge: boolean = true,
  characterGender?: 'boy' | 'girl' | 'other',
  storyClothing?: string,
  debugTracePush?: (entry: DebugTraceEntry) => void,
  debugStep?: string,
  bookId?: string,
  characterType?: { group: string; value: string; displayName?: string }
): Promise<string> {
  const isPet = characterType?.group === 'Pets'
  const animalKind = isPet ? (characterType?.value || 'animal').toLowerCase() : null

  const fixedDescription = {
    ...characterDescription,
    gender: characterGender || characterDescription?.gender || 'boy',
  }
  const characterPrompt = buildCharacterPrompt(fixedDescription, includeAge, true)
  const styleDirective =
    illustrationStyle === '3d_animation'
      ? 'Pixar-style 3D'
      : illustrationStyle === 'watercolor'
      ? 'Watercolor'
      : illustrationStyle

  const outfitPart = !isPet && storyClothing?.trim() ? `Character wearing exactly: ${storyClothing}. ` : ''

  let masterPrompt: string
  let softMasterPrompt: string

  if (isPet) {
    masterPrompt = [
      `[STYLE] ${styleDirective}, children's book illustration [/STYLE]`,
      `Full body, all four paws visible, natural standing or sitting pose. ${animalKind} animal. ${characterPrompt}. Plain neutral background. Illustration style (NOT photorealistic). Match reference photo for fur color, markings, body shape and face.`,
    ].join(' ')
    softMasterPrompt = [
      `[STYLE] ${styleDirective}, children's book illustration [/STYLE]`,
      `Full body view. Friendly ${animalKind}, relaxed pose. ${characterPrompt}. Plain neutral background. Illustration style only (NOT photorealistic). Match reference photo. Child-safe illustration for children's book.`,
    ].join(' ')
  } else {
    masterPrompt = [
      '[ANATOMY] 5 fingers each hand separated, arms at sides, 2 arms 2 legs, symmetrical face (2 eyes 1 nose 1 mouth) [/ANATOMY]',
      `[STYLE] ${styleDirective} [/STYLE]`,
      '[EXPRESSION] Neutral or gentle facial expression, closed mouth or soft closed-mouth smile, calm and relaxed face. Not a big open-mouthed smile. [/EXPRESSION]',
      `Full body, standing, feet visible, neutral pose. Child from head to toe. ${characterPrompt}. ${outfitPart}Plain neutral background. Illustration style (NOT photorealistic). Match reference photos for face and body.`,
    ].join(' ')
    softMasterPrompt = [
      `[STYLE] ${styleDirective}, children's book illustration [/STYLE]`,
      '[EXPRESSION] Gentle facial expression, calm soft smile, relaxed. [/EXPRESSION]',
      `Standing, neutral pose, fully clothed. ${characterPrompt}. ${outfitPart}Plain neutral background. Illustration style only (NOT photorealistic). Match reference photo for face and hair. Fully clothed character. Child-safe illustration for children's book.`,
    ].join(' ')
  }

  console.log('[Pipeline] 📤 MASTER REQUEST sent (model, prompt length:', masterPrompt.length, ')')
  stopAfter('master_request')

  let refImageBuffer: Buffer
  let imageMime: string
  const imageResponse = await fetch(characterPhoto)
  const contentType = imageResponse.headers.get('content-type') || ''
  const isImage = /^image\/(jpeg|png|webp)/i.test(contentType)
  if (isImage) {
    const arrBuf = await imageResponse.arrayBuffer()
    refImageBuffer = Buffer.from(arrBuf)
    imageMime = contentType.split(';')[0].trim().toLowerCase() || 'image/png'
  } else {
    try {
      const url = new URL(characterPhoto)
      const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
      const obj = await getObjectBuffer(key)
      if (!obj) throw new Error('S3 object not found')
      refImageBuffer = obj.buffer
      imageMime = /^image\/(jpeg|png|webp)/i.test(obj.contentType)
        ? obj.contentType.split(';')[0].trim()
        : 'image/png'
    } catch (e) {
      throw new Error(
        `Referans fotoğraf yüklenemedi (fetch: ${contentType?.slice(0, 30) || 'unknown'}). S3 erişimini kontrol edin.`
      )
    }
  }

  const imageBlob = new Blob([new Uint8Array(refImageBuffer)], { type: imageMime })
  const ext = imageMime.includes('jpeg') ? 'jpg' : imageMime.includes('webp') ? 'webp' : 'png'

  const buildMasterFormData = (prompt: string) => {
    const fd = new FormData()
    fd.append('model', IMAGE_MODEL)
    fd.append('prompt', prompt)
    fd.append('size', IMAGE_SIZE)
    fd.append('quality', IMAGE_QUALITY)
    fd.append('input_fidelity', 'high')
    fd.append('image[]', imageBlob, `character.${ext}`)
    return fd
  }

  const logCtx = {
    userId,
    bookId,
    characterId,
    operationType: 'image_master' as const,
    model: IMAGE_MODEL,
    quality: IMAGE_QUALITY,
    size: IMAGE_SIZE,
    refImageCount: 1,
  }

  let result
  let usedPrompt = masterPrompt
  try {
    result = await imageEditWithLog(buildMasterFormData(masterPrompt), logCtx)
  } catch (err: any) {
    const isModerationBlocked =
      (err?.message || '').includes('moderation_blocked') ||
      (err?.message || '').includes('safety_violations')
    if (!isModerationBlocked) throw err
    console.log('[Pipeline] ⚠️ Master blocked by content policy, retrying with safe prompt...')
    usedPrompt = softMasterPrompt
    result = await imageEditWithLog(buildMasterFormData(softMasterPrompt), logCtx)
    console.log('[Pipeline] ✅ Master succeeded on retry with safe prompt')
  }

  const b64Image = result.data?.[0]?.b64_json
  if (!b64Image) {
    throw new Error('No image data in master illustration response')
  }

  console.log('[Pipeline] 📥 MASTER RESPONSE received (image data present)')
  stopAfter('master_response')

  const masterImageBuffer = Buffer.from(b64Image, 'base64')
  const timestamp = Date.now()
  const filename = `${userId}/masters/master_${characterId}_${timestamp}.png`
  const s3Key = await uploadFile('books', filename, masterImageBuffer, 'image/png')
  const masterUrl = getPublicUrl(s3Key)

  if (debugTracePush) {
    debugTracePush({
      step: debugStep || `master_character_${characterId}`,
      request: { model: IMAGE_MODEL, prompt: usedPrompt, size: IMAGE_SIZE, quality: IMAGE_QUALITY, characterId },
      response: { url: masterUrl, b64Length: (b64Image as string).length, rawResponse: result },
    })
  }
  return masterUrl
}

export async function generateSupportingEntityMaster(
  entityId: string,
  entityType: 'animal' | 'object',
  entityName: string,
  entityDescription: string,
  illustrationStyle: string,
  userId: string,
  debugTracePush?: (entry: DebugTraceEntry) => void,
  debugStep?: string,
  bookId?: string
): Promise<string> {
  const styleDirective = getStyleDescription(illustrationStyle)
  const cinematicPack = getCinematicPack()
  const entityPrompt = [
    `[STYLE] ${styleDirective} [/STYLE]`,
    `[CINEMATIC] ${cinematicPack}. Consistent lighting and material with the book style. [/CINEMATIC]`,
    `Neutral front-facing view. ${entityDescription}.`,
    `Plain neutral background. Illustration style (NOT photorealistic).`,
    entityType === 'animal'
      ? 'Friendly and appealing animal character.'
      : 'Clear and recognizable object.',
    "Centered in frame. Simple, clean, professional children's book illustration.",
  ].join(' ')

  const result = await imageGenerateWithLog(
    { model: IMAGE_MODEL, prompt: entityPrompt, size: IMAGE_SIZE, quality: IMAGE_QUALITY },
    { userId, bookId, operationType: 'image_entity', model: IMAGE_MODEL, quality: IMAGE_QUALITY, size: IMAGE_SIZE }
  )
  const b64Image = result.data?.[0]?.b64_json
  if (!b64Image || typeof b64Image !== 'string') {
    throw new Error('No b64_json in entity master response. API may require response_format.')
  }

  const imageBuffer = Buffer.from(b64Image, 'base64')
  const timestamp = Date.now()
  const filename = `${userId}/entity-masters/entity_master_${entityId}_${timestamp}.png`
  const s3Key = await uploadFile('books', filename, imageBuffer, 'image/png')
  const entityUrl = getPublicUrl(s3Key)

  if (debugTracePush) {
    debugTracePush({
      step: debugStep || `entity_master_${entityName}`,
      request: {
        model: IMAGE_MODEL,
        prompt: entityPrompt,
        size: IMAGE_SIZE,
        entityId,
        entityType,
        entityName,
      },
      response: { url: entityUrl, b64Length: (b64Image as string).length, rawResponse: result },
    })
  }
  return entityUrl
}

// ============================================================================
// Ana Pipeline Fonksiyonu
// ============================================================================

/**
 * Kitap görsel pipeline'ını çalıştırır.
 * Masters → Cover → Page Images → TTS
 * Her adımda onProgress callback çağrılır ve DB güncellenir.
 */
export async function runImagePipeline(ctx: PipelineContext): Promise<void> {
  const {
    bookId,
    userId,
    characters,
    storyData: initialStoryData,
    illustrationStyle,
    themeKey,
    language,
    customRequests,
    isFromExampleMode,
    isCoverOnlyMode,
    exampleBook,
    debugTrace,
  } = ctx
  let storyData = initialStoryData

  const character = characters[0]

  const reportProgress = async (percent: number, step: string) => {
    await updateBook(bookId, { progress_percent: percent, progress_step: step })
    if (ctx.onProgress) {
      await ctx.onProgress(percent, step)
    }
  }

  // ----------------------------------------------------------------
  // 0. Status: generating — ilk adım story_generating veya master_generating
  // ----------------------------------------------------------------
  const needsStoryGeneration = !storyData && !isFromExampleMode && !isCoverOnlyMode
  await updateBook(bookId, {
    status: 'generating',
    progress_percent: 0,
    progress_step: needsStoryGeneration ? 'story_generating' : 'master_generating',
  })

  // ----------------------------------------------------------------
  // 0b. STORY GENERATION (P3 §10/C)
  // storyData null ise (normal full-book mode) hikayeyi burada üretiriz.
  // Bu sayede API route anında bookId döndürür, kullanıcı hemen generating page'e gider.
  // ----------------------------------------------------------------
  if (needsStoryGeneration) {
    const effectiveStoryModel = ctx.storyModel || 'gpt-4.1-mini'
    const effectivePageCount = ctx.pageCount || 4

    const languageNames: Record<string, string> = {
      en: 'English', tr: 'Turkish', de: 'German', fr: 'French',
      es: 'Spanish', zh: 'Chinese (Mandarin)', pt: 'Portuguese', ru: 'Russian',
    }
    const languageName = languageNames[language] || 'English'

    const storyPrompt = generateStoryPrompt({
      characterName: character.name,
      characterAge: character.age,
      characterGender: character.gender,
      theme: themeKey,
      illustrationStyle,
      customRequests,
      pageCount: effectivePageCount,
      referencePhotoAnalysis: {
        detectedFeatures: character.description?.physicalFeatures || {},
        finalDescription: character.description,
        confidence: character.analysis_confidence || 0.8,
      },
      language: language as NonNullable<StoryGenerationInput['language']>,
      characters: characters.map((char) => ({
        id: char.id,
        name: char.name,
        type: char.character_type || { group: 'Child', value: 'Child', displayName: char.name },
        characterId: char.id,
      })),
    })

    const storyRequestBody = {
      model: effectiveStoryModel,
      messages: [
        {
          role: 'system' as const,
          content: `You are a professional children's book author. Create engaging, age-appropriate stories with detailed image prompts. Return exactly the requested number of pages. Write the entire story in ${languageName} only; do not use words from other languages.`,
        },
        { role: 'user' as const, content: storyPrompt },
      ],
      response_format: { type: 'json_object' as const },
      temperature: 0.8,
      max_tokens: 8000,
    }

    console.log(`[Pipeline] 📖 Generating story (model: ${effectiveStoryModel}, pages: ${effectivePageCount})...`)

    const openaiForStory = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const MAX_RETRIES = 3
    let generatedStoryData: any = null
    let lastStoryError: Error | null = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const storyStart = Date.now()
        const completion = await chatWithLog(openaiForStory, storyRequestBody, {
          userId,
          bookId,
          operationType: 'story_generation',
        })
        const storyMs = Date.now() - storyStart

        const storyContent = completion.choices[0].message.content
        if (!storyContent) throw new Error('No story content generated')

        generatedStoryData = JSON.parse(storyContent)
        console.log(`[Pipeline] 📥 Story received (title: ${generatedStoryData?.title}, pages: ${generatedStoryData?.pages?.length}) in ${storyMs}ms`)

        if (!generatedStoryData.title || !generatedStoryData.pages || !Array.isArray(generatedStoryData.pages)) {
          throw new Error('Invalid story structure from AI')
        }
        for (const page of generatedStoryData.pages) {
          if (!page.characterIds || !Array.isArray(page.characterIds) || page.characterIds.length === 0) {
            throw new Error(`Page ${page.pageNumber} is missing required "characterIds" field`)
          }
        }
        const suggestedOutfits = generatedStoryData.suggestedOutfits
        if (!suggestedOutfits || typeof suggestedOutfits !== 'object') {
          throw new Error('Story is missing required "suggestedOutfits" object')
        }
        for (const char of characters) {
          const outfit = suggestedOutfits[char.id]
          if (typeof outfit !== 'string' || !outfit.trim()) {
            throw new Error(`suggestedOutfits is missing or empty for character ${char.id}`)
          }
        }

        const returnedPages = generatedStoryData.pages.length
        if (returnedPages !== effectivePageCount) {
          if (returnedPages > effectivePageCount) {
            generatedStoryData.pages = generatedStoryData.pages.slice(0, effectivePageCount)
          } else if (attempt < MAX_RETRIES) {
            lastStoryError = new Error(`AI returned fewer pages (${returnedPages}/${effectivePageCount})`)
            console.warn(`[Pipeline] ⚠️  Story: ${returnedPages}/${effectivePageCount} pages, retrying...`)
            continue
          } else {
            throw new Error(`AI returned fewer pages (${returnedPages}/${effectivePageCount}) after ${MAX_RETRIES} attempts`)
          }
        }

        generatedStoryData.pages = generatedStoryData.pages.map((page: any, idx: number) => ({
          ...page,
          pageNumber: idx + 1,
        }))
        break
      } catch (error: any) {
        lastStoryError = error
        if (attempt < MAX_RETRIES) {
          console.error(`[Pipeline] ❌ Story attempt ${attempt}/${MAX_RETRIES} failed:`, error.message)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
        } else {
          throw lastStoryError || new Error('Failed to generate story after all retries')
        }
      }
    }

    if (!generatedStoryData) {
      throw lastStoryError || new Error('Failed to generate story')
    }

    storyData = generatedStoryData
    console.log(`[Pipeline] ✅ Story ready: ${storyData.pages.length} pages — "${storyData.title}"`)

    // DB'yi story verisi + başlık ile güncelle
    await updateBook(bookId, {
      title: storyData.title,
      total_pages: storyData.pages.length,
      story_data: storyData,
      ...(storyData.metadata?.ageGroup && { age_group: storyData.metadata.ageGroup }),
    })

    // story_generating %0 → %15 geçişi; master adımına hazır
    await reportProgress(15, 'master_generating')
  }

  // ----------------------------------------------------------------
  // 1. MASTER ILLUSTRATIONS
  // ----------------------------------------------------------------
  const masterIllustrations: Record<string, string> = { ...(ctx.preComputedMasterIllustrations || {}) }
  const entityMasterIllustrations: Record<string, string> = { ...(ctx.preComputedEntityMasterIllustrations || {}) }

  if (ctx.debugStopAfterStep === 'masters' && Object.keys(masterIllustrations).length > 0) {
    console.log('[Pipeline] ⏸️ debugStopAfterStep=masters (pre-computed masters provided) — skipping master generation')
  }

  const themeClothingForMaster: Record<string, string> = {
    adventure: 'comfortable outdoor clothing, hiking clothes, sneakers (adventure outfit)',
    space: 'child-sized astronaut suit or space exploration outfit',
    underwater: 'swimwear, beach clothes',
    sports: 'sportswear, athletic clothes',
    fantasy: 'fantasy-appropriate casual clothing, adventure-style',
    'daily-life': 'everyday casual clothing',
    custom: 'age-appropriate casual clothing',
  }

  if (ctx.preComputedMasterIllustrations) {
    console.log('[Pipeline] ⏩ Skipping master generation — pre-computed masters provided:', Object.keys(masterIllustrations))
  } else if (isFromExampleMode && exampleBook) {
    // From-example: master her karaktere ayrı üretilir
    const exThemeKey = (exampleBook.theme || themeKey).toLowerCase().trim()
    const themeClothing = themeClothingForMaster[exThemeKey] || 'age-appropriate casual clothing'

    for (const char of characters) {
      if (!char.reference_photo_url) continue
      const isMainChar = char.id === characters[0].id
      try {
        const masterUrl = await generateMasterCharacterIllustration(
          char.reference_photo_url,
          char.description,
          char.id,
          exampleBook.illustration_style || illustrationStyle,
          userId,
          true,
          char.gender,
          themeClothing,
          debugTrace ? (e) => debugTrace!.push(e) : undefined,
          `master_character_${char.name || char.id}`,
          bookId,
          char.character_type ?? undefined
        )
        masterIllustrations[char.id] = masterUrl
        console.log(`[Pipeline] ✅ From-example master: ${char.id} (${char.name}): ${masterUrl}`)
      } catch (err: any) {
        if (isMainChar) {
          const isModerationBlocked =
            (err?.message || '').includes('moderation_blocked') ||
            (err?.message || '').includes('safety_violations')
          const userMessage = isModerationBlocked
            ? 'Character illustration could not be created due to a content safety check. Please try again.'
            : `Character illustration generation failed. Please try again. (${err?.message?.slice(0, 120) || 'Unknown error'})`
          throw new Error(userMessage)
        }
        console.warn(`[Pipeline] ⚠️ From-example secondary character master failed for ${char.id}:`, err?.message)
      }
    }

    if (Object.keys(masterIllustrations).length > 0) {
      const currentMeta = {} // Will be merged in DB
      await updateBook(bookId, {
        generation_metadata: {
          masterIllustrations,
          masterIllustrationCreated: true,
        },
      })
    }

    // Entity masters for from-example
    if (storyData?.supportingEntities?.length > 0) {
      const exIllustrationStyle = exampleBook.illustration_style || illustrationStyle
      for (const entity of storyData.supportingEntities) {
        try {
          const entityMasterUrl = await generateSupportingEntityMaster(
            entity.id, entity.type, entity.name, entity.description,
            exIllustrationStyle, userId, undefined, undefined, bookId
          )
          entityMasterIllustrations[entity.id] = entityMasterUrl
        } catch (err: any) {
          console.warn(`[Pipeline] ⚠️ From-example entity master failed for ${entity.name}:`, err?.message)
        }
      }
      if (Object.keys(entityMasterIllustrations).length > 0) {
        await updateBook(bookId, {
          generation_metadata: {
            entityMasterIllustrations,
            entityMasterCreated: true,
          },
        })
      }
    }
  } else {
    // Normal / cover-only mode masters
    const masterStartTime = Date.now()
    console.log('[Pipeline] 🎨 Starting master character illustration generation...')

    const suggestedOutfits =
      storyData?.suggestedOutfits && typeof storyData.suggestedOutfits === 'object'
        ? (storyData.suggestedOutfits as Record<string, string>)
        : null

    for (const char of characters) {
      if (!char.reference_photo_url) {
        console.log(`[Pipeline] ⚠️  Character ${char.id} (${char.name}) has no reference photo - skipping master`)
        continue
      }

      const isMainCharacter = char.id === characters[0].id
      let includeAge: boolean
      if (isMainCharacter) {
        includeAge = true
      } else {
        const isChildType = char.character_type?.group === 'Child' || char.character_type?.value === 'Child'
        const hasAge = char.description?.age && char.description.age > 0
        includeAge = isChildType && hasAge
      }

      const themeClothing = themeClothingForMaster[themeKey] || 'age-appropriate casual clothing'
      const charOutfit = suggestedOutfits?.[char.id]?.trim() || themeClothing

      try {
        const masterUrl = await generateMasterCharacterIllustration(
          char.reference_photo_url,
          char.description,
          char.id,
          illustrationStyle,
          userId,
          includeAge,
          char.gender,
          charOutfit,
          debugTrace ? (e) => debugTrace!.push(e) : undefined,
          `master_character_${char.name || char.id}`,
          bookId,
          char.character_type ?? undefined
        )
        masterIllustrations[char.id] = masterUrl
        console.log(`[Pipeline] ✅ Master created for ${char.id} (${char.name}): ${masterUrl}`)
      } catch (error: any) {
        if (error?.message?.startsWith?.('STOP_AFTER')) throw error
        if (isMainCharacter) {
          const isModerationBlocked =
            (error?.message || '').includes('moderation_blocked') ||
            (error?.message || '').includes('safety_violations')
          const userMessage = isModerationBlocked
            ? 'Character illustration could not be created due to a content safety check. Please try again.'
            : `Character illustration generation failed. Please try again. (${error?.message?.slice(0, 120) || 'Unknown error'})`
          throw new Error(userMessage)
        }
        console.warn(`[Pipeline] ⚠️ Secondary character master failed for ${char.id}:`, error?.message)
      }
    }

    if (Object.keys(masterIllustrations).length > 0) {
      await updateBook(bookId, {
        generation_metadata: {
          masterIllustrations,
          masterIllustrationCreated: true,
        },
      })
    }

    // Supporting entity masters
    if (storyData?.supportingEntities?.length > 0) {
      const entityResults = await Promise.allSettled(
        storyData.supportingEntities.map((entity: any) =>
          generateSupportingEntityMaster(
            entity.id, entity.type, entity.name, entity.description,
            illustrationStyle, userId,
            debugTrace ? (e: any) => debugTrace!.push(e) : undefined,
            `entity_master_${entity.name}`,
            bookId
          )
        )
      )
      entityResults.forEach((result, idx) => {
        const entity = storyData.supportingEntities[idx]
        if (result.status === 'fulfilled') {
          entityMasterIllustrations[entity.id] = result.value
          console.log(`[Pipeline] ✅ Entity master: ${entity.name} (${entity.type}): ${result.value}`)
        } else {
          console.error(`[Pipeline] ❌ Entity master failed for ${entity.name}:`, (result.reason as Error)?.message)
        }
      })

      if (Object.keys(entityMasterIllustrations).length > 0) {
        await updateBook(bookId, {
          generation_metadata: {
            entityMasterIllustrations,
            entityMasterCreated: true,
          },
        })
      }
    }

    const masterMs = Date.now() - masterStartTime
    console.log(`[Pipeline] ⏱️  Master illustrations total: ${masterMs}ms`)
  }

  if (ctx.debugStopAfterStep === 'masters') {
    console.log('[Pipeline] ⏸️ debugStopAfterStep=masters — stopping after master generation')
    await updateBook(bookId, { progress_step: 'master_done_debug' })
    return
  }

  await reportProgress(30, 'cover_generating')

  // ----------------------------------------------------------------
  // 2. COVER IMAGE
  // ----------------------------------------------------------------
  let generatedCoverImageUrl: string | null = ctx.preComputedCoverUrl || null
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  if (ctx.preComputedCoverUrl) {
    console.log('[Pipeline] ⏩ Skipping cover generation — pre-computed cover URL provided:', ctx.preComputedCoverUrl)
    await updateBook(bookId, { cover_image_url: ctx.preComputedCoverUrl, status: 'generating' })
  }

  const coverStartTime = Date.now()
  if (!ctx.preComputedCoverUrl) console.log('[Pipeline] 🎨 Starting cover generation...')

  if (!ctx.preComputedCoverUrl) try {
    // Build cover scene description
    let coverSceneDescription: string
    if (storyData?.pages?.length) {
      const locations = new Set<string>()
      for (const p of storyData.pages) {
        const desc = p.sceneDescription || p.imagePrompt || ''
        const text = p.text || ''
        const extracted = extractSceneElements(desc, text)
        if (extracted.location) locations.add(extracted.location)
      }
      const locationList = [...locations].join(', ')
      const journeyPhrase = locationList
        ? ` Evoke the full journey: ${locationList}. Key story moments and world of the story in one image.`
        : ' Key story moments and world of the story in one image.'
      const storyBlock =
        customRequests && customRequests.trim() ? `Story: ${customRequests}. ` : ''
      // Get book title from storyData or fallback
      const bookTitle = storyData?.title || `${character.name}'s Adventure`
      coverSceneDescription = `A magical book cover for a children's story titled "${bookTitle}". ${storyBlock}In a ${themeKey} theme. The main character should be integrated into the scene with an inviting, whimsical background that captures the essence of the story.${journeyPhrase} The composition should be eye-catching and suitable for a children's book cover, with space for title text at the top. Vibrant, warm colors with a sense of wonder and adventure.`
      if (locationList) console.log('[Pipeline] 📍 Story-based cover locations:', locationList)
    } else {
      const storyBlock =
        customRequests && customRequests.trim() ? `Story: ${customRequests}. ` : ''
      const bookTitle = storyData?.title || `${character.name}'s Adventure`
      coverSceneDescription = `A magical book cover for a children's story titled "${bookTitle}". ${storyBlock}In a ${themeKey} theme. The main character should be integrated into the scene with an inviting, whimsical background that captures the essence of the story. The composition should be eye-catching and suitable for a children's book cover, with space for title text at the top. Vibrant, warm colors with a sense of wonder and adventure.`
    }

    // From-example: enrich with example cover scene
    if (isFromExampleMode && exampleBook?.cover_image_url) {
      const exampleSceneExtra = await describeCoverSceneForPrompt(exampleBook.cover_image_url, {
        userId,
        bookId,
      })
      if (exampleSceneExtra) {
        coverSceneDescription += exampleSceneExtra
        console.log('[Pipeline] 📍 From-example: cover prompt enriched')
      }
    }

    // Build character prompt
    const additionalCharacters = characters.slice(1).map((char) => ({
      type: char.character_type || { group: 'Child', value: 'Child', displayName: char.name },
      description: char.description,
    }))
    const characterPrompt =
      additionalCharacters.length > 0
        ? buildMultipleCharactersPrompt(character.description, additionalCharacters, true)
        : buildCharacterPrompt(character.description, true, true)

    const ageGroup = isCoverOnlyMode ? 'preschool' : storyData?.metadata?.ageGroup || 'preschool'

    const coverEnvironment = resolveCoverEnvironment(storyData, customRequests)
    if (coverEnvironment) console.log('[Pipeline] 🌍 Cover environment (length):', coverEnvironment.length)

    const useMasterForClothing = Object.keys(masterIllustrations).length > 0
    const coverClothing = useMasterForClothing ? 'match_reference' : undefined
    const coverSceneInput = {
      pageNumber: 1,
      sceneDescription: coverSceneDescription,
      theme: themeKey,
      mood:
        themeKey === 'adventure'
          ? 'exciting'
          : themeKey === 'fantasy'
          ? 'mysterious'
          : themeKey === 'space'
          ? 'inspiring'
          : themeKey === 'sports'
          ? 'exciting'
          : 'happy',
      // Nötr: "wonder/adventure" dış mekân çerçevesi ve yaprak kenar bias'ı yaratıyordu.
      characterAction:
        characters.length > 1
          ? 'Poses and staging must match the cover scene description below; same story moment.'
          : 'Pose and staging must match the cover scene description below; same story moment.',
      focusPoint: 'balanced' as const,
      ...(coverClothing && { clothing: coverClothing }),
      ...(coverEnvironment && { coverEnvironment }),
    }

    const textPrompt = generateFullPagePrompt(
      characterPrompt,
      coverSceneInput,
      illustrationStyle,
      ageGroup,
      additionalCharacters.length,
      true,
      false
    )

    console.log('[Pipeline] 📤 COVER IMAGE REQUEST: prompt length=', textPrompt.length)

    const coverMasterUrls = Object.values(masterIllustrations).filter((url): url is string => Boolean(url))
    const entityMasterUrls = Object.values(entityMasterIllustrations).filter((url): url is string => Boolean(url))
    const allCoverMasters = [...coverMasterUrls, ...entityMasterUrls]

    const referenceImageUrls =
      allCoverMasters.length > 0
        ? allCoverMasters
        : characters.map((char) => char.reference_photo_url).filter((url): url is string => Boolean(url))

    let coverImageUrl: string | null = null
    let coverImageB64: string | null = null
    let coverImageOutputFormat: string | null = null
    let editsApiSuccess = false

    if (referenceImageUrls.length > 0) {
      const imageBlobs: Array<{ blob: Blob; filename: string }> = []

      for (let i = 0; i < referenceImageUrls.length; i++) {
        const referenceImageUrl = referenceImageUrls[i]
        try {
          let rawBuffer: Buffer
          if (referenceImageUrl.startsWith('data:')) {
            const base64Data = referenceImageUrl.split(',')[1]
            rawBuffer = Buffer.from(base64Data, 'base64')
          } else {
            const imageResponse = await fetch(referenceImageUrl)
            if (!imageResponse.ok) {
              throw new Error(`Failed to download reference image: ${imageResponse.status} ${imageResponse.statusText}`)
            }
            rawBuffer = Buffer.from(await imageResponse.arrayBuffer())
          }
          // Kapak için referans görseli küçült: karakter kapakta küçük görünür,
          // büyük görsel sadece token maliyetini artırır. 512x768 kimlik için yeterli.
          let finalBuffer: Buffer
          try {
            const sharp = (await import('sharp')).default
            finalBuffer = await sharp(rawBuffer).resize(512, 768, { fit: 'inside', withoutEnlargement: true }).png().toBuffer()
            console.log(`[Pipeline] 🗜️ Cover reference ${i + 1} resized: ${rawBuffer.length} → ${finalBuffer.length} bytes`)
          } catch {
            finalBuffer = rawBuffer
          }
          imageBlobs.push({ blob: new Blob([new Uint8Array(finalBuffer)], { type: 'image/png' }), filename: `reference_${i + 1}.png` })
        } catch (imageError) {
          console.error('[Pipeline] ❌ Error processing reference image:', imageError)
        }
      }

      if (imageBlobs.length > 0) {
        const formData = new FormData()
        formData.append('model', IMAGE_MODEL)
        formData.append('prompt', textPrompt)
        formData.append('size', IMAGE_SIZE)
        formData.append('quality', IMAGE_QUALITY)
        formData.append('input_fidelity', 'high')
        imageBlobs.forEach(({ blob, filename }) => {
          formData.append('image[]', blob, filename)
        })

        try {
          let editsResponse: Response
          try {
            editsResponse = await retryFetch(
              'https://api.openai.com/v1/images/edits',
              { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: formData },
              3,
              'Cover edits API',
              {
                operationType: 'image_cover',
                model: IMAGE_MODEL,
                userId,
                bookId,
              }
            )
          } catch (error: any) {
            if (isModerationBlockedError(error)) {
              console.log('[Pipeline] Moderation 400 (false positive), retrying once...')
              await new Promise((r) => setTimeout(r, 2000))
              const formData2 = new FormData()
              formData2.append('model', IMAGE_MODEL)
              formData2.append('prompt', textPrompt)
              formData2.append('size', IMAGE_SIZE)
              formData2.append('quality', IMAGE_QUALITY)
              formData2.append('input_fidelity', 'high')
              imageBlobs.forEach(({ blob, filename }) => formData2.append('image[]', blob, filename))
              const res = await fetchWithAiDebug('https://api.openai.com/v1/images/edits', {
                method: 'POST',
                headers: { Authorization: `Bearer ${apiKey}` },
                body: formData2,
              }, {
                operationType: 'image_cover',
                model: IMAGE_MODEL,
                userId,
                bookId,
              })
              if (!res.ok) {
                const errText = await res.text()
                const err = new Error(
                  `Cover image generation failed after retries. Status: ${res.status}. Please try again.`
                ) as any
                err.status = res.status
                throw err
              }
              editsResponse = res
            } else {
              throw error
            }
          }

          if (editsResponse.ok) {
            const editsResult = await editsResponse.json()
            if (editsResult.data?.length > 0) {
              coverImageUrl = editsResult.data[0]?.url || null
              coverImageB64 = editsResult.data[0]?.b64_json || null
              coverImageOutputFormat = editsResult.output_format || null
              editsApiSuccess = true
              console.log('[Pipeline] ✅ Cover edits API success')
            }
          }
        } catch (coverEditsError) {
          console.error('[Pipeline] ❌ Cover edits API failed:', coverEditsError)
          // Fall through to generations API
        }
      }
    }

    // Fallback to generations API
    if (!coverImageUrl && !coverImageB64) {
      console.log('[Pipeline] Falling back to /v1/images/generations for cover...')
      const genResponse = await fetchWithAiDebug('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          prompt: textPrompt,
          n: 1,
          size: IMAGE_SIZE,
          quality: IMAGE_QUALITY,
        }),
      }, {
        operationType: 'image_cover',
        model: IMAGE_MODEL,
        userId,
        bookId,
      })

      if (!genResponse.ok) {
        const errorText = await genResponse.text()
        console.error('[Pipeline] ❌ Cover generations API error:', genResponse.status, errorText)
        throw new Error(`Cover generation failed: ${genResponse.status}`)
      }

      const genResult = await genResponse.json()
      coverImageUrl = genResult.data?.[0]?.url || null
      coverImageB64 = genResult.data?.[0]?.b64_json || null
      coverImageOutputFormat = genResult.output_format || null
    }

    if (!coverImageUrl && !coverImageB64) {
      throw new Error('No cover image URL returned from API')
    }

    console.log('[Pipeline] ✅ Cover image generated successfully')
    if (editsApiSuccess) {
      console.log('[Pipeline] ✅✅✅ SUCCESS: Reference image was used via /v1/images/edits API')
    }

    // Upload to S3
    let uploadBytes: ArrayBuffer | Buffer
    let contentType = 'image/png'
    const ext = (coverImageOutputFormat || 'png').toLowerCase()

    if (coverImageUrl) {
      const res = await fetch(coverImageUrl)
      uploadBytes = await res.arrayBuffer()
    } else {
      uploadBytes = Buffer.from(coverImageB64 as string, 'base64')
    }
    if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg'
    if (ext === 'webp') contentType = 'image/webp'

    const fileName = `${userId}/covers/cover_${Date.now()}.${ext || 'png'}`
    const uploadBuffer = Buffer.isBuffer(uploadBytes) ? uploadBytes : Buffer.from(uploadBytes as ArrayBuffer)
    const s3Key = await uploadFile('covers', fileName, uploadBuffer, contentType)
    const storageCoverUrl = getPublicUrl(s3Key)

    generatedCoverImageUrl = storageCoverUrl
    console.log('[Pipeline] ✅ Cover uploaded to S3')

    if (debugTrace) {
      debugTrace.push({
        step: 'cover',
        request: { prompt: textPrompt, coverSceneDescription, themeKey, illustrationStyle },
        response: { url: storageCoverUrl },
      })
    }

    await updateBook(bookId, {
      cover_image_url: storageCoverUrl,
      cover_image_path: s3Key,
      status: 'generating',
    })
  } catch (coverError) {
    console.error('[Pipeline] Cover generation failed:', coverError)
    await updateBook(bookId, { status: 'failed', progress_step: 'failed' })
    throw coverError
  }

  const coverMs = Date.now() - coverStartTime
  console.log(`[Pipeline] ⏱️  Cover generation total: ${coverMs}ms`)

  if (isCoverOnlyMode) {
    console.log('[Pipeline] ✅ Cover only mode complete')
    await updateBook(bookId, { status: 'completed', progress_percent: 100, progress_step: 'completed' })
    return
  }

  if (ctx.debugStopAfterStep === 'cover') {
    console.log('[Pipeline] ⏸️ debugStopAfterStep=cover — stopping after cover generation')
    await updateBook(bookId, { progress_step: 'cover_done_debug' })
    return
  }

  await reportProgress(50, 'pages_generating')

  // ----------------------------------------------------------------
  // 3. PAGE IMAGES
  // ----------------------------------------------------------------
  if (!storyData?.pages?.length) {
    console.log('[Pipeline] ⚠️  No story pages - skipping page image generation')
    await updateBook(bookId, { status: 'completed', progress_percent: 90, progress_step: 'tts_generating' })
  } else {
    try {
      const pages = storyData.pages
      const totalPages = pages.length
      const pageImagesStartTime = Date.now()

      console.log(`[Pipeline] 🎨 Starting page images generation (${totalPages} pages)...`)

      const generatedImages: any[] = []
      const sceneDiversityAnalysis: SceneDiversityAnalysis[] = []

      const BATCH_SIZE = 15
      const RATE_LIMIT_WINDOW_MS = 90000

      for (let batchStart = 0; batchStart < totalPages; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, totalPages)
        const batchPages = pages.slice(batchStart, batchEnd)

        console.log(`[Pipeline] 🔄 Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}: pages ${batchStart + 1}-${batchEnd}`)

        const batchPromises = batchPages.map(
          async (
            page: {
              pageNumber?: number
              text?: string
              characterIds?: string[]
              imagePrompt?: string
              sceneDescription?: string
              imageUrl?: string
            },
            batchIndex: number
          ) => {
            const i = batchStart + batchIndex
            const pageNumber = page.pageNumber || i + 1

            let sceneDescription = page.imagePrompt || page.sceneDescription || page.text
            const ageGroup = storyData.metadata?.ageGroup || 'preschool'
            const pageUseMasterClothing = Object.keys(masterIllustrations).length > 0

            const pageWithContext = page as {
              sceneContext?: string
              sceneDescription?: string
              imagePrompt?: string
              text?: string
            }
            const characterActionRaw =
              pageWithContext.sceneContext?.trim() ||
              pageWithContext.sceneDescription?.trim() ||
              pageWithContext.imagePrompt?.trim() ||
              page.text?.trim() ||
              ''
            const riskAnalysis = detectRiskySceneElements(sceneDescription ?? '', characterActionRaw)
            const characterAction = riskAnalysis.hasRisk
              ? getSafeSceneAlternative(characterActionRaw)
              : characterActionRaw

            const focusPoint: 'character' | 'environment' | 'balanced' = 'balanced'
            const mood =
              themeKey === 'adventure'
                ? 'exciting'
                : themeKey === 'fantasy'
                ? 'mysterious'
                : themeKey === 'space'
                ? 'inspiring'
                : themeKey === 'sports'
                ? 'exciting'
                : 'happy'
            const pageClothing = pageUseMasterClothing ? 'match_reference' : undefined

            const pageCharacters = page.characterIds || []

            const characterExpressions: Record<string, string> = {}
            const pageCharExprs = (page as any).characterExpressions || {}
            pageCharacters.forEach((charId: string) => {
              const expr = pageCharExprs[charId]?.trim()
              if (expr) characterExpressions[charId] = expr
            })

            const pageShotPlan = (
              page as {
                shotPlan?: {
                  shotType?: string
                  lens?: string
                  cameraAngle?: string
                  placement?: string
                  timeOfDay?: string
                  mood?: string
                }
              }
            ).shotPlan
            const hasValidShotPlan =
              pageShotPlan && typeof pageShotPlan === 'object' && !Array.isArray(pageShotPlan)

            const pageEnvironmentDescription = (page as any).environmentDescription?.trim() || undefined
            const pageCameraDistance = (page as any).cameraDistance || undefined

            const sceneInput = {
              pageNumber,
              sceneDescription: sceneDescription ?? '',
              theme: themeKey,
              mood,
              characterAction: characterAction ?? '',
              focusPoint,
              ...(pageClothing && { clothing: pageClothing }),
              ...(Object.keys(characterExpressions).length > 0 && { characterExpressions }),
              ...(hasValidShotPlan && { shotPlan: pageShotPlan }),
              ...(pageEnvironmentDescription && { environmentDescription: pageEnvironmentDescription }),
              ...(pageCameraDistance && { cameraDistance: pageCameraDistance }),
            }

            const mainCharacter =
              characters.find((c: { id: string }) => c.id === pageCharacters[0]) || character
            const pageAdditionalCharacters = pageCharacters
              .slice(1)
              .map((charId: string) => {
                const char = characters.find((c: { id: string }) => c.id === charId)
                if (!char) return null
                return {
                  type: char.character_type || { group: 'Child', value: 'Child', displayName: char.name },
                  description: char.description,
                }
              })
              .filter((char): char is NonNullable<typeof char> => char !== null)

            const characterPrompt =
              pageAdditionalCharacters.length > 0
                ? buildMultipleCharactersPrompt(mainCharacter.description, pageAdditionalCharacters, true)
                : buildCharacterPrompt(mainCharacter.description, true, true)

            const additionalCharactersCount = pageAdditionalCharacters.length

            const currentSceneAnalysis = analyzeSceneDiversity(
              sceneDescription ?? '',
              page.text || '',
              pageNumber,
              sceneDiversityAnalysis
            )
            sceneDiversityAnalysis.push(currentSceneAnalysis)

            const fullPrompt = generateFullPagePrompt(
              characterPrompt,
              sceneInput,
              illustrationStyle,
              ageGroup,
              additionalCharactersCount,
              false,
              false,
              sceneDiversityAnalysis.slice(0, -1),
              totalPages,
              pageCharacters.map((charId: string) => ({
                id: charId,
                name: characters.find((c: any) => c.id === charId)?.name || 'Character',
              }))
            )

            let pageImageUrl: string | null = null
            let pageImageB64: string | null = null
            let pageImageOutputFormat: string | null = null

            const pageMasterUrls = pageCharacters
              .map((charId: string) => masterIllustrations[charId])
              .filter((url): url is string => Boolean(url))

            const characterNames = new Set(
              characters.map((c: { name?: string }) => (c.name || '').trim().toLowerCase()).filter(Boolean)
            )
            const pageEntityIds: string[] = []
            if (storyData?.supportingEntities) {
              for (const entity of storyData.supportingEntities) {
                if (entity.appearsOnPages && entity.appearsOnPages.includes(pageNumber)) {
                  const entityName = (entity.name || '').trim().toLowerCase()
                  if (entityName && characterNames.has(entityName)) continue
                  pageEntityIds.push(entity.id)
                }
              }
            }
            const pageEntityMasterUrls = pageEntityIds
              .map((entityId) => entityMasterIllustrations[entityId])
              .filter((url): url is string => Boolean(url))

            const allPageMasters = [...pageMasterUrls, ...pageEntityMasterUrls]
            const referenceImageUrls =
              allPageMasters.length > 0
                ? allPageMasters
                : characters
                    .filter((c) => pageCharacters.includes(c.id))
                    .map((c) => c.reference_photo_url)
                    .filter((url): url is string => Boolean(url))

            if (referenceImageUrls.length > 0) {
              const imageBlobs: Array<{ blob: Blob; filename: string }> = []

              for (let refIdx = 0; refIdx < referenceImageUrls.length; refIdx++) {
                const referenceImageUrl = referenceImageUrls[refIdx]
                const charId = pageCharacters[refIdx] || `unknown_${refIdx}`
                const charName =
                  characters.find((c: any) => c.id === charId)?.name || `character_${refIdx + 1}`
                const isMaster = pageMasterUrls.length > 0 && pageMasterUrls.includes(referenceImageUrl)
                const imageLabel = isMaster ? `master_${charName}` : `photo_${charName}`

                try {
                  if (referenceImageUrl.startsWith('data:')) {
                    const base64Data = referenceImageUrl.split(',')[1]
                    const binaryData = Buffer.from(base64Data, 'base64')
                    imageBlobs.push({ blob: new Blob([binaryData], { type: 'image/png' }), filename: `${imageLabel}.png` })
                  } else {
                    const imageResponse = await fetch(referenceImageUrl)
                    if (!imageResponse.ok) {
                      throw new Error(`Failed to download ${imageLabel}: ${imageResponse.status}`)
                    }
                    const imageBuffer = await imageResponse.arrayBuffer()
                    imageBlobs.push({ blob: new Blob([imageBuffer], { type: 'image/png' }), filename: `${imageLabel}.png` })
                  }
                } catch (imageError) {
                  console.error(`[Pipeline] Page ${pageNumber} - ❌ Error processing ${imageLabel}:`, imageError)
                }
              }

              if (imageBlobs.length > 0) {
                const formData = new FormData()
                formData.append('model', IMAGE_MODEL)
                formData.append('prompt', fullPrompt)
                formData.append('size', IMAGE_SIZE)
                formData.append('quality', IMAGE_QUALITY)
                formData.append('input_fidelity', 'high')
                imageBlobs.forEach(({ blob, filename }) => formData.append('image[]', blob, filename))

                let editsResponse: Response
                try {
                  editsResponse = await retryFetch(
                    'https://api.openai.com/v1/images/edits',
                    { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: formData },
                    3,
                    `Page ${pageNumber} edits API`,
                    {
                      operationType: 'image_page',
                      model: IMAGE_MODEL,
                      userId,
                      bookId,
                      pageIndex: pageNumber,
                    }
                  )
                } catch (error: any) {
                  const errorStatus = error.status || 'unknown'
                  throw new Error(
                    `Page ${pageNumber} image generation failed after retries. Status: ${errorStatus}. Please try again.`
                  )
                }

                const editsResult = await editsResponse.json()
                pageImageUrl = editsResult.data[0]?.url || null
                pageImageB64 = editsResult.data[0]?.b64_json || null
                pageImageOutputFormat = editsResult.output_format || null
              }

              // Only use generations if no reference images processed
              if (!pageImageUrl && !pageImageB64 && referenceImageUrls.length === 0) {
                const genResponse = await fetchWithAiDebug('https://api.openai.com/v1/images/generations', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                  body: JSON.stringify({ model: IMAGE_MODEL, prompt: fullPrompt, n: 1, size: IMAGE_SIZE, quality: IMAGE_QUALITY }),
                }, {
                  operationType: 'image_page',
                  model: IMAGE_MODEL,
                  userId,
                  bookId,
                  pageIndex: pageNumber,
                })
                if (!genResponse.ok) return null
                const genResult = await genResponse.json()
                pageImageUrl = genResult.data?.[0]?.url || null
                pageImageB64 = genResult.data?.[0]?.b64_json || null
                pageImageOutputFormat = genResult.output_format || null
              }
            } else {
              // No reference images: use generations directly
              const genResponse = await fetchWithAiDebug('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({ model: IMAGE_MODEL, prompt: fullPrompt, n: 1, size: IMAGE_SIZE, quality: IMAGE_QUALITY }),
              }, {
                operationType: 'image_page',
                model: IMAGE_MODEL,
                userId,
                bookId,
                pageIndex: pageNumber,
              })
              if (!genResponse.ok) return null
              const genResult = await genResponse.json()
              pageImageUrl = genResult.data?.[0]?.url || null
              pageImageB64 = genResult.data?.[0]?.b64_json || null
              pageImageOutputFormat = genResult.output_format || null
            }

            if (!pageImageUrl && !pageImageB64) return null

            // Upload to S3
            let imageBuffer: ArrayBuffer | Buffer
            let contentType = 'image/png'
            const ext = (pageImageOutputFormat || 'png').toLowerCase()
            if (pageImageUrl) {
              const res = await fetch(pageImageUrl)
              imageBuffer = await res.arrayBuffer()
            } else {
              imageBuffer = Buffer.from(pageImageB64 as string, 'base64')
            }
            if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg'
            if (ext === 'webp') contentType = 'image/webp'

            const fileName = `${userId}/books/${bookId}/page_${pageNumber}_${Date.now()}.${ext || 'png'}`
            const pageImageBuffer = Buffer.isBuffer(imageBuffer)
              ? imageBuffer
              : Buffer.from(imageBuffer as ArrayBuffer)
            const s3Key = await uploadFile('books', fileName, pageImageBuffer, contentType)
            const storageImageUrl = getPublicUrl(s3Key)

            if (debugTrace) {
              debugTrace.push({
                step: `page_${pageNumber}`,
                request: { prompt: fullPrompt, sceneDescription, pageNumber },
                response: { url: storageImageUrl },
              })
            }

            const pageIndex = pages.findIndex(
              (p: { pageNumber?: number }) =>
                (p.pageNumber || pages.indexOf(p) + 1) === pageNumber
            )
            if (pageIndex !== -1) pages[pageIndex].imageUrl = storageImageUrl

            // Per-page progress: 40% → 90% (monotonic DB update: paralel tamamlanmada yüzde geri atlamasın)
            const pageProgress = Math.round(50 + ((i + 1) / totalPages) * 40)
            await updateBookProgressAtLeast(bookId, pageProgress, 'pages_generating')

            return { pageNumber, imageUrl: storageImageUrl, storagePath: s3Key, prompt: fullPrompt }
          }
        )

        const batchResults = await Promise.allSettled(batchPromises)
        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value) {
            generatedImages.push(result.value)
          }
        }
        const successCount = batchResults.filter((r) => r.status === 'fulfilled').length
        const failCount = batchResults.filter((r) => r.status === 'rejected').length
        console.log(
          `[Pipeline] ✅ Batch ${Math.floor(batchStart / BATCH_SIZE) + 1} completed: ${successCount}/${batchPages.length} images (${failCount} failed)`
        )

        if (batchEnd < totalPages) {
          console.log('[Pipeline] ⏳ Rate limiting: Waiting 90 seconds before next batch...')
          await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_WINDOW_MS))
        }
      }

      const totalPageImagesTime = Date.now() - pageImagesStartTime
      console.log(`[Pipeline] ✅ Generated ${generatedImages.length}/${totalPages} page images (${totalPageImagesTime}ms)`)

      const allImagesGenerated = generatedImages.length === totalPages
      if (!allImagesGenerated) {
        await updateBook(bookId, { status: 'failed', progress_step: 'failed' })
        throw new Error(`Page image generation incomplete: ${generatedImages.length}/${totalPages}`)
      }
      // status 'generating' kalıyor — TTS bittikten sonra 'completed' yapılacak
      await updateBook(bookId, {
        story_data: { ...storyData, pages },
        images_data: generatedImages,
        status: 'generating',
      })
    } catch (imagesError) {
      console.error('[Pipeline] Page images generation failed:', imagesError)
      await updateBook(bookId, { status: 'failed', progress_step: 'failed' })
      throw imagesError
    }
  }

  if (ctx.debugStopAfterStep === 'pages') {
    console.log('[Pipeline] ⏸️ debugStopAfterStep=pages — stopping after page generation')
    await updateBook(bookId, { progress_step: 'pages_done_debug' })
    return
  }

  await reportProgress(90, 'tts_generating')

  // ----------------------------------------------------------------
  // 4. TTS
  // ----------------------------------------------------------------
  if (storyData?.pages?.length) {
    const bookLanguage = language || 'tr'
    const pages = storyData.pages
    const ttsPages = pages.filter((p: any) => p?.text?.trim())
    if (ttsPages.length > 0) {
      console.log(`[Pipeline] 🔊 TTS: ${ttsPages.length} pages...`)
      const ttsStartTime = Date.now()
      let ttsSuccess = 0
      let ttsFail = 0
      let ttsFinished = 0

      const basePercent = 90
      const spanPercent = 10
      const totalTts = ttsPages.length

      await Promise.all(
        ttsPages.map(async (p: any, idx: number) => {
          const pageIndex = idx + 1
          try {
            await generateTts(p.text.trim(), { language: bookLanguage, userId, bookId })
            ttsSuccess++
          } catch (err) {
            ttsFail++
            console.warn(`[Pipeline] TTS page ${pageIndex}/${totalTts} failed:`, (err as Error)?.message || err)
          } finally {
            // Paralel TTS tamamlanma sırası deterministic değildir; progress'i "tamamlanan adet" ile monotonik tut.
            ttsFinished += 1
            const perPageProgress = basePercent + Math.round((ttsFinished / totalTts) * spanPercent)
            await updateBookProgressAtLeast(bookId, perPageProgress, 'tts_generating')
            if (ctx.onProgress) {
              await ctx.onProgress(perPageProgress, 'tts_generating')
            }
          }
        })
      )
      const ttsTotalMs = Date.now() - ttsStartTime
      console.log(
        `[Pipeline] ✅ TTS done: ${ttsSuccess}/${ttsPages.length} pages (${ttsFail} failed) — ${ttsTotalMs}ms`
      )
    }
  }

  await reportProgress(100, 'completed')
  await updateBook(bookId, { status: 'completed', progress_percent: 100, progress_step: 'completed' })
  console.log(`[Pipeline] ✅ Book ${bookId} pipeline completed`)
}
