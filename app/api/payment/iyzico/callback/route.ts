/**
 * POST /api/payment/iyzico/callback
 *
 * iyzico'nun 3D Secure sonrası POST attığı endpoint.
 * Bu endpoint PUBLIC'tir — iyzico sunucuları buraya doğrudan istek atar.
 *
 * Akış:
 *  1. formData'dan token al
 *  2. iyzico API'ye token ile sorgulama yap (checkoutForm.retrieve)
 *  3. Sonucu payment_events tablosuna kaydet (idempotent)
 *  4. Sipariş ve ödeme kayıtlarını güncelle
 *  5. Başarı/hata sayfasına yönlendir
 *
 * Güvenlik:
 *  - Token iyzico API'siyle doğrulanır — frontend'den veri alınmaz.
 *  - conversationId (orderId) iyzico'nun kendi yanıtından okunur.
 *  - Aynı token ikinci kez gelirse payment_events idempotency index'i devreye girer.
 *
 * Hata yönetimi:
 *  - Her hata kullanıcıya failure sayfasına yönlendirme ile sonuçlanır.
 *  - Sunucu taraflı hatalar console.error ile loglanır.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { verifyIyzicoPayment } from '@/lib/payment/iyzico/verify-payment'
import {
  updateOrderStatus,
  updatePaymentRecord,
  savePaymentEvent,
  getPaymentByOrderId,
} from '@/lib/db/orders'

export const dynamic = 'force-dynamic'

// ============================================================================
// Yönlendirme yardımcıları
// ============================================================================

function redirectToSuccess(orderId: string): NextResponse {
  const url = new URL('/payment/success', process.env.NEXT_PUBLIC_APP_URL)
  url.searchParams.set('orderId', orderId)
  return NextResponse.redirect(url.toString(), { status: 302 })
}

function redirectToFailure(reason: string, orderId?: string): NextResponse {
  const url = new URL('/payment/failure', process.env.NEXT_PUBLIC_APP_URL)
  url.searchParams.set('reason', reason)
  if (orderId) url.searchParams.set('orderId', orderId)
  return NextResponse.redirect(url.toString(), { status: 302 })
}

// ============================================================================
// Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Token'ı formData'dan al
  let token: string | null = null
  try {
    const formData = await request.formData()
    token = formData.get('token') as string | null
  } catch {
    return redirectToFailure('invalid_request')
  }

  if (!token) {
    return redirectToFailure('missing_token')
  }

  // 2. iyzico API ile doğrula
  const verification = await verifyIyzicoPayment(token)

  const orderId = verification.conversationId

  // 3. Payment event kaydet (idempotent — aynı token gelirse DO NOTHING)
  try {
    await savePaymentEvent({
      provider:       'iyzico',
      eventType:      verification.success ? 'checkout.success' : 'checkout.failure',
      rawPayload:     verification.rawResult,
      orderId:        orderId ?? null,
      providerEventId: token,   // token idempotency key olarak kullanılır
    })
  } catch (eventErr) {
    // Event kaydı kritik değil — devam et ama logla
    console.error('[iyzico/callback] payment_events kaydı başarısız:', eventErr)
  }

  // orderId yoksa siparişi güncelleyemeyiz
  if (!orderId) {
    console.error('[iyzico/callback] conversationId eksik — sipariş güncellenemiyor', {
      token,
      success: verification.success,
    })
    return redirectToFailure('order_not_found')
  }

  // 4. Sipariş ve ödeme kaydını güncelle
  try {
    if (verification.success) {
      // 4a. Başarılı ödeme
      await Promise.all([
        updateOrderStatus(orderId, {
          status: 'paid',
          paidAt: new Date(),
        }),
        // Ödeme kaydını bul ve güncelle
        getPaymentByOrderId(orderId, 'iyzico').then((payment) => {
          if (!payment) return
          return updatePaymentRecord(payment.id, {
            status:            'succeeded',
            providerPaymentId: verification.paymentId,
            providerResponse:  verification.rawResult,
          })
        }),
      ])

      return redirectToSuccess(orderId)
    } else {
      // 4b. Başarısız ödeme
      const reason = verification.errorMessage ?? 'Ödeme başarısız'

      await Promise.all([
        updateOrderStatus(orderId, {
          status:        'failed',
          failureReason: reason,
        }),
        getPaymentByOrderId(orderId, 'iyzico').then((payment) => {
          if (!payment) return
          return updatePaymentRecord(payment.id, {
            status:           'failed',
            providerResponse: verification.rawResult,
          })
        }),
      ])

      return redirectToFailure(
        encodeURIComponent(reason),
        orderId
      )
    }
  } catch (dbErr) {
    console.error('[iyzico/callback] DB güncelleme hatası:', dbErr)

    // DB hatası olsa bile kullanıcıyı uygun sayfaya yönlendir
    if (verification.success) {
      // Sipariş ödendi ama DB güncellenemedi — success sayfası göster,
      // admin log'lardan düzeltilebilir
      console.error('[iyzico/callback] KRİTİK: Ödeme başarılı ama DB güncellenemedi', {
        orderId,
        paymentId: verification.paymentId,
      })
      return redirectToSuccess(orderId)
    }

    return redirectToFailure('processing_error', orderId)
  }
}
