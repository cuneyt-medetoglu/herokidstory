/**
 * GET /api/books/[id]/audio-story/download
 *
 * Sesli hikaye MP4'ünü sunucu üzerinden indirir (S3 → aynı origin).
 * Tarayıcının S3 signed URL'ye doğrudan fetch atması CORS yüzünden başarısız olabiliyor.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/auth/api-auth"
import { getBookById } from "@/lib/db/books"
import { getKeyFromOurS3Url, getObjectBuffer } from "@/lib/storage/s3"
import { CommonErrors, handleAPIError } from "@/lib/api/response"

function safeDownloadFilename(title: string | undefined, bookId: string): string {
  const base = (title || "audio-story")
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80)
    .trim() || "audio-story"
  return `${base}.mp4`
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser()
    const bookId = params.id
    if (!bookId) return CommonErrors.badRequest("Book ID is required")

    const { data: book, error } = await getBookById(bookId)
    if (error || !book) return CommonErrors.notFound("Book")
    if (book.user_id !== user.id) return CommonErrors.forbidden("You do not own this book")

    if (book.audio_story_status !== "ready" || !book.video_url) {
      return NextResponse.json(
        { error: "Audio story is not ready yet", status: book.audio_story_status },
        { status: 404 },
      )
    }

    const s3Key = book.video_path || getKeyFromOurS3Url(book.video_url)
    if (!s3Key) {
      return NextResponse.json({ error: "Could not resolve video storage key" }, { status: 500 })
    }

    const obj = await getObjectBuffer(s3Key)
    if (!obj) return CommonErrors.notFound("Video file")

    const filename = safeDownloadFilename(book.title ?? undefined, bookId)
    const disposition = `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`

    return new NextResponse(obj.buffer, {
      status: 200,
      headers: {
        "Content-Type": obj.contentType || "video/mp4",
        "Content-Disposition": disposition,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (err) {
    console.error("[AudioStory] download error:", err)
    return handleAPIError(err)
  }
}
