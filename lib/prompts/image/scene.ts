import type { PromptVersion, ShotPlan } from '../types'
import { getGlobalArtDirection, usesCinematicImageLayers } from './style-descriptions'
import { getAnatomicalCorrectnessDirectives } from './negative'

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
  version: '1.34.0',
  releaseDate: new Date('2026-04-04'),
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
    'v1.21.0: [D1] story_data.sceneMap → SceneInput.storyScenePlanAnchor; characterAction imagePrompt ile ikinci kez doldurulmaz (page-scene-contract). PRIORITY sırasına plan satırı eklendi. (29 Mart 2026)',
    'v1.22.0: [D3] illustrationStyle grafik düz profil (comic_book, geometric, sticker_art, block_world, collage): getGlobalArtDirection/getCinematicPack/getStyleQualityPhrase; getCinematicElements/getCinematicNaturalDirectives grafik dala; sinematik katmanlar ile stil çekirdeği çakışması azaltıldı. (29 Mart 2026)',
    'v1.23.0: [Faz 2.1] Çelişki temizliği — C1: getGazeDirectionForPage index-0 + POSE_VARIATIONS[1] viewer-facing gaze kaldırıldı (getCinematicNaturalDirectives ile çelişiyordu); C2: getDefaultHandStrategy "not holding objects/no hand gestures" kaldırıldı (story aksiyonu ile çelişiyordu), buildAnatomicalAndSafetySection getSafeHandPoses satırı kaldırıldı; C3a: buildCharacterConsistencySection içinde buildStyleDirectives[2] + buildCharacterConsistencyDirectives[2] — kelimesi kelimesine aynı string iki kez push ediliyordu, sadece gerçek tutarlılık direktifleri bırakıldı; C3b: generateScenePrompt() başındaki buildStyleDirectives[0] kaldırıldı (getGlobalArtDirection + buildStyleSection zaten kapsıyor); C4: buildFirstInteriorPageDirectives "NOT centered" tekrarı kaldırıldı (SHOT PLAN zaten söylüyor). (4 Nisan 2026)',
    'v1.25.0: [Faz 2.2b-A] [SCENE] tekrar temizliği — Depth: FOREGROUND satırında characterAction tekrarı kaldırıldı (üst satırda zaten var). MIDGROUND sceneDescription (= uzun imagePrompt, ~420 karakter) yerine kısa environment kullanıyor. Tahmini ek düşüş ~100-250 karakter. (4 Nisan 2026)',
    'v1.29.0: [Faz 2.2b-B] İç sayfa [7] AVOID ve kapak buildAvoidShort: "extra or fused fingers", "extra limbs", "messy anatomy" kaldırıldı — kısa kompozisyon + arka plan + teknik yasaklar kaldı (OpenAI prompting: kısıtları kısa tut; parmak negatifleri token gürültüsü). (4 Nisan 2026)',
    'v1.28.0: [Faz 4] Kapak özel iyileştirme — (1) Cover PATH [1]: "Illustration style: ..." generic satırı → getGlobalArtDirection(illustrationStyle) (interior ile aynı stil profili); (2) Cover PATH [4] SCENE: buildStyleDirectives[0] (~150 karakter stil tekrarı) kaldırıldı — üstte zaten getGlobalArtDirection var. Pipeline (image-pipeline.ts): entity master URL\'leri kapak referans listesinden çıkarıldı — kapakta yalnızca karakter master\'ları gönderiliyor (entity görselleri karakter kimliğini karıştırabilir). (4 Nisan 2026)',
    'v1.27.0: [Faz 3] Stil izolasyon düzeltmesi — clay_animation: "stop-motion" kelimesi kaldırıldı (model sahneyi dondurulmuş / hareketsiz kare olarak yorumlayabiliyordu); "claymation handcrafted look" ile değiştirildi. Hem STYLE_DESCRIPTIONS hem getStyleSpecificDirectives güncellendi. get3DAnimationNotes dead import temizlendi. (4 Nisan 2026)',
    'v1.26.0: [Faz 1.3] Story staging + pozitif gaze — (1) getCinematicNaturalDirectives: "do NOT look at camera" yerine pozitif sahne hedefi ("look toward scene elements"); (2) [4] SCENE bloğu: "Do NOT look at camera" yerine "look toward the scene: at each other, at the object they interact with, toward the path"; (3) [7] AVOID: "looking directly at camera" kaldırıldı (pozitif yönlendirme ile gereksizleşti). base.ts\'te ILLUSTRATION / STAGING direktifi: her sceneDescription\'a 1 cümle gaze hedefi ekleme zorunluluğu getirildi. (4 Nisan 2026)',
    'v1.24.0: [Faz 2.2] 7-blok prompt yapısı — İç sayfa prompt\'u ~14 dağınık bloktan 7 odaklı bloğa indirildi: [1] PRIORITY, [2] STYLE, [3] SHOT PLAN, [4] SCENE, [5] CHARACTER IDENTITY, [6] EXPRESSIONS, [7] AVOID. Ortam×3→×1, Aydınlatma×2→×1, Stil×3→×1, Tutarlılık×4→×1, Kompozisyon×2→SHOT PLAN\'a birleştirildi. generateScenePrompt() / generateLayeredComposition() iç sayfa için artık çağrılmıyor (benzersiz içerik [4] SCENE\'e taşındı). [ANATOMY] bloğu kaldırıldı, anahtar kelimeler [7] AVOID\'a eklendi. Kalite dolgu satırları (professional children\'s book, high quality, print-ready) tamamen kaldırıldı. Tahmini prompt uzunluğu ~4000→~1800 karakter (~%55 azalma), sahne içeriğinin token oranı artırıldı. (4 Nisan 2026)',
    'v1.30.0: [P2] buildAnatomicalAndSafetySection kaldırıldı — hiç çağrılmıyordu (v1.24+ iç sayfa 7-blok; kapakta getAnatomicalCorrectnessDirectives doğrudan generateFullPagePrompt içinde). (4 Nisan 2026)',
    'v1.31.0: [P3 öncesi] Ölü kod temizliği — generateScenePrompt, generateLayeredComposition, kullanılmayan section builder\'lar ve yalnızca bunlara bağlı getCinematicElements / getCompositionRules zinciri, DoF/atmosfer/entegrasyon export\'ları, getAgeAppropriateSceneRules, getClothingConsistencyNote kaldırıldı. Aktif yol: generateFullPagePrompt (7-blok + kapak). (4 Nisan 2026)',
    'v1.32.0: [P3 öncesi] getCinematicNaturalDirectives kaldırıldı (hiç çağrılmıyordu; gaze/poz içeriği getGazeDirectionForPage + POSE_VARIATIONS ile). Kullanılmayan style-descriptions import\'ları temizlendi; getPoseVariationForPage yalnızca modül içi. (4 Nisan 2026)',
    'v1.33.0: [P3 öncesi] Yalnızca scene.ts içinde kullanılan yardımcılar artık named export değil: getCameraAngleDirectives, getPerspectiveForPage, getCompositionForPage, getSceneDiversityDirectives. (4 Nisan 2026)',
    'v1.34.0: [P3 öncesi] Hiç import edilmeyen `export default scenePrompts` kaldırıldı; `RiskySceneAnalysis` modül dışına export edilmiyor (yalnızca detectRiskySceneElements dönüş tipi). (4 Nisan 2026)',
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
  /**
   * D1: `story_data.sceneMap` satırının tek satırlık özeti (yer | zaman | setting).
   * Uzun `imagePrompt` ile çelişirse yer ve günün zamanı için plan önceliklidir.
   */
  storyScenePlanAnchor?: string
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
// Pose Variation Pool (Faz 2.3: Görsel Kalite İyileştirme)
// ============================================================================

const POSE_VARIATIONS = [
  "character facing into the scene, standing naturally, arms at sides or one hand slightly raised",
  "character looking at a nearby companion or scene object with warmth, relaxed and natural posture",
  "character walking forward confidently, one leg mid-step, dynamic movement",
  "character sitting cross-legged on ground, comfortable and relaxed, gazing at something nearby",
  "character jumping with joy, both arms raised above head, feet off ground",
  "character pointing excitedly toward something in the scene, engaged expression, eyes on the target",
  "character looking up at sky with wonder, head tilted back slightly, arms open",
  "character crouching down examining something on ground, curious expression",
]

/**
 * Returns pose variation for page to encourage variety across pages
 */
function getPoseVariationForPage(pageNumber: number, totalPages: number = 12): string {
  const poseIndex = Math.floor((pageNumber - 1) / Math.max(1, totalPages / POSE_VARIATIONS.length))
  return POSE_VARIATIONS[Math.min(poseIndex, POSE_VARIATIONS.length - 1)]
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
// Camera Angle Directives (NEW: 25 Ocak 2026)
// ============================================================================

/**
 * Generates camera angle directives for visual variety
 * Based on 2026 best practices: perspective diversity, child's viewpoint
 */
function getCameraAngleDirectives(
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
    'clay_animation': 'Clay-like texture, fingerprints visible, matte finish, claymation handcrafted look',
    'kawaii': 'Oversized head, large sparkling eyes, pastel colors, cute aesthetic',
    'comic_book': 'Bold black outlines, flat colors, dramatic shadows, high contrast',
    'sticker_art': 'Clean lines, saturated colors, glossy look, white border effect',
  }
  
  return directives[normalizedStyle] || ''
}

// ============================================================================
// Builder helpers (generateFullPagePrompt — kapak / iç sayfa)
// ============================================================================

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
 * Build cover reference consistency directives
 * v1.7.0: Extracted from generateFullPagePrompt for modularity
 */
function buildCoverReferenceConsistencyDirectives(additionalCharactersCount: number): string {
  const charNote = additionalCharactersCount > 0 ? `All ${additionalCharactersCount + 1} characters` : 'Character'
  return `${charNote} match cover image exactly (hair/eyes/skin/features). Only clothing/pose vary.`
}

/** Faz 3.4: Gaze direction — interior [4] SCENE. */
function getGazeDirectionForPage(pageNumber: number, _totalPages: number): string {
  const gazes = [
    'character looking ahead into the scene, wide-eyed wonder or curiosity',
    'character looking into scene (path, horizon, or object), engaged with environment',
    'character looking up (sky, trees, clouds), sense of wonder',
    'character looking to the side, following action in scene',
    'character looking down at something in scene (e.g. animal, object), curious',
    'character looking toward companion or element in frame, not at camera',
  ]
  const index = (pageNumber - 1) % gazes.length
  return gazes[index] ?? gazes[0]
}

function buildClothingSection(
  clothing: string | undefined,
  theme: string,
  isCover: boolean,
  useCoverReference: boolean
): string[] {
  return [buildClothingDirectives(clothing, theme, isCover, useCoverReference)]
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
// [A1] AVOID – tek satır (kapak)
// ============================================================================

function buildAvoidShort(): string {
  // Faz 2.2b-B: parmak / ekstremite / “messy anatomy” negatifleri kaldırıldı — kısa kompozisyon + teknik yasaklar.
  return 'AVOID: character filling the frame, close-up portrait framing, blurry background, neon saturation, text or watermark.'
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
  // Environment: story environmentDescription > coverEnvironment > sceneDescription > theme template
  const environment = getEnvironmentDescription(
    sceneInput.theme,
    sceneInput.sceneDescription,
    !isCover,
    isCover ? sceneInput.coverEnvironment : undefined,
    !isCover ? sceneInput.environmentDescription : undefined
  )

  const promptParts: string[] = []

  // ─── COVER PATH ────────────────────────────────────────────────────────────
  // Story-driven scene (coverEnvironment = resolveCoverEnvironment: coverImagePrompt first).
  // v1.28.0 (Faz 4): getGlobalArtDirection replaces the generic "Illustration style: ..." line.
  if (isCover) {
    // 1. Style — same cinematic/graphic profile used by interior pages
    promptParts.push(getGlobalArtDirection(illustrationStyle))

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

    // 4. SCENE — story cover brief (style already in [1] getGlobalArtDirection; no repeat here)
    // v1.28.0 (Faz 4): buildStyleDirectives[0] removed (was repeating style description ~150 chars).
    const styleExtra = getStyleSpecificDirectives(illustrationStyle) || ''
    const envPrimary = sceneInput.coverEnvironment?.trim() || sceneInput.sceneDescription?.trim() || ''
    const coverSceneText = [styleExtra, envPrimary].filter(Boolean).join(', ')
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

  // ─── INTERIOR PAGE PATH (v1.24.0 — 7-BLOCK STRUCTURE) ──────────────────────
  //
  // Seven focused blocks replace the previous ~14 blocks and eliminate:
  //   • Environment ×3 → ×1, Lighting ×2 → ×1, Style ×3 → ×1
  //   • Character consistency ×4 → ×1, Composition ×2 → merged into SHOT PLAN
  //   • Quality filler lines removed entirely
  //   • generateScenePrompt() / generateLayeredComposition() no longer called
  //     for interior pages (their unique content folded into [4] SCENE)
  // Target: ~1800 chars (~470 tokens) vs. previous ~4000 chars (~1000 tokens)

  // ── [1] PRIORITY + CONTEXT ──────────────────────────────────────────────────
  promptParts.push(
    'PRIORITY: If conflict, follow: 1) STORY SCENE PLAN (place & time) when present, 2) Scene composition & character scale, 3) Environment richness, 4) Character action & expression, 5) Reference identity.'
  )
  if (sceneInput.storyScenePlanAnchor?.trim()) {
    promptParts.push(`STORY SCENE PLAN: ${sceneInput.storyScenePlanAnchor.trim()}`)
  }
  if (sceneInput.pageNumber === 1) {
    promptParts.push('FIRST INTERIOR PAGE: Distinctly different from cover — different camera angle, composition, and scene detail. Do not repeat cover framing.')
  }

  // ── [2] STYLE ───────────────────────────────────────────────────────────────
  promptParts.push(getGlobalArtDirection(illustrationStyle))
  const styleSpecific = getStyleSpecificDirectives(illustrationStyle)
  if (styleSpecific) promptParts.push(styleSpecific)

  // ── [3] SHOT PLAN ───────────────────────────────────────────────────────────
  promptParts.push(buildShotPlanBlock(sceneInput, isCover, previousScenes))
  promptParts.push('Environment dominates frame. Leading lines, rule of thirds.')
  if (previousScenes && previousScenes.length > 0) {
    const diversityHint = getSceneDiversityDirectives(previousScenes[previousScenes.length - 1])
    if (diversityHint) promptParts.push(diversityHint)
  }

  // ── [4] SCENE (story content — all visual info, ONE TIME) ───────────────────
  // v1.25.0 (Faz 2.2b-A): FOREGROUND no longer repeats characterAction — already in top line.
  // MIDGROUND uses environment (short); imagePrompt was sceneDescription which ballooned to ~420 chars here.
  const sceneLines: string[] = []
  sceneLines.push(sceneInput.characterAction)
  sceneLines.push(environment)
  if (sceneInput.timeOfDay) {
    sceneLines.push(getLightingDescription(sceneInput.timeOfDay, sceneInput.mood))
  }
  if (sceneInput.timeOfDay === 'evening' || sceneInput.mood === 'warm' || sceneInput.mood === 'happy') {
    sceneLines.push('soft natural lighting, subtle warm tones, atmospheric depth')
  }
  if (sceneInput.weather && sceneInput.weather !== 'sunny') {
    sceneLines.push(getWeatherDescription(sceneInput.weather))
  }
  sceneLines.push(
    `Depth: FOREGROUND — character in action, sharp focus, integrated in scene. MIDGROUND — ${environment}. BACKGROUND — distance, atmospheric haze.`
  )
  sceneLines.push(getPoseVariationForPage(sceneInput.pageNumber, totalPages))
  sceneLines.push(getGazeDirectionForPage(sceneInput.pageNumber, totalPages))
  const isGraphicStyle = !usesCinematicImageLayers(illustrationStyle)
  sceneLines.push(
    isGraphicStyle
      ? 'Characters act within scene. Eyes follow the story action — look at objects, each other, or the environment.'
      : 'Cinematic storybook moment — characters look toward the scene: at each other, at the object they interact with, toward the path, or at something in the environment.'
  )
  sceneLines.push('Character naturally integrated into scene, same lighting as environment, feet on ground.')
  promptParts.push(`[SCENE] ${sceneLines.join('. ')} [/SCENE]`)

  // ── [5] CHARACTER IDENTITY ──────────────────────────────────────────────────
  const identityLines: string[] = []
  const useMatchReference = sceneInput.clothing === 'match_reference'
  if (useMatchReference) {
    identityLines.push('Reference = character identity ONLY (face, body, outfit). Do NOT copy pose, expression, or gaze from reference. Same outfit every page. Keep wide framing.')
  } else if (sceneInput.clothing?.trim()) {
    identityLines.push(`Character MUST wear: ${sceneInput.clothing.trim()} (locked for entire book).`)
  }
  identityLines.push('Reference = face, hair, outfit only; do NOT copy lighting or background. Allow relighting to match this scene.')
  identityLines.push('Consistent character design every page, match reference exactly.')
  identityLines.push(buildClothingDirectives(sceneInput.clothing, sceneInput.theme, isCover, useCoverReference))
  if (characterPrompt?.trim()) {
    identityLines.push(`Character identity: ${characterPrompt.trim()}.`)
  }
  if (useCoverReference) {
    identityLines.push(buildCoverReferenceConsistencyDirectives(additionalCharactersCount))
  }
  if (additionalCharactersCount > 0) {
    identityLines.push(`${additionalCharactersCount + 1} characters in scene, all visible and identifiable.`)
  }
  promptParts.push(identityLines.join(' '))

  // ── [6] EXPRESSIONS ─────────────────────────────────────────────────────────
  if (sceneInput.characterExpressions && Object.keys(sceneInput.characterExpressions).length > 0) {
    const charList = characterListForExpressions && characterListForExpressions.length > 0
      ? characterListForExpressions.filter(c => sceneInput.characterExpressions![c.id])
      : Object.keys(sceneInput.characterExpressions).map((id, i) => ({ id, name: `Character ${i + 1}` }))
    promptParts.push(...buildCharacterExpressionsSection(sceneInput.characterExpressions, charList))
  }

  // ── [7] AVOID ────────────────────────────────────────────────────────────────
  // v1.26.0 (Faz 1.3): "looking directly at camera" kaldırıldı.
  // v1.29.0 (Faz 2.2b-B): parmak / ekstremite / messy anatomy negatifleri kaldırıldı (model gürültüsü; GPT-Image 1.5 için A/B sonrası karar).
  promptParts.push(
    'AVOID: character filling frame, close-up portrait, blurry background, neon saturation, text or watermark.'
  )

  return promptParts.join(', ')
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
function getPerspectiveForPage(
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
function getCompositionForPage(
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
interface RiskySceneAnalysis {
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
function getSceneDiversityDirectives(previousScene?: SceneDiversityAnalysis): string {
  if (!previousScene) return ''
  
  const changes: string[] = []
  if (previousScene.location !== 'unknown') changes.push(`location (was: ${previousScene.location})`)
  if (previousScene.perspective !== 'unknown') changes.push(`perspective (was: ${previousScene.perspective})`)
  if (previousScene.composition !== 'unknown') changes.push(`composition (was: ${previousScene.composition})`)
  
  return changes.length > 0 ? `DIVERSITY: Change ${changes.join(', ')}` : ''
}

