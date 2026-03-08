/**
 * @file Book CRUD ve PDF üretimi için veritabanı yardımcıları (PostgreSQL).
 */

import { pool } from './pool'

// ============================================================================
// Types
// ============================================================================

export interface Book {
  id: string
  user_id: string
  character_id?: string
  title: string
  theme: string
  illustration_style: string
  language: string
  age_group?: string
  story_data: any // JSON structure from story generation
  total_pages: number
  custom_requests?: string
  images_data: any[] // Array of image objects
  cover_image_url?: string
  cover_image_path?: string
  pdf_url?: string // Generated PDF URL
  pdf_path?: string // PDF storage path
  status: 'draft' | 'generating' | 'completed' | 'failed' | 'archived'
  generation_metadata: any
  view_count: number
  last_viewed_at?: Date
  is_favorite: boolean
  created_at: Date
  updated_at: Date
  completed_at?: Date
  is_example?: boolean
  edit_quota_used?: number
  edit_quota_limit?: number
  source_example_book_id?: string
}

export interface CreateBookInput {
  character_id?: string
  title: string
  theme: string
  illustration_style: string
  language?: string
  age_group?: string
  story_data: any
  total_pages: number
  custom_requests?: string
  images_data?: any[]
  generation_metadata?: any
  status?: 'draft' | 'generating' | 'completed'
  is_example?: boolean
  source_example_book_id?: string
}

export interface UpdateBookInput {
  title?: string
  status?: 'draft' | 'generating' | 'completed' | 'failed' | 'archived'
  story_data?: any
  images_data?: any[]
  cover_image_url?: string
  cover_image_path?: string
  pdf_url?: string
  pdf_path?: string
  is_favorite?: boolean
  generation_metadata?: any
  edit_quota_used?: number
  edit_quota_limit?: number
}

// ============================================================================
// Create
// ============================================================================

export async function createBook(
  userId: string,
  input: CreateBookInput
): Promise<{ data: Book | null; error: Error | null }> {
  try {
    const result = await pool.query(
      `INSERT INTO books (
        user_id, character_id, title, theme, illustration_style, language, age_group,
        story_data, total_pages, custom_requests, images_data, generation_metadata,
        status, is_example, source_example_book_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING *`,
      [
        userId,
        input.character_id || null,
        input.title,
        input.theme,
        input.illustration_style,
        input.language || 'tr',
        input.age_group || null,
        JSON.stringify(input.story_data),
        input.total_pages,
        input.custom_requests || null,
        JSON.stringify(input.images_data || []),
        JSON.stringify(input.generation_metadata || {}),
        input.status || 'draft',
        input.is_example || false,
        input.source_example_book_id || null,
      ]
    )

    return { data: result.rows[0], error: null }
  } catch (error) {
    console.error('Error creating book:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// Read
// ============================================================================

export async function getBookById(
  bookId: string
): Promise<{ data: Book | null; error: Error | null }> {
  try {
    const result = await pool.query(
      'SELECT * FROM books WHERE id = $1',
      [bookId]
    )

    return { data: result.rows[0] || null, error: null }
  } catch (error) {
    console.error('Error fetching book:', error)
    return { data: null, error: error as Error }
  }
}

export async function getUserBooks(
  userId: string,
  options?: {
    status?: string
    limit?: number
    offset?: number
    /** Kitaplık (Dashboard) için true: örnek kitaplar hariç, sadece kullanıcının kendi kitapları */
    excludeExamples?: boolean
  }
): Promise<{ data: Book[] | null; error: Error | null }> {
  try {
    let query = 'SELECT * FROM books WHERE user_id = $1'
    const params: any[] = [userId]
    let paramCount = 2

    if (options?.excludeExamples) {
      query += ' AND (is_example = false OR is_example IS NULL)'
    }

    if (options?.status) {
      query += ` AND status = $${paramCount++}`
      params.push(options.status)
    }

    query += ' ORDER BY created_at DESC'

    if (options?.limit) {
      query += ` LIMIT $${paramCount++}`
      params.push(options.limit)
    }

    if (options?.offset) {
      query += ` OFFSET $${paramCount++}`
      params.push(options.offset)
    }

    const result = await pool.query(query, params)

    return { data: result.rows, error: null }
  } catch (error) {
    console.error('Error fetching books:', error)
    return { data: null, error: error as Error }
  }
}

export async function getBooksByIds(
  userId: string,
  bookIds: string[]
): Promise<{ data: Book[] | null; error: Error | null }> {
  if (!bookIds.length) {
    return { data: [], error: null }
  }
  try {
    const result = await pool.query(
      'SELECT * FROM books WHERE user_id = $1 AND id = ANY($2::uuid[])',
      [userId, bookIds]
    )
    return { data: result.rows, error: null }
  } catch (error) {
    console.error('Error fetching books by ids:', error)
    return { data: null, error: error as Error }
  }
}

export async function getUserFavoriteBooks(
  userId: string
): Promise<{ data: Book[] | null; error: Error | null }> {
  try {
    const result = await pool.query(
      'SELECT * FROM books WHERE user_id = $1 AND is_favorite = true ORDER BY created_at DESC',
      [userId]
    )

    return { data: result.rows, error: null }
  } catch (error) {
    console.error('Error fetching favorite books:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// Update
// ============================================================================

export async function updateBook(
  bookId: string,
  input: UpdateBookInput
): Promise<{ data: Book | null; error: Error | null }> {
  try {
    const fields: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (input.title !== undefined) {
      fields.push(`title = $${paramCount++}`)
      values.push(input.title)
    }
    if (input.status !== undefined) {
      fields.push(`status = $${paramCount++}`)
      values.push(input.status)
    }
    if (input.story_data !== undefined) {
      fields.push(`story_data = $${paramCount++}`)
      values.push(JSON.stringify(input.story_data))
    }
    if (input.images_data !== undefined) {
      fields.push(`images_data = $${paramCount++}`)
      values.push(JSON.stringify(input.images_data))
    }
    if (input.cover_image_url !== undefined) {
      fields.push(`cover_image_url = $${paramCount++}`)
      values.push(input.cover_image_url)
    }
    if (input.cover_image_path !== undefined) {
      fields.push(`cover_image_path = $${paramCount++}`)
      values.push(input.cover_image_path)
    }
    if (input.pdf_url !== undefined) {
      fields.push(`pdf_url = $${paramCount++}`)
      values.push(input.pdf_url)
    }
    if (input.pdf_path !== undefined) {
      fields.push(`pdf_path = $${paramCount++}`)
      values.push(input.pdf_path)
    }
    if (input.is_favorite !== undefined) {
      fields.push(`is_favorite = $${paramCount++}`)
      values.push(input.is_favorite)
    }
    if (input.generation_metadata !== undefined) {
      fields.push(`generation_metadata = $${paramCount++}`)
      values.push(JSON.stringify(input.generation_metadata))
    }
    if (input.edit_quota_used !== undefined) {
      fields.push(`edit_quota_used = $${paramCount++}`)
      values.push(input.edit_quota_used)
    }
    if (input.edit_quota_limit !== undefined) {
      fields.push(`edit_quota_limit = $${paramCount++}`)
      values.push(input.edit_quota_limit)
    }

    if (fields.length === 0) {
      return getBookById(bookId)
    }

    fields.push(`updated_at = NOW()`)
    values.push(bookId)

    const result = await pool.query(
      `UPDATE books SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    )

    return { data: result.rows[0] || null, error: null }
  } catch (error) {
    console.error('Error updating book:', error)
    return { data: null, error: error as Error }
  }
}

export async function toggleFavorite(
  bookId: string,
  isFavorite: boolean
): Promise<{ data: Book | null; error: Error | null }> {
  return updateBook(bookId, { is_favorite: isFavorite })
}

export async function incrementBookViews(
  bookId: string
): Promise<{ error: Error | null }> {
  try {
    await pool.query(
      'SELECT increment_book_views($1)',
      [bookId]
    )

    return { error: null }
  } catch (error) {
    console.error('Error incrementing book views:', error)
    return { error: error as Error }
  }
}

// ============================================================================
// Delete
// ============================================================================

export async function deleteBook(
  bookId: string
): Promise<{ error: Error | null }> {
  try {
    await pool.query('DELETE FROM books WHERE id = $1', [bookId])

    return { error: null }
  } catch (error) {
    console.error('Error deleting book:', error)
    return { error: error as Error }
  }
}

// ============================================================================
// Statistics
// ============================================================================

export async function getUserBookStats(
  userId: string
): Promise<{
  data: {
    total_books: number
    completed_books: number
    draft_books: number
    favorite_books: number
    total_pages: number
    characters_used: number
  } | null
  error: Error | null
}> {
  try {
    const result = await pool.query(
      'SELECT * FROM get_user_book_stats($1)',
      [userId]
    )

    return { data: result.rows[0] || null, error: null }
  } catch (error) {
    console.error('Error fetching book stats:', error)
    return { data: null, error: error as Error }
  }
}

export async function getBookWithCharacter(
  bookId: string
): Promise<{
  data: {
    book_id: string
    title: string
    theme: string
    status: string
    character_name: string
    character_age: number
    created_at: Date
  } | null
  error: Error | null
}> {
  try {
    const result = await pool.query(
      'SELECT * FROM get_book_with_character($1)',
      [bookId]
    )

    return { data: result.rows[0] || null, error: null }
  } catch (error) {
    console.error('Error fetching book with character:', error)
    return { data: null, error: error as Error }
  }
}
