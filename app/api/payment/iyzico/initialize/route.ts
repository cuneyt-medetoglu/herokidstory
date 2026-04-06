/**
 * POST /api/payment/iyzico/initialize
 *
 * iyzico Checkout Form başlatma endpoint'i.
 *
 * Akış:
 *  1. Kullanıcı kimlik doğrulaması
 *  2. İstek body doğrulaması
 *  3. Sunucu taraflı fiyat hesaplama (frontend fiyatlarına güvenilmez)
 *  4. Sipariş + ödeme kaydı DB'ye yazılır (pending / initiated)
 *  5. iyzico Checkout Form token'ı alınır
 *  6. Ödeme kaydı iyzico session token'ı ile güncellenir
 *  7. { orderId, token, checkoutFormContent } döndürülür
 *
 * Hata hiyerarşisi:
 *  - 401 → kimlik doğrulanmamış
 *  - 400 → geçersiz istek body
 *  - 422 → ürün TRY'de mevcut değil
 *  - 503 → iyzico servis hatası
 *  - 500 → beklenmeyen hata
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/api-auth'
import { CommonErrors, handleAPIError, successResponse } from '@/lib/api/response'
import {
  createOrder,
  createPaymentRecord,
  updateOrderStatus,
  updatePaymentRecord,
} from '@/lib/db/orders'
import {
  calculateOrderTotals,
  isProductAvailableInCurrency,
  PRODUCT_CATALOG,
  type ProductId,
} from '@/lib/pricing/payment-products'
import {
  initializeIyzicoCheckoutForm,
  formatIyzicoAmount,
} from '@/lib/payment/iyzico/checkout-form'
import type { BillingAddress } from '@/lib/payment/types'
import type { IyzicoCheckoutFormRequest } from '@/lib/payment/iyzico/types'

export const dynamic = 'force-dynamic'

// ============================================================================
// İstek tipi
// ============================================================================

interface CartItem {
  bookId:    string
  productId: ProductId
  quantity:  number
}

interface InitializeRequestBody {
  items:          CartItem[]
  billingAddress: BillingAddress
}

// ============================================================================
// Doğrulama yardımcıları
// ============================================================================

function validateBody(body: unknown): body is InitializeRequestBody {
  if (typeof body !== 'object' || body === null) return false

  const b = body as Record<string, unknown>

  if (!Array.isArray(b.items) || b.items.length === 0) return false

  for (const item of b.items) {
    if (typeof item !== 'object' || item === null)               return false
    const i = item as Record<string, unknown>
    if (typeof i.bookId    !== 'string' || !i.bookId.trim())    return false
    if (typeof i.productId !== 'string')                         return false
    if (!(i.productId in PRODUCT_CATALOG))                       return false
    if (typeof i.quantity  !== 'number' || i.quantity < 1)       return false
  }

  const addr = b.billingAddress as Record<string, unknown> | undefined
  if (!addr)                                                      return false
  if (typeof addr.name    !== 'string' || !addr.name.trim())     return false
  if (typeof addr.address !== 'string' || !addr.address.trim())  return false
  if (typeof addr.city    !== 'string' || !addr.city.trim())     return false
  if (typeof addr.country !== 'string' || !addr.country.trim())  return false

  return true
}

// ============================================================================
// Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Kimlik doğrulama
    const user = await getUser()
    if (!user) return CommonErrors.unauthorized()

    // 2. Body parse + doğrulama
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return CommonErrors.badRequest('Geçersiz JSON formatı')
    }

    if (!validateBody(body)) {
      return CommonErrors.badRequest(
        'Gerekli alanlar eksik veya geçersiz. ' +
          'items[].bookId, items[].productId, items[].quantity ve billingAddress zorunludur.'
      )
    }

    const { items, billingAddress } = body

    // 3. Sunucu taraflı fiyat hesaplama — TRY sabit (iyzico = TR)
    const currency = 'TRY' as const

    for (const item of items) {
      if (!isProductAvailableInCurrency(item.productId, currency)) {
        return NextResponse.json(
          {
            success:  false,
            error:    'Ürün bu para biriminde mevcut değil',
            details:  `${item.productId} ürünü ${currency} para birimi ile satışta değil.`,
            code:     'PRODUCT_UNAVAILABLE',
          },
          { status: 422 }
        )
      }
    }

    const totals = calculateOrderTotals(
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      currency
    )

    // 4a. Sipariş oluştur (DB transaction — pending)
    const order = await createOrder({
      userId:    user.id,
      provider:  'iyzico',
      currency,
      subtotal:  totals.subtotal,
      discountAmount: totals.discountAmount,
      totalAmount:    totals.totalAmount,
      billingAddress,
      items: items.map((item) => ({
        bookId:    item.bookId,
        itemType:  PRODUCT_CATALOG[item.productId].orderItemType,
        unitPrice: PRODUCT_CATALOG[item.productId].prices[currency],
        quantity:  item.quantity,
      })),
    })

    // 4b. Ödeme kaydı oluştur (initiated)
    const paymentRecord = await createPaymentRecord({
      orderId:  order.id,
      userId:   user.id,
      provider: 'iyzico',
      amount:   totals.totalAmount,
      currency,
      status:   'initiated',
    })

    // 5. iyzico Checkout Form isteği hazırla
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/iyzico/callback`
    const clientIp    = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                       ?? request.headers.get('x-real-ip')
                       ?? '127.0.0.1'

    const iyzicoRequest: IyzicoCheckoutFormRequest = {
      locale:        'TR',
      conversationId: order.id,
      price:         formatIyzicoAmount(totals.totalAmount),
      paidPrice:     formatIyzicoAmount(totals.totalAmount),
      currency,
      basketId:      order.id,
      paymentGroup:  'PRODUCT',
      callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9, 12],
      buyer: {
        id:      user.id,
        name:    _getFirstName(user.name),
        surname: _getLastName(user.name),
        email:   user.email,
        /**
         * identityNumber: iyzico zorunlu alan.
         * Prodüksiyonda kullanıcıdan alınmalı; sandbox için "11111111111".
         */
        identityNumber:      billingAddress.identityNumber ?? '11111111111',
        registrationAddress: billingAddress.address,
        ip:      clientIp,
        city:    billingAddress.city,
        country: billingAddress.country,
      },
      billingAddress: {
        contactName: billingAddress.name,
        city:        billingAddress.city,
        country:     billingAddress.country,
        address:     billingAddress.address,
        zipCode:     billingAddress.zip,
      },
      shippingAddress: {
        contactName: billingAddress.name,
        city:        billingAddress.city,
        country:     billingAddress.country,
        address:     billingAddress.address,
        zipCode:     billingAddress.zip,
      },
      basketItems: items.map((item) => {
        const product   = PRODUCT_CATALOG[item.productId]
        const unitPrice = product.prices[currency]
        return {
          id:       item.bookId,
          name:     _getProductDisplayName(item.productId),
          category1: item.productId === 'ebook' ? 'E-Book' : 'Physical Book',
          itemType:  item.productId === 'ebook' ? 'VIRTUAL' : 'PHYSICAL',
          price:     formatIyzicoAmount(unitPrice * item.quantity),
        }
      }),
    }

    // 6. iyzico API çağrısı
    let iyzicoResult: Awaited<ReturnType<typeof initializeIyzicoCheckoutForm>>
    try {
      iyzicoResult = await initializeIyzicoCheckoutForm(iyzicoRequest)
    } catch (iyzicoErr) {
      // iyzico API'den hata geldi — siparişi ve ödemeyi başarısız işaretle
      const detailText = _formatIyzicoInitError(iyzicoErr)
      await Promise.allSettled([
        updateOrderStatus(order.id, { status: 'failed', failureReason: detailText }),
        updatePaymentRecord(paymentRecord.id, { status: 'failed' }),
      ])

      console.error('[iyzico/initialize] iyzico API hatası:', detailText, iyzicoErr)

      return NextResponse.json(
        {
          success: false,
          error:   'Ödeme servisi şu anda yanıt vermiyor',
          /** iyzico iş / doğrulama mesajı — UI ve log teşhisi için (anahtar içermez) */
          details: detailText,
          code:    'IYZICO_SERVICE_ERROR',
        },
        { status: 503 }
      )
    }

    // 7. Ödeme kaydına iyzico session token'ını yaz
    await updatePaymentRecord(paymentRecord.id, {
      providerResponse: { token: iyzicoResult.token },
    })

    return successResponse(
      {
        orderId:             order.id,
        token:               iyzicoResult.token,
        checkoutFormContent: iyzicoResult.checkoutFormContent,
      },
      undefined,
      undefined,
      200
    )
  } catch (err) {
    return handleAPIError(err)
  }
}

// ============================================================================
// İç yardımcılar
// ============================================================================

function _formatIyzicoInitError(err: unknown): string {
  if (err instanceof Error) {
    const e = err as Error & { errorCode?: string; errorGroup?: string }
    const bits = [e.message]
    if (e.errorCode) bits.push(`iyzicoErrorCode=${e.errorCode}`)
    if (e.errorGroup) bits.push(`iyzicoErrorGroup=${e.errorGroup}`)
    return bits.filter(Boolean).join(' · ')
  }
  return String(err)
}

function _getFirstName(fullName?: string | null): string {
  if (!fullName?.trim()) return 'Ad'
  return fullName.trim().split(/\s+/)[0]
}

function _getLastName(fullName?: string | null): string {
  if (!fullName?.trim()) return 'Soyad'
  const parts = fullName.trim().split(/\s+/)
  return parts.length > 1 ? parts.slice(1).join(' ') : 'Soyad'
}

function _getProductDisplayName(productId: ProductId): string {
  const names: Record<ProductId, string> = {
    ebook:    'Hero Kid Story E-Kitap',
    hardcopy: 'Hero Kid Story Basılı Kitap',
    bundle:   'Hero Kid Story E-Kitap + Basılı Kitap',
  }
  return names[productId]
}
