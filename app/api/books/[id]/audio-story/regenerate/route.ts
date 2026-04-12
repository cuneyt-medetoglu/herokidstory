/**
 * POST /api/books/[id]/audio-story/regenerate
 *
 * Kitabın sesli hikayesini (yeniden) oluşturma işini kuyruğa ekler.
 * Üretim worker tarafından yapılır; API hemen 202 döner.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/api-auth'
import { getBookById, markAudioStoryGenerating } from '@/lib/db/books'
import { CommonErrors, handleAPIError } from '@/lib/api/response'
import { enqueueAudioStoryRegenerate } from '@/lib/queue/client'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser()
    const bookId = params.id

    if (!bookId) {
      return CommonErrors.badRequest('Book ID is required')
    }

    const { data: book, error: dbError } = await getBookById(bookId)
    if (dbError || !book) return CommonErrors.notFound('Book')
    if (book.user_id !== user.id) return CommonErrors.forbidden('You do not own this book')
    if (book.status !== 'completed') {
      return NextResponse.json(
        { error: 'Book must be completed before generating audio story' },
        { status: 422 },
      )
    }
    if (book.audio_story_status === 'generating') {
      return NextResponse.json(
        { error: 'Audio story is already being generated', status: 'generating', version: book.audio_story_version },
        { status: 409 },
      )
    }

    await markAudioStoryGenerating(bookId)

    const jobId = await enqueueAudioStoryRegenerate({
      bookId,
      userId: user.id,
      language: book.language || 'tr',
    })

    return NextResponse.json(
      {
        message: 'Audio story generation started',
        status: 'generating',
        version: book.audio_story_version + 1,
        jobId,
      },
      { status: 202 },
    )
  } catch (error) {
    console.error('[AudioStory] regenerate error:', error)
    return handleAPIError(error)
  }
}
