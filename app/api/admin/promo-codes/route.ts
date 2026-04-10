/**
 * GET  /api/admin/promo-codes   — Liste (sayfalı + arama)
 * POST /api/admin/promo-codes   — Yeni kod oluştur
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/api-auth'
import { listPromoCodes, createPromoCode } from '@/lib/db/promo-codes'
import type { CreatePromoCodeInput } from '@/lib/db/promo-codes'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const user = await getUser()
  if (!user) return null
  if ((user as { role?: string }).role !== 'admin') return null
  return user
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '50', 10), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)
  const search = searchParams.get('search') ?? undefined

  try {
    const result = await listPromoCodes({ limit, offset, search })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[GET /api/admin/promo-codes]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>

  if (typeof b.code !== 'string' || !b.code.trim()) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 })
  }
  if (!['percent', 'fixed'].includes(b.discountType as string)) {
    return NextResponse.json({ error: 'discountType must be percent or fixed' }, { status: 400 })
  }
  if (typeof b.discountValue !== 'number' || b.discountValue < 0) {
    return NextResponse.json({ error: 'discountValue must be a non-negative number' }, { status: 400 })
  }

  const input: CreatePromoCodeInput = {
    code:            (b.code as string).toUpperCase().trim(),
    discountType:    b.discountType as 'percent' | 'fixed',
    discountValue:   b.discountValue as number,
    currency:        typeof b.currency === 'string' ? b.currency : null,
    maxUses:         typeof b.maxUses === 'number' ? b.maxUses : null,
    maxUsesPerUser:  typeof b.maxUsesPerUser === 'number' ? b.maxUsesPerUser : 1,
    validFrom:       b.validFrom ? new Date(b.validFrom as string) : null,
    validUntil:      b.validUntil ? new Date(b.validUntil as string) : null,
    minOrderAmount:  typeof b.minOrderAmount === 'number' ? b.minOrderAmount : null,
    applicableTo:    Array.isArray(b.applicableTo) ? (b.applicableTo as string[]) : null,
    isActive:        typeof b.isActive === 'boolean' ? b.isActive : true,
    description:     typeof b.description === 'string' ? b.description : null,
  }

  try {
    const created = await createPromoCode(input)
    return NextResponse.json({ promoCode: created }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'Bu kod zaten mevcut' }, { status: 409 })
    }
    console.error('[POST /api/admin/promo-codes]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
