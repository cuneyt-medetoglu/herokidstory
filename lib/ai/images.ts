/**
 * @file OpenAI Images API wrappers with automatic request logging.
 *
 * Covers both image edits (/v1/images/edits) and generations (/v1/images/generations).
 * Logging is fire-and-forget — a logging failure never throws or blocks the caller.
 *
 * Usage (edit):
 *   const result = await imageEditWithLog(formData, {
 *     userId: user.id, bookId: book.id,
 *     operationType: 'image_cover',
 *     model: 'gpt-image-1.5', quality: 'low', size: '1024x1536',
 *     refImageCount: 2,
 *   })
 *
 * Usage (generate):
 *   const result = await imageGenerateWithLog(body, {
 *     userId: user.id, bookId: book.id,
 *     operationType: 'image_page', pageIndex: 3,
 *     model: 'gpt-image-1.5', quality: 'low', size: '1024x1536',
 *   })
 */

import { insertAIRequest, type AIOperationType } from '@/lib/db/ai-requests'

// ============================================================================
// Pricing
// ============================================================================

/** Cost per image (1024×1536 portrait). Adjust if size/model changes. */
const IMAGE_COST_PER_IMAGE: Record<string, Record<string, number>> = {
  'gpt-image-1.5': { low: 0.011, medium: 0.040, high: 0.070 },
}

function calcImageCost(model: string, quality: string, count = 1): number {
  const qualityMap = IMAGE_COST_PER_IMAGE[model]
  if (!qualityMap) return 0
  return (qualityMap[quality] ?? qualityMap['low']) * count
}

// ============================================================================
// Shared context
// ============================================================================

export interface ImageLogContext {
  userId: string
  bookId?: string | null
  characterId?: string | null
  operationType: AIOperationType
  promptVersion?: string | null
  pageIndex?: number | null
  model: string
  quality?: string
  size?: string
  refImageCount?: number
}

type ImageAPIResult = {
  data: Array<{ url?: string; b64_json?: string; revised_prompt?: string }>
  /** Some API variants return a top-level URL instead of data[].url */
  url?: string
}

// ============================================================================
// Image Edit wrapper (/v1/images/edits)
// ============================================================================

/**
 * Calls `/v1/images/edits` with the given FormData and logs the request.
 * Returns the parsed JSON response (same shape as OpenAI Images API).
 */
export async function imageEditWithLog(
  formData: FormData,
  ctx: ImageLogContext
): Promise<ImageAPIResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const startedAt = Date.now()

  let response: Response
  try {
    response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    })
  } catch (err) {
    const durationMs = Date.now() - startedAt
    void insertAIRequest({
      userId: ctx.userId, bookId: ctx.bookId, characterId: ctx.characterId,
      operationType: ctx.operationType, provider: 'openai', model: ctx.model,
      promptVersion: ctx.promptVersion, pageIndex: ctx.pageIndex,
      status: 'error', errorMessage: err instanceof Error ? err.message : String(err),
      durationMs,
      requestMeta: buildRequestMeta(ctx),
    })
    throw err
  }

  const durationMs = Date.now() - startedAt

  if (!response.ok) {
    const errorText = await response.text()
    void insertAIRequest({
      userId: ctx.userId, bookId: ctx.bookId, characterId: ctx.characterId,
      operationType: ctx.operationType, provider: 'openai', model: ctx.model,
      promptVersion: ctx.promptVersion, pageIndex: ctx.pageIndex,
      status: 'error', errorMessage: `HTTP ${response.status}: ${errorText.slice(0, 300)}`,
      durationMs,
      requestMeta: buildRequestMeta(ctx),
    })
    throw new Error(`GPT-image API error: ${response.status} - ${errorText}`)
  }

  const result: ImageAPIResult = await response.json()
  const imageCount = result.data?.length ?? 1
  const costUsd = calcImageCost(ctx.model, ctx.quality ?? 'low', imageCount)

  void insertAIRequest({
    userId: ctx.userId, bookId: ctx.bookId, characterId: ctx.characterId,
    operationType: ctx.operationType, provider: 'openai', model: ctx.model,
    promptVersion: ctx.promptVersion, pageIndex: ctx.pageIndex,
    status: 'success', imageCount, costUsd, durationMs,
    requestMeta: buildRequestMeta(ctx),
  })

  return result
}

// ============================================================================
// Image Generate wrapper (/v1/images/generations)
// ============================================================================

export interface ImageGenerateBody {
  model: string
  prompt: string
  n?: number
  size?: string
  quality?: string
  response_format?: string
}

/**
 * Calls `/v1/images/generations` and logs the request.
 * Returns the parsed JSON response.
 */
export async function imageGenerateWithLog(
  body: ImageGenerateBody,
  ctx: ImageLogContext
): Promise<ImageAPIResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const startedAt = Date.now()

  let response: Response
  try {
    response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    const durationMs = Date.now() - startedAt
    void insertAIRequest({
      userId: ctx.userId, bookId: ctx.bookId, characterId: ctx.characterId,
      operationType: ctx.operationType, provider: 'openai', model: ctx.model,
      promptVersion: ctx.promptVersion, pageIndex: ctx.pageIndex,
      status: 'error', errorMessage: err instanceof Error ? err.message : String(err),
      durationMs,
      requestMeta: buildRequestMeta(ctx),
    })
    throw err
  }

  const durationMs = Date.now() - startedAt

  if (!response.ok) {
    const errorText = await response.text()
    void insertAIRequest({
      userId: ctx.userId, bookId: ctx.bookId, characterId: ctx.characterId,
      operationType: ctx.operationType, provider: 'openai', model: ctx.model,
      promptVersion: ctx.promptVersion, pageIndex: ctx.pageIndex,
      status: 'error', errorMessage: `HTTP ${response.status}: ${errorText.slice(0, 300)}`,
      durationMs,
      requestMeta: buildRequestMeta(ctx),
    })
    throw new Error(`GPT-image API error: ${response.status} - ${errorText}`)
  }

  const result: ImageAPIResult = await response.json()
  const imageCount = result.data?.length ?? (body.n ?? 1)
  const costUsd = calcImageCost(ctx.model, ctx.quality ?? body.quality ?? 'low', imageCount)

  void insertAIRequest({
    userId: ctx.userId, bookId: ctx.bookId, characterId: ctx.characterId,
    operationType: ctx.operationType, provider: 'openai', model: ctx.model,
    promptVersion: ctx.promptVersion, pageIndex: ctx.pageIndex,
    status: 'success', imageCount, costUsd, durationMs,
    requestMeta: buildRequestMeta(ctx),
  })

  return result
}

// ============================================================================
// Helpers
// ============================================================================

function buildRequestMeta(ctx: ImageLogContext): Record<string, unknown> {
  const meta: Record<string, unknown> = {}
  if (ctx.size) meta.size = ctx.size
  if (ctx.quality) meta.quality = ctx.quality
  if (ctx.refImageCount != null) meta.refImageCount = ctx.refImageCount
  return meta
}
