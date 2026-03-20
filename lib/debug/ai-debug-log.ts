import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export interface AIDebugLogEntry {
  stage: 'request' | 'response' | 'error'
  operationType: string
  provider: 'openai' | 'google'
  endpoint: string
  model?: string
  userId?: string | null
  bookId?: string | null
  characterId?: string | null
  pageIndex?: number | null
  promptVersion?: string | null
  status?: number
  durationMs?: number
  payload?: JsonValue
  meta?: Record<string, JsonValue>
}

const BASE64_FIELD_HINTS = [
  'b64',
  'base64',
  'image_base64',
  'imageData',
  'audio_base64',
] as const

const LONG_STRING_LIMIT = 2000

function isLoggingEnabled(): boolean {
  const flag = process.env.AI_DEBUG_LOG
  const file = process.env.AI_DEBUG_LOG_FILE
  return flag === '1' || flag === 'true' || Boolean(file)
}

function getLogFilePath(): string {
  if (process.env.AI_DEBUG_LOG_FILE) {
    return process.env.AI_DEBUG_LOG_FILE
  }
  return path.join(process.cwd(), 'logs', 'ai-api-debug.jsonl')
}

function looksLikeBase64(value: string): boolean {
  if (value.length < 128 || value.length % 4 !== 0) return false
  return /^[A-Za-z0-9+/=\r\n]+$/.test(value)
}

function redactString(value: string): string {
  if (looksLikeBase64(value)) return `[omitted: base64, ${value.length} chars]`
  if (value.length > LONG_STRING_LIMIT) {
    return `${value.slice(0, LONG_STRING_LIMIT)}...[truncated ${value.length - LONG_STRING_LIMIT} chars]`
  }
  return value
}

function shouldRedactByKey(key: string): boolean {
  const lowerKey = key.toLowerCase()
  return BASE64_FIELD_HINTS.some((hint) => lowerKey.includes(hint.toLowerCase()))
}

function sanitizeValue(value: unknown, keyHint?: string): JsonValue {
  if (value == null) return null
  if (typeof value === 'boolean' || typeof value === 'number') return value
  if (typeof value === 'string') {
    if (keyHint && shouldRedactByKey(keyHint)) {
      return `[omitted: ${keyHint}, ${value.length} chars]`
    }
    return redactString(value)
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item))
  }
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') {
    const out: { [key: string]: JsonValue } = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === 'string' && shouldRedactByKey(k)) {
        out[k] = `[omitted: ${k}, ${v.length} chars]`
      } else {
        out[k] = sanitizeValue(v, k)
      }
    }
    return out
  }
  return String(value)
}

export async function appendAiDebugLog(entry: AIDebugLogEntry): Promise<void> {
  if (!isLoggingEnabled()) return

  try {
    const filePath = getLogFilePath()
    await mkdir(path.dirname(filePath), { recursive: true })

    const record = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry,
      payload: sanitizeValue(entry.payload),
      meta: sanitizeValue(entry.meta ?? {}) as Record<string, JsonValue>,
    }

    await appendFile(filePath, `${JSON.stringify(record)}\n`, 'utf8')
  } catch (err) {
    console.warn('[ai-debug-log] Failed to write debug log:', err)
  }
}

export function summarizeFormData(formData: FormData): Record<string, JsonValue> {
  const summary: Record<string, JsonValue> = {}

  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      const current = summary[key]
      const sanitized = sanitizeValue(value, key)
      if (current === undefined) summary[key] = sanitized
      else if (Array.isArray(current)) summary[key] = [...current, sanitized]
      else summary[key] = [current, sanitized]
      continue
    }

    const fileSummary = {
      type: 'file',
      name: value.name,
      size: value.size,
      mime: value.type,
    } satisfies JsonValue
    const current = summary[key]
    if (current === undefined) summary[key] = fileSummary
    else if (Array.isArray(current)) summary[key] = [...current, fileSummary]
    else summary[key] = [current, fileSummary]
  }

  return summary
}

export function sanitizeForDebugLog(value: unknown): JsonValue {
  return sanitizeValue(value)
}
