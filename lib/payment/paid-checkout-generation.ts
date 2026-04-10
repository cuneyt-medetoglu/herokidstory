/**
 * Ödeme tamamlandıktan sonra `checkout-placeholder` ile oluşturulmuş kitapları
 * görsel/hikâye üretim kuyruğuna alır.
 *
 * Placeholder kitaplar: status=draft, generation_metadata.pendingPaidCheckout=true,
 * story_data boş veya {} — pipeline `storyData` null bekler (veya from-example dolu story).
 */

import { pool } from '@/lib/db/pool'
import { getBookById, updateBook, type Book } from '@/lib/db/books'
import { enqueueBookGeneration } from '@/lib/queue/client'
import { normalizeThemeKey } from '@/lib/book-generation/normalize-theme-key'
import { cloneExampleStoryForPaidPlaceholder } from '@/lib/book-generation/from-example-story-clone'
import { DEFAULT_STORY_MODEL } from '@/lib/ai/openai-models'
import { DEFAULT_PAGE_COUNT, PAGE_COUNT_DB_MAX } from '@/lib/constants/book-config'

function parseBookMeta(book: Book): Record<string, unknown> {
  const raw = book.generation_metadata
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown
      return p && typeof p === 'object' && !Array.isArray(p) ? (p as Record<string, unknown>) : {}
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return {}
}

function userCharacterIdsFromBook(book: Book, meta: Record<string, unknown>): string[] {
  const fromMeta = meta.paidCheckoutCharacterIds
  if (Array.isArray(fromMeta)) {
    return fromMeta.filter((id): id is string => typeof id === 'string' && id.length > 0)
  }
  if (book.character_id) return [book.character_id]
  return []
}

/**
 * Sipariş ödendikten sonra e-kitap placeholder'larını üretime alır.
 * Idempotent: yalnızca draft + pendingPaidCheckout olan kayıtlar işlenir.
 */
export async function enqueuePaidCheckoutBooks(orderId: string): Promise<void> {
  let bookIds: string[] = []
  try {
    const { rows } = await pool.query<{ book_id: string }>(
      `SELECT DISTINCT oi.book_id::text AS book_id
       FROM order_items oi
       WHERE oi.order_id = $1::uuid
         AND oi.item_type IN ('ebook','bundle')`,
      [orderId]
    )
    bookIds = rows.map((r) => r.book_id)
  } catch (err) {
    console.error('[paid-checkout-generation] order_items sorgusu hatası:', { orderId, err })
    return
  }

  for (const bookId of bookIds) {
    try {
      const { data: book, error } = await getBookById(bookId)
      if (error || !book) {
        console.warn('[paid-checkout-generation] kitap bulunamadı:', bookId)
        continue
      }

      if (book.status !== 'draft') {
        continue
      }

      const meta = parseBookMeta(book)
      if (meta.pendingPaidCheckout !== true) {
        continue
      }

      const userIds = userCharacterIdsFromBook(book, meta)
      if (userIds.length === 0) {
        console.error('[paid-checkout-generation] Karakter ID yok, üretim atlanıyor:', bookId)
        continue
      }

      const exId = book.source_example_book_id
      const themeKey = normalizeThemeKey(book.theme || 'story')
      const illustrationStyle = book.illustration_style || '3d_animation'
      const language = book.language || 'tr'
      const pageCount = Math.max(1, Math.min(PAGE_COUNT_DB_MAX, book.total_pages || DEFAULT_PAGE_COUNT))

      const nextMeta: Record<string, unknown> = {
        ...meta,
        pendingPaidCheckout: false,
        paidCheckoutGenerationEnqueuedAt: new Date().toISOString(),
      }

      if (exId) {
        const { data: exampleBook } = await getBookById(exId)
        if (!exampleBook?.story_data) {
          console.error('[paid-checkout-generation] Örnek kitap story_data yok:', exId)
          continue
        }
        const cloned = await cloneExampleStoryForPaidPlaceholder(
          {
            id: exampleBook.id,
            title: exampleBook.title,
            story_data: exampleBook.story_data,
          },
          userIds
        )
        if (!cloned) {
          console.error('[paid-checkout-generation] Örnek hikâye klonlanamadı:', bookId)
          continue
        }

        const pages = (cloned.storyData.pages as unknown[]) || []
        await updateBook(bookId, {
          title: cloned.title,
          story_data: cloned.storyData,
          total_pages: pages.length,
          status: 'generating',
          progress_percent: 0,
          progress_step: 'master_generating',
          generation_metadata: {
            ...nextMeta,
            mode: 'from-example-paid',
            fromExampleId: exId,
          },
        })

        await enqueueBookGeneration({
          bookId,
          userId: book.user_id,
          themeKey,
          illustrationStyle,
          language,
          isFromExampleMode: true,
          isCoverOnlyMode: false,
          characterIds: userIds,
          fromExampleId: exId,
          storyModel: DEFAULT_STORY_MODEL,
          pageCount: pages.length,
        })
      } else {
        await updateBook(bookId, {
          story_data: null,
          status: 'generating',
          progress_percent: 0,
          progress_step: 'story_generating',
          generation_metadata: {
            ...nextMeta,
            mode: 'full-book-paid',
            characterIds: userIds,
          },
        })

        await enqueueBookGeneration({
          bookId,
          userId: book.user_id,
          themeKey,
          illustrationStyle,
          language,
          isFromExampleMode: false,
          isCoverOnlyMode: false,
          characterIds: userIds,
          storyModel: DEFAULT_STORY_MODEL,
          pageCount,
        })
      }

      console.log('[paid-checkout-generation] Kuyruğa alındı:', bookId)
    } catch (e) {
      console.error('[paid-checkout-generation] Kitap işlenemedi:', bookId, e)
    }
  }
}
