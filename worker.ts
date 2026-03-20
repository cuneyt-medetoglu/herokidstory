/**
 * PM2 worker entry point — BullMQ worker process.
 * Calistirma: npx tsx worker.ts (veya PM2: ecosystem.config.js)
 * Yerel test: npm run worker / npm run worker:dev
 *
 * ÖNEMLİ: `./env.worker` bu dosyadaki diğer import'lardan önce çalışmalı (REDIS_URL vb.).
 */
import './env.worker'
import { connection, BOOK_GENERATION_QUEUE_NAME } from './lib/queue/client'
import { startBookGenerationWorker } from './lib/queue/workers/book-generation.worker'

console.log(
  `[Worker] AI debug file log: AI_DEBUG_LOG=${process.env.AI_DEBUG_LOG ?? '(unset)'} → ${process.env.AI_DEBUG_LOG_FILE || 'logs/ai-api-debug.jsonl (default)'}`
)
console.log('[Worker] Starting book-generation worker...')
console.log(
  `[Worker] Redis hedefi: ${connection.host}:${connection.port} | kuyruk: ${BOOK_GENERATION_QUEUE_NAME}`
)
startBookGenerationWorker()
console.log('[Worker] Listening for jobs on queue: book-generation')
