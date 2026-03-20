/**
 * OpenAI Images API (edits + generations) — yanıttaki `usage` token’ları + resmi fiyatlarla maliyet.
 */

import { insertAIRequest, type AIOperationType } from '@/lib/db/ai-requests'
import {
  imageCostUsdFromUsage,
  type OpenAIImageUsage,
} from '@/lib/pricing/openai-usage-cost'
import {
  appendAiDebugLog,
  sanitizeForDebugLog,
  summarizeFormData,
} from '@/lib/debug/ai-debug-log'

function throwHttpError(prefix: string, status: number, errorText: string): never {
  const err = new Error(`${prefix}: ${status} - ${errorText}`) as Error & { status: number }
  err.status = status
  throw err
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

export type ImageAPIResult = {
  data: Array<{ url?: string; b64_json?: string; revised_prompt?: string }>
  url?: string
  output_format?: string
  /** gpt-image: token kullanımı (maliyet buradan hesaplanır) */
  usage?: OpenAIImageUsage
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
  const endpoint = '/v1/images/edits'

  void appendAiDebugLog({
    stage: 'request',
    operationType: ctx.operationType,
    provider: 'openai',
    endpoint,
    model: ctx.model,
    userId: ctx.userId,
    bookId: ctx.bookId,
    characterId: ctx.characterId,
    pageIndex: ctx.pageIndex,
    promptVersion: ctx.promptVersion,
    payload: sanitizeForDebugLog({
      formData: summarizeFormData(formData),
      context: buildRequestMeta(ctx),
    }),
  })

  let response: Response
  try {
    response = await fetch(`https://api.openai.com${endpoint}`, {
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
    void appendAiDebugLog({
      stage: 'error',
      operationType: ctx.operationType,
      provider: 'openai',
      endpoint,
      model: ctx.model,
      userId: ctx.userId,
      bookId: ctx.bookId,
      characterId: ctx.characterId,
      pageIndex: ctx.pageIndex,
      promptVersion: ctx.promptVersion,
      durationMs,
      payload: { error: err instanceof Error ? err.message : String(err) },
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
    void appendAiDebugLog({
      stage: 'error',
      operationType: ctx.operationType,
      provider: 'openai',
      endpoint,
      model: ctx.model,
      userId: ctx.userId,
      bookId: ctx.bookId,
      characterId: ctx.characterId,
      pageIndex: ctx.pageIndex,
      promptVersion: ctx.promptVersion,
      status: response.status,
      durationMs,
      payload: sanitizeForDebugLog({ error: errorText }),
    })
    throwHttpError('GPT-image API error', response.status, errorText)
  }

  const result: ImageAPIResult = await response.json()
  const imageCount = result.data?.length ?? 1
  const costUsd = imageCostUsdFromUsage(ctx.model, result.usage, { kind: 'edit' })

  void insertAIRequest({
    userId: ctx.userId, bookId: ctx.bookId, characterId: ctx.characterId,
    operationType: ctx.operationType, provider: 'openai', model: ctx.model,
    promptVersion: ctx.promptVersion, pageIndex: ctx.pageIndex,
    status: 'success', imageCount, costUsd, durationMs,
    requestMeta: buildRequestMeta(ctx),
    responseMeta: { usage: result.usage ?? null },
  })

  void appendAiDebugLog({
    stage: 'response',
    operationType: ctx.operationType,
    provider: 'openai',
    endpoint,
    model: ctx.model,
    userId: ctx.userId,
    bookId: ctx.bookId,
    characterId: ctx.characterId,
    pageIndex: ctx.pageIndex,
    promptVersion: ctx.promptVersion,
    status: response.status,
    durationMs,
    payload: sanitizeForDebugLog(result),
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
  const endpoint = '/v1/images/generations'

  void appendAiDebugLog({
    stage: 'request',
    operationType: ctx.operationType,
    provider: 'openai',
    endpoint,
    model: ctx.model,
    userId: ctx.userId,
    bookId: ctx.bookId,
    characterId: ctx.characterId,
    pageIndex: ctx.pageIndex,
    promptVersion: ctx.promptVersion,
    payload: sanitizeForDebugLog({
      body,
      context: buildRequestMeta(ctx),
    }),
  })

  let response: Response
  try {
    response = await fetch(`https://api.openai.com${endpoint}`, {
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
    void appendAiDebugLog({
      stage: 'error',
      operationType: ctx.operationType,
      provider: 'openai',
      endpoint,
      model: ctx.model,
      userId: ctx.userId,
      bookId: ctx.bookId,
      characterId: ctx.characterId,
      pageIndex: ctx.pageIndex,
      promptVersion: ctx.promptVersion,
      durationMs,
      payload: { error: err instanceof Error ? err.message : String(err) },
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
    void appendAiDebugLog({
      stage: 'error',
      operationType: ctx.operationType,
      provider: 'openai',
      endpoint,
      model: ctx.model,
      userId: ctx.userId,
      bookId: ctx.bookId,
      characterId: ctx.characterId,
      pageIndex: ctx.pageIndex,
      promptVersion: ctx.promptVersion,
      status: response.status,
      durationMs,
      payload: sanitizeForDebugLog({ error: errorText }),
    })
    throwHttpError('GPT-image API error', response.status, errorText)
  }

  const result: ImageAPIResult = await response.json()
  const imageCount = result.data?.length ?? (body.n ?? 1)
  const costUsd = imageCostUsdFromUsage(ctx.model, result.usage, { kind: 'generate' })

  void insertAIRequest({
    userId: ctx.userId, bookId: ctx.bookId, characterId: ctx.characterId,
    operationType: ctx.operationType, provider: 'openai', model: ctx.model,
    promptVersion: ctx.promptVersion, pageIndex: ctx.pageIndex,
    status: 'success', imageCount, costUsd, durationMs,
    requestMeta: buildRequestMeta(ctx),
    responseMeta: { usage: result.usage ?? null },
  })

  void appendAiDebugLog({
    stage: 'response',
    operationType: ctx.operationType,
    provider: 'openai',
    endpoint,
    model: ctx.model,
    userId: ctx.userId,
    bookId: ctx.bookId,
    characterId: ctx.characterId,
    pageIndex: ctx.pageIndex,
    promptVersion: ctx.promptVersion,
    status: response.status,
    durationMs,
    payload: sanitizeForDebugLog(result),
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
