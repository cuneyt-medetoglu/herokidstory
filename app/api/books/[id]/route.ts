/**
 * Book Detail API
 * 
 * GET /api/books/:id - Get book details
 * PATCH /api/books/:id - Update book
 * DELETE /api/books/:id - Delete book
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/api-auth'
import { getUserRole } from '@/lib/db/users'
import {
  getBookById,
  updateBook,
  deleteBook,
  toggleFavorite,
  incrementBookViews,
} from '@/lib/db/books'
import { successResponse, handleAPIError, CommonErrors } from '@/lib/api/response'

// ============================================================================
// GET /api/books/:id - Get book details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser()

    const bookId = params.id

    if (!bookId) {
      return CommonErrors.badRequest('Book ID is required')
    }

    const { data: book, error: dbError } = await getBookById(bookId)

    if (dbError || !book) {
      return CommonErrors.notFound('Book')
    }

    // DEBUG: Log database data
    console.log('[GET /api/books/:id] 📦 Database Book Data:')
    console.log('[GET /api/books/:id]   - Book ID:', book.id)
    console.log('[GET /api/books/:id]   - Title:', book.title)
    console.log('[GET /api/books/:id]   - Status:', book.status)
    console.log('[GET /api/books/:id]   - Total Pages:', book.total_pages)
    console.log('[GET /api/books/:id]   - Has story_data:', !!book.story_data)
    console.log('[GET /api/books/:id]   - Has images_data:', !!book.images_data)
    console.log('[GET /api/books/:id]   - images_data type:', Array.isArray(book.images_data) ? 'array' : typeof book.images_data)
    console.log('[GET /api/books/:id]   - images_data length:', Array.isArray(book.images_data) ? book.images_data.length : 'N/A')
    console.log('[GET /api/books/:id]   - Has cover_image_url:', !!book.cover_image_url)
    console.log('[GET /api/books/:id]   - cover_image_url:', book.cover_image_url || 'MISSING')
    
    if (book.story_data && book.story_data.pages) {
      console.log('[GET /api/books/:id]   - story_data.pages length:', book.story_data.pages.length)
      console.log('[GET /api/books/:id]   - First page structure:', {
        pageNumber: book.story_data.pages[0]?.pageNumber,
        hasText: !!book.story_data.pages[0]?.text,
        hasImageUrl: !!book.story_data.pages[0]?.imageUrl,
        imageUrl: book.story_data.pages[0]?.imageUrl || 'MISSING',
      })
    }

    // Verify ownership (RLS should handle this, but double-check for security)
    if (book.user_id !== user.id) {
      return CommonErrors.forbidden('You do not own this book')
    }

    // Increment view count (non-blocking)
    incrementBookViews(bookId).catch((error) => {
      console.error('Failed to increment view count:', error)
    })

    const userRole = await getUserRole(user.id)
    const imageEditQuotaBypass = userRole === 'admin'

    return successResponse(
      imageEditQuotaBypass ? { ...book, imageEditQuotaBypass: true } : book,
      'Book fetched successfully'
    )
  } catch (error) {
    console.error('Get book error:', error)
    return handleAPIError(error)
  }
}

// ============================================================================
// PATCH /api/books/:id - Update book
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser()

    const bookId = params.id

    if (!bookId) {
      return CommonErrors.badRequest('Book ID is required')
    }

    const { data: existingBook, error: getError } = await getBookById(bookId)

    if (getError || !existingBook) {
      return CommonErrors.notFound('Book')
    }

    // Verify ownership
    if (existingBook.user_id !== user.id) {
      return CommonErrors.forbidden('You do not own this book')
    }

    // Parse Request Body
    const body = await request.json()
    const {
      title,
      status,
      images_data,
      cover_image_url,
      cover_image_path,
      is_favorite,
      generation_metadata,
    } = body

    // Prepare Update Input
    const updateInput: {
      title?: string
      status?: 'draft' | 'generating' | 'completed' | 'failed' | 'archived'
      images_data?: any[]
      cover_image_url?: string
      cover_image_path?: string
      is_favorite?: boolean
      generation_metadata?: any
    } = {}

    if (title !== undefined) updateInput.title = title
    if (status !== undefined) updateInput.status = status
    if (images_data !== undefined) updateInput.images_data = images_data
    if (cover_image_url !== undefined) updateInput.cover_image_url = cover_image_url
    if (cover_image_path !== undefined) updateInput.cover_image_path = cover_image_path
    if (is_favorite !== undefined) updateInput.is_favorite = is_favorite
    if (generation_metadata !== undefined)
      updateInput.generation_metadata = generation_metadata

    // Update Book
    const { data: updatedBook, error: updateError } = await updateBook(
      bookId,
      updateInput
    )

    if (updateError || !updatedBook) {
      console.error('Update error:', updateError)
      throw new Error('Failed to update book')
    }

    return successResponse(updatedBook, 'Book updated successfully')
  } catch (error) {
    console.error('Update book error:', error)
    return handleAPIError(error)
  }
}

// ============================================================================
// DELETE /api/books/:id - Delete book
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser()

    const bookId = params.id

    if (!bookId) {
      return CommonErrors.badRequest('Book ID is required')
    }

    const { data: existingBook, error: getError } = await getBookById(bookId)

    if (getError || !existingBook) {
      return CommonErrors.notFound('Book')
    }

    // Verify ownership
    if (existingBook.user_id !== user.id) {
      return CommonErrors.forbidden('You do not own this book')
    }

    // Delete Book
    const { error: deleteError } = await deleteBook(bookId)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      throw new Error('Failed to delete book')
    }

    return successResponse(
      { id: bookId },
      'Book deleted successfully',
      undefined,
      200
    )
  } catch (error) {
    console.error('Delete book error:', error)
    return handleAPIError(error)
  }
}

