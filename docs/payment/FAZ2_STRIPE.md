# 💳 Faz 2 — Stripe Entegrasyonu (Uluslararası)

**Bağlı Roadmap:** [PAYMENT_ROADMAP.md](PAYMENT_ROADMAP.md)  
**Durum:** ⏸️ **ERTELENDİ** — iyzico (Faz 0–1 ve iyzico-only checkout) tamamlandıktan **sonra** bu dosyaya göre entegrasyon yapılacak.  
**Ön koşul:** [Faz 0](FAZ0_HAZIRLIK.md) + [Faz 1 (iyzico)](FAZ1_IYZICO.md) canlı veya test akışı oturmuş olmalı  
**Tahmini süre:** 3-5 gün

---

## 🎯 Bu Fazın Amacı

Türkiye dışındaki kullanıcıların Stripe ile ödeme yapabilmesini sağlamak:
- Stripe Payment Element (embedded) veya Stripe Checkout (hosted) entegrasyonu
- Webhook ile sipariş kaydı güncelleme
- Mevcut Stripe hesabının bağlanması

---

## 1. Stripe Genel Bilgi

### 1.1 Stripe Nedir?

Stripe, dünya genelinde kullanılan en popüler ödeme altyapısı sağlayıcısıdır:
- **Payment Element:** Uygulamanın içine gömülü ödeme formu (kart, Apple Pay, Google Pay vs.)
- **Stripe Checkout:** Stripe'ın kendi hosted checkout sayfası (en kolay yöntem)
- **Webhook:** Ödeme olaylarını gerçek zamanlı dinleme
- **Dashboard:** stripe.com/dashboard üzerinden tüm işlemleri görme

### 1.2 Stripe Ödeme Yöntemi Kararı

İki seçenek mevcuttur:

| Yöntem | Artıları | Eksileri | Öneri |
|--------|----------|----------|-------|
| **Stripe Checkout (hosted)** | Çok kolay, Stripe sayfasına yönlendirme, Apple Pay/Google Pay otomatik | Kullanıcı Stripe'ın sayfasına gider | ✅ **Başlangıç için önerilir** |
| **Payment Element (embedded)** | Kendi sayfamızda kalır, daha özelleştirilebilir | Daha fazla kod, PCI uyum | Sonraki versiyonda |

> **Karar: Stripe Checkout (hosted) ile başla.** Daha hızlı geliştirme, daha az hata riski. Kullanıcı deneyimi iyi — Stripe sayfası güvenilir ve tanıdık görünür.

### 1.3 Stripe Checkout Akışı

```
1. Kullanıcı "Ödeme Yap" butonuna basar
2. Backend → Stripe API → Checkout Session oluşturur
3. Frontend → session.url'e redirect eder (Stripe'ın sayfası)
4. Kullanıcı Stripe sayfasında kart bilgilerini girer
5. Ödeme tamamlanır → Stripe success_url'e redirect eder
   (veya cancel_url → kullanıcı geri döner)
6. Stripe → backend webhook'a event gönderir (checkout.session.completed)
7. Webhook → sipariş durumunu günceller
8. Başarı sayfası kullanıcıya gösterilir
```

---

## 2. Teknik Mimari

### 2.1 Dosya Yapısı

```
lib/payment/
  stripe/
    client.ts             — Stripe SDK istemcisi
    checkout-session.ts   — Checkout Session oluşturma
    webhook.ts            — Webhook event işleme
    types.ts              — TypeScript tipleri

app/api/payment/
  stripe/
    create-session/route.ts   — Checkout Session oluştur
  webhooks/
    stripe/route.ts           — Stripe webhook handler
```

### 2.2 Stripe Dashboard Ayarları

Mevcut Stripe hesabında yapılacaklar:
1. **Products & Prices:** Ürünler oluştur (veya API'de dinamik olarak)
2. **Webhooks:** `https://herokidstory.com/api/webhooks/stripe` endpoint ekle
3. **Webhook Events:** `checkout.session.completed`, `payment_intent.payment_failed`
4. **API Keys:** Test ve live key'leri kopyala

---

## 3. Kod Implementasyonu

### 3.1 Stripe İstemcisi

**`lib/payment/stripe/client.ts`**

```typescript
import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-06-20',
    })
  }
  return stripeClient
}

// Client-side için (publishable key)
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
```

### 3.2 Checkout Session Oluşturma

**`lib/payment/stripe/checkout-session.ts`**

```typescript
import Stripe from 'stripe'
import { getStripeClient } from './client'

interface CreateCheckoutSessionParams {
  orderId: string
  userId: string
  userEmail: string
  currency: 'usd' | 'eur' | 'gbp'
  items: Array<{
    name: string
    description?: string
    amount: number      // Cent cinsinden (9.99 USD → 999)
    quantity: number
    type: 'ebook' | 'hardcopy'
  }>
  successUrl: string   // Ödeme başarılı → yönlendirilecek URL
  cancelUrl: string    // Ödeme iptal → yönlendirilecek URL
}

export async function createStripeCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripeClient()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: params.userEmail,
    currency: params.currency,
    
    line_items: params.items.map((item) => ({
      price_data: {
        currency: params.currency,
        unit_amount: Math.round(item.amount * 100), // Cent'e çevir
        product_data: {
          name: item.name,
          description: item.description,
          metadata: { type: item.type },
        },
      },
      quantity: item.quantity,
    })),

    // Sipariş ID'sini metadata'ya ekle (webhook'ta kullanacağız)
    metadata: {
      orderId: params.orderId,
      userId: params.userId,
    },

    success_url: params.successUrl,
    cancel_url: params.cancelUrl,

    // Otomatik vergi (opsiyonel, Stripe Tax ile)
    // automatic_tax: { enabled: true },
  })

  if (!session.url) {
    throw new Error('Stripe session URL oluşturulamadı')
  }

  return {
    sessionId: session.id,
    url: session.url,
  }
}
```

### 3.3 Webhook İşleme

**`lib/payment/stripe/webhook.ts`**

```typescript
import Stripe from 'stripe'
import { getStripeClient } from './client'

export function verifyStripeWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripeClient()
  
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}

export function getStripeEventType(event: Stripe.Event): string {
  return event.type
}
```

### 3.4 API: Checkout Session Oluştur

**`app/api/payment/stripe/create-session/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/api-auth'
import { createStripeCheckoutSession } from '@/lib/payment/stripe/checkout-session'
import { createOrder } from '@/lib/db/orders'
import { getUserCurrency } from '@/lib/currency'
import { PRICING } from '@/lib/pricing'

export async function POST(request: NextRequest) {
  const user = await requireUser()
  const body = await request.json()
  const { cartItems } = body

  // Kullanıcının para birimini tespit et
  const currency = getUserCurrency(request.headers)
  // Stripe 'usd' | 'eur' | 'gbp' formatı bekler (lowercase)
  const stripeCurrency = currency.toLowerCase() as 'usd' | 'eur' | 'gbp'

  // Toplam tutarı hesapla
  const totalAmount = cartItems.reduce((sum: number, item: any) => {
    return sum + (PRICING[item.type as 'ebook'][currency] || PRICING.ebook.USD)
  }, 0)

  // DB'ye sipariş kaydet (pending)
  const order = await createOrder({
    userId: user.id,
    provider: 'stripe',
    currency,
    items: cartItems,
    status: 'pending',
    totalAmount,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Stripe Checkout Session oluştur
  const session = await createStripeCheckoutSession({
    orderId: order.id,
    userId: user.id,
    userEmail: user.email,
    currency: stripeCurrency,
    items: cartItems.map((item: any) => ({
      name: item.bookTitle,
      description: item.type === 'ebook' ? 'Dijital E-Book' : 'Basılı Kitap',
      amount: PRICING[item.type as 'ebook'][currency] || PRICING.ebook.USD,
      quantity: 1,
      type: item.type,
    })),
    successUrl: `${appUrl}/payment/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl}/checkout?cancelled=true`,
  })

  // payments tablosuna kayıt
  await savePaymentRecord({
    orderId: order.id,
    provider: 'stripe',
    providerSessionId: session.sessionId,
    amount: totalAmount,
    currency,
    status: 'initiated',
  })

  return NextResponse.json({
    success: true,
    orderId: order.id,
    checkoutUrl: session.url,
  })
}
```

### 3.5 Stripe Webhook Handler

**`app/api/webhooks/stripe/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyStripeWebhookSignature } from '@/lib/payment/stripe/webhook'
import { updateOrderStatus, getOrderById } from '@/lib/db/orders'
import { savePaymentEvent } from '@/lib/db/payments'
import Stripe from 'stripe'

// Stripe webhook için raw body gerekli (body parser devre dışı)
export const config = {
  api: { bodyParser: false },
}

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = verifyStripeWebhookSignature(payload, signature)
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Event'i kaydet
  const session = event.data.object as Stripe.Checkout.Session
  const orderId = session.metadata?.orderId

  await savePaymentEvent({
    provider: 'stripe',
    orderId: orderId || null,
    eventType: event.type,
    rawPayload: event as any,
  })

  // Event tipine göre işlem yap
  switch (event.type) {
    case 'checkout.session.completed': {
      if (session.payment_status === 'paid' && orderId) {
        await updateOrderStatus(orderId, {
          status: 'paid',
          paidAt: new Date(),
          providerPaymentId: session.payment_intent as string,
        })
        console.log(`[Stripe] Order ${orderId} marked as paid`)
      }
      break
    }

    case 'checkout.session.expired': {
      if (orderId) {
        await updateOrderStatus(orderId, {
          status: 'cancelled',
          failureReason: 'Stripe session expired',
        })
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.error('[Stripe] Payment failed:', paymentIntent.last_payment_error?.message)
      // orderId metadata'da olmayabilir, payment_intent üzerinden bul
      break
    }

    default:
      console.log(`[Stripe] Unhandled event: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
```

---

## 4. Stripe Dashboard Yapılandırması

### 4.1 Webhook Endpoint Ekleme

1. Stripe Dashboard → **Developers → Webhooks**
2. **Add endpoint** tıkla
3. URL: `https://herokidstory.com/api/webhooks/stripe`
4. Listen to events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
5. **Signing secret** kopyala → `.env` → `STRIPE_WEBHOOK_SECRET`

### 4.2 Local Test için (geliştirme)

```bash
# Stripe CLI kur
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test event gönder
stripe trigger checkout.session.completed
```

### 4.3 Test Kart Numaraları

| Kart | Numara | Son kullanma | CVV | Sonuç |
|------|--------|--------------|-----|-------|
| Başarılı | 4242 4242 4242 4242 | Herhangi | Herhangi | ✅ Başarılı |
| 3D Secure | 4000 0025 0000 3155 | Herhangi | Herhangi | 🔒 3DS tetikler |
| Yetersiz bakiye | 4000 0000 0000 9995 | Herhangi | Herhangi | ❌ Başarısız |
| Reddedildi | 4000 0000 0000 0002 | Herhangi | Herhangi | ❌ Reddedildi |

---

## 5. Stripe Hesabı Canlıya Alış

Mevcut Stripe hesabı zaten var. Canlıya geçmek için:

1. **Dashboard → Complete activation** — Şirket/şahıs bilgileri doldur
2. **Live API keys** kopyala → `.env`'e live key'leri ekle
3. **Webhook** endpoint URL'ini canlı URL ile güncelle
4. **Test modunu kapat** → Dashboard'da "Viewing test data" toggle'ı kapat

> **Not:** Türkiye'de Stripe hesabından para çekebilmek için yabancı banka hesabı veya yurt dışı şirket gereklidir. Bu konu `docs/roadmap/PHASE_4_ECOMMERCE.md`'deki **4.4.7 Yurtdışı Şirket Kurulumu** bölümünde ele alınmıştır.

---

## 6. Yapılacaklar Kontrol Listesi

### Hazırlık
- [ ] Stripe dashboard'dan test API key'lerini al
- [ ] Stripe dashboard'a webhook endpoint ekle
- [ ] Webhook signing secret'ı `.env`'e ekle
- [ ] `npm install stripe @stripe/stripe-js` çalıştır

### Backend
- [ ] `lib/payment/stripe/client.ts` oluştur
- [ ] `lib/payment/stripe/checkout-session.ts` oluştur
- [ ] `lib/payment/stripe/webhook.ts` oluştur
- [ ] `app/api/payment/stripe/create-session/route.ts` oluştur
- [ ] `app/api/webhooks/stripe/route.ts` oluştur

### Test
- [ ] `stripe listen` ile local webhook testi
- [ ] Başarılı ödeme testi (4242 kartı)
- [ ] Başarısız ödeme testi
- [ ] 3D Secure testi
- [ ] `orders` tablosunun doğru güncellenmesi kontrolü
- [ ] `checkout.session.expired` testi

---

## ⏭️ Sonraki Faz

→ [FAZ3_CHECKOUT.md](FAZ3_CHECKOUT.md) — Her iki sağlayıcıyı birleştiren checkout sayfası
