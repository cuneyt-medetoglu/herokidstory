/**
 * GET /api/books/[id]/audio-story/url
 *
 * Kitabın sesli hikayesi için kısa ömürlü signed URL döndürür.
 * Yalnızca kitabın sahibi erişebilir.
 *
 * Query params:
 *   ?expires=<seconds>  (default: 3600 = 1 saat)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/api-auth'
import { getBookById } from '@/lib/db/books'
import { getSignedObjectUrl, getKeyFromOurS3Url } from '@/lib/storage/s3'
import { CommonErrors, handleAPIError } from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser()
    const bookId = params.id

    if (!bookId) return CommonErrors.badRequest('Book ID is required')

    const { data: book, error } = await getBookById(bookId)
    if (error || !book) return CommonErrors.notFound('Book')
    if (book.user_id !== user.id) return CommonErrors.forbidden('You do not own this book')

    if (book.audio_story_status !== 'ready' || !book.video_url) {
      return NextResponse.json(
        { error: 'Audio story is not ready yet', status: book.audio_story_status },
        { status: 404 },
      )
    }

    // S3 key: video_path'ten al; yoksa video_url'den çıkar
    const s3Key = book.video_path || getKeyFromOurS3Url(book.video_url)
    if (!s3Key) {
      // Public URL'yi olduğu gibi dön (key resolve edemedik)
      return NextResponse.json({ url: book.video_url, signed: false })
    }

    const expiresIn = Math.min(
      parseInt(request.nextUrl.searchParams.get('expires') || '3600', 10),
      86400, // max 24 saat
    )

    const signedUrl = await getSignedObjectUrl(s3Key, expiresIn)

    return NextResponse.json({
      url: signedUrl,
      signed: true,
      expiresIn,
    })
  } catch (err) {
    console.error('[AudioStory] url error:', err)
    return handleAPIError(err)
  }
}
