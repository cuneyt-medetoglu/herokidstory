/**
 * @file Ödeme başarılı / başarısız sonrası tetiklenecek işlemler.
 *
 * Tek giriş noktası: `handlePaymentSuccess(orderId)` ve `handlePaymentFailed(orderId, reason)`.
 * Bu fonksiyonlar:
 *  - iyzico callback
 *  - (ileride) Stripe webhook
 * tarafından çağrılır.
 *
 * Tasarım ilkeleri:
 *  - Her zaman resolve eder (reject etmez) — ana ödeme akışını bloke etmez.
 *  - Her adım ayrı try/catch ile izole edilir; biri başarısız olursa diğerleri çalışmaya devam eder.
 *  - Tüm hatalar loglanır; prod'da bu loglar alarm/alerting sistemine bağlanabilir.
 *  - Idempotent olmaya çalışır — aynı orderId için iki kez çağrılsa da çift mail gitmez (EMAIL_ENABLED=false dev'de).
 */

import { getOrderForEmail } from '@/lib/db/orders'
import { sendEmail } from '@/lib/email/send'
import { buildOrderConfirmationEmail } from '@/lib/email/templates/order-confirmation'
import { buildAdminHardcopyEmail } from '@/lib/email/templates/admin-hardcopy'
import type { OrderConfirmationData } from '@/lib/email/templates/order-confirmation'
import { enqueuePaidCheckoutBooks } from '@/lib/payment/paid-checkout-generation'
import { recordPromoCodeUsage } from '@/lib/db/promo-codes'

// ============================================================================
// Yardımcılar
// ============================================================================

function localeFromCurrency(currency: string): 'tr' | 'en' {
  return currency === 'TRY' ? 'tr' : 'en'
}

// ============================================================================
// handlePaymentSuccess
// ============================================================================

/**
 * Sipariş `paid` olduğunda tetiklenir.
 *
 * Sıra:
 *  1. Sipariş + kullanıcı bilgisini çek
 *  2. Sipariş onayı e-postası gönder
 *  3. Hardcopy varsa admin'e bildirim gönder
 *
 * E-book "hazır" maili: kitap üretimi tamamlandığında (status → completed)
 * ayrıca tetiklenmesi gerekir — bu fonksiyon şu an bunu yapmıyor.
 * Bkz: `handleBookCompleted()` (ileride eklenecek).
 */
export async function handlePaymentSuccess(orderId: string): Promise<void> {
  let order: Awaited<ReturnType<typeof getOrderForEmail>>

  try {
    order = await getOrderForEmail(orderId)
  } catch (err) {
    console.error('[post-payment] Sipariş bilgisi alınamadı:', { orderId, err })
    return
  }

  if (!order) {
    console.error('[post-payment] Sipariş bulunamadı:', orderId)
    return
  }

  // 0. Ödeme sonrası placeholder e-kitapları üretim kuyruğuna al (önce — kullanıcı generating görür)
  try {
    await enqueuePaidCheckoutBooks(orderId)
  } catch (err) {
    console.error('[post-payment] paid-checkout-generation hatası:', { orderId, err })
  }

  // 0b. Promo kodu kullanımını kaydet (varsa)
  if (order.promo_code_id && order.discount_amount > 0) {
    try {
      await recordPromoCodeUsage({
        promoCodeId:    order.promo_code_id,
        userId:         order.user_id,
        orderId:        order.id,
        discountAmount: order.discount_amount,
      })
    } catch (err) {
      console.error('[post-payment] Promo kodu kullanım kaydı hatası:', { orderId, err })
    }
  }

  const locale = localeFromCurrency(order.order_currency)

  // 1. Sipariş onayı e-postası
  try {
    const hasEbook = order.items.some(
      (i) => i.item_type === 'ebook' || i.item_type === 'bundle'
    )

    const emailData: OrderConfirmationData = {
      orderShortId: order.id.slice(0, 8).toUpperCase(),
      userEmail:    order.user_email,
      userName:     order.user_name,
      totalAmount:  order.total_amount,
      currency:     order.order_currency,
      locale,
      items: order.items.map((i) => ({
        bookTitle: i.book_title,
        itemType:  i.item_type as 'ebook' | 'hardcopy' | 'bundle',
        unitPrice: i.unit_price,
        quantity:  i.quantity,
      })),
      hasEbook,
    }

    const { subject, html, text } = buildOrderConfirmationEmail(emailData)
    await sendEmail({ to: order.user_email, subject, html, text })
  } catch (err) {
    console.error('[post-payment] Sipariş onayı e-postası gönderilemedi:', { orderId, err })
  }

  // 2. Hardcopy varsa admin bildirimi
  const hardcopyItems = order.items.filter(
    (i) => i.item_type === 'hardcopy' || i.item_type === 'bundle'
  )

  if (hardcopyItems.length > 0) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL ?? process.env.EMAIL_FROM
      if (!adminEmail) {
        console.warn('[post-payment] ADMIN_EMAIL tanımlı değil — hardcopy bildirimi atlanıyor.')
      } else {
        const { subject, html, text, to } = buildAdminHardcopyEmail({
          orderId:        order.id,
          orderShortId:   order.id.slice(0, 8).toUpperCase(),
          userEmail:      order.user_email,
          userName:       order.user_name,
          items:          hardcopyItems.map((i) => ({
            bookTitle: i.book_title,
            quantity:  i.quantity,
            unitPrice: i.unit_price,
            currency:  order!.order_currency,
          })),
          billingAddress: order.billing_address,
          totalAmount:    order.total_amount,
          currency:       order.order_currency,
        })
        await sendEmail({ to, subject, html, text })
      }
    } catch (err) {
      console.error('[post-payment] Admin hardcopy bildirimi gönderilemedi:', { orderId, err })
    }
  }

  console.log('[post-payment] handlePaymentSuccess tamamlandı:', orderId)
}

// ============================================================================
// handlePaymentFailed
// ============================================================================

/**
 * Sipariş `failed` olduğunda tetiklenir.
 * Şu an sadece loglama yapar.
 * İleride kullanıcıya "ödeme başarısız" e-postası gönderilebilir.
 */
export async function handlePaymentFailed(
  orderId: string,
  reason?: string
): Promise<void> {
  console.warn('[post-payment] Ödeme başarısız:', { orderId, reason })
  // TODO: buildPaymentFailedEmail + sendEmail — e-posta şablonu hazır olunca ekle
}
