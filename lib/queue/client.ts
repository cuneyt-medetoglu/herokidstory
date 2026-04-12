/**
 * BullMQ queue client — Faz 0: baglanti ve kuyruk tanimi.
 * Faz 2: enqueueBookGeneration helper ile kitap oluşturma işi kuyruğa eklenir.
 * Connection options kullaniliyor (BullMQ kendi ioredis ile baglanti açar; tip uyumsuzlugu onlenir).
 */
import { Queue } from 'bullmq'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
let host = 'localhost'
let port = 6379
try {
  const u = new URL(redisUrl)
  host = u.hostname
  port = parseInt(u.port || '6379', 10)
} catch {
  // redisUrl gecersizse localhost:6379 kullan
}

export const connection = { host, port, maxRetriesPerRequest: null as number | null }

export const BOOK_GENERATION_QUEUE_NAME = 'book-generation'

export const bookGenerationQueue = new Queue(BOOK_GENERATION_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
  },
})

export interface BookGenerationJobData {
  bookId: string
  userId: string
  /** Normalize edilmiş tema anahtarı */
  themeKey: string
  illustrationStyle: string
  language: string
  customRequests?: string
  isFromExampleMode: boolean
  isCoverOnlyMode: boolean
  /** Character ID listesi (DB'den okunacak) */
  characterIds: string[]
  /** From-example modda örnek kitap ID'si */
  fromExampleId?: string
  /**
   * Hikaye üretimi için model (P3 §10/C).
   * story_data null ise worker pipeline ilk adımda hikayeyi üretir.
   */
  storyModel?: string
  /** Kaç sayfa üretileceği (story üretimi için) */
  pageCount?: number
}

/**
 * Kitap görsel oluşturma işini kuyruğa ekler.
 * Route handler bu fonksiyonu çağırır ve hemen döner.
 */
export async function enqueueBookGeneration(data: BookGenerationJobData): Promise<string> {
  const job = await bookGenerationQueue.add('generate-images', data, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
  })
  console.log(`[Queue] 📥 Job enqueued: ${job.id} for book ${data.bookId}`)
  return job.id ?? ''
}

// ============================================================================
// Sesli Hikaye Regenerate Job
// ============================================================================

export interface AudioStoryJobData {
  bookId: string
  userId: string
  language: string
}

/**
 * Sesli hikaye (yeniden) oluşturma işini kuyruğa ekler.
 * API route bu fonksiyonu çağırır ve hemen 202 döner.
 */
export async function enqueueAudioStoryRegenerate(data: AudioStoryJobData): Promise<string> {
  const job = await bookGenerationQueue.add('regenerate-audio-story', data, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
  })
  console.log(`[Queue] 📥 Audio story job enqueued: ${job.id} for book ${data.bookId}`)
  return job.id ?? ''
}
