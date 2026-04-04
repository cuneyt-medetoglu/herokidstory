/**
 * Image Edit API
 * 
 * POST /api/ai/edit-image
 * Uses OpenAI Image Edit API to fix/edit images with mask-based editing
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/api-auth'
import { getUserRole } from '@/lib/db/users'
import { uploadFile, getPublicUrl } from '@/lib/storage/s3'
import { getBookById, updateBook } from '@/lib/db/books'
import { insertEditHistory, getLatestPageVersion, getEditHistory } from '@/lib/db/edit-history'
import { successResponse, errorResponse, handleAPIError } from '@/lib/api/response'
import { getMaskEditAvoid, getAnatomicalCorrectnessDirectives } from '@/lib/prompts/image/negative'
import { imageEditWithLog } from '@/lib/ai/images'
import { DEFAULT_IMAGE_MODEL, DEFAULT_IMAGE_SIZE, DEFAULT_IMAGE_QUALITY } from '@/lib/ai/openai-models'

export interface ImageEditRequest {
  bookId: string
  pageNumber: number
  maskImageBase64: string // Canvas mask as PNG base64
  editPrompt: string // User's edit description
}

export interface ImageEditResponse {
  editedImageUrl: string
  version: number
  quotaRemaining: number | null
  history: Array<{
    version: number
    imageUrl: string
    editPrompt: string
    createdAt: string
  }>
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // ====================================================================
    // 1. AUTHENTICATION & AUTHORIZATION
    // ====================================================================
    const user = await requireUser()
    const userRole = await getUserRole(user.id)
    const isAdmin = userRole === 'admin'

    // ====================================================================
    // 2. PARSE & VALIDATE REQUEST
    // ====================================================================
    const body: ImageEditRequest = await request.json()
    const { bookId, pageNumber, maskImageBase64, editPrompt } = body

    if (!bookId || !pageNumber || !maskImageBase64 || !editPrompt) {
      return errorResponse('Missing required fields: bookId, pageNumber, maskImageBase64, editPrompt', undefined, 400)
    }

    if (pageNumber < 0) {
      return errorResponse('Invalid pageNumber: must be >= 0 (0 = cover)', undefined, 400)
    }

    if (!maskImageBase64.startsWith('data:image/png;base64,')) {
      return errorResponse('maskImageBase64 must be a PNG in base64 format', undefined, 400)
    }

    if (editPrompt.trim().length < 5) {
      return errorResponse('editPrompt must be at least 5 characters', undefined, 400)
    }

    // ====================================================================
    // 3. FETCH BOOK & CHECK OWNERSHIP
    // ====================================================================
    const { data: book, error: bookError } = await getBookById(bookId)
    if (bookError || !book) {
      return errorResponse('Book not found', undefined, 404)
    }

    if (book.user_id !== user.id) {
      return errorResponse('Unauthorized', undefined, 403)
    }

    console.log(`[Image Edit] Starting edit for book ${bookId}, page ${pageNumber}`)
    console.log(`[Image Edit] User: ${user.email}`)

    // ====================================================================
    // BUILD SAFE EDIT PROMPT WITH POSITIVE AND NEGATIVE CONSTRAINTS
    // ====================================================================
    // Build comprehensive positive prompt with safety directives.
    // Negative politikası: iç sayfa felsefesiyle uyumlu (P1).
    // - Anatomi: getAnatomicalCorrectnessDirectives() pozitif direktif olarak prefix'e eklenir.
    // - Güvenlik: proz "DO NOT" kuralları yeterli; COMPOSITION_NEGATIVE yok (kompozisyon sabit).
    // - Kısa AVOID: getMaskEditAvoid() — getNegativePrompt + slice(0,10) yerine.
    const promptPrefix = [
      'CRITICAL EDITING RULES:',
      '1. Only modify the masked area. Keep the rest of the image completely unchanged.',
      '2. Maintain the original illustration style and character consistency.',
      '3. Follow these anatomical correctness rules:',
      getAnatomicalCorrectnessDirectives(),
      '',
      'STRICT PROHIBITIONS (DO NOT):',
      'DO NOT change anything outside the masked area.',
      'DO NOT alter character appearance or clothing unless specifically requested.',
      'DO NOT add or remove elements not mentioned in the edit request.',
      'DO NOT introduce violence, scary elements, or inappropriate content.',
      '',
      'EDIT REQUEST:',
    ].join('\n')

    const finalPrompt = `${promptPrefix}\n${editPrompt}\n${getMaskEditAvoid()}`.trim()
    
    console.log(`[Image Edit] Prompt length: ${finalPrompt.length} characters`)

    // ====================================================================
    // 4. CHECK EDIT QUOTA
    // ====================================================================
    const quotaUsed = book.edit_quota_used || 0
    const quotaLimit = book.edit_quota_limit || 3

    if (!isAdmin && quotaUsed >= quotaLimit) {
      return errorResponse(`Edit quota exceeded. You have used all ${quotaLimit} edits for this book.`, undefined, 429)
    }

    console.log(`[Image Edit] Quota check: ${quotaUsed}/${quotaLimit} used`)

    // ====================================================================
    // 5. GET CURRENT IMAGE FOR THE PAGE (OR COVER)
    // ====================================================================
    let currentImageUrl: string

    if (pageNumber === 0) {
      // Cover: use book.cover_image_url
      currentImageUrl = book.cover_image_url || ''
      if (!currentImageUrl) {
        return errorResponse('Book has no cover image to edit', undefined, 400)
      }
    } else {
      // Story page
      if (!book.story_data || !Array.isArray(book.story_data.pages)) {
        return errorResponse('Book has no story data', undefined, 400)
      }
      const pageIndex = pageNumber - 1
      if (pageIndex < 0 || pageIndex >= book.story_data.pages.length) {
        return errorResponse(`Invalid page number: ${pageNumber}. Book has ${book.story_data.pages.length} pages.`, undefined, 400)
      }
      const currentPage = book.story_data.pages[pageIndex]
      currentImageUrl = currentPage.imageUrl || ''
      if (!currentImageUrl) {
        return errorResponse(`Page ${pageNumber} has no image to edit`, undefined, 400)
      }
    }

    console.log(`[Image Edit] Current image URL: ${currentImageUrl}`)

    // ====================================================================
    // 6. GET LATEST VERSION NUMBER
    // ====================================================================
    const latestVersion = await getLatestPageVersion(bookId, pageNumber)
    const nextVersion = latestVersion + 1
    console.log(`[Image Edit] Next version: ${nextVersion}`)

    // ====================================================================
    // 7. PREPARE OPENAI API REQUEST
    // ====================================================================

    // Fetch current image from URL
    console.log('[Image Edit] Fetching current image...')
    const imageResponse = await fetch(currentImageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch current image: ${imageResponse.statusText}`)
    }
    const imageBlob = await imageResponse.blob()

    // Convert base64 mask to Blob
    console.log('[Image Edit] Converting mask to blob...')
    const base64Data = maskImageBase64.split(',')[1]
    const binaryStr = atob(base64Data)
    const len = binaryStr.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }
    const maskBlob = new Blob([bytes], { type: 'image/png' })

    // Build FormData
    // According to OpenAI docs: Image Edit API returns b64_json by default
    // Parameters: image, mask, prompt, model, size (optional), quality (optional)
    const formData = new FormData()
    formData.append('image', imageBlob, 'original.png')
    formData.append('mask', maskBlob, 'mask.png')
    formData.append('prompt', finalPrompt)
    formData.append('model', DEFAULT_IMAGE_MODEL)
    formData.append('size', DEFAULT_IMAGE_SIZE)
    formData.append('quality', DEFAULT_IMAGE_QUALITY)
    formData.append('input_fidelity', 'high')

    // ====================================================================
    // 8. CALL OPENAI IMAGE EDIT API
    // ====================================================================
    console.log('[Image Edit] Calling OpenAI Image Edit API...')
    const openaiResult = await imageEditWithLog(formData, {
      userId: user.id,
      bookId,
      operationType: 'image_edit',
      pageIndex: pageNumber,
      model: DEFAULT_IMAGE_MODEL,
      quality: 'low',
      size: '1024x1536',
    })
    const dataCount = Array.isArray(openaiResult.data) ? openaiResult.data.length : 0
    const firstItem = dataCount > 0 ? openaiResult.data[0] : null
    const b64Length = firstItem?.b64_json ? firstItem.b64_json.length : 0
    console.log('[Image Edit] OpenAI Response Summary:', {
      dataCount,
      b64Length,
      size: (openaiResult as any).size,
      quality: (openaiResult as any).quality,
      output_format: (openaiResult as any).output_format,
      usage: (openaiResult as any).usage ? {
        input_tokens: (openaiResult as any).usage.input_tokens,
        output_tokens: (openaiResult as any).usage.output_tokens,
      } : undefined,
    })
    
    // Image Edit API returns b64_json by default (per OpenAI documentation)
    // Response format: { data: [{ b64_json: string }] }
    let editedImageBase64: string | null = null
    
    if (openaiResult.data && Array.isArray(openaiResult.data) && openaiResult.data.length > 0) {
      const firstItem = openaiResult.data[0]
      editedImageBase64 = firstItem.b64_json || null
    }

    if (!editedImageBase64) {
      console.error('[Image Edit] Missing b64_json in OpenAI response', {
        dataCount,
        hasUsage: Boolean((openaiResult as any).usage),
        size: (openaiResult as any).size,
        quality: (openaiResult as any).quality,
        output_format: (openaiResult as any).output_format,
      })
      throw new Error('No b64_json found in OpenAI response')
    }

    console.log('[Image Edit] ✅ OpenAI edit successful, converting base64 to buffer...')

    // ====================================================================
    // 9. CONVERT BASE64 TO BUFFER & UPLOAD TO S3
    // ====================================================================
    // Convert base64 to Buffer for storage upload
    const editedBinaryStr = atob(editedImageBase64)
    const editedLen = editedBinaryStr.length
    const editedBytes = new Uint8Array(editedLen)
    for (let i = 0; i < editedLen; i++) {
      editedBytes[i] = editedBinaryStr.charCodeAt(i)
    }
    const editedImageBuffer = Buffer.from(editedBytes)
    const editedFileName = `${user.id}/books/${bookId}/edits/page_${pageNumber}_v${nextVersion}_${Date.now()}.png`

    const s3Key = await uploadFile('books', editedFileName, editedImageBuffer, 'image/png')
    const editedImageUrl = getPublicUrl(s3Key)

    console.log('[Image Edit] ✅ Edited image uploaded:', editedImageUrl)

    // ====================================================================
    // 10. UPLOAD MASK IMAGE (OPTIONAL, FOR DEBUGGING)
    // ====================================================================
    let maskImageUrl: string | null = null
    try {
      const maskBuffer = Buffer.from(await maskBlob.arrayBuffer())
      const maskFileName = `${user.id}/books/${bookId}/edits/page_${pageNumber}_mask_v${nextVersion}_${Date.now()}.png`
      
      const maskS3Key = await uploadFile('books', maskFileName, maskBuffer, 'image/png')
      maskImageUrl = getPublicUrl(maskS3Key)
    } catch (error) {
      console.warn('[Image Edit] Failed to upload mask (non-critical):', error)
    }

    // ====================================================================
    // 11. INSERT EDIT HISTORY
    // ====================================================================
    const processingTime = Date.now() - startTime

    await insertEditHistory({
      book_id: bookId,
      page_number: pageNumber,
      version: nextVersion,
      original_image_url: currentImageUrl,
      edited_image_url: editedImageUrl,
      edit_prompt: editPrompt,
      mask_image_url: maskImageUrl,
      edit_metadata: { mode: 'mask-edit' },
    })

    console.log('[Image Edit] ✅ Edit history saved')

    // ====================================================================
    // 12. UPDATE BOOK: INCREMENT QUOTA & UPDATE PAGE IMAGE OR COVER
    // ====================================================================
    if (pageNumber === 0) {
      const bookUpdateData: Parameters<typeof updateBook>[1] = {
        cover_image_url: editedImageUrl,
        cover_image_path: s3Key,
      }
      if (!isAdmin) {
        bookUpdateData.edit_quota_used = quotaUsed + 1
      }
      await updateBook(bookId, bookUpdateData)
      console.log('[Image Edit] ✅ Book cover updated and quota incremented')
    } else {
      const pageIndex = pageNumber - 1
      const updatedPages = [...book.story_data.pages]
      updatedPages[pageIndex] = {
        ...updatedPages[pageIndex],
        imageUrl: editedImageUrl,
      }
      const bookUpdateData: Parameters<typeof updateBook>[1] = {
        story_data: {
          ...book.story_data,
          pages: updatedPages,
        },
      }
      if (!isAdmin) {
        bookUpdateData.edit_quota_used = quotaUsed + 1
      }
      await updateBook(bookId, bookUpdateData)
      console.log('[Image Edit] ✅ Book updated with new image and quota')
    }

    // ====================================================================
    // 13. FETCH EDIT HISTORY FOR RESPONSE
    // ====================================================================
    const historyData = await getEditHistory(bookId)

    const history = (historyData || [])
      .filter((h: any) => h.page_number === pageNumber)
      .map((h: any) => ({
        version: h.version,
        imageUrl: h.edited_image_url,
        editPrompt: h.edit_prompt,
        createdAt: h.created_at,
      }))

    // ====================================================================
    // 14. RETURN RESPONSE
    // ====================================================================
    const quotaRemaining: number | null = isAdmin ? null : quotaLimit - (quotaUsed + 1)

    return successResponse<ImageEditResponse>(
      {
        editedImageUrl,
        version: nextVersion,
        quotaRemaining,
        history,
      },
      'Image edited successfully'
    )
  } catch (error) {
    console.error('[Image Edit] Error:', error)
    return handleAPIError(error)
  }
}
