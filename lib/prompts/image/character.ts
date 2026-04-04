import type { CharacterDescription, PromptVersion } from '../types'

/**
 * Character Analysis and Consistency System - Version 1.0.0
 * 
 * This system ensures character consistency:
 * 1. Across all pages in a single book
 * 2. Across all books for the same user
 * 3. From reference photo to generated images
 * 
 * Flow:
 * 1. User uploads photo → Analyze once → Save as "Master Character"
 * 2. User creates Book 1 → Use Master Character
 * 3. User creates Book 2 → Use same Master Character
 * 4. User creates Book 3 → Use same Master Character
 */

export const VERSION: PromptVersion = {
  version: '1.5.0',
  releaseDate: new Date('2026-04-04'),
  status: 'active',
  changelog: [
    'Initial release',
    'Photo analysis integration',
    'Master character concept',
    'Multi-book consistency',
    'Detailed feature extraction',
    'Added child descriptions for multi-character prompts',
    'Support multiple reference images for cover edits',
    'Enhanced multi-character prompt with reference image matching (16 Ocak 2026)',
    'Individual eye color preservation for each character (16 Ocak 2026)',
    'v1.0.4: Hands descriptor added to buildCharacterPrompt - contextual anchoring for anatomical accuracy (16 Ocak 2026)',
    'v1.0.5: Enhanced family member descriptions with character names, detailed appearance (hair/eye color, age, features), and critical individual character emphasis (16 Ocak 2026)',
    'v1.0.6: Hands descriptor simplified - research-backed simple directives (18 Ocak 2026)',
    'v1.1.0: Major optimization - buildCharacterPrompt simplified (800→300 chars), buildMultipleCharactersPrompt reduced (1500→500 chars), removed verbose descriptions, minimized CRITICAL/IMPORTANT emphasis, streamlined adult/child distinction (18 Ocak 2026)',
    'v1.2.0: Clothing excluded from master character and page character prompts - clothing comes from story per page (Plan: Kapak/Close-up/Kıyafet) (24 Ocak 2026)',
    'v1.3.0: Character analysis output adds defaultClothing - exact outfit from photo for story/image consistency (Faz 1 - CONSISTENCY_AND_QUALITY_ACTION_PHASES) (31 Ocak 2026)',
    'v1.4.0: Adult–child height directives – When Family Members present: "Adult character(s) clearly taller than child(ren); visible height/size difference. Adult body proportions (not child proportions)." No hardcoded elderly stereotype. (2 Şubat 2026)',
    'v1.5.0: [P3 öncesi] Hiç import edilmeyen bloklar kaldırıldı: CONSISTENCY_KEYWORDS, MasterCharacter, formatCharacterForStorage, getCharacterForBookGeneration, MULTI_BOOK_STRATEGY, generateSubsequentBookPrompt, getCoverReferenceConsistencyPrompt, getCoverQualityEmphasisPrompt, default characterPrompts. (4 Nisan 2026)',
  ],
  author: '@prompt-manager',
}

// ============================================================================
// Character Analysis from Photo
// ============================================================================

/**
 * Analyzes reference photo to create detailed character description
 * This runs ONCE when user uploads photo
 * Result is saved as "Master Character" in database
 */
export function generateCharacterAnalysisPrompt(
  photoDescription: string,
  userInputs: {
    name: string
    age: number
    gender: string
    additionalDetails?: string
  }
): string {
  const prompt = `
You are an expert character designer for children's book illustrations. Analyze this reference photo and create a DETAILED character description that will be used consistently across multiple books.

# REFERENCE PHOTO ANALYSIS
${photoDescription}

# USER PROVIDED INFO
- Name: ${userInputs.name}
- Age: ${userInputs.age} years old
- Gender: ${userInputs.gender}
${userInputs.additionalDetails ? `- Additional: ${userInputs.additionalDetails}` : ''}

# YOUR TASK
Create a detailed character description that an illustrator could use to draw this character consistently. Be specific and detailed.

# REQUIRED DETAILS

## FACE AND HEAD
1. Face Shape: (round, oval, heart-shaped, square, etc.)
2. Skin Tone: (very specific - pale, fair, light, medium, tan, brown, dark brown, etc.)
3. Eye Color: (exact color - blue, green, brown, hazel, grey, etc.)
4. Eye Shape: (round, almond, wide-set, close-set, etc.)
5. Eyebrow Style: (thick, thin, arched, straight, etc.)
6. Nose: (small, button, average, wide, etc.)
7. Mouth: (small, wide, full lips, thin lips, etc.)
8. Cheeks: (full, dimpled, rosy, etc.)

## HAIR
1. Color: (exact shade - blonde, light brown, dark brown, black, red, etc.)
2. Style: (straight, wavy, curly, kinky, braided, ponytail, etc.)
3. Length: (very short, short, shoulder-length, long, very long)
4. Texture: (fine, thick, coarse, silky, etc.)
5. Bangs: (yes/no, style if yes)

## BODY
1. Height for age: (short, average, tall for their age)
2. Build: (slim, average, sturdy, athletic, etc.)
3. Posture: (confident, shy, energetic, etc.)

## UNIQUE FEATURES
List any distinctive features:
- Freckles? (location, density)
- Glasses? (style, color)
- Birthmarks or beauty marks?
- Gap in teeth?
- Dimples?
- Any other distinguishing features

## TYPICAL EXPRESSION
- Usual facial expression (smiling, serious, curious, playful, etc.)
- Personality that shows in face (cheerful, thoughtful, adventurous, etc.)

## CLOTHING STYLE (for illustrations)
Based on age and photo:
- Typical clothing style (casual, sporty, dressy, etc.)
- Preferred colors
- Common clothing items

## DEFAULT OUTFIT (CRITICAL for consistency)
Describe the EXACT outfit visible in the photo in ONE detailed sentence. This will be used as the character's locked outfit across all story pages unless the story explicitly requires a change (e.g. pajama party, swimwear, astronaut suit).
- Example: "Purple knitted sweater with small flower patterns, dark blue pants"
- Example: "Light blue t-shirt with a star print, beige shorts"
- Be specific: colors, pattern, garment types. This is the defaultClothing field.

# OUTPUT FORMAT (JSON)
Return a valid JSON object:
{
  "characterId": "unique-id",
  "name": "${userInputs.name}",
  "age": ${userInputs.age},
  "gender": "${userInputs.gender}",
  "physicalFeatures": {
    "faceShape": "...",
    "skinTone": "...",
    "eyeColor": "...",
    "eyeShape": "...",
    "eyebrowStyle": "...",
    "nose": "...",
    "mouth": "...",
    "cheeks": "..."
  },
  "hair": {
    "color": "...",
    "style": "...",
    "length": "...",
    "texture": "...",
    "hasBangs": true/false,
    "bangsStyle": "..."
  },
  "body": {
    "heightForAge": "...",
    "build": "...",
    "posture": "..."
  },
  "uniqueFeatures": [
    "feature 1",
    "feature 2"
  ],
  "expression": {
    "typical": "...",
    "personality": "..."
  },
  "clothingStyle": {
    "style": "...",
    "colors": ["color1", "color2"],
    "commonItems": ["item1", "item2"]
  },
  "defaultClothing": "One detailed sentence describing the exact outfit visible in the photo (e.g. purple knitted sweater with small flower patterns, dark blue pants). REQUIRED.",
  "illustrationNotes": "Additional notes for illustrators to maintain consistency",
  "confidence": 0.95
}

IMPORTANT: Be extremely detailed. This description will be used for ALL future books this user creates.
`

  return prompt.trim()
}

// ============================================================================
// Character Description for Image Generation
// ============================================================================

/**
 * Converts master character description to image prompt
 * This is used for EVERY image generation
 * 
 * @param excludeClothing - If true, clothing is excluded (for master character generation - clothing comes from story)
 */
export function buildCharacterPrompt(
  character: CharacterDescription,
  includeAge: boolean = true,
  excludeClothing: boolean = false // NEW: Plan: Kapak/Close-up/Kıyafet - master character should not have fixed clothing
): string {
  const parts: string[] = []
  
  // Basic info (yaş dahil edilip edilmeyeceğine göre)
  if (includeAge) {
    parts.push(`${character.age}yo ${character.gender}`)
  } else {
    parts.push(character.gender) // Sadece gender - yaş yok
  }
  
  // Hair (combined, simplified)
  const hair = [character.hairColor, character.hairLength, character.hairStyle].filter(Boolean).join(' ')
  if (hair) parts.push(`${hair} hair`)
  
  // Eyes (simplified - keep blue emphasis for accuracy)
  const eyes = character.eyeColor?.toLowerCase() === 'blue' 
    ? 'blue eyes' 
    : `${character.eyeColor} eyes`
  parts.push(eyes)
  
  // Skin
  parts.push(`${character.skinTone} skin`)
  
  // Unique features (max 2 for brevity)
  if (character.uniqueFeatures && character.uniqueFeatures.length > 0) {
    parts.push(character.uniqueFeatures.slice(0, 2).join(', '))
  }
  
  // Clothing (simplified) - EXCLUDED for master character (Plan: Kapak/Close-up/Kıyafet)
  // Master character is reference for features only; clothing comes from story per page
  if (!excludeClothing && character.clothingStyle) {
    const colors = character.clothingColors?.join(' and ') || 'bright colors'
    parts.push(`${character.clothingStyle} in ${colors}`)
  }
  
  return parts.join(', ')
}

/**
 * Build prompt for multiple characters
 * Main character (with reference image) + additional characters (text description only)
 * ENHANCED: 16 Ocak 2026 - Referans görsel eşleştirme iyileştirmesi
 * 
 * @param excludeClothing - If true, clothing is excluded (for story-driven clothing - Plan: Kapak/Close-up/Kıyafet)
 */
export function buildMultipleCharactersPrompt(
  mainCharacter: CharacterDescription,
  additionalCharacters?: Array<{
    type: { group: string; value: string; displayName: string }
    description?: CharacterDescription
  }>,
  excludeClothing: boolean = false // NEW: Plan: Kapak/Close-up/Kıyafet
): string {
  const parts: string[] = []

  // Multiple reference images instruction (simplified)
  const totalChars = additionalCharacters ? additionalCharacters.length + 1 : 1
  parts.push(`${totalChars} reference images provided (image 1-${totalChars}). Match each character's description with its reference image. Do NOT mix features between characters.`)
  const hasAdult = additionalCharacters?.some(c => c.type.group === 'Family Members')
  if (hasAdult) {
    parts.push('Adult character(s) clearly taller than child(ren); visible height/size difference. Adult body proportions (not child proportions) for adult characters. NOT child body proportions; NOT same height as child when adult and child in same scene.')
  }
  parts.push('')

  // Main character
  parts.push(`CHAR 1: ${buildCharacterPrompt(mainCharacter, true, excludeClothing)}`)

  // Additional characters
  if (additionalCharacters && additionalCharacters.length > 0) {
    additionalCharacters.forEach((char, index) => {
      const charNum = index + 2
      const charParts: string[] = [`CHAR ${charNum}:`]
      
      if (char.type.group === "Child" && char.description) {
        charParts.push(buildCharacterPrompt(char.description, true, excludeClothing))
        charParts.push(`(${char.description.eyeColor} eyes, NOT same as Char 1)`)
      } else if (char.type.group === "Pets") {
        charParts.push(`${char.type.value.toLowerCase()}`)
        if (char.description) {
          if (char.description.hairColor) charParts.push(`${char.description.hairColor} fur`)
          if (char.description.eyeColor) charParts.push(`${char.description.eyeColor} eyes`)
        }
      } else if (char.type.group === "Family Members") {
        const name = char.type.displayName || char.type.value
        charParts.push(`${name} (${char.type.value.toLowerCase()})`)
        
        if (char.description) {
          const age = char.description.age
          if (age) {
            const ageNote = age >= 18 ? 'adult body proportions (not child proportions)' : age >= 13 ? 'teen proportions' : ''
            charParts.push(`${age}yo ${ageNote}`)
          } else if (char.type.value === "Mom" || char.type.value === "Dad") {
            charParts.push('adult body proportions (not child proportions)')
          }
          
          if (char.description.hairColor) {
            const hair = [char.description.hairColor, char.description.hairLength].filter(Boolean).join(' ')
            charParts.push(`${hair} hair`)
          }
          
          if (char.description.eyeColor) {
            charParts.push(`${char.description.eyeColor} eyes (NOT same as Char 1)`)
          }
        } else {
          charParts.push('adult body proportions (not child proportions)')
        }
      }
      
      parts.push(charParts.join(' '))
    })
  }

  return parts.join('\n')
}

/**
 * Enhanced character prompt with style consistency
 */
export function buildDetailedCharacterPrompt(
  character: CharacterDescription,
  illustrationStyle: string,
  scene?: string,
  additionalCharacters?: Array<{
    type: { group: string; value: string; displayName: string }
    description?: CharacterDescription
  }>
): string {
  // Build character prompt (single or multiple)
  const baseCharacter = additionalCharacters && additionalCharacters.length > 0
    ? buildMultipleCharactersPrompt(character, additionalCharacters)
    : buildCharacterPrompt(character)
  
  let prompt = `${illustrationStyle} illustration of ${baseCharacter}`
  
  if (scene) {
    prompt += `, ${scene}`
  }

  // Add consistency keywords
  prompt += `, consistent character design, same character as previous pages`
  
  // Additional characters note
  if (additionalCharacters && additionalCharacters.length > 0) {
    prompt += `, all ${additionalCharacters.length + 1} characters visible in the scene`
  }
  
  // Style-specific enhancements
  if (illustrationStyle.includes('watercolor')) {
    prompt += `, soft watercolor style, gentle colors, painterly texture`
  } else if (illustrationStyle.includes('digital')) {
    prompt += `, vibrant digital art, clean lines, professional children's book illustration`
  } else if (illustrationStyle.includes('cartoon')) {
    prompt += `, charming cartoon style, expressive features, kid-friendly`
  }

  return prompt
}
