import type { StoryGenerationInput, StoryGenerationOutput, PromptVersion } from '../types'
import {
  getReadingAgeBracketConfig,
  wordsPerPageRangeString,
  type ReadingAgeBracketConfig,
} from '@/lib/config/reading-age-brackets'
import { DEFAULT_PAGE_COUNT, PAGE_COUNT_MIN, PAGE_COUNT_MAX } from '@/lib/constants/book-config'

/**
 * Story Generation Prompt - Version 1.0.0
 * 
 * Initial version focused on:
 * - Age-appropriate content
 * - Safety (no scary/inappropriate content)
 * - Educational value
 * - Clear structure for AI
 * - Detailed image prompts
 */

export const VERSION: PromptVersion = {
  version: '3.2.2',
  releaseDate: new Date('2026-04-04'),
  status: 'active',
  changelog: [
    'Initial release',
    'Age-appropriate content rules',
    'Safety filters implemented',
    'Educational themes integrated',
    'Image prompt generation included',
    '8 language support added (tr, en, de, fr, es, zh, pt, ru) - 24 Ocak 2026',
    'Strong language enforcement directives added - 24 Ocak 2026',
    'Language mixing prevention (no English words in non-English stories) - 24 Ocak 2026',
    'Final language check mechanism added - 24 Ocak 2026',
    'v1.0.1: Enhanced additional characters section with detailed appearance descriptions (age, hair color, eye color, features) and explicit character name usage directive (16 Ocak 2026)',
    'v1.0.2: Visual safety guidelines added - avoid risky hand interactions for better anatomical accuracy (GPT research-backed) (18 Ocak 2026)',
    'v1.0.3: Character mapping per page - Story generation now returns characterIds array for each page, replacing unreliable text-based character detection (18 Ocak 2026)',
    'v1.1.0: Enhanced writing quality improvements (25 Ocak 2026)',
    'v1.1.0: Added getExampleText() - age-group specific example texts with dialogue and sensory details (25 Ocak 2026)',
    'v1.1.0: Enhanced "show, don\'t tell" examples - detailed BAD and GOOD examples with full sensory details (25 Ocak 2026)',
    'v1.1.0: Enhanced sensory details emphasis - visual, auditory, tactile, olfactory, gustatory details (25 Ocak 2026)',
    'v1.1.0: Enhanced pacing control - strong hook early, shorter scenes, predictable patterns, scene-by-scene breakdown (25 Ocak 2026)',
    'v1.1.0: Enhanced illustration guidelines - sensory details visualization (25 Ocak 2026)',
    'v1.2.0: Page 1 vs Cover rule - first interior page must differ from cover (scene, composition, camera) (3.5.20) (24 Ocak 2026)',
    'v1.3.0: Story-driven clothing – "clothing" per page in JSON; CRITICAL CHARACTER CLOTHING updated; imagePrompt/sceneDescription include SPECIFIC clothing; plan: Kapak/Close-up/Kıyafet (24 Ocak 2026)',
    'v1.3.1: characterIds and clothing REQUIRED enforcement – JSON schema "DO NOT OMIT", CRITICAL reminders strengthened, validation added in books route (24 Ocak 2026)',
    'v1.3.2: Theme-specific clothing güçlendirme – getThemeConfig space → "astronaut suit", few-shot examples eklendi (space/underwater/forest), "mavi ve kırmızı rahat giysiler" yasaklandı, JSON şemasında tema bazlı örnekler (24 Ocak 2026)',
    'v1.4.0: Story API Refactor – Faz 1: Clothing direktiflerini modülerleştir (getClothingDirectives, getClothingFewShotExamples), Faz 2: Prompt\'u 11 bölüme ayır (builder fonksiyonları), Faz 3: Theme-specific logic\'i merkezileştir (getThemeConfig.clothingExamples) (24 Ocak 2026)',
    'v1.4.1: defaultClothing (Faz 1) – Master kıyafet story prompt\'a enjekte; tüm sayfalarda aynı kıyafet zorunluluğu (CONSISTENCY_AND_QUALITY_ACTION_PHASES) (31 Ocak 2026)',
    'v1.5.0: Master-For-All-Entities – supportingEntities (hayvan/obje) eklendi; entity detection direktifleri; tüm varlıklar için master üretme (31 Ocak 2026)',
    'v1.6.0: SYSTEM REDESIGN (CLOTHING CONSISTENCY) – Story no longer generates clothing; master system = single source of truth for visual details. REMOVED: getClothingDirectives, ClothingDirectives interface, stripClothingFromSceneText. ADDED: "DO NOT DESCRIBE" directive (no clothing/appearance in story text), "sceneContext" field (replaces "clothing"), supportingEntities already present. IMPACT: Story focuses on narrative (actions, emotions, plot); all visual details from master illustrations. (30 Ocak 2026)',
    'v1.7.0: PROMPT SLIM – Request length reduced. System: one-line language rule. User: removed duplicate opening line; removed PERSONALITY block; removed Theme-Specific Examples; LANGUAGE section one line + verification; STORY STRUCTURE = short cover/interior/different-scenes; THEME + DO NOT DESCRIBE shortened; VISUAL DIVERSITY, WRITING STYLE, ILLUSTRATION, CRITICAL REMINDERS, OUTPUT FORMAT, SUPPORTING ENTITIES shortened. (30 Ocak 2026)',
    'v1.8.0: Per-page expression field – Story output adds expression (one word or short phrase, English) per page; derived from page text; no fixed list. ILLUSTRATION + OUTPUT FORMAT + CRITICAL REMINDERS updated. Used by image pipeline for facial expression. (2 Şubat 2026)',
    'v1.9.0: characterExpressions (per-character per-page) – Replaces single "expression" field. Story output now has characterExpressions object (char ID → visual facial description: eyes, brows, mouth). ILLUSTRATION section: detailed expression guidelines (sad/worried/curious/angry/focused/surprised/happy/calm), visual betimleme (not emotion words), multi-character scene support (each character can have different expression). OUTPUT FORMAT + CRITICAL REMINDERS updated. (3 Şubat 2026)',
    'v2.0.0: STORY_PROMPT_ACTION_PLAN – Cover netliği (cover ayrı, pages = interior only). CHARACTER MAPPING + CHARACTER_ID_MAP (liste + map, gerçek UUID). Yaş/kelime: getWordCountRange (toddler 10-25, preschool 25-45, vb.), getSentenceLength doğal kurallar. DO NOT DESCRIBE iki maddeli: (a) text = görsel yok, (b) imagePrompt = appearance yasak, ışık/kompozisyon serbest. OUTPUT FORMAT suggestedOutfits placeholder düzeltmesi. (7 Şubat 2026)',
    'v2.1.0: GPT trace aksiyonları – VISUAL DIVERSITY: Do NOT repeat same pose/action on consecutive pages; each page distinctly different action/pose. Word count: getWordCountRange artırıldı (toddler 30-45 … pre-teen 130-180), getWordCountMin export; CRITICAL: Each page text at least X words. generate-story: kelime sayımı + kısa sayfa repair pass. (7 Şubat 2026)',
    'v2.2.0: [A3] VERIFICATION CHECKLIST – Tüm verify/check maddeleri tek blokta. LANGUAGE: "Before returning JSON verify..." kaldırıldı. OUTPUT FORMAT: Tekrarlayan "characterIds/suggestedOutfits/characterExpressions REQUIRED" satırları kısaltıldı, "see # VERIFICATION CHECKLIST" referansı. buildCriticalRemindersSection → buildVerificationChecklistSection. (PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md, 8 Şubat 2026)',
    'v2.3.0: [A5] shotPlan (optional) – OUTPUT FORMAT: per-page optional shotPlan (shotType, lens, cameraAngle, placement, timeOfDay, mood). English only; used for image composition when provided. Omit if not needed. (PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md, 8 Şubat 2026)',
    'v2.4.0: [Plan A] coverSetting REQUIRED – Story JSON top-level field: one sentence English, setting/background only for book cover (no characters). LLM generates it from story; used for cover image BACKGROUND. COVER_PATH_FLOWERS_ANALYSIS.md §7 (8 Şubat 2026)',
    'v2.5.0: [Seçenek A] STORY SEED section – customRequests promoted from "Special Requests" bullet to dedicated # STORY SEED section with backbone directive. Placed after STORY REQUIREMENTS for prominence. Removed "Special Requests: None" noise when absent. Improves story quality for example book creation. (14 Şubat 2026)',
    'v2.6.0: SCENE DIVERSITY → ONE STORY STEP BY STEP. User goal: "güzel bir hikaye" — one clear story (e.g. camping day) that flows naturally from start to end; each page = next step, no rigid rules. (1) buildStoryStructureSection: "ONE STORY, STEP BY STEP" with camping example (wake up → pack → go → set tent → explore → activity → sleep); no SCENE DIVERSITY / location-count language. (2) buildStorySeedSection: seed = how the story starts; then "continue the same story step by step" to ending. (3) VERIFICATION: "each page = one step; imagePrompt describes that step". (1 Mart 2026)',
    'v2.7.0: Few-shot anchoring kaldırıldı — OUTPUT FORMAT içindeki somut kapak/sahne örnekleri (isim + mekân), environmentDescription ve shotPlan şema örnekleri nötrleştirildi. buildStoryStructureSection kamp örneği soyut akışa indirildi. getExampleText doğa/orman bias\'ı kaldırıldı (mekân-agnostic örnek cümleler). HARDCODED_ORNEKLER_VE_AMAC_ANALIZI.md (20 Mart 2026)',
    'v2.7.1: STORY STRUCTURE — mekân tutarlılığı: tohum kapalı salon/turnuva gibi bir mekân söylüyorsa coverDescription ve tüm sayfa ortamları aynı tür mekânda kalsın; hikâye ortasında dış mekân/park/çimene kayma. PROMPT_ANALIZ Ö10 (20 Mart 2026)',
    'v2.8.0: coverImagePrompt — kapak için ayrı İngilizce görsel brief (kitap kapağı kompozisyonu, üstte başlık alanı, odak); pipeline önceliği coverImagePrompt → coverDescription → coverSetting. scene.ts sabit BOOK COVER layout satırı. (20 Mart 2026)',
    'v3.0.0: SYSTEM/USER SPLIT (A1) — statik kurallar (safety, language, DO NOT DESCRIBE, expressions guide) system mesajına taşındı; user mesajı yalnızca bu kitaba özgü dinamik veri içeriyor. A3: max_tokens kaldırıldı. A4: buildThemeSpecificSection + buildIllustrationSection sadeleşti. A5: sinematik imagePrompt direktifi (LIGHTING→DEPTH→COLOR→COMP→ATMO) system\'e eklendi. A6: coverImagePrompt = film afişi / zirve anı direktifi system\'e eklendi. buildStorySystemPrompt() export edildi. (28 Mart 2026)',
    'v3.0.1: LANGUAGE — pages[].text %100 hedef dil; title tercihen hedef dil; görsel alanlar EN. Step 6 StepRunner: dil artık step3.language.id üzerinden okunuyor (önceden wizardData.language yanlıştı). story max_tokens: lib/ai/story-generation-config.ts (50k). step-runner createBook: age_group dolduruluyor. (28 Mart 2026)',
    'v3.0.4: LANGUAGE — Sadece pages[].text (+ tercihen title) hedef dilde; sceneMap, supportingEntities (name, description), metadata metinleri ve tüm görsel/API alanları açıkça English-only. json_schema açıklamaları güncellendi. Repair prompt aynı kural. (28 Mart 2026)',
    'v3.0.5: suggestedOutfits — tüm kitap için tek kıyafet seti; sadece hikâyede açık kıyafet değişimi varsa farklı. (28 Mart 2026)',
    'v3.0.6: supportingEntities — en az bir kayıt (pipeline kuralı); prompt/şema/repair minItems; arka plan entity yasağı ilke dilinde; custom tema + boş customRequests step-runner/generate-story 400. (30 Mart 2026)',
    'v3.0.7: supportingEntities — minItems kaldırıldı; entity sayısını hikaye içeriği belirler (1–5 tipik); story seed objelerine entity ipucu; repair prompt customRequests bağlamı; assert hard length kontrolü kaldırıldı. (30 Mart 2026)',
    'v3.0.8: supportingEntities — en fazla 2 (maliyet); şema maxItems 2; validator + repair; seed çok aday varsa en kritik 2. (30 Mart 2026)',
    'v3.2.0: [Faz 1.3] STAGING direktifi — buildIllustrationSection\'a zorunlu "STAGING (gaze & orientation)" satırı eklendi: her sceneDescription\'a karakterlerin neye baktığını / yöneldiğini belirten 1 İngilizce cümle ekleme direktifi (sahne elemanı hedefi: yol, nesne, arkadaş, ufuk). Kamera bakış yönetimi negatif yasaktan pozitif yöne çevrildi. (4 Nisan 2026)',
    'v3.1.0: [Faz 1.1] Story anti-pattern kuralları — (1) buildIllustrationSection: "Visual safety: hands at sides" kaldırıldı (GPT Image 1.5 4.47/5 el skoru, kısıtlama gereksiz); aktif sahne direktifi eklendi: her imagePrompt spesifik fiil+nesne içermeli. (2) buildVisualDiversitySection: ardışık aynı fiil yasağı (sit/stand/walk/look 2 art arda yasak); checklist ritmi yasağı açık kurala dönüştürüldü. (3) buildStoryStructureSection: Sayfa 1 vs Kapak farkı güçlendirildi — kapak = zirve dramatik an, sayfa 1 = başlangıç; farklı yer+aksiyon+kamera zorunlu. (4) buildStorySystemPrompt/#COVER IMAGE: cover direktifi güçlendirildi — "en dramatik an" zorunluluğu, karakterler aksiyon içinde, kapak+sayfa1 farklı sahne garantisi. (4 Nisan 2026)',
    'v3.0.2: Okuma yaşı bantları (0-1, 1-3, 3-5, 6+) — lib/config/reading-age-brackets.ts tek kaynak; Step 1 seçim; characters API + tüm generateStoryPrompt çağrıları readingAgeBracket; getWordCountMinForStoryInput. (28 Mart 2026)',
    'v3.0.3: Hikaye akışı ve entity disiplini güçlendirildi — itinerary/checklist anlatımı yasaklandı; sayfalar arası sebep-sonuç akışı vurgulandı. supportingEntities için tekrarlayan/merkezi nesneler (örn. teddy bear, ball, map) zorunlu hale getirildi. (28 Mart 2026)',
    'v3.2.1: Hiç import edilmeyen `export default baseStoryPrompts` kaldırıldı (yalnızca named export kullanımı). (4 Nisan 2026)',
    'v3.2.2: getWordCountMinForStoryInput kaldırıldı — hiç çağrılmıyordu; kelime tablosu için getReadingAgeBracketConfig doğrudan kullanılabilir. (4 Nisan 2026)',
  ],
  author: '@prompt-manager',
}

export function generateStoryPrompt(input: StoryGenerationInput): string {
  const {
    characterName,
    characterAge,
    characterGender,
    theme,
    illustrationStyle,
    customRequests,
    pageCount, // Debug: Optional page count override
    referencePhotoAnalysis, // Optional: kept for backward compatibility, but not required
    language = 'en',
    // New: Direct character features from Step 1 (optional)
    hairColor,
    eyeColor,
    /** Faz 1: Master karakterin kilitli kıyafeti; tüm sayfalarda aynı kıyafet. */
    defaultClothing,
    // NEW: Multiple characters support
    characters,
    readingAgeBracket,
  } = input

  const readingCfg = getReadingAgeBracketConfig(readingAgeBracket, characterAge)
  const themeConfig = getThemeConfig(theme)
  
  // REMOVED: clothing directives (v1.6.0) – kıyafet story'nin sorumluluğu değil; sadece master'da

  // Build character description (use Step 1 data if available, otherwise use analysis)
  let characterDesc = buildCharacterDescription(
    characterName,
    characterAge,
    characterGender,
    referencePhotoAnalysis, // Optional: for backward compatibility
    { hairColor, eyeColor } // Step 1 data
  )

  // Add additional characters if present
  if (characters && characters.length > 1) {
    characterDesc += `\n\nADDITIONAL CHARACTERS:\n`
    
    characters.slice(1).forEach((char, index) => {
      const charName = char.name || char.type.displayName
      const charNumber = index + 2
      
      if (char.type.group === "Pets") {
        characterDesc += `\n${charNumber}. ${charName} (a ${char.type.value.toLowerCase()})`
        // Add appearance details if available
        const desc = (char as { description?: { hairColor?: string; eyeColor?: string; uniqueFeatures?: string[]; age?: number } }).description
        if (desc) {
          if (desc.hairColor) characterDesc += ` with ${desc.hairColor} fur`
          if (desc.eyeColor) characterDesc += `, ${desc.eyeColor} eyes`
          if (desc.uniqueFeatures && desc.uniqueFeatures.length > 0) {
            characterDesc += `, ${desc.uniqueFeatures.join(', ')}`
          }
        }
        characterDesc += ` - A friendly and playful companion`
      } else if (char.type.group === "Toys") {
        characterDesc += `\n${charNumber}. ${charName} (a ${char.type.value.toLowerCase()})`
        const desc = (char as { description?: { hairColor?: string; eyeColor?: string; uniqueFeatures?: string[] } }).description
        if (desc) {
          if (desc.hairColor) characterDesc += `, ${desc.hairColor} color`
          if (desc.eyeColor) characterDesc += `, ${desc.eyeColor} details`
          if (desc.uniqueFeatures && desc.uniqueFeatures.length > 0) {
            characterDesc += `, ${desc.uniqueFeatures.join(', ')}`
          }
        }
        characterDesc += ` - A beloved and special toy`
      } else if (char.type.group === "Family Members") {
        characterDesc += `\n${charNumber}. ${charName} (${characterName}'s ${char.type.value.toLowerCase()})`
        const desc = (char as { description?: { age?: number; hairColor?: string; eyeColor?: string; uniqueFeatures?: string[] } }).description
        if (desc) {
          if (desc.age) characterDesc += `, ${desc.age} years old`
          if (desc.hairColor) characterDesc += `, ${desc.hairColor} hair`
          if (desc.eyeColor) characterDesc += `, ${desc.eyeColor} eyes`
          if (desc.uniqueFeatures && desc.uniqueFeatures.length > 0) {
            characterDesc += `, ${desc.uniqueFeatures.join(', ')}`
          }
        }
        characterDesc += ` - A warm and caring family member`
      } else {
        characterDesc += `\n${charNumber}. ${charName}`
        const desc = (char as { description?: { hairColor?: string; eyeColor?: string; uniqueFeatures?: string[] } }).description
        if (desc) {
          if (desc.hairColor) characterDesc += ` with ${desc.hairColor} hair`
          if (desc.eyeColor) characterDesc += `, ${desc.eyeColor} eyes`
          if (desc.uniqueFeatures && desc.uniqueFeatures.length > 0) {
            characterDesc += `, ${desc.uniqueFeatures.join(', ')}`
          }
        }
      }
    })
    
    characterDesc += `\n\n**CRITICAL - CHARACTER USAGE REQUIREMENTS (MANDATORY - NO EXCEPTIONS):**`
    characterDesc += `\n- ALL ${characters.length} characters MUST appear in the story`
    characterDesc += `- The main character is ${characterName}`
    characterDesc += `- Use ALL character names (${characters.map(c => c.name || c.type.displayName).join(', ')}) throughout the story, not generic terms like "friends" or "companions"`
    
    // Character distribution requirements (NEW: 25 Ocak 2026)
    const familyMembers = characters.filter(c => c.type?.group === "Family Members")
    if (familyMembers.length > 0) {
      characterDesc += `\n\n**FAMILY MEMBERS USAGE (MANDATORY):**`
      characterDesc += `\n- Family Members (${familyMembers.map(c => c.name || c.type.displayName).join(', ')}) MUST appear in multiple pages`
      characterDesc += `\n- Each Family Member should appear in at least ${Math.max(3, Math.floor(resolveStoryPageCount(pageCount) * 0.4))} pages`
      characterDesc += `\n- DO NOT exclude any Family Member from the story - ALL must be included`
    }
    
    characterDesc += `\n\n**CHARACTER DISTRIBUTION REQUIREMENTS:**`
    characterDesc += `\n- ALL ${characters.length} characters should appear throughout the story`
    characterDesc += `\n- Each character should appear in at least ${Math.max(2, Math.floor(resolveStoryPageCount(pageCount) * 0.3))} pages`
    characterDesc += `\n- Main character (${characterName}) will appear in most/all pages`
    if (characters.length > 2) {
      characterDesc += `\n- Pages 2-${Math.floor(resolveStoryPageCount(pageCount) * 0.6)} should feature at least 2 characters`
      characterDesc += `\n- Pages ${Math.floor(resolveStoryPageCount(pageCount) * 0.6) + 1}-${resolveStoryPageCount(pageCount)} should feature all ${characters.length} characters when possible`
    }
    characterDesc += `\n- Distribute characters evenly - do not favor some characters over others`
    
    // CHARACTER MAPPING for JSON response (aksiyon planı 1.2: liste + CHARACTER_ID_MAP)
    characterDesc += `\n\nCHARACTER MAPPING (CRITICAL - for JSON response):\n`
    characters.forEach((char, index) => {
      const name = char.name || char.type.displayName
      characterDesc += `- Character ${index + 1}: id: ${char.id} | name: ${name}\n`
    })
    characterDesc += `\nCHARACTER_ID_MAP (use these exact IDs in characterIds and suggestedOutfits):\n${JSON.stringify(Object.fromEntries(characters.map(c => [c.id, c.name || c.type.displayName])))}\n`
    characterDesc += `\n**CRITICAL - REQUIRED FIELD:** When returning the JSON, for EACH page, you MUST include a "characterIds" array indicating which characters appear on that page using their IDs from the mapping above (exact UUIDs from CHARACTER_ID_MAP).`
    characterDesc += `\n- "characterIds" is a REQUIRED field - do NOT omit it`
    characterDesc += `\n- Use the exact character IDs from the mapping above`
    characterDesc += `\n- Example: If page 2 features both ${characterName} and ${characters[1].name || characters[1].type.displayName}, set "characterIds": ["${characters[0].id}", "${characters[1].id}"]`
    characterDesc += `\n- **CRITICAL:** ALL ${characters.length} characters must appear in the story - check each page's characterIds to ensure ALL characters are included across all pages`
    characterDesc += `\n- **DO NOT** exclude any character - ALL ${characters.length} characters must be used in the story (see # VERIFICATION CHECKLIST for required fields).`
  } else if (characters && characters.length === 1) {
    // Single character - liste + CHARACTER_ID_MAP (aksiyon planı 1.2)
    const c = characters[0]
    const name = c.name || c.type.displayName
    characterDesc += `\n\nCHARACTER MAPPING (CRITICAL - for JSON response):\n`
    characterDesc += `- Character 1: id: ${c.id} | name: ${name}\n`
    characterDesc += `\nCHARACTER_ID_MAP (use this exact ID in characterIds and suggestedOutfits):\n${JSON.stringify({ [c.id]: name })}\n`
    characterDesc += `\n**CRITICAL - REQUIRED FIELD:** When returning the JSON, for EACH page, you MUST include "characterIds": ["${c.id}"]`
  }

  // v3.0.0: System/user split — statik kurallar system'de; user = bu kitaba özgü dinamik veri
  // Kaldırıldı: buildSafetySection (system'de), buildLanguageSection (system'de)
  const sections = [
    buildCharacterSection(characterDesc, characters),
    buildStoryRequirementsSection(themeConfig, characterAge, readingCfg, pageCount ?? DEFAULT_PAGE_COUNT, language, illustrationStyle),
    ...(customRequests?.trim() ? [buildStorySeedSection(customRequests.trim(), pageCount ?? DEFAULT_PAGE_COUNT)] : []),
    buildSupportingEntitiesSection(theme, characters, customRequests), // Pets must NOT be duplicated in supportingEntities
    buildAgeAppropriateSection(readingCfg),
    buildStoryStructureSection(characterName, pageCount ?? DEFAULT_PAGE_COUNT, characters),
    buildThemeSpecificSection(themeConfig, theme),
    buildVisualDiversitySection(),
    buildWritingStyleSection(readingCfg, language, characterName, characters),
    buildIllustrationSection(illustrationStyle, characterName, characters),
    buildOutputFormatSection(readingCfg, pageCount ?? DEFAULT_PAGE_COUNT),
    buildVerificationChecklistSection(readingCfg, characterName, themeConfig, pageCount ?? DEFAULT_PAGE_COUNT, language),
    `Generate the story now in valid JSON format with EXACTLY ${resolveStoryPageCount(pageCount)} pages.`
  ]
  
  return sections.join('\n\n').trim()
}

// ============================================================================
// Helper Functions
// ============================================================================

function resolveStoryPageCount(override?: number): number {
  if (override !== undefined && override >= PAGE_COUNT_MIN && override <= PAGE_COUNT_MAX) {
    return override
  }
  return DEFAULT_PAGE_COUNT
}

/**
 * Get example text for age group (NEW: 25 Ocak 2026)
 * Provides concrete examples with dialogue, sensory details, and atmosphere
 */
function getExampleText(
  ageGroup: string,
  characterName: string,
  language: string,
  characters?: Array<{ name?: string; type: { displayName: string } }>
): string {
  // Note: Examples are in English for instruction, but the actual story should be in the specified language
  // The function returns English examples as templates - the model should write in the target language
  
  const companionName = characters && characters.length > 1 
    ? (characters[1].name || characters[1].type.displayName)
    : 'companion'
  
  // Setting-agnostic samples: show rhythm, dialogue, sensory detail — do not imply a default location (forest/meadow/etc.).
  const examples: Record<string, string> = {
    toddler: `"Look!" ${characterName} said, clapping small hands. Something new made ${characterName} curious. ${characterName} hummed a happy little tune. "Again!" ${characterName} giggled. Warm air felt cozy. "Pretty!" ${characterName} whispered.`,
    
    preschool: `"Wow!" ${characterName} said, looking around carefully. ${characterName} listened and waited. A sound felt close and clear. "What happens next?" ${characterName} wondered. ${characterName} took a slow breath and smiled.`,
    
    'early-elementary': `As ${characterName} stepped forward, feelings bubbled up inside. "This matters!" ${characterName} said to ${companionName}, voice steady. ${characterName} listened for small sounds nearby. "I think I can do this," ${characterName} thought, feeling calmer with each step.`,
    
    elementary: `Light and shadows shifted as ${characterName} moved. "Do you hear that?" ${characterName} asked ${companionName}, pausing. ${characterName} noticed details others might miss. "I think I understand now," ${characterName} said, feeling more sure. The moment felt full and real.`,
    
    'pre-teen': `As the situation unfolded, ${characterName} looked at it with fresh eyes. "What if we try it this way?" ${characterName} suggested to ${companionName}. The air felt heavier with meaning. ${characterName} chose each word carefully and waited. "I will remember this," ${characterName} thought.`,
  }
  
  return examples[ageGroup] || examples['early-elementary']
}

function getThemeConfig(theme: string) {
  const t = (theme || '').toString().trim().toLowerCase()
  const normalizedTheme =
    t === 'sports&activities' || t === 'sports_activities' || t === 'sports-activities'
      ? 'sports'
      : t

  const configs: Record<string, any> = {
    adventure: {
      name: 'Adventure',
      mood: 'exciting',
      setting: 'outdoor exploration (forest, mountain, beach)',
      commonElements: ['discovery', 'nature', 'exploration', 'teamwork'],
      clothingStyle: 'comfortable outdoor clothing appropriate for adventure (casual pants/shorts, t-shirts, sneakers, outdoor gear)',
      clothingExamples: {
        correct: [
          'outdoor gear',
          'hiking clothes',
          'adventure outfit'
        ],
        wrong: [
          'casual clothes',
          'mavi ve kırmızı rahat giysiler'
        ]
      }
    },
    sports: {
      name: 'Sports & Activities',
      mood: 'exciting',
      setting: 'playground, sports field, or indoor activity space',
      commonElements: ['movement', 'teamwork', 'practice', 'friendly competition', 'having fun'],
      clothingStyle: 'sportswear (athletic clothes, sports shoes, comfortable activewear)',
      clothingExamples: {
        correct: [
          'sportswear',
          'athletic clothes',
          'sports outfit'
        ],
        wrong: [
          'casual clothes',
          'mavi ve kırmızı rahat giysiler'
        ]
      }
    },
    fantasy: {
      name: 'Fantasy',
      mood: 'magical',
      setting: 'magical world or enchanted place',
      commonElements: ['magic', 'wonder', 'imagination', 'friendly creatures'],
      clothingStyle: 'fantasy-appropriate clothing (adventure-style casual, magical themes, not formal)',
      clothingExamples: {
        correct: [
          'fantasy adventure outfit',
          'magical adventure clothes',
          'enchanted explorer clothing'
        ],
        wrong: [
          'casual clothes',
          'mavi ve kırmızı rahat giysiler',
          'formal wear'
        ]
      }
    },
    animals: {
      name: 'Animals',
      mood: 'fun',
      setting: 'farm, zoo, or natural habitat',
      commonElements: ['animal friends', 'nature', 'care', 'learning'],
      clothingStyle: 'casual comfortable clothing appropriate for nature/outdoors (jeans, t-shirts, casual shoes)',
      clothingExamples: {
        correct: [
          'casual comfortable clothing',
          'outdoor casual clothes',
          'nature-appropriate outfit'
        ],
        wrong: [
          'formal wear',
          'dress clothes'
        ]
      }
    },
    'daily-life': {
      name: 'Daily Life',
      mood: 'relatable',
      setting: 'home, school, or neighborhood',
      commonElements: ['family', 'friends', 'everyday activities', 'growth'],
      clothingStyle: 'everyday casual clothing (normal kids clothes, casual outfits)',
      clothingExamples: {
        correct: [
          'everyday casual clothing',
          'normal kids clothes'
        ],
        wrong: [] // Bu tema için kabul edilebilir
      }
    },
    space: {
      name: 'Space',
      mood: 'inspiring',
      setting: 'space, planets, or stars',
      commonElements: ['exploration', 'discovery', 'wonder', 'science'],
      clothingStyle: 'astronaut suit / space suit (child-sized space outfit with helmet, space exploration gear)',
      clothingExamples: {
        correct: [
          'child-sized astronaut suit with helmet',
          'space exploration outfit',
          'astronaut gear'
        ],
        wrong: [
          'casual clothes',
          'mavi ve kırmızı rahat giysiler',
          'everyday casual clothing'
        ]
      }
    },
    educational: {
      name: 'Learning & Discovery',
      mood: 'inspiring',
      setting: 'science, nature, or cosmic exploration (classroom, lab, space, or outdoor discovery)',
      commonElements: ['learning', 'discovery', 'science', 'facts', 'exploration', 'wonder', 'cosmic adventures'],
      clothingStyle: 'age-appropriate casual clothing suitable for learning and exploration (comfortable, practical)',
      clothingExamples: {
        correct: [
          'casual clothes for learning',
          'comfortable exploration outfit',
          'age-appropriate casual clothing'
        ],
        wrong: [
          'mavi ve kırmızı rahat giysiler'
        ]
      }
    },
    custom: {
      name: 'Custom',
      mood: 'imaginative',
      setting: 'based on the story seed provided by the author',
      commonElements: ['creativity', 'imagination', 'unique adventure'],
      clothingStyle: 'age-appropriate casual clothing suitable for the story setting',
      clothingExamples: {
        correct: ['age-appropriate casual clothing', 'outfit fitting the story'],
        wrong: []
      }
    },
    underwater: {
      name: 'Underwater',
      mood: 'mysterious',
      setting: 'ocean, sea, or underwater world',
      commonElements: ['sea creatures', 'exploration', 'discovery', 'beauty'],
      clothingStyle: 'swimwear or beach-appropriate clothing (swimsuit, beach clothes, casual summer wear)',
      clothingExamples: {
        correct: [
          'swimwear',
          'beach clothes',
          'swimsuit'
        ],
        wrong: [
          'casual clothes',
          'mavi ve kırmızı rahat giysiler'
        ]
      }
    },
  }
  
  return configs[normalizedTheme] || configs['adventure']
}

function buildCharacterDescription(
  name: string,
  age: number,
  gender: string,
  analysis?: any, // Optional: kept for backward compatibility
  step1Data?: { hairColor?: string; eyeColor?: string } // Step 1 data (preferred)
): string {
  let desc = `Name: ${name}\nAge: ${age} years old\nGender: ${gender}`
  
  // Prefer Step 1 data if available (simpler, no AI Analysis needed). Skin/face/build = reference image; only hair/eyes in prompt.
  if (step1Data && (step1Data.hairColor || step1Data.eyeColor)) {
    desc += `\n\nPHYSICAL APPEARANCE (use in every image – only what we have; rest from reference):`
    const hairStyle = 'natural'
    const hairLength = age <= 3 ? 'short' : age <= 7 ? 'medium' : 'long'
    const eyeShape = 'round'
    if (step1Data.hairColor) {
      desc += `\n- Hair: ${step1Data.hairColor} ${hairStyle} ${hairLength} hair`
    } else {
      desc += `\n- Hair: natural ${hairStyle} ${hairLength} hair`
    }
    if (step1Data.eyeColor) {
      desc += `\n- Eyes: ${step1Data.eyeColor} ${eyeShape} eyes`
    } else {
      desc += `\n- Eyes: brown ${eyeShape} eyes`
    }
    return desc
  }
  
  // Fallback: Use analysis data if available (backward compatibility)
  if (analysis?.finalDescription) {
    const char = analysis.finalDescription
    desc += `\n\nPHYSICAL APPEARANCE (use in every image):`
    
    if (char.skinTone) desc += `\n- Skin tone: ${char.skinTone}`
    if (char.hairColor && char.hairStyle && char.hairLength) {
      desc += `\n- Hair: ${char.hairColor} ${char.hairStyle} ${char.hairLength} hair`
    } else if (char.hairColor) {
      desc += `\n- Hair: ${char.hairColor}`
    }
    if (char.eyeColor && char.eyeShape) {
      desc += `\n- Eyes: ${char.eyeColor} ${char.eyeShape} eyes`
    } else if (char.eyeColor) {
      desc += `\n- Eyes: ${char.eyeColor}`
    }
    if (char.faceShape) desc += `\n- Face: ${char.faceShape} face shape`
    if (char.height && char.build) {
      desc += `\n- Build: ${char.height}, ${char.build}`
    }
    // v1.6.0: Do not add clothingStyle/clothingColors to story prompt; clothing comes from master only.
    
    if (char.uniqueFeatures && Array.isArray(char.uniqueFeatures) && char.uniqueFeatures.length > 0) {
      desc += `\n- Unique features: ${char.uniqueFeatures.join(', ')}`
    }
  } else if (analysis?.detectedFeatures) {
    // Fallback: Use detectedFeatures if finalDescription is not available
    const features = analysis.detectedFeatures
    desc += `\n\nPHYSICAL APPEARANCE (from photo analysis):`
    if (features.hairColor) desc += `\n- Hair: ${features.hairColor}`
    if (features.eyeColor) desc += `\n- Eyes: ${features.eyeColor}`
    if (features.faceShape) desc += `\n- Face: ${features.faceShape}`
    if (features.skinTone) desc += `\n- Skin tone: ${features.skinTone}`
  } else {
    // Minimal fallback: only hair/eyes; skin/face/build from reference image at image-generation time
    desc += `\n\nPHYSICAL APPEARANCE (use in every image – only what we have; rest from reference):`
    desc += `\n- Hair: natural hair`
    desc += `\n- Eyes: brown round eyes`
  }
  return desc
}

// ============================================================================
// Prompt Section Builder Functions (Faz 2: Bölümlere Ayırma)
// ============================================================================

function buildCharacterSection(
  characterDesc: string,
  characters?: Array<{ id: string; name?: string; type: { displayName: string } }>
): string {
  return `# CHARACTER${characters && characters.length > 1 ? 'S' : ''}
${characterDesc}`
}

function buildStoryRequirementsSection(
  themeConfig: ReturnType<typeof getThemeConfig>,
  characterAge: number,
  rac: ReadingAgeBracketConfig,
  pageCount: number,
  language: string,
  illustrationStyle: string,
): string {
  const n = resolveStoryPageCount(pageCount)
  const wordTarget = wordsPerPageRangeString(rac)
  const wordMin = rac.wordsPerPageMin
  const bandNote =
    rac.id === '0-1'
      ? '\n- Reading band 0-1: very short, read-aloud friendly lines; rhythm and repetition over plot; stay within the word band above.'
      : ''
  return `# STORY REQUIREMENTS
- Theme: ${themeConfig.name} (${themeConfig.mood} mood)
- Reading age band: ${rac.id} (listener / reader age range for this book)
- Character age (illustration reference): ~${characterAge} years old
- Story Length: EXACTLY ${n} pages (CRITICAL: You MUST return exactly ${n} interior pages, no more, no less. Cover is generated separately.)
- Words per page: ${wordTarget}. CRITICAL: Each page's "text" must be at least ${wordMin} words and at most ${rac.wordsPerPageMax} words (count words in the target story language).${bandNote}
- Language: ${getLanguageName(language)}
- Illustration Style: ${illustrationStyle}`
}

function buildStorySeedSection(customRequests: string, pageCount: number): string {
  const n = resolveStoryPageCount(pageCount)
  return `# STORY SEED
The author gave this idea for the story. Use it as the starting point.
- It describes how the story begins (e.g. who, where, what situation). Use that for the opening (pages 1–2).
- Then continue the same story step by step for the rest of the ${n} pages — the next natural events, one per page, until you reach a clear ending.
- Do not copy the text word for word; use it as the beginning and grow the story from there.

"${customRequests}"`
}

function buildSupportingEntitiesSection(
  theme: string,
  characters?: Array<{ name?: string; type?: { displayName?: string; group?: string } }>,
  customRequests?: string
): string {
  const petNames =
    characters
      ?.filter(c => c.type?.group === 'Pets' || (c.type?.displayName && ['Dog', 'Cat', 'Rabbit', 'Bird'].includes(c.type.displayName)))
      .map(c => c.name || c.type?.displayName)
      .filter(Boolean) ?? []
  const excludeRule =
    petNames.length > 0
      ? `\n- **CRITICAL:** Do NOT add to "supportingEntities" any animal that is already a CHARACTER (e.g. the family pet). The following are characters and must NOT appear in supportingEntities: ${petNames.join(', ')}. supportingEntities is ONLY for ADDITIONAL entities (e.g. a toy, a wild animal that is not the pet, or an important object like a photo or map). One pet = one character; do not duplicate it as an entity.`
      : ''

  const seedHint =
    customRequests?.trim()
      ? `
- **Story seed entities:** The STORY SEED names objects or animals. Include the **most plot-critical** among them in supportingEntities (see max count below). If the seed names more than two candidates, pick only the two that drive the story most (e.g. central prop + key animal).`
      : ''

  return `# SUPPORTING ENTITIES (Master-For-All-Entities)
Identify ADDITIONAL animals and important objects that appear in the story (each gets a master illustration).${excludeRule}${seedHint}
- Include only: objects or non-character animals that are **plot-significant** — the story names them, characters interact with them as their own thing (hold, find, share, talk to, solve a problem with), or they recur across pages as a focus — not as mere backdrop.
- Exclude: any character already in CHARACTER MAPPING; scenery and setting geometry (vegetation, terrain features, paths, water as “the place”, sky, weather); character clothing; vague “the forest” as an entity.
- **How many?** **At most 2** entries in \`supportingEntities\` (each entity = one paid master image). Include the one or two most plot-significant non-character animals or objects only. If many things appear in the story, choose the two that matter most to the plot; do not pad.
- Rules: unique name+id per entity; English visual description suitable for a standalone master sheet; list appearsOnPages for pages where the entity matters visually.
- JSON: \`supportingEntities\` array with id, type, name, description, appearsOnPages. **type** must be exactly \`animal\` or \`object\` (lowercase).
- **Language:** \`name\` and \`description\` must be **English** (image master API).

# SUGGESTED OUTFITS (for master illustrations)
Output "suggestedOutfits": an object with one entry per character. Keys = character IDs from CHARACTER MAPPING (exact UUIDs). Value for each key = one line in English describing that character's outfit for this story (e.g. "comfortable outdoor clothing, sneakers"; "casual dress, sandals"). Used for master character illustrations so each character's clothing fits the story. Match story setting and theme. If only one character, the object has one key.
- **Wardrobe consistency:** One outfit description per character applies to the **whole book** (master + page images use the same reference). Use the **same** clothing for all pages unless the story text **explicitly** changes it (e.g. pajamas at night, swimwear at the pool). Do not imply a different outfit per page without a clear story beat.`
}

function buildAgeAppropriateSection(rac: ReadingAgeBracketConfig): string {
  return `# AGE-APPROPRIATE GUIDELINES
- Vocabulary: ${rac.vocabularyLevel}
- Sentence Length: ${rac.sentenceLength}
- Complexity: ${rac.complexityLevel}
- Reading Time: ${rac.readingTimeMinutesPerPage} minutes per page`
}

function buildStoryStructureSection(
  characterName: string,
  pageCount: number,
  characters?: Array<{ id: string; name?: string; type: { displayName: string } }>
): string {
  const n = resolveStoryPageCount(pageCount)
  return `# STORY STRUCTURE
- **Cover:** Cover is generated separately; do NOT include cover in pages. pages[] = interior pages only.
- **pages[]:** EXACTLY ${n} items (interior pages only). No cover in this array.
- **Page 1 (first interior):** MUST be a completely different moment from the cover — different location, action, AND camera angle. The cover shows the book's PEAK dramatic moment; page 1 shows the BEGINNING (how the story starts, the ordinary world before the adventure). They must be visually unrelated scenes.
- **Narrative arc:** One clear story from beginning to end. First 1–2 pages set the situation; middle pages are the main events (things that happen, step by step); last 1–2 pages bring a clear resolution. The last page should feel like an ending.

# ONE STORY, STEP BY STEP
- Tell ONE coherent story; each page = the next natural step in the plot. Do not anchor to a single genre (e.g. only camping or only outdoor): the setting and events must follow the user's theme and STORY SEED.
- Abstract arc: opening → events unfold → resolution. No fixed checklist of locations; each step must follow from the previous page.
- If the story seed describes how the story starts, use it for the opening (pages 1–2). Then continue with the natural next steps of that same story — do not stretch one moment across many pages.
- Each page should change the situation in a small but real way: discovery, question, choice, obstacle, reaction, help, or resolution. Avoid a flat "then we went here, then we went there" rhythm.
- Each page's imagePrompt and sceneDescription should spell out that step clearly (where we are, what is happening), so each illustration is different.
- **Setting consistency:** If the STORY SEED names a venue type (e.g. indoor arena, gym, tournament final inside a hall), keep \`coverDescription\`, \`coverImagePrompt\`, every page's \`environmentDescription\`, and scene text aligned with that venue for the whole book. Do not jump mid-story to an outdoor park, open field, grass, or "open sky" stadium unless the user seed clearly asks for outdoor.

# SCENE MAP (plan before writing)
Before writing any page text, build sceneMap[] — one entry per page with: pageNumber, location (specific place name), timeOfDay, setting (one-sentence visual summary). Use this plan to guarantee visual diversity:
- **All sceneMap strings (location, timeOfDay, setting) must be English** — they are visual-planning fields for the image pipeline, not book text.
- Each page should have a distinct location OR distinct time of day from adjacent pages.
- Avoid the same location + same timeOfDay for 3 consecutive pages.
- The plan guides your imagePrompt and environmentDescription for each page.`
}

function buildThemeSpecificSection(
  themeConfig: ReturnType<typeof getThemeConfig>,
  theme: string
): string {
  return `# THEME
Use a setting, mood, and educational focus that fit the theme "${themeConfig.name}" and target age. Derive setting and events from the story you create.`
}

function buildVisualDiversitySection(): string {
  return `# VISUAL DIVERSITY
Each page = different scene. Vary location, time of day, perspective, composition, and character action/pose.
- Do NOT repeat the same pose or action on consecutive pages. Each page must have a distinctly different character action or pose (e.g. one page running, next page sitting or looking around; one page jumping, next page crouching or pointing).
- Do NOT use the same dominant action verb (sit, stand, walk, look, watch) on two consecutive pages. If page 4 is "looking at something", page 5 must involve a different kind of action (reaching, climbing, tasting, hiding, picking up, pointing, running, splashing, etc.).
- Checklist rhythm is FORBIDDEN. "First they went here, then they went there" is NOT a story. Each new scene must follow as a consequence of the previous page's action or discovery.
- Scene description and imagePrompt: detailed (150+ and 200+ chars).`
}

function exampleRhythmKeyForReading(rac: ReadingAgeBracketConfig): string {
  if (rac.id === '0-1' || rac.id === '1-3') return 'toddler'
  if (rac.id === '3-5') return 'preschool'
  return 'elementary'
}

function buildWritingStyleSection(
  rac: ReadingAgeBracketConfig,
  language: string,
  characterName: string,
  characters?: Array<{ name?: string; type: { displayName: string } }>
): string {
  const rhythmKey = exampleRhythmKeyForReading(rac)
  return `# WRITING STYLE
Each page: ${wordsPerPageRangeString(rac)} words (stay within this band). Include dialogue where appropriate for the band, sensory details (see, hear, feel), atmosphere. Show, don't just tell. Structure: opening + action/dialogue + emotion + transition.
- The story should read like a real picture-book story, not a summary of a day. Use cause-and-effect transitions between pages.
Example (${getLanguageName(language)}, rhythm reference for this band): ${getExampleText(rhythmKey, characterName, language, characters)}`
}

function buildIllustrationSection(
  illustrationStyle: string,
  characterName: string,
  characters?: Array<{ name?: string; type: { displayName: string } }>
): string {
  return `# ILLUSTRATION
Per page: write imagePrompt (200+ chars, cinematic) + sceneDescription (150+ chars). Illustration style: ${illustrationStyle}.
Apply the cinematic image direction from the system prompt: LIGHTING → DEPTH → COLOR → COMPOSITION → ATMOSPHERE.
Each page's imagePrompt MUST include a clear story action: what the character is actively DOING right now (specific verb + object or environment interaction) — not just where they are. Bad: "Arya stands in the garden." Good: "Arya reaches toward the beehive with one hand, eyes wide in awe, while Bal sniffs at the bark below."
STAGING (gaze & orientation): In sceneDescription, add 1 short English sentence describing WHERE each character is looking or facing — name a scene element, not the camera. Examples: "Arya looks up toward the beehive on the branch above." / "Bal looks toward Arya and sniffs the jar between them." / "Both characters face the winding path ahead." This replaces any camera-facing default and gives the image model a clear positive target.`
}

function buildOutputFormatSection(
  rac: ReadingAgeBracketConfig,
  pageCount: number,
): string {
  const n = resolveStoryPageCount(pageCount)
  return `# OUTPUT FORMAT
The response_format schema defines the full structure. Key field constraints:
- sceneMap[]: EXACTLY ${n} entries. Plan all page locations FIRST (before writing pages). Each entry: pageNumber, location, timeOfDay, setting — **all of location, timeOfDay, setting in English**.
- pages[]: EXACTLY ${n} items. Each page must have all schema fields.
- imagePrompt per page: 200+ chars, cinematic — apply LIGHTING/DEPTH/COLOR/COMPOSITION/ATMOSPHERE layers.
- sceneDescription per page: 150+ chars, specific to that step (location, time, action, mood).
- cameraDistance: **exactly** one of these four JSON strings (lowercase, no spaces): "close", "medium", "wide", "establishing". Never use compounds like "medium-wide" or "close-up" — pick the single best match. Prefer "wide"/"establishing" (character 30-40% of frame). Vary per page.
- shotPlan: 6 English strings (shotType, lens, cameraAngle, placement, timeOfDay, mood). Each must be a non-empty string (no null/empty). All real values — not placeholders.
- characterIds[]: use exact UUIDs from CHARACTER MAPPING for each page.
- characterExpressions{}: one key per character on that page — value = visual description (eyes, brows, mouth).
- suggestedOutfits{}: one key per character UUID from CHARACTER MAPPING — value = one-line English outfit.
- metadata: { ageGroup, theme, educationalThemes: [], safetyChecked: true } — ageGroup must be **exactly** one of: toddler, preschool, early-elementary, elementary, pre-teen (use "${rac.metadataAgeGroup}" for this book). safetyChecked must be JSON boolean true/false, not a string.
See # VERIFICATION CHECKLIST for final checks.`
}

/** A3: Single verification block – no duplicate verify/check across LANGUAGE, OUTPUT FORMAT, CRITICAL REMINDERS. PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md */
function buildVerificationChecklistSection(
  rac: ReadingAgeBracketConfig,
  characterName: string,
  themeConfig: ReturnType<typeof getThemeConfig>,
  pageCount: number,
  language: string
): string {
  const n = resolveStoryPageCount(pageCount)
  const langName = getLanguageName(language)
  return `# VERIFICATION CHECKLIST (before returning JSON)
- sceneMap[]: EXACTLY ${n} entries (one per page). All pageNumbers present; locations varied across pages.
- pages[]: EXACTLY ${n} items. characterIds REQUIRED per page (exact UUIDs from CHARACTER MAPPING).
- coverImagePrompt: 4-8 sentences, English, movie-poster composition (see system). REQUIRED.
- coverDescription: 2-4 sentences, English, reader-facing summary. REQUIRED.
- suggestedOutfits: one key per character UUID; value = one-line English outfit. REQUIRED.
- characterExpressions per page: one key per character on that page; value = visual (eyes, brows, mouth). REQUIRED.
- environmentDescription per page: specific, story-driven background (not generic). REQUIRED.
- cameraDistance per page: exactly "close", "medium", "wide", or "establishing" only (no hyphens, no extra words). Vary; prefer wide/establishing.
- shotPlan per page: 6 non-empty English strings (no null). Vary timeOfDay and mood across pages.
- metadata.ageGroup: exactly one of toddler, preschool, early-elementary, elementary, pre-teen. metadata.safetyChecked: boolean.
- supportingEntities: **at most 2** entries; each .type exactly "animal" or "object" only; no scenery-only entities; pick the most important plot objects/animals (story seed candidates prioritized among equals).
- Every page "text" in ${langName}; **title** prefer ${langName} when the book is not English. **All other JSON strings** (sceneMap, supportingEntities, cover fields, per-page visual fields, metadata theme/educationalThemes text): **English only**.
- Word count: each page "text" must be between ${rac.wordsPerPageMin} and ${rac.wordsPerPageMax} words (in the story language); expand or trim to fit.
- ${characterName} = main character in every scene. Positive, age-appropriate content.`
}

// ============================================================================
// Language Helper Functions
// ============================================================================

function getLanguageName(language: string = 'en'): string {
  const languageMap: Record<string, string> = {
    'en': 'English',
    'tr': 'Turkish',
    'de': 'German',
    'fr': 'French',
    'es': 'Spanish',
    'zh': 'Chinese (Mandarin)',
    'pt': 'Portuguese',
    'ru': 'Russian',
  }
  return languageMap[language] || 'English'
}

// ============================================================================
// Response Schema (A2 + A7) — json_schema response_format
// ============================================================================

/**
 * JSON Schema for the story generation response.
 * Used as response_format: { type: 'json_schema', json_schema: { name: 'story_output', strict: false, schema: buildStoryResponseSchema() } }
 *
 * Note: strict: false because suggestedOutfits and characterExpressions have dynamic UUID keys
 * (cannot define additionalProperties: false for those). Upgrade to strict: true requires
 * converting those to arrays.
 *
 * A7: sceneMap[] — per-page location plan — added to schema and prompt.
 */
export function buildStoryResponseSchema() {
  return {
    type: 'object',
    properties: {
      title: { type: 'string' },
      coverDescription: { type: 'string' },
      coverImagePrompt: { type: 'string' },
      sceneMap: {
        type: 'array',
        description: 'One entry per page — planned BEFORE writing pages. English only for location, timeOfDay, setting (image pipeline).',
        items: {
          type: 'object',
          properties: {
            pageNumber: { type: 'integer' },
            location: { type: 'string', description: 'English. Specific place name (e.g. "kitchen counter", "moonlit garden")' },
            timeOfDay: { type: 'string', description: 'English. e.g. "morning", "golden hour", "night"' },
            setting: { type: 'string', description: 'English. One-sentence visual summary of the environment' },
          },
          required: ['pageNumber', 'location', 'timeOfDay', 'setting'],
        },
      },
      pages: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            pageNumber: { type: 'integer' },
            text: { type: 'string' },
            imagePrompt: { type: 'string', description: '200+ chars. Cinematic: LIGHTING, DEPTH, COLOR, COMPOSITION, ATMOSPHERE. No appearance/clothing.' },
            sceneDescription: { type: 'string', description: '150+ chars. Location, time, action, mood.' },
            environmentDescription: { type: 'string', description: 'Specific background/environment for this page.' },
            cameraDistance: { type: 'string', enum: ['close', 'medium', 'wide', 'establishing'] },
            characterIds: { type: 'array', items: { type: 'string' } },
            characterExpressions: { type: 'object', description: 'Keys = character UUIDs. Values = visual expression (eyes, brows, mouth).' },
            shotPlan: {
              type: 'object',
              properties: {
                shotType: { type: 'string' },
                lens: { type: 'string' },
                cameraAngle: { type: 'string' },
                placement: { type: 'string' },
                timeOfDay: { type: 'string' },
                mood: { type: 'string' },
              },
              required: ['shotType', 'lens', 'cameraAngle', 'placement', 'timeOfDay', 'mood'],
            },
          },
          required: [
            'pageNumber', 'text', 'imagePrompt', 'sceneDescription',
            'environmentDescription', 'cameraDistance', 'characterIds',
            'characterExpressions', 'shotPlan',
          ],
        },
      },
      supportingEntities: {
        type: 'array',
        description:
          'Plot-significant non-character entities for entity-master images. Props or animals only; name and description English; not scenery. Let story content determine count.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['animal', 'object'] },
            name: { type: 'string', description: 'English display name for the entity' },
            description: { type: 'string', description: 'English visual description for master illustration' },
            appearsOnPages: { type: 'array', items: { type: 'integer' } },
          },
          required: ['id', 'type', 'name', 'description', 'appearsOnPages'],
        },
      },
      suggestedOutfits: { type: 'object', description: 'Keys = character UUIDs. Values = one-line English outfit.' },
      metadata: {
        type: 'object',
        properties: {
          ageGroup: { type: 'string' },
          theme: { type: 'string' },
          educationalThemes: { type: 'array', items: { type: 'string' } },
          safetyChecked: { type: 'boolean' },
        },
        required: ['ageGroup', 'theme', 'educationalThemes', 'safetyChecked'],
      },
    },
    required: [
      'title', 'coverDescription', 'coverImagePrompt', 'sceneMap',
      'pages', 'supportingEntities', 'suggestedOutfits', 'metadata',
    ],
  }
}

// ============================================================================
// System Prompt Builder (v3.0.0 — A1/A5/A6)
// ============================================================================

/**
 * Builds the FIXED OpenAI system message for story generation.
 * Contains: role, safety, language rule, DO NOT DESCRIBE, cinematic imagePrompt directive (A5),
 * character expressions guide, and cover image (film poster) directive (A6).
 *
 * Usage: pass as messages[0].content; generateStoryPrompt() output goes in messages[1].content.
 */
export function buildStorySystemPrompt(language: string): string {
  const langName = getLanguageName(language)

  return `You are a professional children's book author and visual director. Create engaging, age-appropriate stories and return a single valid JSON object — no markdown, no explanation.

# LANGUAGE (CRITICAL)
- **Reader-facing story text:** only \`pages[].text\` MUST be 100% in ${langName} (every page, dialogue included). If ${langName} is not English, do not write story text in English.
- **Book title:** \`title\` — prefer ${langName} when the book is not English (matches the reader).
- **Everything else in the JSON** is for pipelines and image APIs — **English only**: \`sceneMap\` (location, timeOfDay, setting), \`supportingEntities\` (name, description), \`imagePrompt\`, \`sceneDescription\`, \`environmentDescription\`, \`coverDescription\`, \`coverImagePrompt\`, \`shotPlan\`, \`characterExpressions\`, \`suggestedOutfits\`, and **metadata** string fields (\`theme\`, \`educationalThemes\` entries).

# STORY PRINCIPLES
- Cover is generated separately; pages[] = interior pages only. Do NOT put a cover in pages[].
- Narrative arc: opening (1-2 pages) → events unfold → resolution. Last page = clear ending.
- ONE coherent story; each page = the next natural step. No abrupt scene jumps.
- Avoid itinerary/checklist storytelling. The next page should happen because of the previous page, not just because the character moved somewhere else.

# CONTENT RULES (DO NOT DESCRIBE)
(a) pages[].text — no visual details: no appearance, clothing, or colors. Narrative only: actions, emotions, location, plot.
(b) imagePrompt / sceneDescription — do NOT describe character appearance or clothing (the master reference handles identity). DO include: scene, environment, light, composition, atmosphere.

# SAFETY (MUST FOLLOW)
Include: positive uplifting message, kindness/friendship/courage themes, happy or hopeful ending.
Avoid: violence, scary monsters, death, injury, abandonment, adult themes, dark imagery, hopeless endings.

# CINEMATIC IMAGE DIRECTION
Every page's imagePrompt is a scene brief for a cinematic children's book illustration. Structure it with these five layers (200+ chars total):
- LIGHTING: quality and direction of light (soft morning glow, warm golden hour rays, cool blue dusk, rim lighting from window, diffused overcast, etc.)
- DEPTH: three layers — foreground detail (small object, floor texture, leaf, dropped item), mid-ground (character in action), background (setting atmosphere). Give each layer at least one visual element.
- COLOR: dominant palette + accent (warm amber walls with a pop of turquoise, soft pastels with one vivid red element, cool blues with warm lantern glow, etc.)
- COMPOSITION: camera distance and angle (wide establishing shot from low angle, close-up on hands and object, over-shoulder medium shot, bird's-eye-view, etc.)
- ATMOSPHERE: emotional tone in environment (golden dust motes, sense of vast open space, cozy warmth, magical shimmer, anticipation in stillness, etc.)
Do NOT include character appearance or clothing in imagePrompt. Focus on scene, light, color, depth, and atmosphere.

# CHARACTER EXPRESSIONS
For each page, describe EACH character's facial expression in characterExpressions (keys = character IDs from CHARACTER MAPPING). Use specific visual language — eyes, eyebrows, mouth — NOT just emotion words.
Good: "eyes wide with surprise, eyebrows raised high, mouth slightly open"
Bad: "surprised"
Vary expressions per page and per character. Multiple characters can have different expressions simultaneously (e.g. one laughing while another looks concerned). Think like a film director.

# COVER IMAGE (coverImagePrompt)
The cover is a MOVIE POSTER for this book. Ask yourself: "What single moment from this story would make a child reach out and pick up this book?" — write THAT as the cover. It must be the peak dramatic, exciting, or emotionally resonant moment of the story, NOT the opening scene and NOT a generic standing pose.
- Characters must be DOING something in the cover image — active pose that tells a story (e.g. "leaping over a stream", "holding up a glowing jar to the light", "hiding behind a giant flower while peeking at a bee") — not simply standing or walking
- Bold, iconic composition with all main characters in action
- The setting that best represents this book's world (peak location or most memorable environment)
- Upper third: clear, simpler area (soft sky gradient, ceiling, blurred background, plain wall) matching THIS story's setting — reserved for title text
- The cover and page 1 MUST show different moments, locations, and actions — describe them as visually unrelated scenes
- No typography or written words anywhere in the scene
- 4-8 sentences, English only`
}
