/**
 * Regenerate Page Image API
 *
 * POST /api/ai/regenerate-image
 * Seçilen sayfanın görselini baştan üretir. Create-book'taki sayfa üretim
 * pipeline'ıyla birebir aynı mantığı kullanır:
 *   1. generation_metadata'dan master illüstrasyonları al
 *   2. Aynı prompt builder'ı (generateFullPagePrompt) kullan
 *   3. Master varsa → /v1/images/edits (image[] ile)
 *   4. Master yoksa  → /v1/images/generations
 *   5. S3'e yükle, image_edit_history'ye kaydet, story_data + quota güncelle
 */

import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/api-auth"
import { getUserRole } from "@/lib/db/users"
import { getBookById, updateBook } from "@/lib/db/books"
import { getCharacterById } from "@/lib/db/characters"
import { getLatestPageVersion, insertEditHistory, getEditHistory } from "@/lib/db/edit-history"
import { uploadFile, getPublicUrl, getObjectBufferFromUrl } from "@/lib/storage/s3"
import { buildCharacterPrompt, buildMultipleCharactersPrompt } from "@/lib/prompts/image/character"
import {
  generateFullPagePrompt,
  detectRiskySceneElements,
  getSafeSceneAlternative,
  type SceneDiversityAnalysis,
} from "@/lib/prompts/image/scene"
import { imageEditWithLog, imageGenerateWithLog } from "@/lib/ai/images"
import { successResponse, errorResponse, handleAPIError } from "@/lib/api/response"

const IMAGE_MODEL = "gpt-image-1.5"
const IMAGE_SIZE = "1024x1536"
const IMAGE_QUALITY = "low"

/** Geçici: REGENERATE_DEBUG=true veya DEBUG_LOGGING=true ile hikaye/prompt önizlemesi loglanır */
const REGENERATE_DEBUG = process.env.REGENERATE_DEBUG === "true" || process.env.DEBUG_LOGGING === "true"

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const userRole = await getUserRole(user.id)
    const isAdmin = userRole === 'admin'
    const body = await request.json()
    const { bookId, pageNumber, userPrompt } = body || {}

    if (REGENERATE_DEBUG) {
      console.log("[Regenerate] ─── START", { bookId, pageNumber, userPrompt: userPrompt ? `${String(userPrompt).slice(0, 80)}...` : "(empty)" })
    }

    // ── 1. Validasyon ──────────────────────────────────────────────────────
    if (!bookId || !pageNumber) {
      return errorResponse("Missing required fields: bookId, pageNumber", undefined, 400)
    }
    if (pageNumber < 1) {
      return errorResponse("Invalid pageNumber: must be >= 1", undefined, 400)
    }

    // ── 2. Kitap + yetki ───────────────────────────────────────────────────
    const { data: book, error: bookError } = await getBookById(bookId)
    if (bookError || !book) {
      return errorResponse("Book not found", undefined, 404)
    }
    if (book.user_id !== user.id) {
      return errorResponse("Unauthorized", undefined, 403)
    }

    // ── 3. Quota ───────────────────────────────────────────────────────────
    const quotaUsed = book.edit_quota_used ?? 0
    const quotaLimit = book.edit_quota_limit ?? 3
    if (!isAdmin && quotaUsed >= quotaLimit) {
      return errorResponse(
        `Image change quota exceeded. You have used all ${quotaLimit} changes for this book.`,
        undefined,
        429
      )
    }

    // ── 4. Sayfa ───────────────────────────────────────────────────────────
    if (!book.story_data?.pages?.length) {
      return errorResponse("Book has no story data", undefined, 400)
    }
    const pageIndex = pageNumber - 1
    if (pageIndex < 0 || pageIndex >= book.story_data.pages.length) {
      return errorResponse(
        `Invalid page number: ${pageNumber}. Book has ${book.story_data.pages.length} pages.`,
        undefined,
        400
      )
    }
    const page = book.story_data.pages[pageIndex] as {
      pageNumber?: number
      text?: string
      imagePrompt?: string
      sceneDescription?: string
      sceneContext?: string
      characterIds?: string[]
      characterExpressions?: Record<string, string>
      shotPlan?: { shotType?: string; lens?: string; cameraAngle?: string; placement?: string; timeOfDay?: string; mood?: string }
      imageUrl?: string
    }

    // ── 5. Karakterler ─────────────────────────────────────────────────────
    // Hem metadata hem page.characterIds'deki tüm ID'leri yükle.
    // page.characterIds bazen Anne/Baba gibi ek karakterler içerir; bunlar metadata'da olmayabilir.
    const metaCharacterIds: string[] =
      book.story_data?.metadata?.characterIds ||
      (book.character_id ? [book.character_id] : [])
    // page henüz yüklendi (pageIndex kullanıldı); page.characterIds'i de ekle
    const pageCharIds: string[] = (book.story_data.pages[pageIndex] as any)?.characterIds || []
    const allCharacterIds = [...new Set([...metaCharacterIds, ...pageCharIds])]
    if (allCharacterIds.length === 0) {
      return errorResponse("Book has no character data", undefined, 400)
    }
    const characters = (
      await Promise.all(allCharacterIds.map((id) => getCharacterById(id).then((r) => r.data)))
    ).filter(Boolean) as Awaited<ReturnType<typeof getCharacterById>>["data"][]
    if (characters.length === 0) {
      return errorResponse("Could not load characters for this book", undefined, 400)
    }
    // characterIds = metadata listesi (kitap geneli); page'e özgü olanlar pageCharacters'ta belirlenir
    const characterIds = metaCharacterIds

    // ── 6. Temel meta ──────────────────────────────────────────────────────
    const themeKey = (book.theme || "adventure").toLowerCase().replace(/\s+/g, "_")
    const ageGroup = book.story_data?.metadata?.ageGroup || book.age_group || "preschool"
    const illustrationStyle = book.illustration_style || "watercolor"
    const totalPages = book.story_data.pages.length

    // Master illüstrasyonlar (create-book ile aynı kaynak)
    const masterIllustrations = (
      book.generation_metadata?.masterIllustrations || {}
    ) as Record<string, string>

    // ── 7. Sahne tanımı ────────────────────────────────────────────────────
    // userPrompt doluysa orijinal sahneye ek olarak eklenir (yoksa orijinal kullanılır)
    const baseScene =
      page.imagePrompt || page.sceneDescription || page.text || ""
    const sceneDescription =
      userPrompt?.trim()
        ? baseScene.trim()
          ? `${baseScene.trim()}. ${userPrompt.trim()}`
          : userPrompt.trim()
        : baseScene

    if (REGENERATE_DEBUG) {
      console.log("[Regenerate] HIKAYE (sayfa metni):", {
        baseSceneLen: baseScene.length,
        baseScenePreview: baseScene.slice(0, 200) + (baseScene.length > 200 ? "..." : ""),
        sceneDescriptionLen: sceneDescription.length,
        scenePreview: sceneDescription.slice(0, 250) + (sceneDescription.length > 250 ? "..." : ""),
      })
    }

    const characterActionRaw =
      page.sceneContext?.trim() ||
      page.sceneDescription?.trim() ||
      page.imagePrompt?.trim() ||
      page.text?.trim() ||
      ""
    const riskAnalysis = detectRiskySceneElements(sceneDescription, characterActionRaw)
    const characterAction = riskAnalysis.hasRisk
      ? getSafeSceneAlternative(characterActionRaw)
      : characterActionRaw

    const mood =
      themeKey === "adventure"
        ? "exciting"
        : themeKey === "fantasy"
          ? "mysterious"
          : themeKey === "space"
            ? "inspiring"
            : themeKey === "sports"
              ? "exciting"
              : "happy"

    // ── 8. Sayfa bazlı karakter listesi ────────────────────────────────────
    const pageCharacters: string[] = page.characterIds?.length
      ? page.characterIds
      : characterIds

    const characterExpressions: Record<string, string> = {}
    const pageCharExprs = page.characterExpressions || {}
    pageCharacters.forEach((charId) => {
      const expr = pageCharExprs[charId]?.trim()
      if (expr) characterExpressions[charId] = expr
    })

    const pageShotPlan = page.shotPlan
    const hasValidShotPlan =
      pageShotPlan && typeof pageShotPlan === "object" && !Array.isArray(pageShotPlan)

    // Master varsa kıyafet referanstan (create-book ile aynı): elbise tutarlı kalsın
    const pageMasterUrls = pageCharacters
      .map((id) => masterIllustrations[id])
      .filter((url): url is string => Boolean(url))
    const useMasterForClothing = pageMasterUrls.length > 0

    if (REGENERATE_DEBUG) {
      const names = pageCharacters.map((id) => characters.find((c) => c.id === id)?.name || id)
      console.log("[Regenerate] SAYFA KARAKTERLERİ:", {
        pageCharacters: pageCharacters.length,
        names,
        useMasterForClothing,
        clothingDirective: useMasterForClothing ? "match_reference" : "theme default",
      })
    }

    const sceneInput = {
      pageNumber,
      sceneDescription,
      theme: themeKey,
      mood,
      characterAction: characterAction || "",
      focusPoint: "balanced" as const,
      ...(Object.keys(characterExpressions).length > 0 && { characterExpressions }),
      ...(hasValidShotPlan && { shotPlan: pageShotPlan }),
      ...(useMasterForClothing && { clothing: "match_reference" as const }),
    }

    // ── 9. Karakter prompt (create-book ile aynı) ──────────────────────────
    const mainChar = characters.find((c) => c.id === pageCharacters[0]) || characters[0]
    const pageAdditionalCharacters = pageCharacters
      .slice(1)
      .map((charId) => {
        const c = characters.find((x) => x.id === charId)
        if (!c) return null
        return {
          type: c.character_type || { group: "Child", value: "Child", displayName: c.name },
          description: c.description,
        }
      })
      .filter(Boolean) as { type: any; description: any }[]

    const characterPrompt =
      pageAdditionalCharacters.length > 0
        ? buildMultipleCharactersPrompt(mainChar.description, pageAdditionalCharacters, true)
        : buildCharacterPrompt(mainChar.description, true, true)

    // ── 10. Full prompt (create-book ile aynı parametreler) ─────────────────
    // Kapak ayrı; story_data.pages = sadece iç sayfalar. Page 1 = ilk iç sayfa → isCover: false
    const previousScenes: SceneDiversityAnalysis[] = []
    const fullPrompt = generateFullPagePrompt(
      characterPrompt,
      sceneInput,
      illustrationStyle,
      ageGroup,
      pageAdditionalCharacters.length,
      false,  // isCover: kapak bu API'de yok, tüm sayfalar iç sayfa
      false,  // useCoverReference: master kullanıldığı için false
      previousScenes,
      totalPages,
      pageCharacters.map((id) => ({
        id,
        name: characters.find((c) => c.id === id)?.name || "Character",
      }))
    )

    if (REGENERATE_DEBUG) {
      console.log("[Regenerate] PROMPT:", {
        fullPromptLen: fullPrompt.length,
        promptPreview: fullPrompt.slice(0, 350) + (fullPrompt.length > 350 ? "..." : ""),
      })
    }

    // ── 11. Referans görseller (create-book ile aynı: karakter master + bu sayfada görünen entity master) ─
    // Karakter başına mutlaka bir ref: master varsa onu, yoksa reference_photo_url (eksik master = yanlış karakter çıkar)
    const entityMasterIllustrations = (book.generation_metadata?.entityMasterIllustrations || {}) as Record<string, string>
    const supportingEntities = (book.story_data?.supportingEntities || []) as Array<{
      id: string
      name?: string
      appearsOnPages?: number[]
    }>
    const characterNamesLower = new Set(
      characters.map((c) => (c.name || "").trim().toLowerCase()).filter(Boolean)
    )
    const pageEntityIds: string[] = []
    if (supportingEntities.length > 0) {
      for (const entity of supportingEntities) {
        if (!entity.appearsOnPages?.includes(pageNumber)) continue
        const entityName = (entity.name || "").trim().toLowerCase()
        if (entityName && characterNamesLower.has(entityName)) continue
        pageEntityIds.push(entity.id)
      }
    }
    const pageEntityMasterUrls = pageEntityIds
      .map((id) => entityMasterIllustrations[id])
      .filter((url): url is string => Boolean(url))

    // Her karakter için: önce master, yoksa reference_photo_url (hiç ref kalmamasın)
    const pageCharacterUrls: string[] = []
    for (const charId of pageCharacters) {
      const url = masterIllustrations[charId] || characters.find((c) => c.id === charId)?.reference_photo_url
      if (url) pageCharacterUrls.push(url)
    }
    const referenceImageUrls = [
      ...pageCharacterUrls,
      ...pageEntityMasterUrls,
    ]
    const characterMasterUrls = pageCharacterUrls.filter((url) =>
      pageCharacters.some((id) => masterIllustrations[id] === url)
    )
    const numCharRefs = pageCharacterUrls.length

    if (referenceImageUrls.length === 0) {
      return errorResponse(
        "No reference images available for this page (no character/entity masters or photos). Cannot regenerate with character consistency.",
        undefined,
        400
      )
    }

    console.log("[Regenerate] REFERANSLAR:", {
      pageNumber,
      characterRefs: numCharRefs,
      entityRefs: pageEntityMasterUrls.length,
      totalRefUrls: referenceImageUrls.length,
      characterSources: pageCharacterUrls.map((url, i) => {
        const charId = pageCharacters[i]
        const isMaster = characterMasterUrls.includes(url)
        const name = characters.find((c) => c.id === charId)?.name || charId
        return `${name}:${isMaster ? "master" : "photo"}`
      }),
    })

    // ── 12. Referans blob'larını indir ─────────────────────────────────────
    // Önce kendi S3'ümüzden credential ile oku (403 önlenir); değilse fetch (data: veya harici URL)
    const imageBlobs: Array<{ blob: Blob; filename: string }> = []

    for (let i = 0; i < referenceImageUrls.length; i++) {
      const refUrl = referenceImageUrls[i]
      const isCharRef = i < numCharRefs
      const isMaster = characterMasterUrls.includes(refUrl) || pageEntityMasterUrls.includes(refUrl)
      const label = isCharRef
        ? (() => {
            const charId = pageCharacters[i] || `unknown_${i}`
            const charName = characters.find((c) => c.id === charId)?.name || `char_${i + 1}`
            return isMaster ? `master_${charName}` : `photo_${charName}`
          })()
        : (() => {
            const entityIndex = i - numCharRefs
            const entityId = pageEntityIds[entityIndex]
            const entity = supportingEntities.find((e) => e.id === entityId)
            return entity?.name ? `entity_${entity.name}` : `entity_${entityIndex}`
          })()

      try {
        const fromS3 = await getObjectBufferFromUrl(refUrl)
        if (fromS3) {
          imageBlobs.push({
            blob: new Blob([fromS3.buffer], { type: fromS3.contentType }),
            filename: `${label}.png`,
          })
          continue
        }
        if (refUrl.startsWith("data:")) {
          const base64Data = refUrl.split(",")[1]
          const binaryData = Buffer.from(base64Data, "base64")
          imageBlobs.push({ blob: new Blob([binaryData], { type: "image/png" }), filename: `${label}.png` })
        } else {
          const imageRes = await fetch(refUrl)
          if (!imageRes.ok) throw new Error(`HTTP ${imageRes.status}`)
          const buffer = await imageRes.arrayBuffer()
          imageBlobs.push({ blob: new Blob([buffer], { type: "image/png" }), filename: `${label}.png` })
        }
      } catch (err) {
        console.error(`[Regenerate Image] Failed to fetch reference ${label}:`, err)
      }
    }

    console.log("[Regenerate] BLOB SONUÇ:", {
      pageNumber,
      wanted: referenceImageUrls.length,
      loaded: imageBlobs.length,
      charRefsWanted: numCharRefs,
      ok: imageBlobs.length >= numCharRefs && imageBlobs.length > 0,
    })

    if (referenceImageUrls.length > 0 && imageBlobs.length === 0) {
      return errorResponse(
        "Referans görselleri yüklenemedi. Lütfen tekrar deneyin veya destek ile iletişime geçin.",
        undefined,
        500
      )
    }
    if (referenceImageUrls.length > 0 && imageBlobs.length < numCharRefs) {
      return errorResponse(
        `Karakter referansları eksik (${imageBlobs.length}/${numCharRefs} yüklendi). Karakter tutarlılığı için tüm referanslar gerekli. Lütfen tekrar deneyin.`,
        undefined,
        500
      )
    }

    // ── 13. OpenAI API çağrısı ────────────────────────────────────────────
    let imageUrl: string | null = null
    let imageB64: string | null = null

    if (imageBlobs.length > 0) {
      console.log("[Regenerate] API: /v1/images/edits (referanslarla)", { imageCount: imageBlobs.length })
      // Edits API — create-book ile aynı FormData yapısı
      const formData = new FormData()
      formData.append("model", IMAGE_MODEL)
      formData.append("prompt", fullPrompt)
      formData.append("size", IMAGE_SIZE)
      formData.append("quality", IMAGE_QUALITY)
      formData.append("input_fidelity", "high")
      imageBlobs.forEach(({ blob, filename }) => {
        formData.append("image[]", blob, filename)
      })

      const result = await imageEditWithLog(formData, {
        userId: user.id,
        bookId,
        operationType: "image_regenerate",
        pageIndex: pageNumber,
        model: IMAGE_MODEL,
        quality: IMAGE_QUALITY,
        size: IMAGE_SIZE,
        refImageCount: imageBlobs.length,
      })

      imageUrl = result.data?.[0]?.url || null
      imageB64 = result.data?.[0]?.b64_json || null
    } else {
      console.warn("[Regenerate] API: /v1/images/generations (referans yok – karakter tutarlılığı olmaz)")
      // Fallback: referans görsel yok → generations API
      console.warn("[Regenerate Image] No reference images available, using /v1/images/generations")
      const result = await imageGenerateWithLog(
        { model: IMAGE_MODEL, prompt: fullPrompt, n: 1, size: IMAGE_SIZE, quality: IMAGE_QUALITY },
        {
          userId: user.id,
          bookId,
          operationType: "image_regenerate",
          pageIndex: pageNumber,
          model: IMAGE_MODEL,
          quality: IMAGE_QUALITY,
          size: IMAGE_SIZE,
        }
      )
      imageUrl = result.data?.[0]?.url || null
      imageB64 = result.data?.[0]?.b64_json || null
    }

    if (!imageUrl && !imageB64) {
      return errorResponse("Image generation failed: no image returned from OpenAI", undefined, 500)
    }

    // ── 14. S3'e yükle ─────────────────────────────────────────────────────
    const buffer = imageB64
      ? Buffer.from(imageB64, "base64")
      : Buffer.from(await (await fetch(imageUrl!)).arrayBuffer())

    const latestVersion = await getLatestPageVersion(bookId, pageNumber)
    const nextVersion = latestVersion + 1
    const fileName = `${user.id}/books/${bookId}/edits/page_${pageNumber}_v${nextVersion}_regen_${Date.now()}.png`
    const s3Key = await uploadFile("books", fileName, buffer, "image/png")
    const newImageUrl = getPublicUrl(s3Key)

    // ── 15. History kaydı ──────────────────────────────────────────────────
    const editPromptForHistory =
      (userPrompt?.trim() || sceneDescription || fullPrompt || "[Regenerate page]").trim() ||
      "[Regenerate page]"
    await insertEditHistory({
      book_id: bookId,
      page_number: pageNumber,
      version: nextVersion,
      original_image_url: page.imageUrl || null,
      edited_image_url: newImageUrl,
      edit_prompt: editPromptForHistory,
      ai_model: IMAGE_MODEL,
      edit_metadata: { mode: "regenerate", refCount: imageBlobs.length },
    })

    // ── 16. Book güncelle (imageUrl + quota) ───────────────────────────────
    const updatedPages = [...book.story_data.pages]
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], imageUrl: newImageUrl }

    const bookUpdateData: Parameters<typeof updateBook>[1] = {
      story_data: { ...book.story_data, pages: updatedPages },
    }
    if (!isAdmin) {
      bookUpdateData.edit_quota_used = quotaUsed + 1
    }
    await updateBook(bookId, bookUpdateData)

    // ── 17. Yanıt ──────────────────────────────────────────────────────────
    const historyData = await getEditHistory(bookId)
    const history = (historyData || [])
      .filter((h) => h.page_number === pageNumber)
      .map((h) => ({
        version: h.version,
        imageUrl: h.edited_image_url,
        editPrompt: h.edit_prompt,
        createdAt: h.created_at,
      }))

    const quotaRemaining: number | null = isAdmin ? null : quotaLimit - (quotaUsed + 1)

    return successResponse(
      {
        editedImageUrl: newImageUrl,
        version: nextVersion,
        quotaRemaining,
        history,
      },
      "Page image regenerated successfully"
    )
  } catch (err) {
    console.error("[Regenerate Image] Error:", err)
    return handleAPIError(err)
  }
}
