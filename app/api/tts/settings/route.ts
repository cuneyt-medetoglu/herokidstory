/**
 * GET  /api/tts/settings - Read global TTS defaults (public; used by TTS pipeline / reader).
 * PATCH /api/tts/settings - Update global TTS defaults (admin only; UI at /admin/tts-settings).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTtsSettings, updateTtsSettings, type UpdateTtsSettingsInput } from '@/lib/db/tts-settings'
import { requireUser } from '@/lib/auth/api-auth'
import { getUserRole } from '@/lib/db/users'

export async function GET() {
  try {
    const row = await getTtsSettings()
    if (!row) {
      return NextResponse.json({
        voiceName: 'Achernar',
        prompt: 'Çocuk hikayesi anlatır gibi enerjik, heyecanlı ve sıcak bir tonda konuş.',
        languageCode: 'tr',
        modelName: 'gemini-2.5-pro-tts',
        speakingRate: 1,
      })
    }
    return NextResponse.json({
      voiceName: row.voice_name,
      prompt: row.prompt,
      languageCode: row.language_code,
      modelName: row.model_name,
      speakingRate: Number(row.speaking_rate),
      updatedAt: row.updated_at,
    })
  } catch (error: unknown) {
    console.error('[TTS Settings] GET error:', error)
    return NextResponse.json({ error: 'Failed to load TTS settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser()
    const role = await getUserRole(user.id)
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 })
    }
    const body = await request.json()
    const input: UpdateTtsSettingsInput = {}
    if (typeof body.voiceName === 'string') input.voice_name = body.voiceName
    if (typeof body.prompt === 'string') input.prompt = body.prompt
    if (typeof body.languageCode === 'string') input.language_code = body.languageCode
    if (typeof body.modelName === 'string') input.model_name = body.modelName
    if (typeof body.speakingRate === 'number') input.speaking_rate = body.speakingRate
    const row = await updateTtsSettings(input)
    if (!row) {
      return NextResponse.json({ error: 'Failed to update TTS settings' }, { status: 500 })
    }
    return NextResponse.json({
      voiceName: row.voice_name,
      prompt: row.prompt,
      languageCode: row.language_code,
      modelName: row.model_name,
      speakingRate: Number(row.speaking_rate),
      updatedAt: row.updated_at,
    })
  } catch (error: unknown) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[TTS Settings] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update TTS settings' }, { status: 500 })
  }
}
