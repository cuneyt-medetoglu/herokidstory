# 💳 Faz 4 — Sipariş Yönetimi ve Admin Panel

**Bağlı Roadmap:** [PAYMENT_ROADMAP.md](PAYMENT_ROADMAP.md)  
**Durum:** ⬜ Bekliyor  
**Ön koşul:** [Faz 0](FAZ0_HAZIRLIK.md) tamamlanmış olmalı (DB tabloları gerekli)  
**İlgili Doküman:** `docs/analysis/ADMIN_DASHBOARD_ANALYSIS.md` → Faz B.1  
**Tahmini süre:** 2-3 gün

---

## 🎯 Bu Fazın Amacı

Admin paneline sipariş yönetimi eklemek:
- Tüm siparişleri listeleme, filtreleme, arama
- Sipariş detayları (kullanıcı, ürünler, ödeme bilgisi)
- Durum güncelleme (manuel iptal, iade tetikleme)
- Finansal metrikler (gelir, sipariş istatistikleri)
- Kullanıcıya sipariş geçmişi sayfası

---

## 1. Kullanıcı Tarafı — Sipariş Sayfaları

### 1.1 URL Yapısı

```
/orders          — Kullanıcının siparişleri listesi
/orders/[id]     — Sipariş detayı
```

### 1.2 Siparişler Listesi (`/orders`)

**Gösterilecekler:**
- Sipariş tarihi
- Sipariş no (kısaltılmış UUID)
- Kitap adları (ve kapak thumbnail'ları)
- Toplam tutar ve para birimi
- Durum (ödenmiş, bekliyor, iptal, iade)
- "Detay" butonu

### 1.3 Sipariş Detayı (`/orders/[id]`)

**Gösterilecekler:**
- Sipariş özeti
- Ödeme bilgisi (sağlayıcı, tarih, tutar)
- Ürünler listesi (kitap kapağı, adı, türü, fiyatı)
- E-Book için: "Kitabı Oku" butonu (sadece ödeme tamamlanmışsa)
- Hardcopy için: kargo takip numarası (varsa)
- İptal talebi butonu (sadece pending/paid ve henüz kargolanmamışsa)

### 1.4 API Endpoint'leri (Kullanıcı)

```
GET  /api/orders                    — Kullanıcının siparişleri
GET  /api/orders/[id]               — Sipariş detayı
POST /api/orders/[id]/cancel        — İptal talebi
GET  /api/orders/[id]/download      — E-book PDF indirme linki
```

---

## 2. Admin Paneli — Sipariş Yönetimi

### 2.1 URL Yapısı (Admin)

```
/admin/orders          — Tüm siparişler listesi
/admin/orders/[id]     — Sipariş detayı (admin görünümü)
```

### 2.2 Sipariş Listesi (`/admin/orders`)

**Filtreler:**
| Filtre | Seçenekler |
|--------|-----------|
| Durum | Tümü / pending / paid / failed / cancelled / refunded |
| Sağlayıcı | Tümü / iyzico / Stripe |
| Tarih aralığı | Bugün / Bu hafta / Bu ay / Özel |
| Para birimi | Tümü / TRY / USD / EUR / GBP |

**Arama:** Sipariş no, kullanıcı e-posta, kitap adı

**Tablo Sütunları:**
- Sipariş No (kısaltılmış)
- Kullanıcı (e-posta, kullanıcı detay linki)
- Ürünler (kitap adları)
- Tutar (para birimi ile)
- Sağlayıcı (iyzico/Stripe badge'i)
- Durum (renkli badge)
- Tarih
- İşlemler (Detay butonu)

**Export:** CSV olarak tüm filtrelenmiş siparişleri indir

### 2.3 Sipariş Detayı — Admin (`/admin/orders/[id]`)

**Bölümler:**
1. **Sipariş Özeti** — Tutar, tarih, sağlayıcı, durum
2. **Ödeme Bilgisi** — provider_payment_id, işlem ID'si, ödeme tarihi
3. **Kullanıcı Bilgisi** — İsim, e-posta, admin kullanıcı sayfasına link
4. **Ürünler** — Her ürün için kitap bilgisi, tür, fiyat, fulfillment durumu
5. **Fatura Adresi** — (iyzico için)
6. **Durum Değiştir** — Manuel durum güncelleme (dikkatli: sadece gerektiğinde)
7. **İade İşlemi** — "İade Başlat" butonu (iyzico/Stripe API üzerinden)
8. **Sipariş Notu** — Admin notları
9. **Event Geçmişi** — `payment_events` tablosundan gelen webhook olayları

### 2.4 API Endpoint'leri (Admin)

```
GET    /api/admin/orders                    — Tüm siparişler (filtreleme, arama, sayfalama)
GET    /api/admin/orders/[id]              — Sipariş detayı (tam bilgi)
PATCH  /api/admin/orders/[id]              — Durum güncelle, not ekle
POST   /api/admin/orders/[id]/refund       — İade işlemi başlat
GET    /api/admin/orders/stats             — Sipariş istatistikleri (dashboard için)
GET    /api/admin/orders/export            — CSV export
```

---

## 3. Kod Implementasyonu

### 3.1 DB Yardımcı Fonksiyonlar

**`lib/db/orders.ts`**

```typescript
import { db } from '@/lib/db'

export async function createOrder(params: {
  userId: string
  provider: 'iyzico' | 'stripe'
  currency: string
  items: Array<{ bookId: string; type: string; price: number }>
  billingAddress?: object
  status?: string
  totalAmount: number
}) {
  // orders tablosuna INSERT
  // order_items tablosuna INSERT (her item için)
}

export async function updateOrderStatus(
  orderId: string,
  update: {
    status: string
    paidAt?: Date
    cancelledAt?: Date
    providerPaymentId?: string
    failureReason?: string
  }
) {
  // orders tablosunu UPDATE
}

export async function getOrdersByUser(userId: string) {
  // Kullanıcının siparişlerini getir (items ile birlikte)
}

export async function getOrderById(orderId: string, userId?: string) {
  // Sipariş detayı (userId varsa sahiplik kontrolü)
}

export async function getAdminOrders(params: {
  page: number
  limit: number
  status?: string
  provider?: string
  search?: string
  dateFrom?: Date
  dateTo?: Date
}) {
  // Admin için tüm siparişler (filtreleme ile)
}

export async function getOrderStats() {
  // Dashboard istatistikleri
  // Bugün/Bu hafta/Bu ay: sipariş sayısı, toplam gelir
}
```

### 3.2 Admin Sipariş API

**`app/api/admin/orders/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/api-auth'
import { getAdminOrders, getOrderStats } from '@/lib/db/orders'

export async function GET(request: NextRequest) {
  await requireAdmin()
  
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') || undefined
  const provider = searchParams.get('provider') || undefined
  const search = searchParams.get('search') || undefined

  const orders = await getAdminOrders({ page, limit, status, provider, search })
  
  return NextResponse.json(orders)
}
```

### 3.3 İade İşlemi

İade işlemi ödeme sağlayıcısına göre farklıdır:

**iyzico İadesi:**
```typescript
// lib/payment/iyzico/refund.ts
async function refundIyzicoPayment(paymentId: string, amount: number) {
  // iyzico.cancel.create() veya iyzico.refund.create()
  // Kısmi iade: refund.create
  // Tam iade: cancel.create (ödeme günü aynısı) veya refund.create
}
```

**Stripe İadesi:**
```typescript
// lib/payment/stripe/refund.ts
async function refundStripePayment(paymentIntentId: string, amount?: number) {
  const stripe = getStripeClient()
  await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined, // undefined = tam iade
  })
}
```

---

## 4. Admin Dashboard — Finansal Metrikler

Admin ana dashboard'a eklenecek istatistikler (Faz C):

```typescript
// lib/db/admin.ts — mevcut getAdminStats() fonksiyonuna eklenecek
const orderStats = await db.query(`
  SELECT
    COUNT(*) FILTER (WHERE status = 'paid') AS total_orders,
    SUM(total_amount) FILTER (WHERE status = 'paid' AND currency = 'TRY') AS revenue_try,
    SUM(total_amount) FILTER (WHERE status = 'paid' AND currency != 'TRY') AS revenue_usd,
    COUNT(*) FILTER (WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '24 hours') AS orders_today,
    COUNT(*) FILTER (WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '7 days') AS orders_this_week,
    COUNT(*) FILTER (WHERE payment_provider = 'iyzico' AND status = 'paid') AS iyzico_orders,
    COUNT(*) FILTER (WHERE payment_provider = 'stripe' AND status = 'paid') AS stripe_orders
  FROM orders
`)
```

**Dashboard kartları:**
- Bugünkü gelir (TRY + USD ayrı)
- Bu ayki toplam sipariş sayısı
- iyzico / Stripe oranı
- Başarısız ödeme sayısı (son 24s)

---

## 5. Kullanıcı Sipariş Sayfaları — Kod

### 5.1 `app/[locale]/(public)/orders/page.tsx`

```tsx
import { requireAuth } from '@/lib/auth/page-auth'
import { getOrdersByUser } from '@/lib/db/orders'

export default async function OrdersPage() {
  const user = await requireAuth()
  const orders = await getOrdersByUser(user.id)

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Siparişlerim</h1>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">Henüz siparişiniz yok.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 6. Yapılacaklar Kontrol Listesi

### Kullanıcı Tarafı
- [ ] `lib/db/orders.ts` — tüm DB fonksiyonları
- [ ] `app/api/orders/route.ts` — kullanıcı sipariş listesi
- [ ] `app/api/orders/[id]/route.ts` — sipariş detayı
- [ ] `app/[locale]/(public)/orders/page.tsx`
- [ ] `app/[locale]/(public)/orders/[id]/page.tsx`
- [ ] `components/orders/OrderCard.tsx`
- [ ] `components/orders/OrderDetail.tsx`

### Admin Tarafı
- [ ] `app/api/admin/orders/route.ts` — liste + stats
- [ ] `app/api/admin/orders/[id]/route.ts` — detay + güncelleme
- [ ] `app/api/admin/orders/[id]/refund/route.ts` — iade
- [ ] `app/api/admin/orders/export/route.ts` — CSV
- [ ] `app/(admin)/admin/orders/page.tsx` — admin sipariş listesi
- [ ] `app/(admin)/admin/orders/[id]/page.tsx` — admin detay
- [ ] Admin sidebar'a "Siparişler" linki ekle
- [ ] Admin dashboard'a sipariş istatistikleri ekle

### İade
- [ ] `lib/payment/iyzico/refund.ts`
- [ ] `lib/payment/stripe/refund.ts`
- [ ] İade API endpoint

---

## ⏭️ Sonraki Faz

→ [FAZ5_POST_ODEME.md](FAZ5_POST_ODEME.md) — Ödeme sonrası akışlar
