/**
 * Kitap olusturma worker — Faz 2'da pipeline buraya tasinacak.
 * Faz 0: stub processor (Redis + PM2 testi icin job alir, loglar, biter).
 */
import { Worker, Job } from 'bullmq'
import { connection, BOOK_GENERATION_QUEUE_NAME } from '../client'

export type BookGenerationJobData = {
  bookId: string
  payload: Record<string, unknown>
}

async function processBookGeneration(job: Job<BookGenerationJobData>) {
  const { bookId } = job.data
  // Faz 2'da: story → master → cover → pages → TTS pipeline buraya tasinacak
  console.log(`[Worker] Stub: job ${job.id} bookId=${bookId} — pipeline Faz 2'da eklenecek`)
  await job.updateProgress(100)
}

export function startBookGenerationWorker(): Worker {
  const worker = new Worker<BookGenerationJobData>(
    BOOK_GENERATION_QUEUE_NAME,
    processBookGeneration,
    {
      connection,
      concurrency: 3,
    }
  )

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err?.message)
  })

  return worker
}
