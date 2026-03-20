import type { PromptVersion, ShotPlan } from '../types'
import { getStyleDescription, is3DAnimationStyle, get3DAnimationNotes, getCinematicPack, getGlobalArtDirection } from './style-descriptions'
import { getAnatomicalCorrectnessDirectives, getSafeHandPoses, getDefaultHandStrategy } from './negative'

/**
 * Scene Generation Prompts - Version 1.0.0
 * 
 * Creates detailed scene descriptions for each page
 * Works in conjunction with character prompts
 * 
 * Updated: 15 Ocak 2026
 * - Enhanced with POC's detailed prompt structure
 * - Added character consistency emphasis
 * - Added book cover special instructions
 * - Added 3D Animation style special notes
 */

export const VERSION: PromptVersion = {
  version: '1.17.0',
  releaseDate: new Date('2026-02-08'),
  status: 'active',
  changelog: [
    'Initial release',
    'Scene composition rules',
    'Age-appropriate scenes',
    'Theme-based environments',
    'Enhanced with POC detailed prompt structure (15 Ocak 2026)',
    'Added character consistency emphasis',
    'Added book cover special instructions',
    'Added 3D Animation style special notes',
    'v1.0.1: Prompt order optimization - anatomical directives moved to beginning (anatomy-first approach) (16 Ocak 2026)',
    'v1.0.1: Style emphasis added with uppercase for better attention (16 Ocak 2026)',
    'v1.0.2: Risky scene detection added - detectRiskySceneElements() (GPT research-backed) (18 Ocak 2026)',
    'v1.0.2: Safe scene alternatives - getSafeSceneAlternative() for risk mitigation (18 Ocak 2026)',
    'v1.1.0: Major optimization - style directives simplified (1500→200 chars), cinematic elements compressed (50→5 lines), environment templates reduced (90→15 lines), composition rules simplified (28→7 lines), cover directives optimized (27→3 lines), diversity directives minimized (40→10 lines), clothing consistency compressed (30→5 lines) - Total ~70% reduction (18 Ocak 2026)',
    'v1.2.0: Major enhancement - composition and depth improvements (25 Ocak 2026)',
    'v1.2.0: Added getDepthOfFieldDirectives() - camera parameters, focus planes, bokeh effects (25 Ocak 2026)',
    'v1.2.0: Added getAtmosphericPerspectiveDirectives() - color desaturation, contrast reduction, haze (25 Ocak 2026)',
    'v1.2.0: Added getCameraAngleDirectives() - perspective diversity, child\'s viewpoint (25 Ocak 2026)',
    'v1.2.0: Added getCharacterEnvironmentRatio() - 30-40% character, 60-70% environment balance (25 Ocak 2026)',
    'v1.2.0: Enhanced getCinematicElements() - specific lighting techniques (golden hour, backlighting, god rays) (25 Ocak 2026)',
    'v1.2.0: Enhanced generateLayeredComposition() - depth of field and atmospheric perspective (25 Ocak 2026)',
    'v1.2.0: Enhanced getCompositionRules() - camera angle variety and character-environment ratio (25 Ocak 2026)',
    'v1.2.0: Enhanced getLightingDescription() - specific lighting techniques, color temperatures, atmospheric particles (25 Ocak 2026)',
    'v1.2.0: Enhanced getEnvironmentDescription() - background details, sky, distant elements (25 Ocak 2026)',
    'v1.2.0: Enhanced generateFullPagePrompt() - new directives integrated, prompt structure reorganized (25 Ocak 2026)',
    'v1.3.0: DoF balanced/environment - sharp detailed background, blur removed; layered composition - net ortam; getCharacterEnvironmentRatio - ortam netliği (24 Ocak 2026)',
    'v1.3.0: Cover vs first interior page differentiation - distinct camera/composition (3.5.20) (24 Ocak 2026)',
    'v1.4.0: Character ratio 25-35%, max 35%, wider shot, character smaller; getCharacterEnvironmentRatio and getCompositionRules (24 Ocak 2026)',
    'v1.4.0: Cover poster for entire book, epic wide, dramatic lighting, character max 30-35%, environment-dominant (24 Ocak 2026)',
    'v1.5.0: Age-agnostic scene rules - getAgeAppropriateSceneRules returns rich background for all ages (24 Ocak 2026)',
    'v1.5.0: First interior page - "Character centered" removed; "Character smaller in frame, NOT centered; rule of thirds or leading lines" (24 Ocak 2026)',
    'v1.5.0: Cover prompt softening - "standing prominently/looking at viewer" → "integrated into environment as guide"; "prominently displayed" → "integrated into scene" (24 Ocak 2026)',
    'v1.6.0: Cover focusPoint → balanced (plan: Kapak/Close-up/Kıyafet); no "character centered" on cover (24 Ocak 2026)',
    'v1.6.0: Close-up removed from getCameraAngleDirectives and getPerspectiveForPage – "character 25–35%" alignment (24 Ocak 2026)',
    'v1.6.0: Story-driven clothing – SceneInput.clothing; generateFullPagePrompt uses story clothing when present, else theme (24 Ocak 2026)',
    'v1.7.0: Image API Refactor - Modülerleştirme (3 Faz) (24 Ocak 2026)',
    'v1.7.0: Faz 1 - Inline direktifleri modülerleştir (buildCoverDirectives, buildFirstInteriorPageDirectives, buildClothingDirectives, buildMultipleCharactersDirectives, buildCoverReferenceConsistencyDirectives)',
    'v1.7.0: Faz 2 - Tekrar eden direktifleri birleştir (buildCharacterConsistencyDirectives, buildStyleDirectives)',
    'v1.7.0: Faz 3 - Prompt bölümlerini organize et (12 builder fonksiyonu, generateFullPagePrompt refactor)',
    'v1.8.1: Faz 1 - Clothing lock en başta (CLOTHING_LOCK) - kıyafet direktifi Scene Establishment sonrası (31 Ocak 2026)',
    'v1.8.0: Faz 2 Görsel Kalite – Scene-First (buildSceneEstablishmentSection), Golden Hour Boost, Pose Variation (8 pose pool), Enhanced Atmospheric Depth, Character Integration directives (31 Ocak 2026)',
    'v1.8.2: Faz 3.4 Advanced Composition – getCharacterPlacementForPage (sol/sağ üçte bir), getAdvancedCompositionRules (rule of thirds, leading lines), getGazeDirectionForPage (bakış çeşitliliği); getCompositionRules interior için "character centered" kaldırıldı, isCover parametresi eklendi (30 Ocak 2026)',
    'v1.9.0: SceneInput.expression (per-page from story); Facial expression in prompt when present. Clothing: "same outfit every page" when match_reference. (2 Şubat 2026)',
    'v1.10.0: getCinematicNaturalDirectives() – interior pages: cinematic storybook moment, characters engaged with scene not viewer, do NOT look at camera; natural composition. (2 Şubat 2026)',
    'v1.11.0: SceneInput.characterExpressions (per-character from story) – Replaces single expression field. buildCharacterExpressionsSection(): [CHARACTER_EXPRESSIONS] block with per-character visual descriptions; "Do not copy reference expression; match only face + outfit"; "No generic smile unless joy/laughter". Multi-character scenes: each character can have different expression. (3 Şubat 2026)',
    'v1.12.0: [A4] Priority ladder at start of generateFullPagePrompt – conflict resolution order: 1) Scene composition & character scale, 2) Environment richness & depth, 3) Character action & expression, 4) Reference identity match. (PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md, 8 Şubat 2026)',
    'v1.13.0: [A2] Cover prompt repetition removed – customRequests/scene once only. getEnvironmentDescription(theme, sceneDesc, useFullSceneDesc); generateLayeredComposition(..., midgroundOverride); generateScenePrompt(..., isCover); buildSceneContentSection(..., sceneInput, isCover) pushes COVER SCENE once. (PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md, 8 Şubat 2026)',
    'v1.14.0: [A7] GLOBAL_ART_DIRECTION – getGlobalArtDirection(illustrationStyle) in style-descriptions; injected after PRIORITY in generateFullPagePrompt. Single global block (3D Animation / other styles), kısa tekrar + uzun sahne şablonu. (PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md §9.1, 8 Şubat 2026)',
    'v1.15.0: [A8] SHOT PLAN – buildShotPlanBlock(sceneInput, isCover, previousScenes): shotType, lens, cameraAngle, placement, characterScale 25-30%, timeOfDay, mood. [A1] Image prompt konsolidasyonu: SHOT PLAN + COMPOSITION RULES short + AVOID short; Composition&Depth, Camera&Perspective, CharacterEnvironmentRatio blokları kaldırıldı (içerik SHOT PLAN + tek satırlara taşındı). (PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md §9.2–9.3, 8 Şubat 2026)',
    'v1.16.0: [A11] Parmak stratejisi – getDefaultHandStrategy() (negative.ts) buildAnatomicalAndSafetySection içinde: hands at sides, relaxed, partially out of frame, no hand gestures, not holding objects. (PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md, 8 Şubat 2026)',
    'v1.17.0: [A5] shotPlan schema – SceneInput.shotPlan (optional). buildShotPlanBlock uses LLM shotPlan when present (shotType, lens, cameraAngle, placement, timeOfDay, mood) with code fallbacks. (PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md, 8 Şubat 2026)',
    'v1.18.0: [Sıra 14] Kapak ortamı hikayeden – SceneInput.coverEnvironment; getEnvironmentDescription(..., coverEnvironment) kapakta tema şablonu yerine hikaye ortamı; extractSceneElements öncelikli locationKeywords (glacier, ice, space, ocean vb.). COVER_PATH_FLOWERS_ANALYSIS.md (8 Şubat 2026)',
    'v1.19.0: [Sıra 16] Çelişkili stil ifadeleri – Tek stil profili (filmic, controlled saturation). getEnhancedAtmosphericDepth: vibrant saturated/high contrast → rich textures, clear detail, moderate saturation; getLightingDescription/getCinematicElements: dramatic → clear/defined; getStyleSpecificDirectives 3d: vibrant → rich appealing. PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md (8 Şubat 2026)',
    'v1.20.0: [Sıra 19] Allow relighting – Interior sayfa prompt\'una "Use reference for face, hair, and outfit only; do NOT copy lighting or background from reference. Allow relighting to match this scene." eklendi. PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md (8 Şubat 2026)',
  ],
  author: '@prompt-manager',
}

// ============================================================================
// Scene Generation
// ============================================================================

export interface SceneInput {
  pageNumber: number
  sceneDescription: string // From story generation
  theme: string
  mood: string
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy'
  characterAction: string // What character is doing
  focusPoint: 'character' | 'environment' | 'balanced'
  /** Story-driven clothing (e.g. astronaut suit, swimwear). Plan: Kapak/Close-up/Kıyafet. */
  clothing?: string
  /** v1.9.0: Per-character facial expressions from story. Key = character ID, value = visual description (eyes, brows, mouth). */
  characterExpressions?: Record<string, string>
  /** A5: Optional shot plan from LLM; when set, SHOT PLAN block uses these (with code fallbacks for missing fields). */
  shotPlan?: ShotPlan
  /** Sıra 14: Kapak için hikayeden türetilmiş sahne metni. Öncelik (story): coverImagePrompt → coverDescription → coverSetting → derive. */
  coverEnvironment?: string
  /**
   * Story-specific environment/background for interior pages. When present, replaces
   * hardcoded atmospheric templates. Comes from page.environmentDescription in story output.
   */
  environmentDescription?: string
  /** Camera distance hint from story LLM: "close" | "medium" | "wide" | "establishing" */
  cameraDistance?: 'close' | 'medium' | 'wide' | 'establishing'
}

// NEW: Scene Diversity Analysis (16 Ocak 2026)
export interface SceneDiversityAnalysis {
  location: string
  timeOfDay: 'morning' | 'late-morning' | 'noon' | 'afternoon' | 'late-afternoon' | 'evening' | 'sunset' | 'dusk' | 'night' | 'unknown'
  weather: 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'unknown'
  perspective: 'wide' | 'medium' | 'close-up' | 'bird-eye' | 'low-angle' | 'high-angle' | 'eye-level' | 'unknown'
  composition: 'centered' | 'left' | 'right' | 'balanced' | 'diagonal' | 'symmetrical' | 'group' | 'unknown'
  mood: string
  action: string
}

/**
 * HYBRID PROMPT GENERATION (NEW: 15 Ocak 2026)
 * Combines cinematic and descriptive elements for high-quality illustrations
 * Inspired by Magical Children's Book quality standards
 */
export function generateScenePrompt(
  scene: SceneInput,
  characterPrompt: string,
  illustrationStyle: string,
  isCover: boolean = false
): string {
  const parts: string[] = []

  // 1. STYLE - v1.7.0: Using buildStyleDirectives (first directive only for scene prompt)
  const styleDirectives = buildStyleDirectives(illustrationStyle)
  parts.push(styleDirectives[0]) // First style directive: `${styleDesc} illustration, cinematic quality`
  
  // 2. CINEMATIC ELEMENTS - Add cinematic composition
  const cinematicElements = getCinematicElements(scene.pageNumber, scene.mood, scene.timeOfDay)
  parts.push(cinematicElements)
  
  // 3. CHARACTER - With emphasis on consistency - v1.7.0: Using buildCharacterConsistencyDirectives
  parts.push(`${characterPrompt}`)
  parts.push(buildCharacterConsistencyDirectives()[0]) // First consistency directive
  
  // 4. CHARACTER ACTION
  parts.push(`${scene.characterAction}`)

  // 5. ENVIRONMENT - Detailed (cinematic level). Cover: use short env to avoid repeating long scene (A2).
  const useFullSceneDesc = !isCover
  const environment = getEnvironmentDescription(
    scene.theme,
    scene.sceneDescription,
    useFullSceneDesc,
    isCover ? scene.coverEnvironment : undefined,
    !isCover ? scene.environmentDescription : undefined
  )
  parts.push(`in ${environment}`)

  // 6. LIGHTING - Based on time of day
  if (scene.timeOfDay) {
    const lighting = getLightingDescription(scene.timeOfDay, scene.mood)
    parts.push(`${lighting}`)
  }

  // 7. WEATHER - If applicable
  if (scene.weather && scene.weather !== 'sunny') {
    parts.push(getWeatherDescription(scene.weather))
  }

  // 8. MOOD AND ATMOSPHERE
  parts.push(getMoodDescription(scene.mood))

  // 9. STYLE-SPECIFIC DIRECTIVES (NEW: Illustration Style İyileştirmesi)
  const styleSpecificDirectives = getStyleSpecificDirectives(illustrationStyle)
  if (styleSpecificDirectives) {
    parts.push(styleSpecificDirectives)
  }

  // 10. COMPOSITION RULES
  // Note: previousScenes not available in generateScenePrompt, will be handled in generateFullPagePrompt
  // Composition rules are now handled in generateFullPagePrompt with full context
  // Keeping basic composition here for backward compatibility
  const baseComposition = scene.focusPoint === 'character' ? 'clear face when visible, character off-center (rule of thirds)' :
                         scene.focusPoint === 'environment' ? 'wide environmental shot' :
                         'balanced composition'
  parts.push(baseComposition)

  // 11. QUALITY AND CONSISTENCY
  parts.push('professional children\'s book illustration')
  parts.push('high quality, print-ready')
  parts.push('detailed but age-appropriate')
  parts.push('warm and inviting atmosphere')
  
  // 12. CHARACTER CONSISTENCY EMPHASIS - v1.7.0: Using buildCharacterConsistencyDirectives
  parts.push(buildCharacterConsistencyDirectives()[1]) // Second consistency directive

  return parts.join(', ')
}

// ============================================================================
// Environment Descriptions (ENHANCED: 15 Ocak 2026 - 3 Levels of Detail)
// ============================================================================

/**
 * 3-level environment description system
 * Level 1: General - Simple description
 * Level 2: Detailed - Adds specific elements
 * Level 3: Cinematic - Full atmospheric description with lighting, textures, mood
 */
// Simplified environment templates (optimized - only essential info)
const ENVIRONMENT_TEMPLATES: Record<string, string[]> = {
  adventure: ['lush forest, dappled sunlight, wildflowers', 'mountain path, colorful wildflowers, distant peaks'],
  sports: ['sunny playground, colorful equipment', 'sports field, bright cones, goal posts'],
  fantasy: ['magical garden, glowing flowers, fairy lights', 'enchanted forest, magical lights, mystical fog'],
  animals: ['friendly farm, red barn, green fields', 'forest clearing, soft grass, wildflowers'],
  'daily-life': ['cozy home interior, warm light, comfortable', 'cheerful classroom, colorful decorations'],
  space: ['space station, large windows, stars and planets', 'alien planet, unusual plants, colorful sky'],
  underwater: ['coral reef, colorful fish, clear water', 'underwater cave, bioluminescent plants'],
}

/**
 * @param useFullSceneDesc When false (e.g. cover), do not embed full sceneDesc to avoid repetition; use theme template or coverEnvironment. A2 PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md
 * @param coverEnvironment Kapak için hikayeden türetilmiş sahne (coverImagePrompt veya coverDescription / coverSetting). Varsa tema şablonu atlanır.
 * @param environmentDescription Sayfa için hikayeden gelen ortam (page.environmentDescription). Varsa tema şablonu ve hardcoded atmosfer atlanır.
 */
function getEnvironmentDescription(
  theme: string,
  sceneDesc: string,
  useFullSceneDesc: boolean = true,
  coverEnvironment?: string,
  environmentDescription?: string
): string {
  // Interior page: story-specific environmentDescription takes priority
  if (useFullSceneDesc && environmentDescription && environmentDescription.trim().length > 0) {
    return environmentDescription.trim()
  }

  // Cover: use coverEnvironment (from story resolve: coverImagePrompt, etc.)
  if (coverEnvironment && coverEnvironment.trim().length > 0) {
    return coverEnvironment.trim()
  }

  // Interior page: use full sceneDescription if available
  if (useFullSceneDesc && sceneDesc && sceneDesc.length > 50) {
    return sceneDesc
  }

  // Fallback: theme template (only when nothing story-specific is available)
  const normalizedTheme = theme.toLowerCase().replace(/[-&_\s]/g, '-')
  const templates = ENVIRONMENT_TEMPLATES[normalizedTheme] || ENVIRONMENT_TEMPLATES['adventure']
  return templates[0]
}

// ============================================================================
// Lighting Descriptions
// ============================================================================

function getLightingDescription(timeOfDay: string, mood: string): string {
  const lightingParts: string[] = []
  
  // Base lighting based on time of day
  if (timeOfDay === 'morning') {
    lightingParts.push('soft morning light')
    lightingParts.push('gentle backlighting')
    lightingParts.push('warm diffused light')
  } else if (timeOfDay === 'afternoon') {
    lightingParts.push('bright daylight')
    lightingParts.push('even, diffuse overhead light')
  } else if (timeOfDay === 'evening') {
    lightingParts.push('soft natural lighting')
    lightingParts.push('cohesive warm tone where appropriate')
    lightingParts.push('gentle backlighting optional')
    lightingParts.push('atmospheric depth')
  } else if (timeOfDay === 'night') {
    lightingParts.push('moonlight')
    lightingParts.push('cool ambient light')
    lightingParts.push('clear contrast between moonlight and shadow')
  } else {
    lightingParts.push('bright daylight')
  }
  
  // Light direction
  if (timeOfDay === 'evening' || timeOfDay === 'morning') {
    lightingParts.push('light from behind (backlighting)')
  } else if (timeOfDay === 'afternoon') {
    lightingParts.push('top lighting, even distribution')
  }
  
  // Light quality
  if (mood === 'exciting') {
    lightingParts.push('defined key light with clear shadows')
  } else if (mood === 'calm') {
    lightingParts.push('soft diffused light, gentle shadows')
  }
  
  // Color temperature (soft, no forced Pixar/golden-hour tone)
  if (timeOfDay === 'evening') {
    lightingParts.push('subtle warm tone where appropriate')
  } else if (timeOfDay === 'morning') {
    lightingParts.push('soft warm tones')
  }
  
  // Atmospheric depth
  if (timeOfDay === 'evening' || timeOfDay === 'morning') {
    lightingParts.push('atmospheric depth, cohesive mood')
  }
  
  return lightingParts.join(', ')
}

// ============================================================================
// Weather Descriptions
// ============================================================================

function getWeatherDescription(weather: string): string {
  const desc: Record<string, string> = {
    cloudy: 'gentle clouds', rainy: 'light rain', snowy: 'soft snowflakes',
  }
  return desc[weather] || ''
}

// ============================================================================
// Mood and Atmosphere
// ============================================================================

function getMoodDescription(mood: string): string {
  const moods: Record<string, string> = {
    exciting: 'dynamic energetic', calm: 'peaceful serene',
    funny: 'playful cheerful', mysterious: 'intriguing wonder',
    inspiring: 'uplifting', happy: 'joyful bright',
  }
  return moods[mood] || 'joyful bright'
}

// ============================================================================
// Cinematic Elements (NEW: 15 Ocak 2026)
// ============================================================================

/**
 * Generates cinematic composition elements (ENHANCED: 25 Ocak 2026)
 * Based on 2026 best practices: specific lighting techniques, golden hour, backlighting, god rays
 */
export function getCinematicElements(
  pageNumber: number,
  mood: string,
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
): string {
  const elements: string[] = []
  
  // Lighting based on time of day and mood
  if (timeOfDay === 'evening') {
    elements.push('golden hour lighting')
    elements.push('warm amber tones, golden glow')
    elements.push('backlighting with rim light around character')
    elements.push('volumetric god rays through atmosphere')
  } else if (timeOfDay === 'morning') {
    elements.push('soft morning light')
    elements.push('gentle backlighting')
    elements.push('warm diffused light')
  } else if (timeOfDay === 'night') {
    elements.push('moonlight')
    elements.push('cool ambient light')
    elements.push('clear contrast between moonlight and shadow')
  } else {
    // Afternoon or default
    if (mood === 'exciting') {
      elements.push('dynamic lighting with defined shadows')
    } else if (mood === 'calm') {
      elements.push('soft ambient light, even diffusion')
    } else {
      elements.push('warm natural light')
    }
  }
  
  // Source → Obstacle → Medium structure for realistic light effects
  if (timeOfDay === 'morning' || timeOfDay === 'evening') {
    elements.push('sunlight through trees into morning mist (source → obstacle → medium)')
  }
  
  // Composition elements
  elements.push('layered depth')
  elements.push('rule of thirds composition')
  
  // Camera angle
  const angle = pageNumber === 1 ? 'hero shot' : 'varied perspective'
  elements.push(angle)
  
  elements.push('cinematic quality')
  
  return elements.join(', ')
}

// ============================================================================
// Composition Rules (Faz 3.4: Advanced Composition – karakter ortada değil)
// ============================================================================

/** Character position in frame – avoid "always centered". Rotates by page. */
function getCharacterPlacementForPage(
  pageNumber: number,
  previousScenes?: SceneDiversityAnalysis[]
): string {
  const placements = [
    'character on left third of frame, rule of thirds intersection',
    'character on right third of frame, rule of thirds intersection',
    'character at lower third, environment dominant above',
    'character on left, leading lines (path or trail) guide eye',
    'character on right, balanced with environment on left',
    'character off-center, dynamic negative space',
  ]
  const lastComp = previousScenes?.[previousScenes.length - 1]?.composition
  const index = lastComp && lastComp !== 'unknown'
    ? (pageNumber - 1) % (placements.length - 1)
    : (pageNumber - 1) % placements.length
  return placements[index] ?? placements[0]
}

/** Advanced composition – cinematic framing, no "character centered" default. */
function getAdvancedCompositionRules(
  pageNumber: number,
  previousScenes?: SceneDiversityAnalysis[]
): string {
  const options = [
    'rule of thirds composition, character at intersection points',
    'leading lines (path, fence, tree line) guide eye to character',
    'natural frame (tree branches, doorway) framing character',
    'diagonal composition, dynamic energy',
    'symmetrical balance with character off-center',
    'layered depth, character in foreground third',
  ]
  const lastComp = previousScenes?.[previousScenes.length - 1]?.composition
  const avoidIndex = lastComp === 'diagonal' ? 3 : lastComp === 'symmetrical' ? 4 : -1
  const available = avoidIndex >= 0 ? options.filter((_, i) => i !== avoidIndex) : options
  const index = (pageNumber - 1) % available.length
  return available[index] ?? options[0]
}

function getCompositionRules(
  focus: string,
  pageNumber: number,
  previousScenes?: SceneDiversityAnalysis[],
  isCover?: boolean
): string {
  const rules: string[] = []

  // Faz 3.4: Interior pages – character NOT centered; use placement + advanced composition
  if (!isCover) {
    rules.push(getCharacterPlacementForPage(pageNumber, previousScenes))
    rules.push(getAdvancedCompositionRules(pageNumber, previousScenes))
    rules.push('clear face when visible, character NOT centered in frame')
  } else {
    if (focus === 'environment') rules.push('wide environmental shot')
    else rules.push('balanced composition')
  }

  const cameraAngle = getCameraAngleDirectives(pageNumber, previousScenes)
  rules.push(cameraAngle)

  const compositions = ['rule of thirds', 'leading lines (path, trail)', 'symmetrical', 'diagonal composition']
  const lastComposition = previousScenes?.[previousScenes.length - 1]?.composition
  if (lastComposition && lastComposition !== 'unknown') {
    const availableCompositions = compositions.filter(c => {
      if (lastComposition === 'balanced' && c.includes('balanced')) return false
      if (lastComposition === 'symmetrical' && c.includes('symmetrical')) return false
      if (lastComposition === 'diagonal' && c.includes('diagonal')) return false
      return true
    })
    if (availableCompositions.length > 0) {
      const index = (pageNumber - 1) % availableCompositions.length
      rules.push(availableCompositions[index])
    }
  } else {
    const index = (pageNumber - 1) % compositions.length
    rules.push(compositions[index])
  }

  rules.push('character 25-35% of frame, environment 65-75%')

  if (pageNumber === 1) rules.push('inviting opening')
  else if (pageNumber >= 10) rules.push('conclusion')

  return rules.join(', ')
}

// ============================================================================
// Age-Appropriate Scene Rules (v1.5.0: age-agnostic for images)
// ============================================================================

/**
 * Returns scene rules for image prompts.
 * v1.5.0: Age-agnostic – all ages use same "rich environment" rules (elementary-like).
 * Removes "simple background" / "clear focal point" that made character dominant.
 */
export function getAgeAppropriateSceneRules(_ageGroup: string): string[] {
  return [
    'rich background',
    'detailed environment',
    'visually interesting',
    'bright colors',
    'no scary elements',
  ]
}

// ============================================================================
// Theme-Appropriate Clothing (NEW: 15 Ocak 2026)
// ============================================================================

/**
 * Returns theme-appropriate clothing description
 * Ensures clothing matches story theme (camping → casual outdoor, NOT formal)
 */
function getThemeAppropriateClothing(theme: string): string {
  const normalized = theme.toLowerCase().replace(/[-&_\s]/g, '-')
  const styles: Record<string, string> = {
    adventure: 'outdoor casual', sports: 'sportswear', fantasy: 'casual',
    animals: 'casual outdoor', 'daily-life': 'everyday casual', space: 'casual futuristic',
    underwater: 'swimwear or beach wear',
  }
  return styles[normalized] || 'casual'
}

// ============================================================================
// CHARACTER CLOTHING CONSISTENCY (NEW: 15 Ocak 2026)
// ============================================================================

/**
 * Ensures character wears same clothing unless story explicitly mentions change
 * Critical for visual consistency across pages
 */
export function getClothingConsistencyNote(
  pageNumber: number,
  storyText: string,
  previousClothing?: string
): string {
  // Keywords that indicate clothing change in story
  const changeKeywords = [
    'changed into',
    'put on',
    'wore',
    'dressed in',
    'wearing',
    'changed clothes',
    'pajamas',
    'costume',
    'outfit',
    'jacket',
    'coat',
    'swimsuit',
    'uniform'
  ]
  
  // Check if story mentions clothing change
  const hasClothingChange = changeKeywords.some(keyword => 
    storyText.toLowerCase().includes(keyword)
  )
  
  // If no clothing change mentioned and not first page
  if (!hasClothingChange && pageNumber > 1) {
    if (previousClothing) {
      return `wearing the same ${previousClothing} as in previous pages`
    } else {
      return 'wearing the same clothing as in previous pages, maintain clothing consistency throughout story'
    }
  }
  
  // If clothing change mentioned or first page, let AI generate appropriate clothing
  return ''
}

// ============================================================================
// Depth of Field Directives (NEW: 25 Ocak 2026)
// ============================================================================

/**
 * Generates depth of field directives for cinematic composition
 * Based on 2026 best practices: camera parameters, focus planes, bokeh effects
 */
export function getDepthOfFieldDirectives(pageNumber: number, focusPoint: string): string {
  const directives: string[] = []
  
  // Camera parameters based on focus point
  if (focusPoint === 'character') {
    // Shallow DoF for cover only (portrait style); background softened but readable
    directives.push('50mm prime lens, f/1.4 aperture')
    directives.push('shallow depth of field')
    directives.push('sharp focus on character\'s eyes and face')
    directives.push('background with subtle atmospheric haze, environment still readable')
    directives.push('foreground elements may have slight blur for depth')
    directives.push('middle ground in sharp detail')
    directives.push('background elements fade into atmospheric haze')
  } else if (focusPoint === 'environment') {
    // Deep focus for environmental shots
    directives.push('24mm wide-angle lens, f/11 aperture')
    directives.push('deep focus throughout frame')
    directives.push('foreground, midground, and background all in sharp detail')
    directives.push('background sharp and detailed, rich environment')
    directives.push('distant background elements fade into atmospheric haze')
  } else {
    // Balanced: deep/medium DoF, sharp detailed background (no blur)
    directives.push('35mm lens, f/5.6 aperture')
    directives.push('deep focus throughout frame')
    directives.push('foreground, midground, and background all in sharp detail')
    directives.push('background sharp and detailed, rich environment')
    directives.push('character in sharp focus, environment sharp and detailed')
    directives.push('distant background elements fade into atmospheric haze')
  }
  
  // Page-specific variations
  if (pageNumber === 1) {
    directives.push('hero shot with clear depth separation')
  } else {
    directives.push('varied depth of field for visual interest')
  }
  
  // Focus plane: balanced/environment – explicit no-blur
  if (focusPoint !== 'character') {
    directives.push('no background blur, environment in sharp detail')
  }
  
  return directives.join(', ')
}

// ============================================================================
// Atmospheric Perspective Directives (NEW: 25 Ocak 2026)
// ============================================================================

/**
 * Generates atmospheric perspective directives for depth
 * Based on 2026 best practices: color desaturation, contrast reduction, haze
 */
export function getAtmosphericPerspectiveDirectives(): string {
  return [
    'atmospheric perspective: distant elements fade into soft mist',
    'background colors become lighter and less saturated with distance',
    'background contrast decreases gradually',
    'foreground sharp and detailed, midground moderately detailed, background atmospheric',
    'atmospheric haze in distant background',
    'horizon line visible with soft transition to sky'
  ].join(', ')
}

// ============================================================================
// Enhanced Atmospheric Depth (Faz 2.4: Görsel Kalite İyileştirme)
// ============================================================================

/**
 * Enhanced atmospheric depth for cinematic layering
 * Foreground sharp → midground detailed → background soft/hazy
 */
export function getEnhancedAtmosphericDepth(): string {
  return [
    'foreground: sharp focus, rich textures, clear detail, moderate saturation',
    'midground: detailed and clear, moderate saturation, visible textures',
    'background: soft atmospheric haze, colors 30-40% less saturated',
    'distant elements fade into warm golden mist or soft blue haze',
    'background contrast reduced gradually, lighter tones',
    'horizon line visible with soft transition to sky',
    'clear separation between foreground, midground, and background layers',
    'aerial perspective: far objects appear lighter, softer'
  ].join(', ')
}

// ============================================================================
// Pose Variation Pool (Faz 2.3: Görsel Kalite İyileştirme)
// ============================================================================

const POSE_VARIATIONS = [
  "character facing forward, standing naturally, arms at sides or one hand slightly raised",
  "character looking directly at viewer, warm smile, natural relaxed posture",
  "character walking forward confidently, one leg mid-step, dynamic movement",
  "character sitting cross-legged on ground, comfortable and relaxed",
  "character jumping with joy, both arms raised above head, feet off ground",
  "character pointing at something off-screen with one hand, engaged expression",
  "character looking up at sky with wonder, head tilted back slightly, arms at sides",
  "character crouching down examining something on ground, curious expression",
]

/**
 * Returns pose variation for page to encourage variety across pages
 */
export function getPoseVariationForPage(pageNumber: number, totalPages: number = 12): string {
  const poseIndex = Math.floor((pageNumber - 1) / Math.max(1, totalPages / POSE_VARIATIONS.length))
  return POSE_VARIATIONS[Math.min(poseIndex, POSE_VARIATIONS.length - 1)]
}

// ============================================================================
// Character Integration Directives (Faz 2.5: Görsel Kalite İyileştirme)
// ============================================================================

/**
 * Directives so character feels part of scene, not pasted on top
 */
export function getCharacterIntegrationDirectives(): string {
  return [
    'character naturally integrated into scene',
    'character is part of the environment, not pasted on top',
    'character lighting matches scene lighting (same color temperature, same shadow direction)',
    'character receives same ambient light as environment',
    'character clearly positioned in 3D space (not floating), feet touch ground naturally',
    'character scale appropriate for distance from viewer'
  ].join(', ')
}

/**
 * Cinematic, natural storybook moment – characters engaged with scene, not posing for viewer.
 * Use for interior pages to avoid "looking at camera" and achieve immersive, natural composition.
 * Reference: campfire/sunset style – characters looking at scene, each other, or objects (fire, sky, path).
 */
export function getCinematicNaturalDirectives(): string {
  return [
    'cinematic, storybook moment – as if capturing a moment in the story, not a photo shoot',
    'characters engaged with the scene and each other, not posing for the viewer',
    'do NOT have characters look directly at the viewer or camera; they look at the scene, at each other, or at objects (e.g. fire, sky, path, horizon)',
    'natural composition, immersive atmosphere, natural lighting and depth'
  ].join(', ')
}

/**
 * Build character expressions section (v1.9.0)
 * Per-character facial expression from story; specific visual details (eyes, brows, mouth)
 */
function buildCharacterExpressionsSection(
  characterExpressions: Record<string, string>,
  characters: Array<{ id: string; name: string }>
): string[] {
  if (Object.keys(characterExpressions).length === 0) return []
  
  const parts: string[] = []
  parts.push('[CHARACTER_EXPRESSIONS]')
  
  Object.entries(characterExpressions).forEach(([charId, expr]) => {
    const char = characters.find(c => c.id === charId)
    const charName = char?.name || 'Character'
    parts.push(`${charName}: ${expr}`)
  })
  
  parts.push('CRITICAL: Do not copy the reference image\'s facial expression. Match only face identity (facial features, skin tone, hair, eyes structure) and outfit. Each character\'s expression for THIS scene is specified above; use those exact visual descriptions.')
  parts.push('No generic open-mouthed smile unless the scene text clearly indicates joy, laughter, or excitement. Expression must match the character\'s emotion in THIS scene.')
  parts.push('[/CHARACTER_EXPRESSIONS]')
  
  return parts
}

// ============================================================================
// Enhanced Golden Hour Directives (Faz 2.2: Görsel Kalite İyileştirme)
// ============================================================================

/**
 * Soft natural lighting for evening or warm mood.
 * Avoid forcing Pixar/golden-hour look – reference images (test/1.png, test/2.png) use a distinct, non-daylight tone.
 */
export function getEnhancedGoldenHourDirectives(): string {
  return [
    'soft natural lighting, subtle warm tones where appropriate',
    'gentle ambient light, no harsh contrast',
    'soft shadows with warm undertones, no harsh blacks',
    'atmospheric depth, cohesive color mood'
  ].join(', ')
}

// ============================================================================
// Camera Angle Directives (NEW: 25 Ocak 2026)
// ============================================================================

/**
 * Generates camera angle directives for visual variety
 * Based on 2026 best practices: perspective diversity, child's viewpoint
 */
export function getCameraAngleDirectives(
  pageNumber: number,
  previousScenes?: SceneDiversityAnalysis[]
): string {
  // v1.6.0: close-up removed – contradicts "character 25–35%" (plan: Kapak/Close-up/Kıyafet)
  const angles: string[] = [
    'wide shot',
    'medium shot',
    'low-angle view (child\'s perspective)',
    'high-angle view',
    'eye-level view',
    'bird\'s-eye view'
  ]
  
  // Get previous perspectives to avoid repetition
  const previousPerspectives = previousScenes?.map(s => s.perspective) || []
  const lastPerspective = previousPerspectives[previousPerspectives.length - 1]
  
  // Filter out last perspective for variety
  const availableAngles = angles.filter(angle => {
    if (!lastPerspective || lastPerspective === 'unknown') return true
    // Map perspective to angle keywords
    if (lastPerspective === 'wide' && angle.includes('wide')) return false
    if (lastPerspective === 'medium' && angle.includes('medium')) return false
    if (lastPerspective === 'close-up' && angle.includes('close-up')) return false
    if (lastPerspective === 'low-angle' && angle.includes('low-angle')) return false
    if (lastPerspective === 'high-angle' && angle.includes('high-angle')) return false
    if (lastPerspective === 'eye-level' && angle.includes('eye-level')) return false
    if (lastPerspective === 'bird-eye' && angle.includes('bird')) return false
    return true
  })
  
  // Rotate through available angles
  const index = (pageNumber - 1) % availableAngles.length
  const selectedAngle = availableAngles[index] || angles[0]
  
  // Add child's perspective emphasis for children's books
  if (selectedAngle.includes('low-angle')) {
    return `${selectedAngle}, child's eye level, immersive perspective`
  }
  
  return selectedAngle
}

// ============================================================================
// Character-Environment Ratio Directives (NEW: 25 Ocak 2026)
// ============================================================================

/**
 * Generates character-environment ratio directives for balanced composition
 * Based on 2026 best practices: 25-35% character, 65-75% environment (v1.4.0)
 */
export function getCharacterEnvironmentRatio(): string {
  return [
    'character occupies 25-35% of frame, environment 65-75%',
    'character must NOT exceed 35% of frame',
    'wider shot, character smaller in frame',
    'character must not occupy more than half the frame',
    'wide environmental context, character integrated into scene',
    'expansive background with sky, trees, landscape visible',
    'character not dominating frame, balanced with surroundings',
    'environment sharp and detailed, not blurred',
    'environment provides depth and atmosphere, character is part of the scene'
  ].join(', ')
}

// ============================================================================
// FOREGROUND/MIDGROUND/BACKGROUND LAYER SYSTEM (NEW: 15 Ocak 2026)
// ============================================================================

/**
 * Generates layered composition instructions (ENHANCED: 25 Ocak 2026)
 * Ensures proper depth and visual hierarchy with depth of field and atmospheric perspective
 */
/**
 * @param midgroundOverride When provided (e.g. for cover), use this instead of full sceneDescription to avoid repetition. A2 PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md
 */
export function generateLayeredComposition(
  sceneInput: SceneInput,
  characterAction: string,
  environment: string,
  midgroundOverride?: string
): string {
  const layers: string[] = []
  
  // FOREGROUND - Character and immediate elements with depth of field
  layers.push(`FOREGROUND: ${characterAction}, main character in sharp focus with detailed features visible`)
  layers.push('foreground elements may have slight blur (foreground bokeh) for depth')
  
  // MIDGROUND - Story elements and context. Cover: use short override so full description appears only once (A2).
  if (midgroundOverride) {
    layers.push(`MIDGROUND: ${midgroundOverride}, in sharp detail`)
  } else if (sceneInput.sceneDescription && sceneInput.sceneDescription.length > 20) {
    layers.push(`MIDGROUND: ${sceneInput.sceneDescription}, in sharp detail`)
  } else {
    layers.push(`MIDGROUND: story elements and contextual objects related to the scene, in sharp detail`)
  }
  
  // BACKGROUND - Environment and atmosphere; sharp detail, rich environment
  layers.push(`BACKGROUND: ${environment}, providing depth and atmosphere`)
  layers.push('midground and near background in sharp detail, rich environment')
  layers.push('distant background elements fade into soft mist with atmospheric perspective')
  layers.push('background colors become lighter and less saturated with distance')
  
  return layers.join('. ')
}

// ============================================================================
// Style-Specific Directives (NEW: Illustration Style İyileştirmesi)
// ============================================================================

/**
 * Get style-specific technical directives for each illustration style
 * These are detailed technical instructions that help GPT-image-1.5 understand
 * and apply the specific visual characteristics of each style
 */
export function getStyleSpecificDirectives(illustrationStyle: string): string {
  const normalizedStyle = illustrationStyle.toLowerCase().replace(/[-\s]/g, '_')
  
  const directives: Record<string, string> = {
    '3d_animation': 'Pixar-style 3D, rounded shapes, rich appealing colors, soft shadows',
    'geometric': 'Flat geometric shapes, no gradients, vector art, clean lines',
    'watercolor': 'Transparent watercolor, soft brushstrokes, paper texture visible',
    'block_world': 'Pixelated blocky aesthetic, Minecraft-like, limited palette',
    'collage': 'Cut-out pieces, rough edges, layered textures, mixed media',
    'clay_animation': 'Clay-like texture, fingerprints visible, matte finish, stop-motion',
    'kawaii': 'Oversized head, large sparkling eyes, pastel colors, cute aesthetic',
    'comic_book': 'Bold black outlines, flat colors, dramatic shadows, high contrast',
    'sticker_art': 'Clean lines, saturated colors, glossy look, white border effect',
  }
  
  return directives[normalizedStyle] || ''
}

// ============================================================================
// Builder Functions for Prompt Sections (v1.7.0: Refactor - Modülerleştirme)
// ============================================================================

/**
 * Build cover directives for book cover generation
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 */
function buildCoverDirectives(additionalCharactersCount: number): string[] {
  const charCount = additionalCharactersCount + 1
  return [
    `COVER: Use reference images ONLY for character identity (face, hair, eyes, skin, body, outfit). Do NOT copy pose or expression from reference. Pose, expression, and composition must come from THIS cover scene description. All ${charCount} characters prominent. Professional, print-ready. Adults have adult proportions.`,
    'Cover = poster for the entire book; suggest key locations, theme, and journey in one image.',
    'Epic wide or panoramic composition; character(s) as guides into the world, environment shows the world of the story.',
    'Eye-catching, poster-like, movie-poster quality. Reserve clear space for title at top.',
    'Atmospheric lighting that fits the theme (cohesive mood, no forced style).',
    'Cover: epic wide; character max 30-35% of frame; environment-dominant.',
    'Cover composition and camera must be distinctly different from the first interior page.'
  ]
}

/**
 * Build first interior page directives
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 */
function buildFirstInteriorPageDirectives(additionalCharactersCount: number): string[] {
  const charNote = additionalCharactersCount > 0 ? `All ${additionalCharactersCount + 1} characters prominent` : 'Character integrated into scene'
  return [
    'FIRST INTERIOR PAGE: Must be distinctly different from the book cover. Use a different camera angle (e.g. cover = medium/portrait, page 1 = wide or low-angle), different composition (e.g. rule of thirds, character off-center), and/or expanded scene detail. Do not repeat the same framing as the cover.',
    'Character smaller in frame, NOT centered; use rule of thirds or leading lines (e.g. path).',
    `Book interior illustration (flat, standalone, NOT 3D mockup). ${charNote}. No text/writing.`
  ]
}

/**
 * Build clothing directives based on context
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 */
function buildClothingDirectives(
  clothing: string | undefined,
  theme: string,
  isCover: boolean,
  useCoverReference: boolean
): string {
  if (clothing === 'match_reference') {
    return 'Clothing: Match reference image exactly (same outfit as in reference). Same outfit every page; do not change clothing. No formal wear.'
  }
  const themeClothing = getThemeAppropriateClothing(theme)
  const clothingDesc = clothing?.trim() || themeClothing

  if (isCover) {
    return `Clothing: ${clothingDesc} (reference for all pages). No formal wear. Match story/scene.`
  } else if (useCoverReference) {
    return 'Clothing: Match cover exactly. No formal wear.'
  } else {
    return `Clothing: ${clothingDesc}. No formal wear. Match story/scene.`
  }
}

/**
 * Build multiple characters directives
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 */
function buildMultipleCharactersDirectives(additionalCharactersCount: number): string[] {
  const totalCharacters = additionalCharactersCount + 1
  return [
    `${totalCharacters} characters in the scene: main character and ${additionalCharactersCount} companion(s)`,
    `all ${totalCharacters} characters should be visible and clearly identifiable`,
    'group composition, balanced arrangement of characters'
  ]
}

/**
 * Build cover reference consistency directives
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 */
function buildCoverReferenceConsistencyDirectives(additionalCharactersCount: number): string {
  const charNote = additionalCharactersCount > 0 ? `All ${additionalCharactersCount + 1} characters` : 'Character'
  return `${charNote} match cover image exactly (hair/eyes/skin/features). Only clothing/pose vary.`
}

/**
 * Build character consistency directives
 * v1.7.0: Consolidates all character consistency directives from multiple locations
 */
function buildCharacterConsistencyDirectives(): string[] {
  return [
    'consistent character design, same character as previous pages',
    'character must match reference photo exactly, same features on every page',
    'Illustration style (NOT photorealistic). Match reference features.'
  ]
}

/**
 * Build style directives
 * v1.7.0: Consolidates all style directives from multiple locations
 */
function buildStyleDirectives(illustrationStyle: string): string[] {
  const styleDesc = getStyleDescription(illustrationStyle)
  return [
    `${styleDesc} illustration, cinematic quality`,
    `ILLUSTRATION STYLE: ${styleDesc}`,
    'Illustration style (NOT photorealistic). Match reference features.'
  ]
}

// ============================================================================
// Section Builder Functions (v1.7.0: Faz 3 - Prompt Bölümlerini Organize Et)
// ============================================================================

/**
 * Build anatomical and safety section
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 */
function buildAnatomicalAndSafetySection(ageGroup: string): string[] {
  const parts: string[] = []
  
  // Anatomical correctness
  const anatomicalDirectives = getAnatomicalCorrectnessDirectives()
  parts.push(anatomicalDirectives)
  
  // [A11] Parmak stratejisi – varsayılan: el vurgulama (hands at sides, no gestures)
  parts.push(getDefaultHandStrategy())
  
  // Safe hand poses (backup: simple wave, behind back)
  const safeHandPoses = getSafeHandPoses()
  parts.push('Preferred hand poses: ' + safeHandPoses.join(', '))
  parts.push('') // Empty line for separation
  
  return parts
}

/**
 * Build composition and depth section
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 * v1.8.0: Enhanced atmospheric depth (Faz 2.4)
 */
function buildCompositionAndDepthSection(pageNumber: number, focusPoint: string): string[] {
  const parts: string[] = []
  
  const depthOfField = getDepthOfFieldDirectives(pageNumber, focusPoint)
  parts.push('[COMPOSITION_DEPTH]')
  parts.push(depthOfField)
  parts.push(getAtmosphericPerspectiveDirectives())
  parts.push(getEnhancedAtmosphericDepth())
  parts.push('[/COMPOSITION_DEPTH]')
  parts.push('') // Empty line for separation
  
  return parts
}

/**
 * Build lighting and atmosphere section
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 * v1.8.0: Golden hour boost (Faz 2.2) – evening/warm mood gets enhanced golden hour directives
 */
function buildLightingAndAtmosphereSection(timeOfDay: string | undefined, mood: string): string[] {
  const parts: string[] = []
  
  if (timeOfDay) {
    const enhancedLighting = getLightingDescription(timeOfDay, mood)
    parts.push('[LIGHTING_ATMOSPHERE]')
    parts.push(enhancedLighting)
    if (timeOfDay === 'evening' || timeOfDay === 'sunset' || mood === 'warm' || mood === 'happy') {
      parts.push(getEnhancedGoldenHourDirectives())
    }
    parts.push('[/LIGHTING_ATMOSPHERE]')
    parts.push('') // Empty line for separation
  }
  
  return parts
}

/**
 * Build camera and perspective section
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 */
function buildCameraAndPerspectiveSection(
  pageNumber: number,
  focusPoint: string,
  previousScenes?: SceneDiversityAnalysis[]
): string[] {
  const parts: string[] = []
  
  const cameraAngle = getCameraAngleDirectives(pageNumber, previousScenes)
  parts.push('[CAMERA_PERSPECTIVE]')
  parts.push(cameraAngle)
  const compositionRules = getCompositionRules(focusPoint, pageNumber, previousScenes)
  parts.push(compositionRules)
  parts.push('[/CAMERA_PERSPECTIVE]')
  parts.push('') // Empty line for separation
  
  return parts
}

/**
 * Build character-environment ratio section
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 */
function buildCharacterEnvironmentRatioSection(): string[] {
  const parts: string[] = []
  
  const characterRatio = getCharacterEnvironmentRatio()
  parts.push('[CHARACTER_ENVIRONMENT_RATIO]')
  parts.push(characterRatio)
  parts.push('[/CHARACTER_ENVIRONMENT_RATIO]')
  parts.push('') // Empty line for separation
  
  return parts
}

/**
 * Build style section
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 */
function buildStyleSection(illustrationStyle: string): string[] {
  const parts: string[] = []
  
  const styleDirectives = buildStyleDirectives(illustrationStyle)
  parts.push(styleDirectives[1]) // Second style directive: `ILLUSTRATION STYLE: ${styleDesc}`
  
  return parts
}

/**
 * Build scene establishment section (Faz 2.1: Scene-First)
 * @param hasStoryEnvironment - When true (story-provided environmentDescription present),
 *   the outdoor atmospheric depth block (sky, horizon, aerial perspective) is skipped.
 *   This prevents the model from adding outdoor vegetation/nature to indoor scenes.
 */
function buildSceneEstablishmentSection(environment: string, hasStoryEnvironment: boolean = false): string[] {
  const parts: string[] = []
  parts.push('[SCENE_ESTABLISHMENT]')
  parts.push(environment)
  parts.push('rich details, layered depth')
  if (!hasStoryEnvironment) {
    // Only add outdoor atmospheric depth when story hasn't defined the environment.
    // When environmentDescription is set by story (e.g. "indoor arena"), this block
    // would inject sky/horizon/aerial perspective and break the scene.
    parts.push(getEnhancedAtmosphericDepth())
  }
  parts.push('[/SCENE_ESTABLISHMENT]')
  parts.push('')
  return parts
}

/**
 * Build character integration section (Faz 2.5)
 */
function buildCharacterIntegrationSection(): string[] {
  return [getCharacterIntegrationDirectives()]
}

/** Faz 3.4: Gaze direction variety – character not always looking at viewer. */
function getGazeDirectionForPage(pageNumber: number, totalPages: number): string {
  const gazes = [
    'character looking toward viewer, warm expression',
    'character looking into scene (path, horizon, or object), engaged with environment',
    'character looking up (sky, trees), sense of wonder',
    'character looking to the side, following action in scene',
    'character looking down at something in scene (e.g. animal, object), curious',
    'character looking toward companion or element in frame, not at camera',
  ]
  const index = (pageNumber - 1) % gazes.length
  return gazes[index] ?? gazes[0]
}

/**
 * Build pose variation for page (Faz 2.3); Faz 3.4: adds gaze direction variety
 */
function buildPoseVariationSection(pageNumber: number, totalPages: number): string[] {
  const pose = getPoseVariationForPage(pageNumber, totalPages)
  const gaze = getGazeDirectionForPage(pageNumber, totalPages)
  return [
    pose,
    gaze,
    'natural pose variation, NOT the same pose as other pages',
    'head angle and gaze direction vary by page (not always same direction)',
  ]
}

/**
 * Build scene content section
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 * v1.8.0: Pose variation (Faz 2.3) appended
 * A2: For cover, full scene description appears only here (once); layeredComp/scenePrompt use short text.
 */
function buildSceneContentSection(
  scenePrompt: string,
  layeredComp: string,
  ageRules: string[],
  pageNumber: number,
  totalPages: number,
  sceneInput?: SceneInput,
  isCover?: boolean
): string[] {
  const parts: string[] = []
  
  if (isCover && sceneInput?.sceneDescription) {
    parts.push(`COVER SCENE: ${sceneInput.sceneDescription}`)
  }
  parts.push(layeredComp)
  parts.push(scenePrompt)
  parts.push(...buildPoseVariationSection(pageNumber, totalPages))
  parts.push(ageRules.join(', '))
  
  return parts
}

/**
 * Build special page directives section
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 */
function buildSpecialPageDirectives(
  pageNumber: number,
  isCover: boolean,
  useCoverReference: boolean,
  additionalCharactersCount: number,
  sceneInput: SceneInput
): string[] {
  const parts: string[] = []
  
  // Multiple characters note
  if (additionalCharactersCount > 0) {
    parts.push(...buildMultipleCharactersDirectives(additionalCharactersCount))
  }
  
  // Cover generation
  if (isCover) {
    parts.push(...buildCoverDirectives(additionalCharactersCount))
  }
  
  // Cover reference consistency
  if (useCoverReference) {
    parts.push(buildCoverReferenceConsistencyDirectives(additionalCharactersCount))
  }
  
  // First interior page
  if (sceneInput.pageNumber === 1 && !isCover) {
    parts.push(...buildFirstInteriorPageDirectives(additionalCharactersCount))
  }
  
  return parts
}

/**
 * Build character consistency section
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 */
function buildCharacterConsistencySection(illustrationStyle: string): string[] {
  const parts: string[] = []
  
  const styleDirectives = buildStyleDirectives(illustrationStyle)
  parts.push(styleDirectives[2]) // Third style directive
  const charConsistency = buildCharacterConsistencyDirectives()
  parts.push(charConsistency[2]) // Third consistency directive
  
  return parts
}

/**
 * Build scene diversity section
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 */
function buildSceneDiversitySection(isCover: boolean, previousScenes?: SceneDiversityAnalysis[]): string[] {
  const parts: string[] = []
  
  if (!isCover && previousScenes && previousScenes.length > 0) {
    const lastScene = previousScenes[previousScenes.length - 1]
    const diversityDirectives = getSceneDiversityDirectives(lastScene)
    if (diversityDirectives) {
      parts.push('')
      parts.push(diversityDirectives)
    }
  }
  
  return parts
}

/**
 * Build clothing section
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 */
function buildClothingSection(
  clothing: string | undefined,
  theme: string,
  isCover: boolean,
  useCoverReference: boolean
): string[] {
  const parts: string[] = []
  
  parts.push(buildClothingDirectives(clothing, theme, isCover, useCoverReference))
  
  return parts
}

/**
 * Build final directives section
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 */
function buildFinalDirectives(): string[] {
  return ['No text/writing in image.']
}

// ============================================================================
// [A8] SHOT PLAN – sayfa başına kısa sinematik blok (PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md §9.2)
// ============================================================================

/** Short placement label for SHOT PLAN (left third / right third / lower third / off-center). */
function getShotPlanPlacementLabel(pageNumber: number, previousScenes?: SceneDiversityAnalysis[]): string {
  const placements = ['left third', 'right third', 'lower third', 'left with leading lines', 'right balanced', 'off-center']
  const lastComp = previousScenes?.[previousScenes.length - 1]?.composition
  const index = lastComp && lastComp !== 'unknown'
    ? (pageNumber - 1) % Math.max(1, placements.length - 1)
    : (pageNumber - 1) % placements.length
  return placements[index] ?? placements[0]
}

/**
 * Build SHOT PLAN block: shotType, lens, cameraAngle, characterScale, placement, timeOfDay, mood.
 * A8: Sinematik dilin deterministik ve kısa kalması; mevcut sceneInput'tan koddan türetilir.
 * A5: When sceneInput.shotPlan is present, use its fields with code fallbacks for missing/empty values.
 */
function buildShotPlanBlock(
  sceneInput: SceneInput,
  isCover: boolean,
  previousScenes?: SceneDiversityAnalysis[]
): string {
  const sp = sceneInput.shotPlan
  const shotType =
    (sp?.shotType?.trim()) ||
    (isCover ? 'wide establishing' : sceneInput.focusPoint === 'environment' ? 'wide establishing' : 'wide shot')
  const lens =
    (sp?.lens?.trim()) ||
    (sceneInput.focusPoint === 'environment' ? '24-28mm' : '35mm')
  const cameraAngle =
    (sp?.cameraAngle?.trim()) ||
    getCameraAngleDirectives(sceneInput.pageNumber, previousScenes)
  const placement =
    (sp?.placement?.trim()) ||
    getShotPlanPlacementLabel(sceneInput.pageNumber, previousScenes)
  const timeOfDay =
    (sp?.timeOfDay?.trim()) ||
    sceneInput.timeOfDay ||
    'day'
  const mood = (sp?.mood?.trim()) || sceneInput.mood || 'wonder'
  return `SHOT PLAN: ${shotType}. ${lens} lens look. Camera: ${cameraAngle}. Characters are SMALL (25-30% of frame height). Placement: ${placement}. Not centered. Time: ${timeOfDay}. Mood: ${mood}.`
}

// ============================================================================
// [A1] COMPOSITION RULES – tek kısa satır (şablon 9.3; tekrarları kaldırır)
// ============================================================================

function buildCompositionRulesShort(): string {
  return 'COMPOSITION RULES: Environment dominates (65-75%). Strong leading lines, rule of thirds, no zoom-in.'
}

// ============================================================================
// [A1] AVOID – tek satır (buildFinalDirectives + ana negatifler)
// ============================================================================

function buildAvoidShort(): string {
  return 'AVOID: character filling the frame, close-up portrait framing, extra limbs, messy anatomy, blurry background, neon saturation, text or watermark.'
}

/** Kısa, sabit kitap kapağı kompozisyonu — çiçek/çerçeve sızıntısı tetiklemeden poster hissi. Story metni ayrı gelir (coverEnvironment). */
function getCoverBookLayoutDirectives(): string {
  return [
    'BOOK COVER (not an interior page spread): poster-like children\'s book cover illustration.',
    'Reserve the upper third of the frame for future title text: quiet or simple area (ceiling, soft gradient, blurred background, or open wall) matching THIS scene — no decorative floral borders, no leaf frames.',
    'One strong focal story moment; character clearly readable at thumbnail size.',
    'No physical book mockup, no spine, no printed typography or letters in the image.',
  ].join(' ')
}

// ============================================================================
// Full Page Image Prompt (ENHANCED: 15 Ocak 2026)
// ============================================================================

export function generateFullPagePrompt(
  characterPrompt: string,
  sceneInput: SceneInput,
  illustrationStyle: string,
  ageGroup: string,
  additionalCharactersCount: number = 0, // NEW: Number of additional characters
  isCover: boolean = false, // NEW: Cover generation için (CRITICAL quality)
  useCoverReference: boolean = false, // NEW: Pages 2-10 için cover reference
  previousScenes?: SceneDiversityAnalysis[], // NEW: For diversity tracking (16 Ocak 2026)
  totalPages: number = 12, // v1.8.0: For pose variation distribution (Faz 2.3)
  characterListForExpressions?: Array<{ id: string; name: string }> // v1.11.0: For [CHARACTER_EXPRESSIONS] labels (char ID → name)
): string {
  // Interior: full hybrid scene prompt. Cover: built only inside the cover branch (no wonder/adventure chain).
  const scenePrompt = isCover
    ? ''
    : generateScenePrompt(sceneInput, characterPrompt, illustrationStyle, false)

  // Get environment for layered composition.
  // Priority: environmentDescription (interior) > coverEnvironment (cover) > sceneDescription > theme template
  const environment = getEnvironmentDescription(
    sceneInput.theme,
    sceneInput.sceneDescription,
    !isCover,
    isCover ? sceneInput.coverEnvironment : undefined,
    !isCover ? sceneInput.environmentDescription : undefined
  )

  // Build layered composition (FOREGROUND/MIDGROUND/BACKGROUND)
  const midgroundOverride = isCover ? 'Book cover: key story moments and theme in one image' : undefined
  const layeredComp = generateLayeredComposition(sceneInput, sceneInput.characterAction, environment, midgroundOverride)

  // Add age-appropriate rules
  const ageRules = getAgeAppropriateSceneRules(ageGroup)

  const promptParts: string[] = []

  // ─── COVER PATH ────────────────────────────────────────────────────────────
  // Story-driven scene (coverEnvironment = resolveCoverEnvironment: coverImagePrompt first).
  // Fixed layout line + identity; no GLOBAL_ART_DIRECTION / PRIORITY / old cinematic bloat.
  if (isCover) {
    // 1. Style identifier (short)
    promptParts.push(`Illustration style: ${illustrationStyle}. Children's picture book, digital art.`)

    // 2. Character identity reference (short, no pose copying)
    const useMatchRefCover = sceneInput.clothing === 'match_reference'
    if (useMatchRefCover) {
      promptParts.push('CRITICAL: Use reference image ONLY for character identity (same face, body proportions, and outfit). Do NOT copy pose or expression from the reference. Pose comes from THIS scene description.')
    } else if (sceneInput.clothing?.trim()) {
      promptParts.push(`CRITICAL: Character MUST wear EXACTLY: ${sceneInput.clothing.trim()}.`)
    }

    // 3. Anatomy — skip "hands at sides / not holding objects" for cover since
    //    the scene may explicitly have the character holding something (trophy, ball, etc.)
    promptParts.push(getAnatomicalCorrectnessDirectives())
    promptParts.push('') // separator

    // 3b. Identity (same facts as master image prompt) — reference alone drifts on iris/hair without text
    const identityTrim = characterPrompt?.trim()
    if (identityTrim) {
      promptParts.push(`Character identity (match reference image): ${identityTrim}.`)
    }

    // 3c. Book-cover composition (code-owned; keeps poster/title-safe feel without re-adding PRIORITY blocks)
    promptParts.push(getCoverBookLayoutDirectives())

    // 4. SCENE — story cover brief + style only (avoid generateScenePrompt chain)
    const styleLead = buildStyleDirectives(illustrationStyle)[0] || ''
    const styleExtra = getStyleSpecificDirectives(illustrationStyle) || ''
    const envPrimary = sceneInput.coverEnvironment?.trim() || sceneInput.sceneDescription?.trim() || ''
    const coverSceneText = [styleLead, styleExtra, envPrimary].filter(Boolean).join(', ')
    promptParts.push(`SCENE: ${coverSceneText}`)

    // 5. Character expressions from story
    if (sceneInput.characterExpressions && Object.keys(sceneInput.characterExpressions).length > 0) {
      const charList = characterListForExpressions && characterListForExpressions.length > 0
        ? characterListForExpressions.filter(c => sceneInput.characterExpressions![c.id])
        : Object.keys(sceneInput.characterExpressions).map((id, i) => ({ id, name: `Character ${i + 1}` }))
      promptParts.push(...buildCharacterExpressionsSection(sceneInput.characterExpressions, charList))
    }

    // 6. Clothing lock
    promptParts.push(...buildClothingSection(sceneInput.clothing, sceneInput.theme, isCover, useCoverReference))

    // 7. AVOID (short)
    promptParts.push(buildAvoidShort())

    return promptParts.join(', ')
  }

  // ─── INTERIOR PAGE PATH ─────────────────────────────────────────────────────

  // 0. [A4] Priority ladder
  promptParts.push('PRIORITY: If any conflict, follow this order: 1) Scene composition & character scale, 2) Environment richness & depth, 3) Character action & expression, 4) Reference identity match.')

  // 0.4. [A7] GLOBAL_ART_DIRECTION
  promptParts.push(getGlobalArtDirection(illustrationStyle))

  // 0.45. [A8] SHOT PLAN
  promptParts.push(buildShotPlanBlock(sceneInput, isCover, previousScenes))

  // 0.5. Scene Establishment — skip outdoor atmospheric depth when story defined the environment
  const hasStoryEnvironment = !!(sceneInput.environmentDescription?.trim())
  promptParts.push(...buildSceneEstablishmentSection(environment, hasStoryEnvironment))

  // 0.5. Reference = identity only
  const useMatchReference = sceneInput.clothing === 'match_reference'
  if (useMatchReference) {
    promptParts.push('CRITICAL: Use reference image ONLY for character identity (same face, body proportions, and outfit). Do NOT copy pose, expression, or gaze from the reference. Pose, expression, and composition must come from THIS scene description. Same outfit every page; do not change clothing. Identity match does NOT imply close-up. Keep the wide framing.')
  } else if (sceneInput.clothing?.trim()) {
    promptParts.push(`CRITICAL: Character MUST wear EXACTLY: ${sceneInput.clothing.trim()}. This outfit is LOCKED for the entire book.`)
  }

  // 0.55. Allow relighting
  promptParts.push('Use reference for face, hair, and outfit only; do NOT copy lighting or background from reference. Allow relighting to match this scene.')

  // 1. Anatomical & Safety Section
  promptParts.push(...buildAnatomicalAndSafetySection(ageGroup))

  // 5. Lighting & Atmosphere
  promptParts.push(...buildLightingAndAtmosphereSection(sceneInput.timeOfDay, sceneInput.mood))

  // 5.5. COMPOSITION RULES
  promptParts.push(buildCompositionRulesShort())

  // 6. Style Section
  promptParts.push(...buildStyleSection(illustrationStyle))

  // 6.5. CINEMATIC_PACK
  promptParts.push(getCinematicPack())

  // 7. Character Integration
  promptParts.push(...buildCharacterIntegrationSection())
  promptParts.push(getCinematicNaturalDirectives())

  // 8. Scene Content
  promptParts.push(...buildSceneContentSection(
    scenePrompt,
    layeredComp,
    ageRules,
    sceneInput.pageNumber,
    totalPages,
    sceneInput,
    isCover
  ))

  // 8.5. Per-character expressions
  if (sceneInput.characterExpressions && Object.keys(sceneInput.characterExpressions).length > 0) {
    const charList = characterListForExpressions && characterListForExpressions.length > 0
      ? characterListForExpressions.filter(c => sceneInput.characterExpressions![c.id])
      : Object.keys(sceneInput.characterExpressions).map((id, i) => ({ id, name: `Character ${i + 1}` }))
    promptParts.push(...buildCharacterExpressionsSection(sceneInput.characterExpressions, charList))
  }

  // 9. Special Page Directives
  promptParts.push(...buildSpecialPageDirectives(
    sceneInput.pageNumber,
    isCover,
    useCoverReference,
    additionalCharactersCount,
    sceneInput
  ))

  // 10. Character Consistency
  promptParts.push(...buildCharacterConsistencySection(illustrationStyle))

  // 11. Scene Diversity
  promptParts.push(...buildSceneDiversitySection(isCover, previousScenes))

  // 12. Clothing
  promptParts.push(...buildClothingSection(sceneInput.clothing, sceneInput.theme, isCover, useCoverReference))

  // 13. AVOID
  promptParts.push(buildAvoidShort())

  // Combine everything
  const fullPrompt = promptParts.join(', ')

  return fullPrompt
}

// ============================================================================
// Scene Diversity Analysis Functions (NEW: 16 Ocak 2026)
// ============================================================================

/**
 * Extract time of day, location, and weather from scene description
 */
export function extractSceneElements(
  sceneDescription: string,
  storyText?: string
): { timeOfDay?: string; location?: string; weather?: string } {
  const combined = `${sceneDescription} ${storyText || ''}`.toLowerCase()
  
  // Extract time of day
  let timeOfDay: string | undefined
  if (combined.includes('morning') || combined.includes('sabah')) {
    timeOfDay = combined.includes('late morning') || combined.includes('geç sabah') ? 'late-morning' : 'morning'
  } else if (combined.includes('noon') || combined.includes('öğle')) {
    timeOfDay = 'noon'
  } else if (combined.includes('afternoon') || combined.includes('öğleden sonra')) {
    timeOfDay = combined.includes('late afternoon') || combined.includes('geç öğleden sonra') ? 'late-afternoon' : 'afternoon'
  } else if (combined.includes('evening') || combined.includes('akşam')) {
    timeOfDay = 'evening'
  } else if (combined.includes('sunset') || combined.includes('gün batımı')) {
    timeOfDay = 'sunset'
  } else if (combined.includes('dusk') || combined.includes('alacakaranlık')) {
    timeOfDay = 'dusk'
  } else if (combined.includes('night') || combined.includes('gece')) {
    timeOfDay = 'night'
  }
  
  // Extract location keywords (Sıra 14: önce güçlü ortam kelimeleri, sonra genel – COVER_PATH_FLOWERS_ANALYSIS.md)
  let location: string | undefined
  const priorityLocationKeywords = [
    'glacier', 'buzul', 'ice', 'buz', 'frozen', 'snow', 'kar', 'snowy', 'karlı',
    'space', 'uzay', 'stars', 'yıldız', 'planet', 'gezegen',
    'ocean', 'deniz', 'sea', 'underwater', 'sualtı', 'coral', 'reef',
    'cave', 'mağara', 'ice cave', 'buz mağara'
  ]
  const generalLocationKeywords = [
    'forest', 'orman', 'clearing', 'açıklık', 'path', 'yol', 'trail', 'patika',
    'home', 'ev', 'house', 'park', 'mountain', 'dağ', 'beach', 'sahil', 'plaj',
    'river', 'nehir', 'lake', 'göl', 'garden', 'bahçe', 'school', 'okul',
    'playground', 'oyun alanı', 'summit', 'zirve'
  ]
  for (const keyword of priorityLocationKeywords) {
    if (combined.includes(keyword)) {
      location = keyword
      break
    }
  }
  if (!location) {
    for (const keyword of generalLocationKeywords) {
      if (combined.includes(keyword)) {
        location = keyword
        break
      }
    }
  }
  
  // Extract weather
  let weather: string | undefined
  if (combined.includes('sunny') || combined.includes('güneşli')) {
    weather = 'sunny'
  } else if (combined.includes('partly cloudy') || combined.includes('parçalı bulutlu')) {
    weather = 'partly-cloudy'
  } else if (combined.includes('cloudy') || combined.includes('bulutlu')) {
    weather = 'cloudy'
  } else if (combined.includes('rainy') || combined.includes('yağmurlu') || combined.includes('rain') || combined.includes('yağmur')) {
    weather = 'rainy'
  } else if (combined.includes('snowy') || combined.includes('karlı') || combined.includes('snow') || combined.includes('kar')) {
    weather = 'snowy'
  } else if (combined.includes('windy') || combined.includes('rüzgarlı')) {
    weather = 'windy'
  }
  
  return { timeOfDay, location, weather }
}

/**
 * Analyze scene for diversity tracking
 */
export function analyzeSceneDiversity(
  sceneDescription: string,
  storyText: string,
  pageNumber: number,
  previousScenes: SceneDiversityAnalysis[]
): SceneDiversityAnalysis {
  const extracted = extractSceneElements(sceneDescription, storyText)
  
  // Determine perspective based on page number and previous scenes
  const perspective = getPerspectiveForPage(
    pageNumber,
    previousScenes.map(s => s.perspective)
  )
  
  // Determine composition based on page number and previous scenes
  const composition = getCompositionForPage(
    pageNumber,
    previousScenes.map(s => s.composition)
  )
  
  return {
    location: extracted.location || 'unknown',
    timeOfDay: (extracted.timeOfDay as any) || 'unknown',
    weather: (extracted.weather as any) || 'unknown',
    perspective,
    composition,
    mood: sceneDescription.toLowerCase().includes('happy') ? 'happy' : 
          sceneDescription.toLowerCase().includes('excited') ? 'excited' : 
          sceneDescription.toLowerCase().includes('curious') ? 'curious' : 
          'neutral',
    action: storyText.substring(0, 100), // First 100 chars as action summary
  }
}

/**
 * Get appropriate perspective for page, ensuring variety
 */
export function getPerspectiveForPage(
  pageNumber: number,
  previousPerspectives: string[]
): SceneDiversityAnalysis['perspective'] {
  // v1.6.0: close-up removed – contradicts "character 25–35%" (plan: Kapak/Close-up/Kıyafet)
  const perspectives: SceneDiversityAnalysis['perspective'][] = [
    'wide', 'medium', 'bird-eye', 'low-angle', 'high-angle', 'eye-level'
  ]
  
  // Get last perspective
  const lastPerspective = previousPerspectives[previousPerspectives.length - 1]
  
  // Filter out last perspective to ensure variety
  const availablePerspectives = perspectives.filter(p => p !== lastPerspective)
  
  // Rotate through perspectives based on page number
  const index = (pageNumber - 1) % availablePerspectives.length
  return availablePerspectives[index]
}

/**
 * Get appropriate composition for page, ensuring variety
 */
export function getCompositionForPage(
  pageNumber: number,
  previousCompositions: string[]
): SceneDiversityAnalysis['composition'] {
  const compositions: SceneDiversityAnalysis['composition'][] = [
    'centered', 'left', 'right', 'balanced', 'diagonal', 'symmetrical', 'group'
  ]
  
  // Get last composition
  const lastComposition = previousCompositions[previousCompositions.length - 1]
  
  // Filter out last composition to ensure variety
  const availableCompositions = compositions.filter(c => c !== lastComposition)
  
  // Rotate through compositions based on page number
  const index = (pageNumber - 1) % availableCompositions.length
  return availableCompositions[index]
}

/**
 * Detect risky scene elements that may cause anatomical errors
 * NEW: 18 Ocak 2026 - GPT research-backed risk detection
 */
export interface RiskySceneAnalysis {
  hasRisk: boolean
  riskyElements: string[]
  suggestions: string[]
}

export function detectRiskySceneElements(
  sceneDescription: string,
  characterAction: string
): RiskySceneAnalysis {
  const combined = `${sceneDescription} ${characterAction}`.toLowerCase()
  const riskyElements: string[] = []
  const suggestions: string[] = []
  
  // Riskli el etkileşimleri
  const handInteractionKeywords = [
    'holding hands', 'hand in hand', 'holding', 'grabbing', 'grasping',
    'clutching', 'gripping', 'carrying', 'holding object'
  ]
  
  for (const keyword of handInteractionKeywords) {
    if (combined.includes(keyword)) {
      riskyElements.push(`Hand interaction: "${keyword}"`)
      if (keyword.includes('holding hands') || keyword.includes('hand in hand')) {
        suggestions.push('Replace with: characters standing near each other, arms at sides')
      } else if (keyword.includes('holding') || keyword.includes('carrying')) {
        suggestions.push('Simplify: avoid detailed object manipulation, use simple poses')
      }
    }
  }
  
  // Karmaşık el pozisyonları
  const complexPoseKeywords = [
    'pointing', 'fingers crossed', 'thumbs up', 'peace sign',
    'waving with fingers', 'interlocked fingers'
  ]
  
  for (const keyword of complexPoseKeywords) {
    if (combined.includes(keyword)) {
      riskyElements.push(`Complex hand pose: "${keyword}"`)
      suggestions.push('Simplify: use open palm wave or simple raised hand instead')
    }
  }
  
  // Çoklu karakter el etkileşimleri
  if ((combined.includes('together') || combined.includes('with')) && 
      (combined.includes('hand') || combined.includes('arm'))) {
    riskyElements.push('Multiple character hand interaction detected')
    suggestions.push('Ensure: hands clearly separated, individual poses for each character')
  }
  
  return {
    hasRisk: riskyElements.length > 0,
    riskyElements,
    suggestions
  }
}

/**
 * Get safe alternative for risky scene
 * NEW: 18 Ocak 2026 - Provides safe alternatives to risky poses
 */
export function getSafeSceneAlternative(characterAction: string): string {
  const action = characterAction.toLowerCase()
  
  // Replace risky actions with safe alternatives
  if (action.includes('holding hands')) {
    return characterAction.replace(/holding hands?/gi, 'standing together')
  }
  
  if (action.includes('waving')) {
    return 'character with one arm raised in greeting, open palm visible'
  }
  
  if (action.includes('holding') || action.includes('carrying')) {
    return characterAction.replace(/holding|carrying/gi, 'near') + ', hands at sides'
  }
  
  if (action.includes('pointing')) {
    return characterAction.replace(/pointing/gi, 'looking toward') + ', arm extended naturally'
  }
  
  // If no specific replacement, return original
  return characterAction
}

/**
 * Generate scene diversity prompt directives (optimized)
 */
export function getSceneDiversityDirectives(previousScene?: SceneDiversityAnalysis): string {
  if (!previousScene) return ''
  
  const changes: string[] = []
  if (previousScene.location !== 'unknown') changes.push(`location (was: ${previousScene.location})`)
  if (previousScene.perspective !== 'unknown') changes.push(`perspective (was: ${previousScene.perspective})`)
  if (previousScene.composition !== 'unknown') changes.push(`composition (was: ${previousScene.composition})`)
  
  return changes.length > 0 ? `DIVERSITY: Change ${changes.join(', ')}` : ''
}

const scenePrompts = {
  VERSION,
  generateScenePrompt,
  generateFullPagePrompt,
  getAgeAppropriateSceneRules,
  getStyleSpecificDirectives,
  // NEW: Scene diversity functions
  extractSceneElements,
  analyzeSceneDiversity,
  getPerspectiveForPage,
  getCompositionForPage,
  getSceneDiversityDirectives,
  // NEW: Risk detection functions (18 Ocak 2026)
  detectRiskySceneElements,
  getSafeSceneAlternative,
  // NEW: Composition and depth functions (25 Ocak 2026)
  getDepthOfFieldDirectives,
  getAtmosphericPerspectiveDirectives,
  getCameraAngleDirectives,
  getCharacterEnvironmentRatio,
}
export default scenePrompts

