import type { StoryGenerationInput, StoryGenerationOutput, PromptVersion } from '../types'

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
  version: '2.8.0',
  releaseDate: new Date('2026-03-20'),
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
  } = input

  // Get age-appropriate rules
  const ageGroup = getAgeGroup(characterAge)
  const safetyRules = getSafetyRules(ageGroup)
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
      characterDesc += `\n- Each Family Member should appear in at least ${Math.max(3, Math.floor(getPageCount(ageGroup, pageCount) * 0.4))} pages`
      characterDesc += `\n- DO NOT exclude any Family Member from the story - ALL must be included`
    }
    
    characterDesc += `\n\n**CHARACTER DISTRIBUTION REQUIREMENTS:**`
    characterDesc += `\n- ALL ${characters.length} characters should appear throughout the story`
    characterDesc += `\n- Each character should appear in at least ${Math.max(2, Math.floor(getPageCount(ageGroup, pageCount) * 0.3))} pages`
    characterDesc += `\n- Main character (${characterName}) will appear in most/all pages`
    if (characters.length > 2) {
      characterDesc += `\n- Pages 2-${Math.floor(getPageCount(ageGroup, pageCount) * 0.6)} should feature at least 2 characters`
      characterDesc += `\n- Pages ${Math.floor(getPageCount(ageGroup, pageCount) * 0.6) + 1}-${getPageCount(ageGroup, pageCount)} should feature all ${characters.length} characters when possible`
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

  // Faz 2: Prompt bölümlerini oluştur (açılış system'de; tekrar yok)
  const sections = [
    buildCharacterSection(characterDesc, characters),
    buildStoryRequirementsSection(themeConfig, characterAge, ageGroup, pageCount ?? 12, language, illustrationStyle),
    ...(customRequests?.trim() ? [buildStorySeedSection(customRequests.trim(), pageCount ?? 12, ageGroup)] : []),
    buildSupportingEntitiesSection(theme, characters), // Pets must NOT be duplicated in supportingEntities
    buildLanguageSection(language),
    buildAgeAppropriateSection(ageGroup),
    buildStoryStructureSection(characterName, ageGroup, pageCount ?? 12, characters),
    buildThemeSpecificSection(themeConfig, ageGroup, theme),
    buildVisualDiversitySection(),
    buildWritingStyleSection(ageGroup, language, characterName, characters),
    buildSafetySection(ageGroup),
    buildIllustrationSection(illustrationStyle, characterName, characters),
    buildOutputFormatSection(ageGroup, pageCount ?? 12, illustrationStyle, theme, themeConfig, characters || [], characterName),
    buildVerificationChecklistSection(ageGroup, characterName, themeConfig, pageCount ?? 12, language),
    `Generate the story now in valid JSON format with EXACTLY ${getPageCount(ageGroup, pageCount)} pages.`
  ]
  
  return sections.join('\n\n').trim()
}

// ============================================================================
// Helper Functions
// ============================================================================

function getAgeGroup(age: number): string {
  if (age <= 3) return 'toddler'
  if (age <= 5) return 'preschool'
  if (age <= 7) return 'early-elementary'
  if (age <= 9) return 'elementary'
  return 'pre-teen'
}

function getPageCount(ageGroup: string, override?: number): number {
  // Debug: Allow page count override (2-20)
  if (override !== undefined && override >= 2 && override <= 20) {
    return override
  }
  
  // Varsayılan: 12 sayfa (isteğe göre 2–20 override ile değiştirilebilir)
  return 12
  
  // Previous logic (commented out for reference):
  // const counts: Record<string, number> = {
  //   toddler: 6,
  //   preschool: 8,
  //   'early-elementary': 10,
  //   elementary: 12,
  //   'pre-teen': 14,
  // }
  // return counts[ageGroup] || 10
}

function getVocabularyLevel(ageGroup: string): string {
  const levels: Record<string, string> = {
    toddler: 'very simple, common words only',
    preschool: 'simple words, basic concepts',
    'early-elementary': 'simple to moderate words, some new vocabulary',
    elementary: 'moderate vocabulary, age-appropriate challenges',
    'pre-teen': 'rich vocabulary, complex concepts',
  }
  return levels[ageGroup] || 'age-appropriate'
}

function getSentenceLength(ageGroup: string): string {
  // Aksiyon planı 1.3: mikro "3-5 words" kaldırıldı; doğal kurallar
  const lengths: Record<string, string> = {
    toddler: 'very short sentences, simple verbs, lots of repetition',
    preschool: 'short sentences, simple structure',
    'early-elementary': 'short to medium sentences',
    elementary: 'medium sentences, clear cause-effect',
    'pre-teen': 'medium to long sentences',
  }
  return lengths[ageGroup] || 'age-appropriate'
}

function getComplexityLevel(ageGroup: string): string {
  const levels: Record<string, string> = {
    toddler: 'very simple, repetitive, predictable',
    preschool: 'simple with gentle surprises',
    'early-elementary': 'moderate with clear cause-effect',
    elementary: 'moderate complexity with problem-solving',
    'pre-teen': 'more complex with deeper themes',
  }
  return levels[ageGroup] || 'age-appropriate'
}

/** Yaş bandına göre hedef kelime sayısı (basılı kitap için artırılmış hedefler – 7 Şubat 2026) */
function getWordCountRange(ageGroup: string): string {
  const ranges: Record<string, string> = {
    toddler: '30-45',
    preschool: '45-65',
    'early-elementary': '70-95',
    elementary: '95-125',
    'pre-teen': '130-180',
  }
  return ranges[ageGroup] || '70-95'
}

/** Yaş bandına göre sayfa başı minimum kelime (CRITICAL talimat ve post-process için) */
export function getWordCountMin(ageGroup: string): number {
  const mins: Record<string, number> = {
    toddler: 30,
    preschool: 45,
    'early-elementary': 70,
    elementary: 95,
    'pre-teen': 130,
  }
  return mins[ageGroup] ?? 70
}

function getWordCount(ageGroup: string): string {
  return getWordCountRange(ageGroup)
}

function getReadingTime(ageGroup: string): number {
  const times: Record<string, number> = {
    toddler: 1,
    preschool: 2,
    'early-elementary': 3,
    elementary: 4,
    'pre-teen': 5,
  }
  return times[ageGroup] || 3
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

function getSafetyRules(ageGroup: string) {
  return {
    mustInclude: [
      'Positive, uplifting message',
      'Age-appropriate problem-solving',
      'Kindness, friendship, or courage themes',
      'Safe, supportive environment',
      'Happy or hopeful ending',
    ],
    mustAvoid: [
      'Violence, fighting, weapons',
      'Scary monsters, ghosts, or nightmares',
      'Death, injury, or harm to characters',
      'Abandonment or separation anxiety',
      'Adult themes or situations',
      'Negative stereotypes',
      'Commercialism or brand names',
      'Dark, frightening imagery',
      'Hopeless or sad endings',
    ],
  }
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

// ============================================================================
// Educational Focus Helper
// ============================================================================

function getEducationalFocus(ageGroup: string, theme: string): string {
  const t = (theme || '').toString().trim().toLowerCase()
  const normalizedTheme =
    t === 'sports&activities' || t === 'sports_activities' || t === 'sports-activities'
      ? 'sports'
      : t

  const focuses: Record<string, string[]> = {
    toddler: ['colors', 'shapes', 'counting', 'emotions'],
    preschool: ['sharing', 'kindness', 'curiosity', 'basic concepts'],
    'early-elementary': ['problem-solving', 'creativity', 'friendship', 'courage'],
    elementary: ['perseverance', 'teamwork', 'responsibility', 'empathy'],
    'pre-teen': ['self-confidence', 'resilience', 'critical thinking', 'ethics'],
  }
  
  const themeFocuses: Record<string, string> = {
    adventure: 'courage and exploration',
    sports: 'movement, teamwork, and healthy habits',
    fantasy: 'imagination and creativity',
    animals: 'empathy and care for animals',
    'daily-life': 'social-emotional skills',
    space: 'curiosity and science',
    educational: 'curiosity, science, and learning',
    custom: 'creativity and imagination',
    underwater: 'environmental awareness',
  }
  
  const ageFocus = focuses[ageGroup] || focuses['elementary']
  const themeFocus = themeFocuses[normalizedTheme] || 'general growth'
  
  return `${themeFocus}, ${ageFocus.join(', ')}`
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
  ageGroup: string,
  pageCount: number,
  language: string,
  illustrationStyle: string,
): string {
  const n = getPageCount(ageGroup, pageCount)
  const wordTarget = getWordCountRange(ageGroup)
  const wordMin = getWordCountMin(ageGroup)
  return `# STORY REQUIREMENTS
- Theme: ${themeConfig.name} (${themeConfig.mood} mood)
- Target Age: ${characterAge} years old (${ageGroup} age group)
- Story Length: EXACTLY ${n} pages (CRITICAL: You MUST return exactly ${n} interior pages, no more, no less. Cover is generated separately.)
- Words per page: ${wordTarget}. CRITICAL: Each page's "text" must be at least ${wordMin} words. Do not write a page with only 1–2 sentences; expand the narrative, add sensory details or a short dialogue to reach the minimum.
- Language: ${getLanguageName(language)}
- Illustration Style: ${illustrationStyle}`
}

function buildStorySeedSection(customRequests: string, pageCount: number, ageGroup: string): string {
  const n = getPageCount(ageGroup, pageCount)
  return `# STORY SEED
The author gave this idea for the story. Use it as the starting point.
- It describes how the story begins (e.g. who, where, what situation). Use that for the opening (pages 1–2).
- Then continue the same story step by step for the rest of the ${n} pages — the next natural events, one per page, until you reach a clear ending.
- Do not copy the text word for word; use it as the beginning and grow the story from there.

"${customRequests}"`
}

function buildSupportingEntitiesSection(
  theme: string,
  characters?: Array<{ name?: string; type?: { displayName?: string; group?: string } }>
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

  return `# SUPPORTING ENTITIES (Master-For-All-Entities)
Identify ADDITIONAL animals and important objects that appear in the story (each gets a master illustration).${excludeRule}
- Include: only animals/objects that are NOT already in the character list (e.g. a toy, a second animal that is not the family pet, or a key object like a camping photo). Exclude: the family pet (it is already a character); background-only elements (e.g. trees, rocks); character clothing.
- Rules: unique name+id per entity; visual description for master; same name throughout; list appearsOnPages.
- JSON: include "supportingEntities" array with id, type (animal|object), name, description, appearsOnPages. Leave the array empty [] if the only animals/objects in the story are the characters themselves.

# SUGGESTED OUTFITS (for master illustrations)
Output "suggestedOutfits": an object with one entry per character. Keys = character IDs from CHARACTER MAPPING (exact UUIDs). Value for each key = one line in English describing that character's outfit for this story (e.g. "comfortable outdoor clothing, sneakers"; "casual dress, sandals"). Used for master character illustrations so each character's clothing fits the story. Match story setting and theme. If only one character, the object has one key.`
}

function buildLanguageSection(language: string): string {
  const langName = getLanguageName(language)
  return `# LANGUAGE
- **Page "text" only:** Write the story narrative (the "text" field for each page) in ${langName} only. This is what appears in the book. Do not use words from other languages in "text".
- **All other fields** (imagePrompt, sceneDescription, environmentDescription, coverDescription, coverImagePrompt, shotPlan, characterExpressions, suggestedOutfits): Always in English only. These fields are used for image generation APIs and must be in English.`
}

function buildAgeAppropriateSection(ageGroup: string): string {
  return `# AGE-APPROPRIATE GUIDELINES
- Vocabulary: ${getVocabularyLevel(ageGroup)}
- Sentence Length: ${getSentenceLength(ageGroup)}
- Complexity: ${getComplexityLevel(ageGroup)}
- Reading Time: ${getReadingTime(ageGroup)} minutes per page`
}

function buildStoryStructureSection(
  characterName: string,
  ageGroup: string,
  pageCount: number,
  characters?: Array<{ id: string; name?: string; type: { displayName: string } }>
): string {
  const n = getPageCount(ageGroup, pageCount)
  return `# STORY STRUCTURE
- **Cover:** Cover is generated separately; do NOT include cover in pages. pages[] = interior pages only.
- **pages[]:** EXACTLY ${n} items (interior pages only). No cover in this array.
- **Page 1 (first interior):** Must differ from the cover (different moment, angle, or setting).
- **Narrative arc:** One clear story from beginning to end. First 1–2 pages set the situation; middle pages are the main events (things that happen, step by step); last 1–2 pages bring a clear resolution. The last page should feel like an ending.

# ONE STORY, STEP BY STEP
- Tell ONE coherent story; each page = the next natural step in the plot. Do not anchor to a single genre (e.g. only camping or only outdoor): the setting and events must follow the user's theme and STORY SEED.
- Abstract arc: opening → events unfold → resolution. No fixed checklist of locations; each step must follow from the previous page.
- If the story seed describes how the story starts, use it for the opening (pages 1–2). Then continue with the natural next steps of that same story — do not stretch one moment across many pages.
- Each page's imagePrompt and sceneDescription should spell out that step clearly (where we are, what is happening), so each illustration is different.
- **Setting consistency:** If the STORY SEED names a venue type (e.g. indoor arena, gym, tournament final inside a hall), keep \`coverDescription\`, \`coverImagePrompt\`, every page's \`environmentDescription\`, and scene text aligned with that venue for the whole book. Do not jump mid-story to an outdoor park, open field, grass, or "open sky" stadium unless the user seed clearly asks for outdoor.`
}

function buildThemeSpecificSection(
  themeConfig: ReturnType<typeof getThemeConfig>,
  ageGroup: string,
  theme: string
): string {
  return `# THEME
Use a setting, mood, and educational focus that fit the theme "${themeConfig.name}" and target age. Do not list fixed examples; derive them from the story you create.

# DO NOT DESCRIBE VISUAL DETAILS (two rules)
(a) **pages[].text (story narrative):** No visual details (no appearance, clothing, object colors). Focus on actions, emotions, location, time of day, plot. Narrative only.
(b) **imagePrompt / sceneDescription:** Do NOT describe character appearance or clothing (master provides that). DO include: lighting, color, composition, atmosphere, camera angle, environment detail. sceneContext = short location/time/action only, in English (derive from THIS story; no fixed sample scene).`
}

function buildVisualDiversitySection(): string {
  return `# VISUAL DIVERSITY
Each page = different scene. Vary location, time of day, perspective, composition, and character action/pose.
- Do NOT repeat the same pose or action on consecutive pages. Each page must have a distinctly different character action or pose (e.g. one page running, next page sitting or looking around; one page jumping, next page crouching or pointing).
- Scene description and imagePrompt: detailed (150+ and 200+ chars).`
}

function buildWritingStyleSection(
  ageGroup: string,
  language: string,
  characterName: string,
  characters?: Array<{ name?: string; type: { displayName: string } }>
): string {
  return `# WRITING STYLE
Each page: ${getWordCount(ageGroup)} words (stay within this range). Include dialogue, sensory details (see, hear, feel), atmosphere. Show, don't just tell. Structure: opening + action/dialogue + emotion + transition. Example (${getLanguageName(language)}): ${getExampleText(ageGroup, characterName, language, characters)}`
}

function buildSafetySection(ageGroup: string): string {
  const safetyRules = getSafetyRules(ageGroup)
  return `# SAFETY RULES (CRITICAL - MUST FOLLOW)
## MUST INCLUDE:
${safetyRules.mustInclude.map(rule => `- ${rule}`).join('\n')}

## ABSOLUTELY AVOID:
${safetyRules.mustAvoid.map(rule => `- ${rule}`).join('\n')}`
}

function buildIllustrationSection(
  illustrationStyle: string,
  characterName: string,
  characters?: Array<{ name?: string; type: { displayName: string } }>
): string {
  return `# ILLUSTRATION
Per page: scene description + detailed image prompt (${illustrationStyle}). Visual safety: avoid holding hands, detailed hand objects, complex gestures. Prefer hands at sides, simple poses.

# CHARACTER FACIAL EXPRESSIONS (CRITICAL)
For each page, describe EACH character's facial expression separately in the characterExpressions object. Use specific visual details of eyes, eyebrows, and mouth—NOT just emotion words.

- GOOD: "eyes wide with surprise, eyebrows raised high, mouth slightly open in astonishment"
- BAD: "surprised"

Vary expressions by page and by character. Not every character should be 'happy' or 'smiling' on every page. Use expressions that match the scene mood:
- Sad: downturned mouth, eyebrows raised at inner corners, eyes looking down
- Worried/Concerned: furrowed eyebrows, tense face, mouth pressed in line
- Curious: eyes wide, eyebrows slightly raised, head tilted
- Angry: furrowed eyebrows, narrowed eyes, mouth turned down
- Focused: narrowed eyes, eyebrows slightly furrowed, mouth closed neutral
- Surprised: wide eyes, eyebrows raised, mouth open
- Happy/Joyful: smile (describe if teeth showing, eyes crinkled, etc.)
- Calm/Gentle: soft closed-mouth smile, relaxed eyebrows, calm eyes

If multiple characters are in the scene, each can have a DIFFERENT expression. Example: one child surprised while adult is calm; or one character laughing while another looks concerned. Make it visual, like a film director's note.`
}

function buildOutputFormatSection(
  ageGroup: string,
  pageCount: number,
  illustrationStyle: string,
  theme: string,
  themeConfig: ReturnType<typeof getThemeConfig>,
  characters: Array<{ id: string; name?: string; type: { displayName: string; group?: string } }>,
  characterName: string
): string {
  const characterIdsList = characters.map(c => c.id).join(', ')
  const familyMembers = characters.filter(c => c.type?.group === "Family Members")
  const familyMembersList = familyMembers.map(c => c.name || c.type.displayName).join(', ')
  
  return `# OUTPUT FORMAT (JSON)
Return a valid JSON object:
{
  "title": "Story title",
  "coverDescription": "English. 2-4 sentences: vivid, reader-friendly summary of what the cover shows (setting, story hook, mood). For humans and UI; may overlap with coverImagePrompt but stay concise.",
  "coverImagePrompt": "English REQUIRED. 4-8 sentences for the COVER IMAGE API (primary input when combined with system layout). Describe a children's BOOK COVER (not a random interior page): (1) main scene and emotional beat, (2) composition: clear quieter or simpler area in the upper third for title text (e.g. ceiling, soft sky, blurred shelves, gradient wall) matching THIS setting, (3) one strong focal moment, (4) lighting and atmosphere. Do NOT repeat full character appearance (hair, eyes, skin) — the master reference handles that. Use character names from CHARACTER MAPPING for actions only. No typography or written words in the scene.",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Page text (${getWordCount(ageGroup)} words, dialogue + descriptions)",
      "imagePrompt": "English only. Detailed ${illustrationStyle} prompt (200+ chars): location, time of day, composition, character action. No appearance/clothing (master). Each page = distinct scene.",
      "sceneDescription": "English only. Detailed scene (150+ chars): location, time, action, mood. No appearance/clothing.",
      "environmentDescription": "English only. Specific background/environment for THIS page: what fills the frame (walls, floor, ceiling, horizon, objects, light sources) matching the story — indoor, outdoor, or any setting as required. Story-specific; no generic filler.",
      "cameraDistance": "wide",
      "characterIds": ["id-from-CHARACTER-MAPPING"],
      "characterExpressions": {
        "character-id-1": "English only. Visual description of THIS character's facial expression for this page (eyes, eyebrows, mouth). Example: 'eyes wide with surprise, eyebrows raised, mouth slightly open'",
        "character-id-2": "English only. Visual description for second character (if present). Example: 'calm gentle smile, eyes crinkled at corners, relaxed eyebrows'"
      },
      "shotPlan": { "shotType": "<string — your choice for this page>", "lens": "<string — focal length for this scene>", "cameraAngle": "<string>", "placement": "<string>", "timeOfDay": "<string — must match this page>", "mood": "<string — must match this page>" }
    }
  ],
  "supportingEntities": [ { "id": "entity-id", "type": "animal"|"object", "name": "Name", "description": "Visual for master", "appearsOnPages": [2,3] } ],
  "suggestedOutfits": { ${characters.length > 0 ? characters.map(c => `"${c.id}": "one line English outfit"`).join(', ') : '"<uuid-from-CHARACTER_ID_MAP>": "one line English outfit"'} },
  "metadata": { "ageGroup": "${ageGroup}", "theme": "${theme}", "educationalThemes": [], "safetyChecked": true }
}
coverImagePrompt REQUIRED: 4-8 sentences, English, book-cover composition brief (see schema above). Primary scene text for cover image generation before system adds identity/style.
coverDescription REQUIRED: 2-4 sentences, English, vivid cover summary for readers.
environmentDescription REQUIRED per page: specific background/environment for that page (not generic templates). Be story-specific.
cameraDistance REQUIRED per page: "close" | "medium" | "wide" | "establishing". Use "wide" or "establishing" to keep character small in frame (30-40%); use "close" only for emotional close-ups. Vary per page.
shotPlan REQUIRED per page: six English strings (shotType, lens, cameraAngle, placement, timeOfDay, mood). Replace the angle-bracket hints in the schema with real values for each page; vary timeOfDay and mood across pages when the story allows.
Required fields and checks: see # VERIFICATION CHECKLIST below.`
}

/** A3: Single verification block – no duplicate verify/check across LANGUAGE, OUTPUT FORMAT, CRITICAL REMINDERS. PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md */
function buildVerificationChecklistSection(
  ageGroup: string,
  characterName: string,
  themeConfig: ReturnType<typeof getThemeConfig>,
  pageCount: number,
  language: string
): string {
  const n = getPageCount(ageGroup, pageCount)
  const langName = getLanguageName(language)
  return `# VERIFICATION CHECKLIST (before returning JSON)
- Return EXACTLY ${n} pages. characterIds REQUIRED per page (use IDs from CHARACTER MAPPING).
- coverImagePrompt REQUIRED: 4-8 sentences, English, book-cover composition (layout + focal moment + lighting + setting). Drives cover image together with pipeline layout.
- coverDescription REQUIRED: 2-4 sentences, English, reader-facing cover summary.
- suggestedOutfits REQUIRED: one key per character ID from CHARACTER MAPPING, value = one line English outfit (used for master illustration).
- characterExpressions REQUIRED per page: one key per character ID in that page's characterIds; value = short English visual description (eyes, eyebrows, mouth).
- environmentDescription REQUIRED per page: specific background/environment (not generic). Story-specific.
- cameraDistance REQUIRED per page: "close" | "medium" | "wide" | "establishing". Vary per page; prefer "wide"/"establishing" for most pages.
- shotPlan REQUIRED per page: shotType, lens, cameraAngle, placement, timeOfDay, mood (English; vary per page).
- Verify every page "text" is in ${langName}; all other fields in English.
- Each page = one step in the story; imagePrompt describes that step clearly so each illustration is different.
- Word count: any page with fewer than ${getWordCountMin(ageGroup)} words must be expanded.
- ${characterName} = main character in every scene. Positive, age-appropriate, no scary/violent content.`
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

const baseStoryPrompts = {
  VERSION,
  generateStoryPrompt,
}
export default baseStoryPrompts

