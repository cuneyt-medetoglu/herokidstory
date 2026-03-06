import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db/pool'
import { getSignedObjectUrl, getKeyFromOurS3Url } from '@/lib/storage/s3'

export const dynamic = 'force-dynamic'

// 24 hours – long enough for any browser session; bucket stays private
const PRESIGN_EXPIRY_SECONDS = 24 * 60 * 60

/**
 * Returns a presigned GET URL for S3 objects; passes through non-S3 URLs unchanged.
 * Returns null on error so callers can skip the photo gracefully.
 */
async function presignPhotoUrl(url: string): Promise<string | null> {
  if (!url) return null
  try {
    const key = getKeyFromOurS3Url(url)
    if (!key) return url // not our S3 URL (e.g. public test image) – use as-is
    return await getSignedObjectUrl(key, PRESIGN_EXPIRY_SECONDS)
  } catch {
    return null
  }
}

/**
 * GET /api/examples
 * 
 * Get public example books (is_example = true)
 * No authentication required - publicly accessible
 * 
 * Query params:
 * - ageGroup?: string (e.g., "3-5")
 * - theme?: string (e.g., "adventure")
 * - limit?: number (default: 20)
 * - offset?: number (default: 0)
 * 
 * usedPhotos resolution order:
 *   1. generation_metadata.usedPhotos (explicitly stored array) → presign each originalPhoto
 *   2. generation_metadata.characterIds → characters table (reference_photo_url + name) → presign
 *   3. [] fallback
 * 
 * @see docs/strategies/EXAMPLES_REAL_BOOKS_AND_CREATE_YOUR_OWN.md
 * @see docs/features/EXAMPLES_USED_PHOTOS_FEATURE.md
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const ageGroup = searchParams.get('ageGroup') || undefined
    const theme = searchParams.get('theme') || undefined
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build query
    let query = 'SELECT * FROM books WHERE is_example = true AND status = $1'
    const params: any[] = ['completed']
    let paramCount = 2

    // Filters
    if (ageGroup) {
      query += ` AND age_group = $${paramCount++}`
      params.push(ageGroup)
    }
    if (theme) {
      query += ` AND theme = $${paramCount++}`
      params.push(theme)
    }

    query += ' ORDER BY created_at DESC'
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`
    params.push(limit, offset)

    const result = await pool.query(query, params)
    const books = result.rows

    if (!books) {
      console.error('[GET /api/examples] No books found')
      return NextResponse.json(
        { success: false, error: 'Failed to fetch example books' },
        { status: 500 }
      )
    }

    // Batch-fetch characters for usedPhotos fallback (single query, no N+1)
    const allCharacterIds = new Set<string>()
    for (const book of books) {
      const charIds: string[] = book.generation_metadata?.characterIds || []
      charIds.forEach((id: string) => allCharacterIds.add(id))
    }

    const charactersMap = new Map<string, { name: string; reference_photo_url: string }>()
    if (allCharacterIds.size > 0) {
      const charResult = await pool.query(
        'SELECT id, name, reference_photo_url FROM characters WHERE id = ANY($1::uuid[])',
        [Array.from(allCharacterIds)]
      )
      for (const c of charResult.rows) {
        if (c.reference_photo_url) {
          charactersMap.set(c.id, { name: c.name, reference_photo_url: c.reference_photo_url })
        }
      }
    }

    // Transform books to match ExampleBook type (app/examples/types.ts)
    // async map → presign all originalPhoto URLs (S3 private bucket)
    const exampleBooks = await Promise.all(books.map(async (book: any) => {
      type PhotoEntry = { id: string; originalPhoto: string; characterName: string; transformedImage?: string }
      let usedPhotos: PhotoEntry[] = []

      if (Array.isArray(book.generation_metadata?.usedPhotos) && book.generation_metadata.usedPhotos.length > 0) {
        // Presign each originalPhoto in the stored array
        usedPhotos = (
          await Promise.all(
            book.generation_metadata.usedPhotos.map(async (p: PhotoEntry) => {
              const signed = await presignPhotoUrl(p.originalPhoto)
              if (!signed) return null
              return { ...p, originalPhoto: signed }
            })
          )
        ).filter((p): p is PhotoEntry => p !== null)
      } else {
        // Build from characterIds + characters table, then presign
        const charIds: string[] = book.generation_metadata?.characterIds || []
        usedPhotos = (
          await Promise.all(
            charIds.map(async (charId: string) => {
              const char = charactersMap.get(charId)
              if (!char) return null
              const signed = await presignPhotoUrl(char.reference_photo_url)
              if (!signed) return null
              return {
                id: `${book.id}-${charId}`,
                originalPhoto: signed,
                characterName: char.name,
              }
            })
          )
        ).filter((p): p is PhotoEntry => p !== null)
      }

      return {
        id: book.id,
        title: book.title,
        description: book.story_data?.metadata?.description || book.story_data?.pages?.[0]?.text?.slice(0, 150) + '...' || 'A wonderful story',
        coverImage: book.cover_image_url || '',
        ageGroup: book.age_group || '',
        theme: book.theme || '',
        usedPhotos,
        storyDetails: {
          style: book.illustration_style || '',
          font: 'Playful',
          characterCount: book.generation_metadata?.characterIds?.length || 1,
        },
      }
    }))

    return NextResponse.json({
      success: true,
      data: exampleBooks,
      total: exampleBooks.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[GET /api/examples] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
