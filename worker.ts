/**
 * PM2 worker entry point — BullMQ worker process.
 * Calistirma: npx tsx worker.ts (veya PM2: ecosystem.config.js)
 * Yerel test: REDIS_URL=redis://localhost:6379 npx tsx worker.ts
 */
import { startBookGenerationWorker } from './lib/queue/workers/book-generation.worker'

console.log('[Worker] Starting book-generation worker...')
startBookGenerationWorker()
console.log('[Worker] Listening for jobs on queue: book-generation')
