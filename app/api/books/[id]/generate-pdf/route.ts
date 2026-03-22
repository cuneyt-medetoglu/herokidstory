/**
 * PDF Generation API
 * 
 * POST /api/books/[id]/generate-pdf
 * Generates PDF from book data
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/api-auth'
import { getBookById, updateBook } from '@/lib/db/books'
import { uploadFile, getPublicUrl, fileExists } from '@/lib/storage/s3'
import { generateBookPDF } from '@/lib/pdf/generator'
import { prepareCompressedPdfInputFromStoryBook } from '@/lib/pdf/prepare-book-pdf-input'
import { successResponse, errorResponse } from '@/lib/api/response'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()

  try {
    const user = await requireUser()
    const bookId = params.id

    const { data: book, error: bookError } = await getBookById(bookId)

    if (bookError || !book) {
      return errorResponse('Book not found', undefined, 404)
    }

    // Check ownership
    if (book.user_id !== user.id) {
      return errorResponse('Unauthorized', undefined, 403)
    }

    // Check if book has story data
    if (!book.story_data || !book.story_data.pages) {
      return errorResponse('Book has no story data', undefined, 400)
    }

    // Check if PDF already exists (cache)
    // Allow bypass with ?force=true query parameter
    const { searchParams } = new URL(request.url)
    const forceRegenerate = searchParams.get('force') === 'true'
    
    // Verify PDF actually exists in S3
    let pdfExistsInBucket = false
    if (!forceRegenerate && book.pdf_path) {
      try {
        const s3Key = book.pdf_path.startsWith('pdfs/') ? book.pdf_path : `pdfs/${book.pdf_path}`
        pdfExistsInBucket = await fileExists(s3Key)
        if (!pdfExistsInBucket) {
          console.log('[PDF Generation] PDF path in database but file not found in S3, will regenerate')
        }
      } catch (error) {
        console.error('[PDF Generation] Error checking file existence:', error)
        pdfExistsInBucket = false
      }
    }
    
    if (!forceRegenerate && book.pdf_url && book.pdf_path && pdfExistsInBucket) {
      console.log('[PDF Generation] PDF already exists, returning cached URL')
      return successResponse(
        {
          pdfUrl: book.pdf_url,
          pdfPath: book.pdf_path,
          cached: true,
        },
        'PDF already generated',
        {
          generationTime: 0,
        }
      )
    }
    
    // If PDF path exists in DB but file is missing from bucket, clear DB records
    if (book.pdf_path && !pdfExistsInBucket && !forceRegenerate) {
      console.log('[PDF Generation] PDF missing from S3, clearing database records')
      await updateBook(bookId, {
        pdf_url: null,
        pdf_path: null,
      })
    }
    
    if (forceRegenerate) {
      console.log('[PDF Generation] Force regenerate requested, ignoring cache')
    }

    // ====================================================================
    // 3. PREPARE PAGE DATA + COMPRESS IMAGES (stay under 50 MB S3 limit)
    // ====================================================================
    console.log('[PDF Generation] Preparing PDF generation:')
    console.log('[PDF Generation] - Book ID:', bookId)
    console.log('[PDF Generation] - Title:', book.title)
    console.log('[PDF Generation] - Total Pages:', book.story_data.pages?.length ?? 0)
    console.log('[PDF Generation] - Cover Image:', book.cover_image_url ? 'Yes' : 'No')
    console.log('[PDF Generation] Compressing images for PDF (target < 50 MB)...')

    const prepared = await prepareCompressedPdfInputFromStoryBook(book)
    console.log('[PDF Generation] Images compressed for PDF')

    // ====================================================================
    // 4. GENERATE PDF
    // ====================================================================
    console.log('[PDF Generation] Generating PDF...')

    const pdfBuffer = await generateBookPDF({
      ...prepared,
      pdfLayout: 'dashboard',
    })

    console.log('[PDF Generation] PDF generated successfully')
    console.log('[PDF Generation] - PDF Size:', (pdfBuffer.length / 1024).toFixed(2), 'KB')

    // ====================================================================
    // 5. UPLOAD TO S3
    // ====================================================================
    const fileName = `${user.id}/books/${bookId}/${book.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`

    console.log('[PDF Generation] Uploading PDF to S3:', fileName)
    console.log('[PDF Generation] - PDF Size:', (pdfBuffer.length / 1024 / 1024).toFixed(2), 'MB')

    const s3Key = await uploadFile('pdfs', fileName, Buffer.from(pdfBuffer), 'application/pdf')
    const pdfUrl = getPublicUrl(s3Key)

    if (!pdfUrl) {
      return errorResponse('Failed to get PDF public URL', undefined, 500)
    }

    console.log('[PDF Generation] PDF uploaded successfully:', pdfUrl)

    // ====================================================================
    // 6. UPDATE DATABASE
    // ====================================================================
    const { error: updateError } = await updateBook(bookId, {
      pdf_url: pdfUrl,
      pdf_path: s3Key,
    })

    if (updateError) {
      console.error('[PDF Generation] Database update error:', updateError)
      // PDF uploaded but database update failed - still return success
      // PDF will be re-uploaded next time (upsert: false)
      console.warn('[PDF Generation] Warning: PDF uploaded but database update failed')
    }

    const generationTime = Date.now() - startTime

    console.log('[PDF Generation] PDF generation completed in', generationTime, 'ms')

    // ====================================================================
    // 7. RETURN SUCCESS
    // ====================================================================
    return successResponse(
      {
        pdfUrl: pdfUrl,
        pdfPath: s3Key,
        cached: false,
      },
      'PDF generated successfully',
      {
        generationTime,
        pdfSize: pdfBuffer.length,
      }
    )
  } catch (error) {
    console.error('[PDF Generation] Error:', error)
    return errorResponse(
      'Failed to generate PDF',
      error instanceof Error ? error.message : 'Unknown error',
      500
    )
  }
}

