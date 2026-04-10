/**
 * POST /api/promo/validate
 *
 * Kullanıcı girdiği promo kodunu doğrular; indirim tutarını döndürür.
 * Kodu kullanım olarak kaydetmez — bu iş ödeme sonrasında yapılır.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/api-auth'
import { validatePromoCode } from '@/lib/db/promo-codes'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const code = typeof b.code === 'string' ? b.code.trim() : ''
  const subtotal = typeof b.subtotal === 'number' ? b.subtotal : 0
  const currency = typeof b.currency === 'string' ? b.currency : 'TRY'
  const itemTypes = Array.isArray(b.itemTypes)
    ? (b.itemTypes as string[])
    : ['ebook']

  if (!code) {
    return NextResponse.json({ error: 'code required' }, { status: 400 })
  }

  try {
    const result = await validatePromoCode({
      code,
      userId: user.id,
      subtotal,
      currency,
      itemTypes,
    })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[POST /api/promo/validate]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
