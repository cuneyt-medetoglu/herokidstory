# 💳 Faz 1 — iyzico Entegrasyonu (Türkiye)

**Bağlı Roadmap:** [PAYMENT_ROADMAP.md](PAYMENT_ROADMAP.md)  
**Durum:** 🟡 Kod tamam — **Sandbox testleri** ve operasyonel doğrulama kaldı (Faz 3’e geçiş için onay bekle).  
**Ön koşul:** [Faz 0](FAZ0_HAZIRLIK.md) tamamlanmış olmalı  
**Tahmini süre:** 3-5 gün

---

## 🎯 Bu Fazın Amacı

Türkiye'deki kullanıcıların iyzico ile ödeme yapabilmesini sağlamak:
- iyzico Checkout Form entegrasyonu (iframe tabanlı, 3D Secure dahil)
- Ödeme başlatma, tamamlama ve iptal akışları
- Callback ve webhook ile sipariş kaydı güncelleme

---

## 1. iyzico Genel Bilgi

### 1.1 iyzico Nedir?

iyzico, Türkiye merkezli bir ödeme altyapısı sağlayıcısıdır. Özellikle:
- **Checkout Form:** Kullanıcıya iframe içinde hazır bir ödeme formu sunar. Kart bilgileri doğrudan iyzico'ya gider — PCI DSS sorununu ortadan kaldırır.
- **3D Secure:** Türk bankaları için zorunlu olan 3D Secure akışını otomatik yönetir.
- **Sandbox:** `sandbox-api.iyzipay.com` üzerinden ücretsiz test yapılabilir.

### 1.2 iyzico Ödeme Akışı

```
1. Kullanıcı "Ödeme Yap" butonuna basar
2. Backend → iyzico API → Checkout Form token alır
3. Frontend → iyzico Checkout Form iframe yükler
4. Kullanıcı kart bilgilerini iframe içinde girer
5. 3D Secure gerekiyorsa → banka sayfasına yönlendirilir
6. Ödeme tamamlanır → iyzico callback URL'ine POST isteği gönderir
7. Backend callback'i doğrular → sipariş durumunu günceller
8. Kullanıcı başarı/hata sayfasına yönlendirilir
```

### 1.3 Test Bilgileri

**Test API'si:** `https://sandbox-api.iyzipay.com`

**Test Kart Numaraları:**
| Kart | Numara | Son kullanma | CVV |
|------|--------|--------------|-----|
| Visa (başarılı) | 5528790000000008 | 12/30 | 123 |
| MasterCard (başarılı) | 5528790000000008 | 12/30 | 123 |
| 3D Secure başarılı | 4766620000000001 | 07/26 | 000 |
| 3D Secure başarısız | 4785284600015816 | 07/26 | 000 |

**Test API Credentials (iyzico sandbox):**
- API Key: `sandbox-xxxxxxxx` (iyzico sandbox panelinden alınır)
- Secret: `sandbox-xxxxxxxx`

> Sandbox kaydı: https://sandbox-merchant.iyzipay.com/

---

## 2. Teknik Mimari

### 2.1 Dosya Yapısı

```
lib/payment/
  iyzico/
    client.ts          — iyzico SDK istemcisi
    checkout-form.ts   — Checkout Form token oluşturma
    verify-payment.ts  — Ödeme doğrulama
    types.ts           — TypeScript tipleri

app/api/payment/
  iyzico/
    initialize/route.ts   — Checkout form token al
    callback/route.ts     — 3D Secure callback (POST)
  webhooks/
    iyzico/route.ts       — iyzico webhook handler
```

### 2.2 İş Akışı Detayı

```
POST /api/payment/iyzico/initialize
  ├─ Kullanıcı ve sepet bilgilerini al
  ├─ orders tablosuna 'pending' kayıt yaz
  ├─ payments tablosuna 'initiated' kayıt yaz
  ├─ iyzico API'ye checkoutFormInitialize isteği gönder
  │    Parametreler: price, basketItems, buyer, shippingAddress, billingAddress
  ├─ token ve checkoutFormContent (HTML) döner
  └─ Frontend'e { token, checkoutFormContent } döndür

Frontend:
  ├─ checkoutFormContent HTML'ini sayfaya inject eder
  ├─ iyzico Checkout Form iframe yüklenir
  └─ Kullanıcı ödeme yapar

POST /api/payment/iyzico/callback  (iyzico'nun POST ettiği)
  ├─ token al
  ├─ iyzico API → checkoutFormRetrieve(token) ile sonucu sorgula
  ├─ paymentStatus === 'SUCCESS' kontrolü
  ├─ İmza doğrulaması yap
  ├─ orders tablosunu güncelle (paid, paid_at)
  ├─ payments tablosunu güncelle (succeeded)
  └─ Kullanıcıyı /payment/success?orderId=xxx sayfasına yönlendir
     (veya /payment/failure?reason=xxx)
```

### 2.3 Kitap oluşturma (step 6 / örnekten oluştur) → sepet

**Sorun:** Yalnızca `/cart?plan=ebook` (veya benzeri query) ile yönlendirme, **CartContext’e satır eklemediği** için kullanıcı boş sepet görüyordu.

**Faz 1 çözümü:** Ödeme / sepete git butonunda önce ilgili ürün **`addToCart`** ile eklenir, ardından sepet veya checkout’a gidilir (`create/step6`, `create/from-example`).

**Sonraki iyileştirme:** Daha zengin “ürün seç → sepet” UX, plan tipi metinleri ve **geo / para birimi** hizası → **[Faz 3 — Checkout](FAZ3_CHECKOUT.md)** (onay sonrası).

---

## 3. Kod Implementasyonu

### 3.1 iyzico SDK İstemcisi

**`lib/payment/iyzico/client.ts`**

```typescript
import Iyzipay from 'iyzipay'

let client: Iyzipay | null = null

export function getIyzicoClient(): Iyzipay {
  if (!client) {
    client = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.IYZICO_BASE_URL!,
    })
  }
  return client
}
```

### 3.2 Checkout Form Başlatma

**`lib/payment/iyzico/checkout-form.ts`**

```typescript
import { getIyzicoClient } from './client'

interface InitializeCheckoutFormParams {
  orderId: string
  price: number           // Toplam tutar (TRY)
  currency: 'TRY'
  buyer: {
    id: string            // user.id
    name: string
    surname: string
    email: string
    identityNumber?: string  // TC Kimlik No (isteğe bağlı)
    ip: string
    registrationAddress: string
    city: string
    country: string
  }
  basketItems: Array<{
    id: string            // order_item.id
    name: string          // Kitap adı
    category1: string     // 'E-Book' veya 'Hardcopy'
    itemType: 'VIRTUAL' | 'PHYSICAL'
    price: number
  }>
  billingAddress: {
    contactName: string
    city: string
    country: string
    address: string
    zipCode?: string
  }
  shippingAddress?: {     // Sadece hardcopy için
    contactName: string
    city: string
    country: string
    address: string
    zipCode?: string
  }
  callbackUrl: string     // iyzico'nun POST edeceği URL
}

export async function initializeIyzicoCheckoutForm(
  params: InitializeCheckoutFormParams
): Promise<{ token: string; checkoutFormContent: string }> {
  const iyzico = getIyzicoClient()
  
  return new Promise((resolve, reject) => {
    iyzico.checkoutFormInitialize.create(
      {
        locale: 'tr',
        conversationId: params.orderId,
        price: String(params.price),
        paidPrice: String(params.price),
        currency: params.currency,
        basketId: params.orderId,
        paymentGroup: 'PRODUCT',
        callbackUrl: params.callbackUrl,
        enabledInstallments: [1, 2, 3, 6, 9, 12],
        buyer: params.buyer,
        shippingAddress: params.shippingAddress || params.billingAddress,
        billingAddress: params.billingAddress,
        basketItems: params.basketItems,
      },
      (err: Error, result: any) => {
        if (err) return reject(err)
        if (result.status !== 'success') {
          return reject(new Error(result.errorMessage || 'iyzico error'))
        }
        resolve({
          token: result.token,
          checkoutFormContent: result.checkoutFormContent,
        })
      }
    )
  })
}
```

### 3.3 Ödeme Doğrulama

**`lib/payment/iyzico/verify-payment.ts`**

```typescript
import { getIyzicoClient } from './client'

export async function verifyIyzicoPayment(token: string): Promise<{
  success: boolean
  paymentId?: string
  conversationId?: string
  errorMessage?: string
  rawResult?: any
}> {
  const iyzico = getIyzicoClient()

  return new Promise((resolve) => {
    iyzico.checkoutFormRetrieve.retrieve(
      { locale: 'tr', token },
      (err: Error, result: any) => {
        if (err) {
          return resolve({ success: false, errorMessage: err.message })
        }
        resolve({
          success: result.paymentStatus === 'SUCCESS',
          paymentId: result.paymentId,
          conversationId: result.conversationId,
          errorMessage: result.errorMessage,
          rawResult: result,
        })
      }
    )
  })
}
```

### 3.4 API: Checkout Form Başlatma

**`app/api/payment/iyzico/initialize/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/api-auth'
import { initializeIyzicoCheckoutForm } from '@/lib/payment/iyzico/checkout-form'
import { createOrder } from '@/lib/db/orders'

export async function POST(request: NextRequest) {
  const user = await requireUser()
  const body = await request.json()
  const { cartItems, billingAddress } = body

  // 1. Siparişi DB'ye kaydet (pending)
  const order = await createOrder({
    userId: user.id,
    provider: 'iyzico',
    currency: 'TRY',
    items: cartItems,
    billingAddress,
    status: 'pending',
  })

  // 2. iyzico checkout form başlat
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/iyzico/callback`
  
  const result = await initializeIyzicoCheckoutForm({
    orderId: order.id,
    price: order.totalAmount,
    currency: 'TRY',
    buyer: {
      id: user.id,
      name: user.name?.split(' ')[0] || 'Ad',
      surname: user.name?.split(' ').slice(1).join(' ') || 'Soyad',
      email: user.email,
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      registrationAddress: billingAddress.address,
      city: billingAddress.city,
      country: 'Turkey',
    },
    basketItems: cartItems.map((item: any) => ({
      id: item.bookId,
      name: item.bookTitle,
      category1: item.type === 'ebook' ? 'E-Book' : 'Hardcopy Book',
      itemType: item.type === 'ebook' ? 'VIRTUAL' : 'PHYSICAL',
      price: item.price,
    })),
    billingAddress,
    callbackUrl,
  })

  return NextResponse.json({
    success: true,
    orderId: order.id,
    token: result.token,
    checkoutFormContent: result.checkoutFormContent,
  })
}
```

### 3.5 API: Callback Handler

**`app/api/payment/iyzico/callback/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyIyzicoPayment } from '@/lib/payment/iyzico/verify-payment'
import { updateOrderStatus } from '@/lib/db/orders'
import { savePaymentEvent } from '@/lib/db/payments'

// iyzico bu endpoint'e POST atar (3D Secure sonrası)
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const token = formData.get('token') as string

  if (!token) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure?reason=missing_token`
    )
  }

  // Ödemeyi doğrula
  const result = await verifyIyzicoPayment(token)

  // Event'i kaydet (başarılı veya değil)
  await savePaymentEvent({
    provider: 'iyzico',
    orderId: result.conversationId,
    eventType: result.success ? 'payment.success' : 'payment.failure',
    rawPayload: result.rawResult,
  })

  if (result.success) {
    // Siparişi güncelle
    await updateOrderStatus(result.conversationId!, {
      status: 'paid',
      paidAt: new Date(),
      providerPaymentId: result.paymentId,
    })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?orderId=${result.conversationId}`
    )
  } else {
    await updateOrderStatus(result.conversationId!, {
      status: 'failed',
      failureReason: result.errorMessage,
    })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure?orderId=${result.conversationId}&reason=${encodeURIComponent(result.errorMessage || 'unknown')}`
    )
  }
}
```

---

## 4. Frontend: iyzico Checkout Form Bileşeni

**`components/payment/IyzicoCheckoutForm.tsx`**

```tsx
'use client'

import { useEffect, useRef } from 'react'

interface IyzicoCheckoutFormProps {
  checkoutFormContent: string   // iyzico'dan gelen HTML
  onLoad?: () => void
}

export function IyzicoCheckoutForm({ checkoutFormContent, onLoad }: IyzicoCheckoutFormProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !checkoutFormContent) return

    // iyzico'nun döndürdüğü HTML'i inject et (script tag'i dahil)
    containerRef.current.innerHTML = checkoutFormContent

    // Script'leri çalıştır
    const scripts = containerRef.current.querySelectorAll('script')
    scripts.forEach((originalScript) => {
      const newScript = document.createElement('script')
      if (originalScript.src) {
        newScript.src = originalScript.src
      } else {
        newScript.textContent = originalScript.textContent
      }
      document.body.appendChild(newScript)
    })

    onLoad?.()
  }, [checkoutFormContent, onLoad])

  return (
    <div
      ref={containerRef}
      id="iyzipay-checkout-form"
      className="responsive"
    />
  )
}
```

---

## 5. Billing Address Formu

iyzico ödeme formu, kullanıcıdan **kart bilgilerini** alır ama **fatura adresini** bizim uygulamamızın formu alması gerekir.

**Gerekli bilgiler (TR kullanıcılar için):**
- Ad Soyad
- İl
- Adres
- E-posta (zaten var — oturum)

**İsteğe bağlı (KDV faturası için gelecekte):**
- TC Kimlik No veya Vergi No

---

## 6. iyzico'ya Başvuru (Canlıya Alış)

Canlıya geçmek için iyzico'ya başvuru yapılması gerekir:

### Gerekli Belgeler
- Şirket kimlik bilgileri (şahıs şirketi veya Ltd/AŞ)
- Vergi levhası
- İmza sirküleri
- İki aydır aktif banka hesabı belgesi
- Web sitesi URL (canlı ve erişilebilir olmalı)
- Satılan ürün/hizmet açıklaması

### Başvuru Süreci
1. https://iyzico.com → "Hemen Başvur"
2. Başvuru formu doldur
3. Belgeleri yükle
4. iyzico incelemesi (1-5 iş günü)
5. Onay sonrası live API key'leri teslim edilir

---

## 7. Yapılacaklar Kontrol Listesi

### Hazırlık
- [x] iyzico sandbox hesabı oluştur (sandbox-merchant.iyzipay.com)
- [x] Sandbox API key ve Secret'ı `.env`'e ekle
- [x] `npm install iyzipay` + `npm install --save-dev @types/iyzipay`

### DB
- [x] `createOrder()` fonksiyonu (`lib/db/orders.ts`)
- [x] `updateOrderStatus()` fonksiyonu
- [x] `savePaymentEvent()` fonksiyonu
- [x] `createPaymentRecord()` / `updatePaymentRecord()` fonksiyonları
- [x] `getPaymentByOrderId()` — callback için ek yardımcı

### Backend
- [x] `lib/payment/iyzico/types.ts` — iyzico-özel TS tipleri
- [x] `lib/payment/iyzico/client.ts` — singleton iyzipay istemcisi
- [x] `lib/payment/iyzico/checkout-form.ts` — Promise sarmalayıcı
- [x] `lib/payment/iyzico/verify-payment.ts` — ödeme doğrulama
- [x] `app/api/payment/iyzico/initialize/route.ts` — sipariş oluştur + token al
- [x] `app/api/payment/iyzico/callback/route.ts` — callback doğrula + güncelle

### Frontend
- [x] `components/payment/IyzicoCheckoutForm.tsx` — iframe + script inject
- [x] `components/payment/BillingAddressForm.tsx` — fatura adresi (i18n)
- [x] `components/payment/IyzicoPaymentFlow.tsx` — initialize + durum akışı
- [x] `components/checkout/CheckoutForm.tsx` — iyzico akışı entegre (mock kaldırıldı)
- [x] `app/[locale]/(public)/payment/success/page.tsx` — callback sonrası başarı
- [x] `app/[locale]/(public)/payment/failure/page.tsx` — başarısız ödeme
- [x] i18n: `checkout.billingAddress`, `checkout.iyzicoPayment`, `checkout.shipping.hardcopyNote`, `payment.failure.reasonLabel`

### Opsiyonel (Faz 1 dışı / sonraki sprint)
- [ ] `app/api/payment/webhooks/iyzico/route.ts` — iyzico webhook (callback yeterli olabilir; canlıda eklenir)

### Test (sen yapacaksın — kontrol listesi)
- [ ] Sandbox ile başarılı ödeme testi
- [ ] 3D Secure akışı testi
- [ ] Başarısız ödeme testi
- [ ] Callback doğrulama testi (`/api/payment/iyzico/callback` → `/payment/success|failure`)
- [ ] DB: `orders.status = paid`, `payments.status = succeeded`, `payment_events` kaydı

**Nasıl test edilir (özet):** Ayrıntı: [ODEME_NOTLARI.md](ODEME_NOTLARI.md) → “Sandbox — uçtan uca test”.

---

## ⏭️ Sonraki Faz

→ [FAZ2_STRIPE.md](FAZ2_STRIPE.md) — Stripe entegrasyonu  
→ [FAZ3_CHECKOUT.md](FAZ3_CHECKOUT.md) — Her iki sağlayıcıyı birleştiren checkout sayfası
