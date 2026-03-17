/**
 * BullMQ queue client — Faz 0: baglanti ve kuyruk tanimi.
 * Faz 2'da app/api/books route bu kuyruga job ekleyecek; worker isleyecek.
 */
import { Queue } from 'bullmq'
import IORedis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
})

export const BOOK_GENERATION_QUEUE_NAME = 'book-generation'

export const bookGenerationQueue = new Queue(BOOK_GENERATION_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
  },
})
