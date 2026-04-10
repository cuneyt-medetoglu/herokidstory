/**
 * Story Generation API
 *
 * POST /api/ai/generate-story
 * Body: characterId, theme, illustrationStyle, customRequests?, language?
 * Generates a complete children's story with image prompts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_PAGE_COUNT, PAGE_COUNT_MIN, PAGE_COUNT_MAX } from '@/lib/constants/book-config'
import { requireUser } from '@/lib/auth/api-auth'
import { getCharacterById } from '@/lib/db/characters'
import { createBook, getBookById } from '@/lib/db/books'
import { getUserRole } from '@/lib/db/users'
import { generateStoryPrompt, buildStorySystemPrompt, buildStoryResponseSchema } from '@/lib/prompts/story/base'
import type { ShotPlan } from '@/lib/prompts/types'
import { successResponse, errorResponse, handleAPIError } from '@/lib/api/response'
import { chatWithLog } from '@/lib/ai/chat'
import {
  ALLOWED_STORY_MODELS,
  DEFAULT_STORY_MODEL,
  STORY_GENERATION_MAX_OUTPUT_TOKENS,
  STORY_GENERATION_PROMPT_VERSION,
  type AllowedStoryModel,
} from '@/lib/ai/story-generation-config'
import { prepareStoryResponseForUse } from '@/lib/ai/story-response-validator'
import { parseReadingAgeBracket } from '@/lib/config/reading-age-brackets'
import OpenAI from 'openai'

/** Per-model pricing (USD / 1M tokens). Approximate blended input+output. */
const MODEL_COST_PER_1M: Record<AllowedStoryModel, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4.1-mini': { input: 0.40, output: 1.60 },
  'gpt-4.1': { input: 2.00, output: 8.00 },
  'gpt-4o':      { input: 2.50, output: 10.00 },
  'o1-mini':     { input: 1.10, output: 4.40 },
}

/** Formats cost as a display string for API responses (DB logging is handled by chatWithLog). */
function formatStoryCost(model: AllowedStoryModel, inputTokens: number, outputTokens: number): string {
  const pricing = MODEL_COST_PER_1M[model]
  if (!pricing) return '~$0.0000'
  const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
  return `~$${cost.toFixed(4)}`
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface StoryGenerationRequest {
  characterId: string
  theme: string
  illustrationStyle: string
  customRequests?: string
  language?: 'en' | 'tr' | 'de' | 'fr' | 'es' | 'zh' | 'pt' | 'ru'
  /** Sayfa sayısı (2–20). Verilmezse prompt varsayılanı kullanılır (şu an 12). */
  pageCount?: number
  /** Debug: return apiRequest, characterResolved, aiRequest in response metadata.debug */
  debug?: boolean
  /** Admin/debug only: override story model. Ignored for regular users. */
  storyModel?: string
}

export interface StoryGenerationResponse {
  storyId: string
  title: string
  pages: Array<{
    pageNumber: number
    text: string
    imagePrompt: string
    sceneDescription: string
    /** A5: Optional shot plan from LLM; used for image prompt when present. */
    shotPlan?: ShotPlan
  }>
  metadata: {
    ageGroup: string
    theme: string
    totalPages: number
    readingTime: number
    educationalThemes: string[]
  }
  character: {
    id: string
    name: string
  }
  generationTime: number
  tokensUsed: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // ====================================================================
    // 1. Authentication
    // ====================================================================
    const user = await requireUser()

    // ====================================================================
    // 2. Parse & Validate Request
    // ====================================================================
    const body: StoryGenerationRequest = await request.json()
    const {
      characterId,
      theme,
      illustrationStyle,
      customRequests,
      language = 'en',
      pageCount: pageCountOverride,
      debug: debugMode = false,
      storyModel: requestedModel,
    } = body
    const expectedPageCount =
      typeof pageCountOverride === 'number' && pageCountOverride >= PAGE_COUNT_MIN && pageCountOverride <= PAGE_COUNT_MAX
        ? pageCountOverride
        : DEFAULT_PAGE_COUNT

    // Admin/debug only model override (mirrors books/route.ts logic)
    const userRole = await getUserRole(user.id)
    const isAdmin = userRole === 'admin'
    const canUseDebugOptions = process.env.DEBUG_SKIP_PAYMENT === 'true' || isAdmin
    const effectiveStoryModel: AllowedStoryModel =
      canUseDebugOptions &&
      requestedModel &&
      (ALLOWED_STORY_MODELS as readonly string[]).includes(requestedModel)
        ? (requestedModel as AllowedStoryModel)
        : DEFAULT_STORY_MODEL

    if (effectiveStoryModel !== DEFAULT_STORY_MODEL) {
      console.log(`[generate-story] 🔧 Model override: ${effectiveStoryModel} (admin=${isAdmin})`)
    }

    if (!characterId || !theme || !illustrationStyle) {
      return errorResponse(
        'Missing required fields',
        'characterId, theme, and illustrationStyle are required',
        400
      )
    }

    const themeNormalized = String(theme).trim().toLowerCase()
    if (themeNormalized === 'custom' && !String(customRequests ?? '').trim()) {
      return errorResponse(
        'customRequests required',
        'When theme is "custom", customRequests (story seed) is required and must be non-empty.',
        400
      )
    }

    // ====================================================================
    // 3. Get Character
    // ====================================================================
    const { data: character, error: charError } = await getCharacterById(characterId)

    if (charError || !character) {
      return errorResponse('Character not found', 'Invalid character ID', 404)
    }

    // Verify ownership
    if (character.user_id !== user.id) {
      return errorResponse('Forbidden', 'You do not own this character', 403)
    }

    // ====================================================================
    // 4. Generate Story Prompt
    // ====================================================================
    // Faz 1: defaultClothing from master character (exact outfit for story consistency)
    const desc = character.description as unknown as Record<string, unknown>
    const defaultClothing =
      (desc?.defaultClothing as string | undefined) ||
      (character.description?.clothingStyle && Array.isArray(character.description?.clothingColors)
        ? `${character.description.clothingStyle} in ${character.description.clothingColors.join(' and ')}`
        : undefined)

    // CHARACTER MAPPING için gerçek UUID: tek karakterde bile characters dizisi veriyoruz (aksiyon planı 1.2)
    const charactersForPrompt = [
      {
        id: character.id,
        name: character.name,
        type: { displayName: character.name, group: 'Child', value: 'Child' },
      },
    ]

    const storyPrompt = generateStoryPrompt({
      characterName: character.name,
      characterAge: character.age,
      readingAgeBracket: parseReadingAgeBracket(character.description?.readingAgeBracket),
      characterGender: character.gender,
      theme,
      illustrationStyle,
      customRequests,
      pageCount: pageCountOverride,
      referencePhotoAnalysis: {
        detectedFeatures: {
          age: character.description.age,
          gender: character.description.gender,
          skinTone: character.description.skinTone,
          hairColor: character.description.hairColor,
          hairStyle: character.description.hairStyle,
          eyeColor: character.description.eyeColor,
          faceShape: character.description.faceShape,
        },
        finalDescription: character.description,
        confidence: character.analysis_confidence || 0.8,
      },
      language,
      defaultClothing,
      characters: charactersForPrompt,
    })

    console.log('Story generation started for character:', character.name)

    // ====================================================================
    // 5. Call OpenAI
    // ====================================================================
    const completion = await chatWithLog(
      openai,
      {
        model: effectiveStoryModel,
        messages: [
          { role: 'system', content: buildStorySystemPrompt(language) },
          { role: 'user', content: storyPrompt },
        ],
        response_format: {
          type: 'json_schema' as const,
          json_schema: { name: 'story_output', strict: false, schema: buildStoryResponseSchema() },
        },
        temperature: 0.8,
        max_completion_tokens: STORY_GENERATION_MAX_OUTPUT_TOKENS,
      },
      {
        userId: user.id,
        characterId,
        operationType: 'story_generation',
        promptVersion: STORY_GENERATION_PROMPT_VERSION,
        requestMeta: { language, temperature: 0.8 },
      }
    )

    const storyContent = completion.choices[0].message.content
    if (!storyContent) {
      throw new Error('No story content generated')
    }

    const preparedStory = await prepareStoryResponseForUse({
      openai,
      model: effectiveStoryModel,
      userId: user.id,
      characterId,
      promptVersion: STORY_GENERATION_PROMPT_VERSION,
      requestMeta: { language, temperature: 0.8, source: 'generate-story-route' },
      storyData: JSON.parse(storyContent),
      expectedPageCount,
      characters: charactersForPrompt.map((character) => ({ id: character.id, name: character.name })),
      customRequests,
    })
    const storyData = preparedStory.storyData

    console.log('[Story Generation] storyRepair:', {
      repaired: preparedStory.repaired,
      repairFieldsRequested: preparedStory.repairFieldsRequested,
      issues: preparedStory.issues,
    })

    const usageStory = completion.usage
    const usageRepair = preparedStory.repairUsage
    const promptTokensTotal =
      (usageStory?.prompt_tokens ?? 0) + (usageRepair?.prompt_tokens ?? 0)
    const completionTokensTotal =
      (usageStory?.completion_tokens ?? 0) + (usageRepair?.completion_tokens ?? 0)
    const totalTokensAll =
      (usageStory?.total_tokens ?? 0) + (usageRepair?.total_tokens ?? 0)

    // ====================================================================
    // 6.2. LOG: Theme & Clothing Style (NEW: 15 Ocak 2026 - Quality Check)
    // ====================================================================
    console.log('[Story Generation] 👔 THEME & CLOTHING ANALYSIS:')
    console.log(`  Theme: ${theme}`)
    const themeClothingMap: Record<string, string> = {
      adventure: 'comfortable outdoor clothing',
      sports: 'sportswear',
      fantasy: 'fantasy-appropriate casual clothing',
      animals: 'casual comfortable clothing for nature/outdoors',
      'daily-life': 'everyday casual clothing',
      space: 'space/exploration-appropriate clothing',
      underwater: 'swimwear or beach-appropriate clothing',
    }
    const expectedClothing = themeClothingMap[theme] || 'age-appropriate casual clothing'
    console.log(`  Expected clothing: ${expectedClothing}`)
    console.log(`  ✅ Clothing style directives added to prompt`)

    // ====================================================================
    // 7. Save to Database
    // ====================================================================
    const { data: book, error: bookError } = await createBook(user.id, {
      character_id: characterId,
      title: storyData.title,
      theme,
      illustration_style: illustrationStyle,
      language,
      age_group: storyData.metadata?.ageGroup || 'preschool',
      total_pages: storyData.pages.length,
      story_data: storyData,
      status: 'draft', // Story generated, images not yet
      custom_requests: customRequests,
      generation_metadata: {
        model: effectiveStoryModel,
        promptVersion: STORY_GENERATION_PROMPT_VERSION,
        tokensUsed: totalTokensAll || usageStory?.total_tokens || 0,
        tokensStory: usageStory,
        tokensRepair: usageRepair ?? null,
        repairCalls: preparedStory.repairCalls,
        repaired: preparedStory.repaired,
        repairFieldsRequested: preparedStory.repairFieldsRequested,
        storyRepairIssues: preparedStory.issues,
        generationTime: Date.now() - startTime,
      },
    })

    if (bookError || !book) {
      console.error('Database error:', bookError)
      throw new Error('Failed to save story to database')
    }

    // ====================================================================
    // 8. Prepare Response
    // ====================================================================
    const generationTime = Date.now() - startTime
    const tokensUsed = totalTokensAll || completion.usage?.total_tokens || 0

    console.log(
      `Story generated successfully in ${generationTime}ms, ${tokensUsed} tokens (story + repair)`
    )

    const response: StoryGenerationResponse = {
      storyId: book.id,
      title: storyData.title,
      pages: storyData.pages,
      metadata: {
        ageGroup: storyData.metadata?.ageGroup || 'preschool',
        theme,
        totalPages: storyData.pages.length,
        readingTime: storyData.pages.length * 2, // Estimated 2 min per page
        educationalThemes: storyData.metadata?.educationalThemes || [],
      },
      character: {
        id: character.id,
        name: character.name,
      },
      generationTime,
      tokensUsed,
    }

    const metadata: Record<string, unknown> = {
      cost: formatStoryCost(effectiveStoryModel, promptTokensTotal, completionTokensTotal),
      model: effectiveStoryModel,
      characterUsage: character.total_books + 1,
      openaiUsage: {
        story: usageStory ?? null,
        repair: usageRepair ?? null,
        repairCalls: preparedStory.repairCalls,
        repaired: preparedStory.repaired,
        repairFieldsRequested: preparedStory.repairFieldsRequested,
        issues: preparedStory.issues,
      },
    }
    if (debugMode) {
      metadata.debug = {
        apiRequest: {
          characterId,
          theme,
          illustrationStyle,
          customRequests: customRequests ?? '',
          language,
          pageCount: pageCountOverride,
        },
        characterResolved: {
          id: character.id,
          name: character.name,
          age: character.age,
          gender: character.gender,
        },
        aiRequest: {
          model: effectiveStoryModel,
          systemMessage: buildStorySystemPrompt(language),
          userMessage: storyPrompt,
        },
      }
    }

    return successResponse(response, 'Story generated successfully', metadata)
  } catch (error) {
    console.error('Story generation error:', error)
    return handleAPIError(error)
  }
}

// ============================================================================
// GET - Get Story Status (optional, for polling)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storyId = searchParams.get('storyId')

    if (!storyId) {
      return errorResponse('Missing storyId', 'storyId query parameter is required', 400)
    }

    const user = await requireUser()

    const { data: book, error } = await getBookById(storyId)

    if (error || !book) {
      return errorResponse('Story not found', 'Invalid story ID', 404)
    }

    if (book.user_id !== user.id) {
      return errorResponse('Unauthorized', 'You can only view your own stories', 403)
    }

    return successResponse(book)
  } catch (error) {
    return handleAPIError(error)
  }
}

