/**
 * Kitap DB kaydından PDF üretimi için sıkıştırılmış sayfa verisi hazırlar.
 * generate-pdf ve admin generate-pdf route'ları ortak kullanır.
 */

import { compressImageForPdf } from '@/lib/pdf/image-compress'
import type { PageData } from '@/lib/pdf/generator'

export interface PreparedBookPdfInput {
  title: string
  coverImageUrl?: string
  pages: PageData[]
  theme?: string
  illustrationStyle?: string
}

type StoryBookLike = {
  title?: string | null
  story_data?: { pages?: unknown[]; title?: string } | null
  cover_image_url?: string | null
  theme?: string | null
  illustration_style?: string | null
}

export async function prepareCompressedPdfInputFromStoryBook(
  book: StoryBookLike
): Promise<PreparedBookPdfInput> {
  const pages = book.story_data?.pages || []
  let pageData: PageData[] = pages.map((page: any) => ({
    pageNumber: page.pageNumber || 0,
    text: page.text || '',
    imageUrl: page.imageUrl || undefined,
  }))

  let coverUrlForPdf: string | undefined = book.cover_image_url || undefined
  if (book.cover_image_url) {
    const coverResult = await compressImageForPdf(book.cover_image_url)
    coverUrlForPdf = coverResult.dataUrl
  }

  const compressedPages = await Promise.all(
    pageData.map(async (p) => {
      if (!p.imageUrl) return { ...p, imageUrl: undefined }
      const result = await compressImageForPdf(p.imageUrl)
      return { ...p, imageUrl: result.dataUrl }
    })
  )
  pageData = compressedPages

  return {
    title: book.title || book.story_data?.title || 'Untitled Story',
    coverImageUrl: coverUrlForPdf,
    pages: pageData,
    theme: book.theme || undefined,
    illustrationStyle: book.illustration_style || undefined,
  }
}
