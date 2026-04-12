/**
 * Kitap görsel oluşturma worker — Faz 2: gerçek pipeline.
 *
 * Her job:
 *  1. Kitabı ve karakterleri DB'den okur
 *  2. runImagePipeline çağırır (masters → cover → pages → TTS)
 *  3. Her adımda progress_percent + progress_step güncellenir
 */
import { Worker, Job } from 'bullmq'
import { connection, BOOK_GENERATION_QUEUE_NAME, type BookGenerationJobData, type AudioStoryJobData } from '../client'
import { runImagePipeline } from '@/lib/book-generation/image-pipeline'
import { getBookById, updateBook, markAudioStoryGenerating, markAudioStoryReady, markAudioStoryFailed } from '@/lib/db/books'
import { getCharacterById } from '@/lib/db/characters'
import { DEFAULT_STORY_MODEL } from '@/lib/ai/openai-models'
import { PAGE_COUNT_DEBUG_FALLBACK } from '@/lib/constants/book-config'
import { generateTts } from '@/lib/tts/generate'

async function processBookGeneration(job: Job<BookGenerationJobData>): Promise<void> {
  const { bookId, userId, characterIds, illustrationStyle, themeKey, language, customRequests, isFromExampleMode, isCoverOnlyMode, fromExampleId, storyModel, pageCount } = job.data

  console.log(`[Worker] 🚀 Job ${job.id} started — bookId=${bookId}`)

  // 1. Book'u DB'den oku
  const { data: book, error: bookError } = await getBookById(bookId)
  if (bookError || !book) {
    throw new Error(`[Worker] Book not found: ${bookId} (${bookError})`)
  }

  // 2. Karakterleri DB'den oku
  const characters: any[] = []
  for (const charId of characterIds) {
    const { data: char, error: charErr } = await getCharacterById(charId)
    if (charErr || !char) {
      console.warn(`[Worker] Character ${charId} not found — skipping`)
      continue
    }
    characters.push(char)
  }

  if (characters.length === 0) {
    throw new Error(`[Worker] No characters found for book ${bookId}`)
  }

  // 3. From-example: örnek kitabı oku
  let exampleBook: any = null
  if (isFromExampleMode && fromExampleId) {
    const { data: exBook } = await getBookById(fromExampleId)
    exampleBook = exBook || null
  }

  // 4. Pipeline'ı çalıştır (storyData null ise pipeline hikayeyi ilk adım olarak üretir — P3)
  await runImagePipeline({
    bookId,
    userId,
    characters,
    storyData: book.story_data,
    illustrationStyle,
    themeKey,
    language,
    customRequests,
    isFromExampleMode,
    isCoverOnlyMode,
    exampleBook,
    storyModel: storyModel || DEFAULT_STORY_MODEL,
    pageCount: pageCount || PAGE_COUNT_DEBUG_FALLBACK,
    onProgress: async (percent, step) => {
      await job.updateProgress(percent)
      console.log(`[Worker] 📊 Job ${job.id} progress: ${percent}% — ${step}`)
    },
    debugTrace: null,
  })

  console.log(`[Worker] ✅ Job ${job.id} completed — bookId=${bookId}`)
}

async function processAudioStoryRegenerate(job: Job<AudioStoryJobData>): Promise<void> {
  const { bookId, userId, language } = job.data
  console.log(`[Worker] 🔊 Audio story job ${job.id} started — bookId=${bookId}`)

  const { data: book, error } = await getBookById(bookId)
  if (error || !book) throw new Error(`[Worker] Book not found: ${bookId}`)

  const pages = (book.story_data?.pages ?? []) as Array<{ pageNumber?: number; text?: string; imageUrl?: string }>
  const imagesData: Array<{ pageNumber?: number; audioUrl?: string; imageUrl?: string }> = Array.isArray(book.images_data) ? book.images_data : []

  const ttsAudioMap = new Map<number, string>()
  for (const img of imagesData) {
    if (img.pageNumber && img.audioUrl) ttsAudioMap.set(img.pageNumber, img.audioUrl)
  }

  const imagesDataMap = new Map<number, string>()
  for (const img of imagesData) {
    if (img.pageNumber && img.imageUrl) imagesDataMap.set(img.pageNumber, img.imageUrl)
  }

  const candidatePages = pages
    .filter((p) => p?.text?.trim())
    .map((p, idx) => {
      const pageNumber = p.pageNumber ?? idx + 1
      const imageUrl = p.imageUrl || imagesDataMap.get(pageNumber) || ''
      return { pageNumber, text: (p.text ?? '').trim(), imageUrl }
    })
    .filter((p) => p.imageUrl)

  if (candidatePages.length === 0) throw new Error('No pages with images found')

  const freshTtsMap = new Map(ttsAudioMap)
  const missingPages = candidatePages.filter((p) => !freshTtsMap.has(p.pageNumber))
  if (missingPages.length > 0) {
    console.log(`[Worker] 🔊 TTS generating: ${missingPages.length} pages (no cache)...`)
    await Promise.allSettled(
      missingPages.map(async (p) => {
        try {
          const result = await generateTts(p.text, { language, userId, bookId })
          freshTtsMap.set(p.pageNumber, result.audioUrl)
        } catch (err) {
          console.warn(`[Worker] TTS page ${p.pageNumber} failed:`, (err as Error)?.message)
        }
      }),
    )
    const updatedImagesData = imagesData.map((img: any) => {
      if (!img.pageNumber) return img
      const audioUrl = freshTtsMap.get(img.pageNumber)
      return audioUrl ? { ...img, audioUrl } : img
    })
    await updateBook(bookId, { images_data: updatedImagesData })
  }

  const videoPages = candidatePages
    .map((p) => ({ ...p, audioUrl: freshTtsMap.get(p.pageNumber) ?? '' }))
    .filter((p) => p.audioUrl)

  if (videoPages.length === 0) throw new Error('TTS generation failed — no video pages')

  const { generateBookVideo } = await import('@/lib/video/generate-video')
  const result = await generateBookVideo({ bookId, userId, pages: videoPages, language })
  await markAudioStoryReady(bookId, result.publicUrl, result.s3Key)
  console.log(`[Worker] ✅ Audio story completed: book=${bookId}`)
}

export function startBookGenerationWorker(): Worker {
  const worker = new Worker(
    BOOK_GENERATION_QUEUE_NAME,
    async (job: Job) => {
      if (job.name === 'regenerate-audio-story') {
        return processAudioStoryRegenerate(job as Job<AudioStoryJobData>)
      }
      return processBookGeneration(job as Job<BookGenerationJobData>)
    },
    {
      connection,
      concurrency: 3,
    }
  )

  worker.on('completed', (job) => {
    console.log(`[Worker] ✅ Job ${job.id} completed`)
  })

  worker.on('failed', async (job, err) => {
    const bookId = job?.data?.bookId
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[Worker] ❌ Job ${job?.id} failed (bookId=${bookId}):`, msg)
    if (err instanceof Error && err.stack) {
      console.error('[Worker] Stack:', err.stack)
    }
    if (!bookId) return

    if (job?.name === 'regenerate-audio-story') {
      await markAudioStoryFailed(bookId).catch((e) =>
        console.error(`[Worker] markAudioStoryFailed DB error:`, e),
      )
      return
    }

    try {
      const { data: book } = await getBookById(bookId)
      let prevMeta: Record<string, unknown> = {}
      const raw = book?.generation_metadata
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        prevMeta = raw as Record<string, unknown>
      } else if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw) as unknown
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            prevMeta = parsed as Record<string, unknown>
          }
        } catch {
          /* ignore */
        }
      }
      const updatedMeta = {
        ...prevMeta,
        lastGenerationError: msg.slice(0, 2000),
        lastGenerationFailedAt: new Date().toISOString(),
      }
      await updateBook(bookId, {
        status: 'failed',
        progress_step: 'failed',
        generation_metadata: updatedMeta,
      })
    } catch (dbErr) {
      console.error(`[Worker] DB update failed for ${bookId}:`, dbErr)
      await updateBook(bookId, { status: 'failed', progress_step: 'failed' }).catch(() => {})
    }
  })

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err)
  })

  return worker
}
