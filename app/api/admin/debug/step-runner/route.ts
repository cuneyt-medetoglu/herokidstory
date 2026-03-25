/**
 * POST /api/admin/debug/step-runner
 *
 * Admin-only step-by-step debug runner for the real book creation pipeline.
 * Allows running each operationType in isolation (story → master → entity → cover → page → tts)
 * and viewing the exact AI request/response for each step.
 *
 * Flow:
 *   1. story_generation  → creates a debug book, returns storyData + sessionBookId
 *   2. image_master      → generates master illustrations for each character
 *   3. image_entity      → generates entity master illustrations from story
 *   4. image_cover       → generates cover image using pre-computed masters
 *   5. image_page        → generates page images (all or target page)
 *   6. tts               → generates TTS audio for each page
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { requireUser } from '@/lib/auth/api-auth'
import { getUserRole } from '@/lib/db/users'
import { getCharacterById } from '@/lib/db/characters'
import { createBook, getBookById, updateBook } from '@/lib/db/books'
import { generateStoryPrompt } from '@/lib/prompts/story/base'
import type { StoryGenerationInput } from '@/lib/prompts/types'
import {
  generateMasterCharacterIllustration,
  generateSupportingEntityMaster,
  runImagePipeline,
  type DebugTraceEntry,
} from '@/lib/book-generation/image-pipeline'
import { generateTts } from '@/lib/tts/generate'
import { chatWithLog } from '@/lib/ai/chat'

export const maxDuration = 300

// ============================================================================
// Types
// ============================================================================

type OperationType = 'story_generation' | 'image_master' | 'image_entity' | 'image_cover' | 'image_page' | 'tts'

interface StepRunnerRequest {
  operationType: OperationType
  characterIds: string[]
  themeKey: string
  illustrationStyle: string
  language: string
  customRequests?: string
  pageCount?: number
  storyModel?: string
  sessionBookId?: string
  state?: {
    storyData?: any
    masterIllustrations?: Record<string, string>
    entityMasterIllustrations?: Record<string, string>
    coverUrl?: string
    pageImages?: Record<number, string>
  }
  targetPageNumber?: number | null
}

function normalizeThemeKey(theme: string): string {
  const t = (theme || '').toString().trim().toLowerCase()
  if (!t) return t
  if (t === 'sports&activities' || t === 'sports_activities' || t === 'sports-activities') return 'sports'
  return t
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  tr: 'Turkish',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  zh: 'Chinese (Mandarin)',
  pt: 'Portuguese',
  ru: 'Russian',
}

const THEME_CLOTHING: Record<string, string> = {
  adventure: 'comfortable outdoor clothing, hiking clothes, sneakers (adventure outfit)',
  space: 'child-sized astronaut suit or space exploration outfit',
  underwater: 'swimwear, beach clothes',
  sports: 'sportswear, athletic clothes',
  fantasy: 'fantasy-appropriate casual clothing, adventure-style',
  'daily-life': 'everyday casual clothing',
  custom: 'age-appropriate casual clothing',
}

// ============================================================================
// POST handler
// ============================================================================

export async function POST(request: NextRequest) {
  const startedAt = Date.now()

  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const user = await requireUser()
    const role = await getUserRole(user.id)
    if (role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body: StepRunnerRequest = await request.json()
    const { operationType, characterIds, themeKey: rawTheme, illustrationStyle, language, customRequests, pageCount, storyModel, sessionBookId, state, targetPageNumber } = body

    if (!operationType) {
      return NextResponse.json({ success: false, error: 'operationType is required' }, { status: 400 })
    }
    if (!characterIds?.length) {
      return NextResponse.json({ success: false, error: 'characterIds is required' }, { status: 400 })
    }

    const themeKey = normalizeThemeKey(rawTheme)

    // ── Fetch characters ──────────────────────────────────────────────────────
    const characters: any[] = []
    for (const id of characterIds) {
      const { data: char } = await getCharacterById(id)
      if (char) characters.push(char)
    }
    if (characters.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid characters found' }, { status: 400 })
    }

    // ── Dispatch by operationType ─────────────────────────────────────────────
    switch (operationType) {
      case 'story_generation':
        return await handleStoryGeneration({ user, characters, themeKey, illustrationStyle, language, customRequests, pageCount, storyModel, startedAt })

      case 'image_master':
        return await handleImageMaster({ user, characters, themeKey, illustrationStyle, state, sessionBookId, startedAt })

      case 'image_entity':
        return await handleImageEntity({ user, characters, illustrationStyle, state, sessionBookId, startedAt })

      case 'image_cover':
        return await handleImageCover({ user, characters, themeKey, illustrationStyle, language, customRequests, state, sessionBookId, startedAt })

      case 'image_page':
        return await handleImagePage({ user, characters, themeKey, illustrationStyle, language, customRequests, state, sessionBookId, targetPageNumber, startedAt })

      case 'tts':
        return await handleTts({ user, language, state, sessionBookId, startedAt })

      default:
        return NextResponse.json({ success: false, error: `Unknown operationType: ${operationType}` }, { status: 400 })
    }
  } catch (err: any) {
    console.error('[StepRunner] Unhandled error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// story_generation
// ============================================================================

async function handleStoryGeneration({ user, characters, themeKey, illustrationStyle, language, customRequests, pageCount, storyModel, startedAt }: any) {
  const character = characters[0]
  const effectiveStoryModel = storyModel || 'gpt-4.1-mini'
  const effectivePageCount = pageCount || 4
  const languageName = LANGUAGE_NAMES[language] || 'English'

  const storyPromptInput: StoryGenerationInput = {
    characterName: character.name,
    characterAge: character.age,
    characterGender: character.gender,
    theme: themeKey,
    illustrationStyle,
    customRequests,
    pageCount: effectivePageCount,
    referencePhotoAnalysis: {
      detectedFeatures: character.description?.physicalFeatures || {},
      finalDescription: character.description,
      confidence: character.analysis_confidence || 0.8,
    },
    language: language as NonNullable<StoryGenerationInput['language']>,
    characters: characters.map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.character_type || { group: 'Child', value: 'Child', displayName: c.name },
      characterId: c.id,
    })),
  }

  const storyPrompt = generateStoryPrompt(storyPromptInput)
  const storyRequestBody = {
    model: effectiveStoryModel,
    messages: [
      {
        role: 'system' as const,
        content: `You are a professional children's book author. Create engaging, age-appropriate stories with detailed image prompts. Return exactly the requested number of pages. Write the entire story in ${languageName} only; do not use words from other languages.`,
      },
      { role: 'user' as const, content: storyPrompt },
    ],
    response_format: { type: 'json_object' as const },
    temperature: 0.8,
    max_tokens: 8000,
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const reqStartedAt = Date.now()

  const completion = await chatWithLog(openai, storyRequestBody, {
    userId: user.id,
    characterId: character.id,
    operationType: 'story_generation',
    promptVersion: 'step-runner-v1',
    requestMeta: { language, temperature: 0.8, maxTokens: 8000, source: 'step-runner' },
  })

  const durationMs = Date.now() - reqStartedAt
  const storyContent = completion.choices[0].message.content
  if (!storyContent) throw new Error('No story content returned from AI')

  let storyData: any
  try {
    storyData = JSON.parse(storyContent)
  } catch {
    throw new Error('AI returned invalid JSON for story')
  }

  if (!storyData.title || !storyData.pages || !Array.isArray(storyData.pages)) {
    throw new Error('Invalid story structure: missing title or pages')
  }

  storyData.pages = storyData.pages.map((p: any, idx: number) => ({ ...p, pageNumber: p.pageNumber || idx + 1 }))

  // Create a debug book to hold the session state
  const { data: newBook } = await createBook(user.id, {
    character_id: character.id,
    title: storyData.title || 'Debug Session',
    theme: themeKey,
    illustration_style: illustrationStyle,
    language,
    story_data: storyData,
    total_pages: storyData.pages.length,
    custom_requests: customRequests || null,
    status: 'draft',
    is_example: false,
  })

  const aiLog: DebugTraceEntry[] = [
    {
      step: 'story_generation',
      request: {
        model: effectiveStoryModel,
        systemPrompt: storyRequestBody.messages[0].content,
        userPromptLength: storyPrompt.length,
        userPromptPreview: storyPrompt.slice(0, 500) + (storyPrompt.length > 500 ? '...' : ''),
        temperature: 0.8,
        maxTokens: 8000,
        language,
        pageCount: effectivePageCount,
      },
      response: {
        title: storyData.title,
        pageCount: storyData.pages.length,
        pages: storyData.pages.map((p: any) => ({ pageNumber: p.pageNumber, textPreview: (p.text || '').slice(0, 100) })),
        usage: completion.usage,
        durationMs,
      },
    },
  ]

  return NextResponse.json({
    success: true,
    operationType: 'story_generation',
    sessionBookId: newBook?.id,
    statePatch: { storyData },
    aiLog,
    durationMs: Date.now() - startedAt,
  })
}

// ============================================================================
// image_master
// ============================================================================

async function handleImageMaster({ user, characters, themeKey, illustrationStyle, state, sessionBookId, startedAt }: any) {
  const storyData = state?.storyData || null
  const suggestedOutfits: Record<string, string> =
    storyData?.suggestedOutfits && typeof storyData.suggestedOutfits === 'object'
      ? storyData.suggestedOutfits
      : {}
  const themeClothing = THEME_CLOTHING[themeKey] || 'age-appropriate casual clothing'

  const masterIllustrations: Record<string, string> = {}
  const aiLog: DebugTraceEntry[] = []

  for (const char of characters) {
    if (!char.reference_photo_url) {
      console.log(`[StepRunner] ⚠️ Character ${char.id} (${char.name}) has no reference photo - skipping`)
      continue
    }

    const isMainCharacter = char.id === characters[0].id
    let includeAge: boolean
    if (isMainCharacter) {
      includeAge = true
    } else {
      const isChildType = char.character_type?.group === 'Child' || char.character_type?.value === 'Child'
      const hasAge = char.description?.age && char.description.age > 0
      includeAge = isChildType && hasAge
    }

    const charOutfit = suggestedOutfits[char.id]?.trim() || themeClothing

    const masterUrl = await generateMasterCharacterIllustration(
      char.reference_photo_url,
      char.description,
      char.id,
      illustrationStyle,
      user.id,
      includeAge,
      char.gender,
      charOutfit,
      (entry) => aiLog.push(entry),
      `master_character_${char.name || char.id}`,
      sessionBookId,
      char.character_type ?? undefined
    )
    masterIllustrations[char.id] = masterUrl
  }

  if (sessionBookId && Object.keys(masterIllustrations).length > 0) {
    await updateBook(sessionBookId, {
      generation_metadata: { masterIllustrations, masterIllustrationCreated: true },
    })
  }

  return NextResponse.json({
    success: true,
    operationType: 'image_master',
    sessionBookId,
    statePatch: { masterIllustrations },
    aiLog,
    durationMs: Date.now() - startedAt,
  })
}

// ============================================================================
// image_entity
// ============================================================================

async function handleImageEntity({ user, characters, illustrationStyle, state, sessionBookId, startedAt }: any) {
  const storyData = state?.storyData
  const entities: any[] = storyData?.supportingEntities || []

  if (entities.length === 0) {
    return NextResponse.json({
      success: true,
      operationType: 'image_entity',
      sessionBookId,
      statePatch: { entityMasterIllustrations: {} },
      aiLog: [],
      durationMs: Date.now() - startedAt,
      message: 'No supporting entities in storyData',
    })
  }

  const entityMasterIllustrations: Record<string, string> = {}
  const aiLog: DebugTraceEntry[] = []

  await Promise.allSettled(
    entities.map(async (entity: any) => {
      try {
        const url = await generateSupportingEntityMaster(
          entity.id,
          entity.type,
          entity.name,
          entity.description,
          illustrationStyle,
          user.id,
          (entry) => aiLog.push(entry),
          `entity_master_${entity.name}`,
          sessionBookId
        )
        entityMasterIllustrations[entity.id] = url
      } catch (err: any) {
        console.error(`[StepRunner] Entity master failed for ${entity.name}:`, err?.message)
      }
    })
  )

  if (sessionBookId && Object.keys(entityMasterIllustrations).length > 0) {
    await updateBook(sessionBookId, {
      generation_metadata: { entityMasterIllustrations, entityMasterCreated: true },
    })
  }

  return NextResponse.json({
    success: true,
    operationType: 'image_entity',
    sessionBookId,
    statePatch: { entityMasterIllustrations },
    aiLog,
    durationMs: Date.now() - startedAt,
  })
}

// ============================================================================
// image_cover
// ============================================================================

async function handleImageCover({ user, characters, themeKey, illustrationStyle, language, customRequests, state, sessionBookId, startedAt }: any) {
  if (!sessionBookId) {
    return NextResponse.json({ success: false, error: 'sessionBookId required for image_cover step' }, { status: 400 })
  }
  if (!state?.storyData) {
    return NextResponse.json({ success: false, error: 'storyData required in state for image_cover step' }, { status: 400 })
  }

  const debugTrace: DebugTraceEntry[] = []

  await runImagePipeline({
    bookId: sessionBookId,
    userId: user.id,
    characters,
    storyData: state.storyData,
    illustrationStyle,
    themeKey,
    language,
    customRequests,
    isFromExampleMode: false,
    isCoverOnlyMode: false,
    preComputedMasterIllustrations: state.masterIllustrations || {},
    preComputedEntityMasterIllustrations: state.entityMasterIllustrations || {},
    debugStopAfterStep: 'cover',
    debugTrace,
  })

  // Read cover URL from DB
  const { data: updatedBook } = await getBookById(sessionBookId)
  const coverUrl = updatedBook?.cover_image_url || null

  return NextResponse.json({
    success: true,
    operationType: 'image_cover',
    sessionBookId,
    statePatch: { coverUrl },
    aiLog: debugTrace,
    durationMs: Date.now() - startedAt,
  })
}

// ============================================================================
// image_page
// ============================================================================

async function handleImagePage({ user, characters, themeKey, illustrationStyle, language, customRequests, state, sessionBookId, targetPageNumber, startedAt }: any) {
  if (!sessionBookId) {
    return NextResponse.json({ success: false, error: 'sessionBookId required for image_page step' }, { status: 400 })
  }
  if (!state?.storyData?.pages?.length) {
    return NextResponse.json({ success: false, error: 'storyData with pages required in state for image_page step' }, { status: 400 })
  }

  // Filter to target page if specified
  let pipelineStoryData = state.storyData
  if (targetPageNumber != null) {
    const targetPage = state.storyData.pages.find((p: any) => p.pageNumber === targetPageNumber)
    if (!targetPage) {
      return NextResponse.json({ success: false, error: `Page ${targetPageNumber} not found in storyData` }, { status: 400 })
    }
    pipelineStoryData = { ...state.storyData, pages: [targetPage] }
  }

  const debugTrace: DebugTraceEntry[] = []

  await runImagePipeline({
    bookId: sessionBookId,
    userId: user.id,
    characters,
    storyData: pipelineStoryData,
    illustrationStyle,
    themeKey,
    language,
    customRequests,
    isFromExampleMode: false,
    isCoverOnlyMode: false,
    preComputedMasterIllustrations: state.masterIllustrations || {},
    preComputedEntityMasterIllustrations: state.entityMasterIllustrations || {},
    preComputedCoverUrl: state.coverUrl || undefined,
    debugStopAfterStep: 'pages',
    debugTrace,
  })

  // Read page images from updated book
  const { data: updatedBook } = await getBookById(sessionBookId)
  const imagesData: any[] = updatedBook?.images_data || []
  const pageImages: Record<number, string> = {}
  for (const img of imagesData) {
    if (img.pageNumber && img.imageUrl) {
      pageImages[img.pageNumber] = img.imageUrl
    }
  }

  return NextResponse.json({
    success: true,
    operationType: 'image_page',
    sessionBookId,
    statePatch: { pageImages },
    aiLog: debugTrace,
    durationMs: Date.now() - startedAt,
  })
}

// ============================================================================
// tts
// ============================================================================

async function handleTts({ user, language, state, sessionBookId, startedAt }: any) {
  const pages: any[] = state?.storyData?.pages || []
  const ttsPages = pages.filter((p: any) => p?.text?.trim())

  if (ttsPages.length === 0) {
    return NextResponse.json({
      success: true,
      operationType: 'tts',
      sessionBookId,
      statePatch: { audioUrls: {} },
      aiLog: [],
      durationMs: Date.now() - startedAt,
      message: 'No pages with text found',
    })
  }

  const bookLanguage = language || 'tr'
  const audioUrls: Record<number, string> = {}
  const ttsLog: DebugTraceEntry[] = []
  let success = 0
  let fail = 0

  await Promise.all(
    ttsPages.map(async (p: any) => {
      const pageNumber = p.pageNumber
      const reqStart = Date.now()
      try {
        const ttsResult = await generateTts(p.text.trim(), {
          language: bookLanguage,
          userId: user.id,
          bookId: sessionBookId,
        })
        if (ttsResult?.audioUrl) {
          audioUrls[pageNumber] = ttsResult.audioUrl
          success++
          ttsLog.push({
            step: `tts_page_${pageNumber}`,
            request: { text: p.text.trim().slice(0, 200), language: bookLanguage, pageNumber },
            response: { audioUrl: ttsResult.audioUrl, cached: ttsResult.cached, voiceId: ttsResult.voiceId, durationMs: Date.now() - reqStart },
          })
        }
      } catch (err: any) {
        fail++
        ttsLog.push({
          step: `tts_page_${pageNumber}`,
          request: { text: p.text.trim().slice(0, 200), language: bookLanguage, pageNumber },
          response: { error: err?.message || 'TTS failed', durationMs: Date.now() - reqStart },
        })
      }
    })
  )

  return NextResponse.json({
    success: fail === 0,
    operationType: 'tts',
    sessionBookId,
    statePatch: { audioUrls },
    aiLog: ttsLog,
    durationMs: Date.now() - startedAt,
    summary: { success, fail, total: ttsPages.length },
  })
}
