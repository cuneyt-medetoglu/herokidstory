/**
 * POST /api/admin/books/[id]/generate-pdf
 * Admin: `pdfLayout: 'print'` — A4 duplex (kısa kenar) + kesim için spiral cilt imposizyonu.
 * PDF doğrudan yanıtta döner (S3’e yazılmaz, önbellek güncellenmez).
 * @see docs/guides/PDF_GENERATION_GUIDE.md — Spiral Cilt Baskı Düzeni
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getAdminBookById } from '@/lib/db/admin'
import { generateBookPDF } from '@/lib/pdf/generator'
import { prepareCompressedPdfInputFromStoryBook } from '@/lib/pdf/prepare-book-pdf-input'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if ((token as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const bookId = params.id

  try {
    const book = await getAdminBookById(bookId)
    if (!book) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (!book.story_data || !book.story_data.pages) {
      return NextResponse.json({ error: 'Book has no story data' }, { status: 400 })
    }

    console.log('[admin/generate-pdf] Generating spiral print PDF — bookId:', bookId)
    const prepared = await prepareCompressedPdfInputFromStoryBook(book)
    const pdfBuffer = await generateBookPDF({
      ...prepared,
      pdfLayout: 'print',
    })
    console.log('[admin/generate-pdf] Done —', (pdfBuffer.length / 1024).toFixed(1), 'KB')

    const safeName = (book.title || 'book').replace(/[^a-z0-9\-_.]/gi, '_').slice(0, 80)
    const filename = `${safeName}_admin-spiral-print.pdf`

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[admin/generate-pdf]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'PDF generation failed' },
      { status: 500 }
    )
  }
}
