# 💳 Faz 3 — Checkout Sayfası ve Akış Birleşimi

**Bağlı Roadmap:** [PAYMENT_ROADMAP.md](PAYMENT_ROADMAP.md)  
**Durum:** ⬜ Bekliyor  
**Ön koşul:** [Faz 1 (iyzico)](FAZ1_IYZICO.md) tamamlanmış olmalı. **[Faz 2 (Stripe)](FAZ2_STRIPE.md) ertelendi:** ilk implementasyonda checkout **sadece iyzico** (TRY, fatura formu + Checkout Form); Stripe eklendikten sonra bu dokümandaki tam geo-routing uygulanır.  
**Tahmini süre:** 2-3 gün

---

## 🎯 Bu Fazın Amacı

Kullanıcı deneyimini birleştiren checkout sayfasını oluşturmak:
- Sepeti görüntüle
- Ülkeye göre doğru ödeme sağlayıcısını göster (iyzico / Stripe)
- Fatura bilgisi formu
- Ödeme başlatma ve yönlendirme
- Başarı / hata sayfaları

---

## 1. Checkout Sayfası Genel Tasarımı

### 1.1 URL Yapısı

```
/checkout          — Ana checkout sayfası
/payment/success   — Ödeme başarılı sayfası
/payment/failure   — Ödeme başarısız sayfası
/payment/pending   — Ödeme işleniyor (nadir durum)
```

### 1.2 Checkout Sayfası Bölümleri

```
┌─────────────────────────────────────────────────┐
│  Checkout                                        │
│                                                  │
│  ┌───────────────────┐  ┌──────────────────────┐ │
│  │   Sipariş Özeti   │  │  Ödeme Bilgileri      │ │
│  │                   │  │                       │ │
│  │  📚 Kitap Adı     │  │  [Fatura Adresi]      │ │
│  │  E-Book: ₺299     │  │                       │ │
│  │                   │  │  ─────────────────    │ │
│  │  ──────────────   │  │                       │ │
│  │  Toplam: ₺299     │  │  🇹🇷 TR kullanıcı:    │ │
│  │                   │  │  [iyzico form]        │ │
│  └───────────────────┘  │                       │ │
│                         │  🌍 Diğer:             │ │
│                         │  [Stripe'a Yönlendir] │ │
│                         └──────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 1.3 Kullanıcı Akışı

```
Sepet sayfası → "Ödemeye Geç" butonu
      ↓
Checkout sayfası yüklenir
      ↓
API: GET /api/payment/provider → { provider: 'iyzico' | 'stripe', country: 'TR' | ... }
      ↓
      ├── TR kullanıcı:
      │     Fatura formu → "Ödemeyi Başlat" butonu
      │     → POST /api/payment/iyzico/initialize
      │     → checkoutFormContent döner → iframe inject
      │     → Kullanıcı iyzico formunu doldurur
      │     → Ödeme tamamlanır → /payment/success
      │
      └── Diğer kullanıcı:
            Fatura adres gerekmez (Stripe halleder)
            → "Stripe ile Öde" butonu
            → POST /api/payment/stripe/create-session
            → checkoutUrl döner → window.location.href = checkoutUrl
            → Stripe sayfası açılır
            → Ödeme tamamlanır → /payment/success
```

---

## 2. Dosya Yapısı

```
app/[locale]/(public)/
  checkout/
    page.tsx                      — Ana checkout sayfası
  payment/
    success/
      page.tsx                    — Ödeme başarılı
    failure/
      page.tsx                    — Ödeme başarısız
    pending/
      page.tsx                    — Ödeme işleniyor

components/payment/
  CheckoutPage.tsx                — Ana checkout bileşeni (client)
  OrderSummary.tsx                — Sipariş özeti (sağ panel)
  BillingAddressForm.tsx          — Fatura adresi formu
  IyzicoCheckoutForm.tsx          — iyzico iframe (Faz 1'de oluşturuldu)
  StripeCheckoutButton.tsx        — Stripe'a yönlendirme butonu
  PaymentProviderBadge.tsx        — "Güvenli ödeme: iyzico/Stripe" badge
```

---

## 3. Checkout Sayfası Implementasyonu

### 3.1 `app/[locale]/(public)/checkout/page.tsx`

```tsx
import { CheckoutPage } from '@/components/payment/CheckoutPage'
import { requireAuth } from '@/lib/auth/page-auth'

export default async function Checkout() {
  await requireAuth()  // Giriş yapmamışsa login'e yönlendir
  
  return <CheckoutPage />
}
```

### 3.2 `components/payment/CheckoutPage.tsx` (Client)

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/CartContext'
import { OrderSummary } from './OrderSummary'
import { BillingAddressForm } from './BillingAddressForm'
import { IyzicoCheckoutForm } from './IyzicoCheckoutForm'
import { StripeCheckoutButton } from './StripeCheckoutButton'
import { PaymentProviderBadge } from './PaymentProviderBadge'

type PaymentProvider = 'iyzico' | 'stripe'
type Step = 'summary' | 'billing' | 'payment'

export function CheckoutPage() {
  const { items, totalPrice } = useCart()
  const [provider, setProvider] = useState<PaymentProvider | null>(null)
  const [step, setStep] = useState<Step>('summary')
  const [iyzicoFormContent, setIyzicoFormContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [billingAddress, setBillingAddress] = useState(null)

  // Ödeme sağlayıcısını tespit et
  useEffect(() => {
    fetch('/api/payment/provider')
      .then(res => res.json())
      .then(data => setProvider(data.provider))
  }, [])

  // Sepet boşsa sepete yönlendir
  if (items.length === 0) {
    // redirect to /cart
    return null
  }

  const handleBillingSubmit = async (address: any) => {
    setBillingAddress(address)
    
    if (provider === 'iyzico') {
      setIsLoading(true)
      const res = await fetch('/api/payment/iyzico/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems: items, billingAddress: address }),
      })
      const data = await res.json()
      setIyzicoFormContent(data.checkoutFormContent)
      setStep('payment')
      setIsLoading(false)
    } else {
      setStep('payment')
    }
  }

  const handleStripeCheckout = async () => {
    setIsLoading(true)
    const res = await fetch('/api/payment/stripe/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems: items }),
    })
    const data = await res.json()
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl
    }
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Ödeme</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sol: Sipariş özeti */}
        <OrderSummary items={items} totalPrice={totalPrice} provider={provider} />
        
        {/* Sağ: Ödeme */}
        <div className="space-y-6">
          {step === 'summary' && (
            <div>
              <button
                onClick={() => setStep('billing')}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold"
              >
                Ödemeye Devam Et
              </button>
            </div>
          )}

          {step === 'billing' && provider === 'iyzico' && (
            <BillingAddressForm
              onSubmit={handleBillingSubmit}
              isLoading={isLoading}
            />
          )}

          {step === 'billing' && provider === 'stripe' && (
            <StripeCheckoutButton
              onClick={handleStripeCheckout}
              isLoading={isLoading}
            />
          )}

          {step === 'payment' && provider === 'iyzico' && iyzicoFormContent && (
            <IyzicoCheckoutForm checkoutFormContent={iyzicoFormContent} />
          )}

          {provider && <PaymentProviderBadge provider={provider} />}
        </div>
      </div>
    </div>
  )
}
```

---

## 4. Sipariş Özeti Bileşeni

**`components/payment/OrderSummary.tsx`**

```tsx
import Image from 'next/image'
import { CartItem } from '@/contexts/CartContext'

interface OrderSummaryProps {
  items: CartItem[]
  totalPrice: number
  provider: 'iyzico' | 'stripe' | null
}

export function OrderSummary({ items, totalPrice, provider }: OrderSummaryProps) {
  const currencySymbol = provider === 'iyzico' ? '₺' : '$'

  return (
    <div className="bg-muted/30 rounded-xl p-6 space-y-4">
      <h2 className="font-semibold text-lg">Sipariş Özeti</h2>
      
      {items.map((item) => (
        <div key={item.bookId} className="flex items-center gap-4">
          {item.coverImage && (
            <Image
              src={item.coverImage}
              alt={item.bookTitle}
              width={60}
              height={80}
              className="rounded object-cover"
            />
          )}
          <div className="flex-1">
            <p className="font-medium text-sm">{item.bookTitle}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {item.type === 'ebook' ? 'E-Book (Dijital)' : 'Basılı Kitap'}
            </p>
          </div>
          <p className="font-semibold">
            {currencySymbol}{item.price}
          </p>
        </div>
      ))}
      
      <div className="border-t pt-4">
        <div className="flex justify-between font-bold text-lg">
          <span>Toplam</span>
          <span>{currencySymbol}{totalPrice}</span>
        </div>
      </div>
    </div>
  )
}
```

---

## 5. Başarı / Hata Sayfaları

### 5.1 Başarı Sayfası

**`app/[locale]/(public)/payment/success/page.tsx`**

```tsx
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface SearchParams {
  orderId?: string
  session_id?: string  // Stripe'dan gelir
}

export default async function PaymentSuccess({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { orderId } = searchParams
  
  return (
    <div className="container mx-auto py-16 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
        
        <h1 className="text-3xl font-bold">Ödeme Başarılı!</h1>
        
        <p className="text-muted-foreground">
          Siparişiniz alındı. Kısa süre içinde kitabınızı okuyabileceksiniz.
          {orderId && (
            <span className="block mt-2 text-sm">
              Sipariş No: <code className="font-mono">{orderId.slice(0, 8)}...</code>
            </span>
          )}
        </p>
        
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full bg-primary text-white py-3 rounded-lg font-semibold"
          >
            Kitaplığıma Git
          </Link>
          <Link
            href="/orders"
            className="block w-full border py-3 rounded-lg font-semibold"
          >
            Siparişimi Görüntüle
          </Link>
        </div>
      </div>
    </div>
  )
}
```

### 5.2 Hata Sayfası

**`app/[locale]/(public)/payment/failure/page.tsx`**

```tsx
import { XCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentFailure({
  searchParams,
}: {
  searchParams: { orderId?: string; reason?: string }
}) {
  const reason = searchParams.reason ? decodeURIComponent(searchParams.reason) : null

  return (
    <div className="container mx-auto py-16 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <XCircle className="w-20 h-20 text-red-500 mx-auto" />
        
        <h1 className="text-3xl font-bold">Ödeme Başarısız</h1>
        
        <p className="text-muted-foreground">
          Ödeme işleminiz tamamlanamadı. Lütfen tekrar deneyin.
          {reason && (
            <span className="block mt-2 text-sm text-red-500">{reason}</span>
          )}
        </p>
        
        <div className="space-y-3">
          <Link
            href="/checkout"
            className="block w-full bg-primary text-white py-3 rounded-lg font-semibold"
          >
            Tekrar Dene
          </Link>
          <Link
            href="/cart"
            className="block w-full border py-3 rounded-lg font-semibold"
          >
            Sepete Dön
          </Link>
        </div>
      </div>
    </div>
  )
}
```

---

## 6. Güvenlik Notları

### 6.1 CSRF Koruması
- Checkout form Next.js'in CSRF koruması ile çalışır
- Webhook endpoint'leri imza doğrulaması yapar (iyzico + Stripe)

### 6.2 Fiyat Manipülasyonu Önleme
- Frontend'den gelen fiyatlara **asla güvenme**
- Backend'de `lib/pricing.ts`'den fiyatı hesapla
- `cartItems` içindeki fiyatları görmezden gel, book_id ile DB'den fiyatı bul

### 6.3 Sipariş Doğrulama
- Webhook handler çalışmadan önce imzayı doğrula
- İki kez ödeme engellemek için `idempotency key` kullan (Stripe bunu otomatik yapar)
- `payment_events` tablosunda duplicate event kontrolü yap

---

## 7. Lokalizasyon (i18n)

Checkout sayfasında çeviriler:

```json
// messages/tr.json
{
  "checkout": {
    "title": "Ödeme",
    "orderSummary": "Sipariş Özeti",
    "total": "Toplam",
    "continueToPayment": "Ödemeye Devam Et",
    "payWithStripe": "Stripe ile Güvenli Öde",
    "securePayment": "256-bit SSL ile güvenli ödeme",
    "ebook": "E-Book (Dijital)",
    "hardcopy": "Basılı Kitap"
  },
  "payment": {
    "success": {
      "title": "Ödeme Başarılı!",
      "subtitle": "Siparişiniz alındı.",
      "goToLibrary": "Kitaplığıma Git",
      "viewOrder": "Siparişimi Görüntüle"
    },
    "failure": {
      "title": "Ödeme Başarısız",
      "subtitle": "Ödeme işleminiz tamamlanamadı.",
      "tryAgain": "Tekrar Dene",
      "backToCart": "Sepete Dön"
    }
  }
}
```

---

## 8. Yapılacaklar Kontrol Listesi

### Sayfalar
- [ ] `app/[locale]/(public)/checkout/page.tsx` oluştur
- [ ] `app/[locale]/(public)/payment/success/page.tsx` oluştur
- [ ] `app/[locale]/(public)/payment/failure/page.tsx` oluştur

### Bileşenler
- [ ] `components/payment/CheckoutPage.tsx` oluştur
- [ ] `components/payment/OrderSummary.tsx` oluştur
- [ ] `components/payment/BillingAddressForm.tsx` oluştur
- [ ] `components/payment/StripeCheckoutButton.tsx` oluştur
- [ ] `components/payment/PaymentProviderBadge.tsx` oluştur

### Entegrasyon
- [ ] Sepet "Ödemeye Geç" butonu → /checkout yönlendirmesi
- [ ] iyzico formu checkout sayfasına entegre et
- [ ] Stripe redirect checkout sayfasına entegre et
- [ ] Başarı sayfası sepeti temizlesin (CartContext)
- [ ] i18n çevirilerini ekle (TR + EN)

### Test
- [ ] TR IP ile iyzico formu görünüyor mu?
- [ ] Diğer IP ile Stripe butonu görünüyor mu?
- [ ] iyzico başarılı ödeme → /payment/success sayfası
- [ ] Stripe başarılı ödeme → /payment/success sayfası
- [ ] Başarı sayfasında sepet temizleniyor mu?
- [ ] Hata durumunda /payment/failure sayfası

---

## ⏭️ Sonraki Faz

→ [FAZ4_ADMIN_SIPARISLER.md](FAZ4_ADMIN_SIPARISLER.md) — Admin sipariş yönetimi
