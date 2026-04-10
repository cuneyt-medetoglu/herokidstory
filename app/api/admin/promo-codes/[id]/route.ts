/**
 * GET    /api/admin/promo-codes/[id]   — Detay
 * PATCH  /api/admin/promo-codes/[id]   — Güncelle
 * DELETE /api/admin/promo-codes/[id]   — Sil (kullanımı yoksa)
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/api-auth'
import {
  getPromoCode,
  updatePromoCode,
  deletePromoCode,
  getPromoCodeUsages,
} from '@/lib/db/promo-codes'
import type { UpdatePromoCodeInput } from '@/lib/db/promo-codes'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const user = await getUser()
  if (!user) return null
  if ((user as { role?: string }).role !== 'admin') return null
  return user
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const [promoCode, usages] = await Promise.all([
      getPromoCode(params.id),
      getPromoCodeUsages(params.id),
    ])
    if (!promoCode) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ promoCode, usages })
  } catch (err) {
    console.error('[GET /api/admin/promo-codes/[id]]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const input: UpdatePromoCodeInput = {}

  if (b.discountType !== undefined)   input.discountType    = b.discountType as 'percent' | 'fixed'
  if (b.discountValue !== undefined)  input.discountValue   = b.discountValue as number
  if ('currency' in b)               input.currency         = (b.currency as string | null) ?? null
  if ('maxUses' in b)                input.maxUses          = (b.maxUses as number | null) ?? null
  if ('maxUsesPerUser' in b)         input.maxUsesPerUser   = (b.maxUsesPerUser as number | null) ?? null
  if ('validFrom' in b)              input.validFrom        = b.validFrom ? new Date(b.validFrom as string) : null
  if ('validUntil' in b)             input.validUntil       = b.validUntil ? new Date(b.validUntil as string) : null
  if ('minOrderAmount' in b)         input.minOrderAmount   = (b.minOrderAmount as number | null) ?? null
  if ('applicableTo' in b)           input.applicableTo     = Array.isArray(b.applicableTo) ? (b.applicableTo as string[]) : null
  if (b.isActive !== undefined)      input.isActive         = b.isActive as boolean
  if ('description' in b)            input.description      = (b.description as string | null) ?? null

  try {
    const updated = await updatePromoCode(params.id, input)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ promoCode: updated })
  } catch (err) {
    console.error('[PATCH /api/admin/promo-codes/[id]]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const deleted = await deletePromoCode(params.id)
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'PROMO_HAS_USAGES') {
      return NextResponse.json(
        { error: 'Bu kodun kullanım geçmişi var; silinemez. Pasife alabilirsiniz.' },
        { status: 409 }
      )
    }
    console.error('[DELETE /api/admin/promo-codes/[id]]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
