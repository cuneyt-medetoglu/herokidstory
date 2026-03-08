/**
 * Character Creation API
 *
 * POST /api/characters
 * Creates a character from form data (name, age, gender, hairColor, eyeColor, photo).
 * All character types (Child, Family Members, Pets) use the same pipeline: no OpenAI Vision.
 * Reference photo is used directly in image generation; description is built from form only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createCharacter } from '@/lib/db/characters'
import { uploadFile, getPublicUrl } from '@/lib/storage/s3'
import { getUser } from '@/lib/auth/api-auth'
import type { CharacterDescription } from '@/lib/prompts/types'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor. Lütfen giriş yapın.' }, { status: 401 })
    }
    const userId = user.id

    // Parse request body
    const body = await request.json()
    const {
      name,
      age,
      gender,
      hairColor,
      eyeColor,
      photoBase64, // Base64 encoded photo (data URL without prefix)
      characterType, // NEW: Character type info {group, value, displayName}
    } = body

    // FIX: Gender validation based on characterType (25 Ocak 2026)
    // Automatic gender correction for male/female character types - prevents incorrect gender from frontend
    let validatedGender = gender ? gender.toLowerCase() : ''
    
    if (characterType) {
      const charTypeValue = characterType.value?.toLowerCase() || ''
      const charName = name?.toLowerCase() || ''
      const charDisplayName = characterType.displayName?.toLowerCase() || ''
      
      // Male character types - automatic "boy" gender
      const maleTypes = ['dad', 'father', 'brother', 'grandpa', 'grandfather', 'uncle']
      const maleKeywords = ['uncle', 'brother', 'dad', 'father', 'grandpa', 'grandfather']
      
      if (maleTypes.includes(charTypeValue) || 
          maleKeywords.some(keyword => charName.includes(keyword) || charDisplayName.includes(keyword))) {
        validatedGender = 'boy'
        console.log(`[Character Creation] 🔧 Gender auto-corrected: ${characterType.value || name} character must be "boy" (was: ${gender})`)
      }
      // Female character types - automatic "girl" gender
      else if (charTypeValue === "mom" || charTypeValue === "mother" || 
               charTypeValue === "sister" || charTypeValue === "grandma" || charTypeValue === "grandmother" ||
               charTypeValue === "aunt") {
        validatedGender = 'girl'
        console.log(`[Character Creation] 🔧 Gender auto-corrected: ${characterType.value || name} character must be "girl" (was: ${gender})`)
      }
      // "Other Family" - determine gender based on name
      else if (characterType.value === "Other Family" || characterType.value === "other family") {
        const femaleKeywords = ['aunt', 'mother', 'mom', 'sister', 'grandma', 'grandmother']
        const hasFemaleKeyword = femaleKeywords.some(keyword => charName.includes(keyword) || charDisplayName.includes(keyword))
        
        if (hasFemaleKeyword) {
          validatedGender = 'girl'
          console.log(`[Character Creation] 🔧 Gender auto-corrected: ${name} (Other Family) character must be "girl" based on name (was: ${gender})`)
        } else if (maleKeywords.some(keyword => charName.includes(keyword) || charDisplayName.includes(keyword))) {
          validatedGender = 'boy'
          console.log(`[Character Creation] 🔧 Gender auto-corrected: ${name} (Other Family) character must be "boy" based on name (was: ${gender})`)
        }
      }
    }
    
    // Validation
    // Toys don't need gender validation (gender-neutral)
    const isToys = characterType?.group === 'Toys'
    if (!name || !age || (!validatedGender && !isToys)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, age, gender' },
        { status: 400 }
      )
    }

    // Build character description from form data (same for all types: Child, Family, Pets).
    // No OpenAI Vision — reference photo is used directly in image generation.
    const characterDescription: CharacterDescription = {
      age: parseInt(age) || 5,
      gender: validatedGender || 'other',
      skinTone: 'fair',
      hairColor: hairColor || 'brown',
      hairStyle: 'natural',
      hairLength: parseInt(age) <= 3 ? 'short' : parseInt(age) <= 7 ? 'medium' : 'long',
      eyeColor: eyeColor || 'brown',
      eyeShape: 'round',
      faceShape: 'round',
      height: 'average',
      build: 'normal',
      clothingStyle: 'casual',
      clothingColors: ['blue', 'red'],
      uniqueFeatures: [],
      typicalExpression: 'happy',
      personalityTraits: ['curious', 'friendly'],
    }

    let referencePhotoUrl: string | undefined
    let referencePhotoPath: string | undefined

    // Upload photo to AWS S3 if provided
    if (photoBase64) {
      try {
        // Convert base64 to buffer
        const base64Data = photoBase64.includes(',') 
          ? photoBase64.split(',')[1] 
          : photoBase64
        
        const buffer = Buffer.from(base64Data, 'base64')

        // Sanitize name to avoid invalid characters
        const safeName = name
          .toString()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // strip diacritics
          .replace(/[^a-zA-Z0-9_-]+/g, '_') // keep only safe chars
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 40) || 'child'

        const fileName = `${userId}/characters/character_${Date.now()}_${safeName}.png`

        console.log('[Character Creation] Uploading photo to S3:', fileName)

        // Upload to S3 (photos/ prefix)
        const s3Key = await uploadFile('photos', fileName, buffer, 'image/png')
        referencePhotoUrl = getPublicUrl(s3Key)
        referencePhotoPath = s3Key

        console.log('[Character Creation] Photo uploaded successfully:', referencePhotoUrl)
      } catch (photoError) {
        console.error('[Character Creation] Error processing photo:', photoError)
        // Continue without photo if processing fails
      }
    }

    // Log character type for debugging
    if (characterType) {
      console.log('[Character Creation] Character type:', JSON.stringify(characterType))
    } else {
      console.log('[Character Creation] Warning: No characterType provided, using default (Child)')
    }

    // Create character in database
    const { data: character, error: dbError } = await createCharacter(
      userId,
      {
        name,
        age: parseInt(age) || 5,
        gender: (validatedGender as 'boy' | 'girl' | 'other'), // FIX: Use validatedGender (25 Ocak 2026)
        character_type: characterType || { group: 'Child', value: 'Child', displayName: name }, // NEW: Character type info
        hair_color: hairColor || 'brown',
        eye_color: eyeColor || 'brown',
        features: [],
        reference_photo_url: referencePhotoUrl,
        reference_photo_path: referencePhotoPath,
        description: characterDescription,
        is_default: true, // First character is default
        ai_analysis: undefined,
        full_description: undefined,
        analysis_raw: undefined,
        analysis_confidence: undefined,
      }
    )

    if (dbError || !character) {
      console.error('[Character Creation] Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create character in database', details: dbError?.message },
        { status: 500 }
      )
    }

    console.log('[Character Creation] Character created successfully:', character.id)

    return NextResponse.json({
      success: true,
      character: {
        id: character.id,
        name: character.name,
        age: character.age,
        gender: character.gender,
        reference_photo_url: character.reference_photo_url,
      },
      message: 'Character created successfully',
    })
  } catch (error) {
    console.error('[Character Creation] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create character',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
