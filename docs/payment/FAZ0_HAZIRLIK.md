# 💳 Faz 0 — Hazırlık ve Altyapı

**Bağlı Roadmap:** [PAYMENT_ROADMAP.md](PAYMENT_ROADMAP.md)  
**Durum:** 🟡 Devam (iyzico sandbox hazır; Stripe bu fazda **gerekmez**)  
**Ön koşul:** Yok — ilk faz  
**Tahmini süre:** 1-2 gün

> **Not (5 Nisan 2026):** Stripe entegrasyonu [FAZ2_STRIPE.md](FAZ2_STRIPE.md) ile **sonraya** bırakıldı. Bu fazda yalnızca iyzico için env, paket ve altyapı yeterli. iyzico API anahtarları **sadece** `.env` içinde tutulur; repoya veya dokümana yazılmaz.

---

## 🎯 Bu Fazın Amacı

Ödeme entegrasyonuna başlamadan önce gereken tüm altyapıyı hazırlamak:
- Veritabanı tablolarını oluşturmak
- Ortam değişkenlerini (env) tanımlamak
- Ödeme sağlayıcısı seçim mantığını kodlamak
- Sepet sistemini DB destekli hale getirmek (opsiyonel)

---

## 1. Fiyatlandırma Kararları (Kesinleştirilecek)

Ürün seti **3 satır** olarak sadeleştirildi (sayfa sayısına göre ayrı fiyat satırları yok; farklı sayfa sayıları aynı “E-Book” kalemi altında fiyat kuralı veya ürün varyantı ile ileride genişletilebilir).

Aşağıdaki fiyatlar **taslak** değerdir; onay sonrası `lib/pricing.ts` ile kodlanır.

| Ürün | TRY (iyzico) | Not |
|------|-------------|-----|
| **E-Book** | ₺299 (taslak) | Dijital kitap |
| **Hardcopy** | ₺499 (taslak) | Basılı — şimdilik sadece TR |
| **E-Book + Hardcopy (bundle)** | ₺699 (taslak) | Tek kalemden ikisi birlikte |

Stripe (USD/EUR/GBP) fiyatları **[FAZ2_STRIPE.md](FAZ2_STRIPE.md)** döneminde eklenecek.

> **Karar gerekli:** Yukarıdaki TRY tutarlarının kesinleşmesi.

---

## 1.1 Sepet ve indirim kodu: hazır altyapı mı, sıfırdan mı?

**Özet öneri:** Bu ürün tipi (kişiselleştirilmiş kitap, az SKU, mevcut Next.js + Postgres) için **tam “e-ticaret suite” (Medusa, Saleor vb.) genelde gereksiz ağırlık** taşır. **Sepette** mevcut yapıyı (Context + localStorage + checkout’ta sunucu doğrulaması + `orders`) güçlendirmek; **indirim kodunda** ise önce **hafif özel tablo + doğrulama**, Stripe gelince **Stripe Coupons** ile uluslararası tarafı desteklemek daha dengeli.

### Sepet

| Seçenek | Ne zaman mantıklı? |
|---------|---------------------|
| **Mevcut yapıyı genişletmek** (CartContext, `/api/cart` doğrulama, checkout’ta `orders`) | Az ürün, kitap satırı = `book_id` + tip (`ebook` / `hardcopy` / `bundle`). **Şu anki yön.** |
| **Headless commerce** (Medusa, Commerce Layer, vb.) | Çok SKU, çok kanal, karmaşık envanter, pazaryeri entegrasyonları. HeroKidStory MVP için genelde erken. |
| **Ödeme sağlayıcısı “sepeti”** (Stripe Checkout line items tek başına) | Stripe ağırlıklı ve basit satış; iyzico tarafı yine kendi sepet özetinizi bekler. **Hibrit** projede tek başına yeterli değil. |

**Sonuç:** “Hazır” diye komple platform almak yerine, **sepeti uygulama içinde tutmak** (gerekirse ileride Redis/DB ile kalıcı sepet) genelde doğru maliyet/fayda.

### İndirim kodu

| Seçenek | Not |
|---------|-----|
| **Kendi DB:** `promo_codes` (kod, yüzde/sabit, geçerlilik, kullanım limiti) + checkout’ta sunucu hesabı | iyzico ve özel akışlarla uyumlu; kontrol sizde. |
| **Stripe Coupons / Promotion Codes** | Stripe ödemelerinde güçlü; **Faz 2** ile birlikte değerlendirilir. |
| **Üçüncü parti “kupon SaaS”** | Çok kampanya, çok segment gerekiyorsa; MVP için çoğunlukla gereksiz. |

**Sonuç:** İndirimi **en baştan “0’dan her şey”** diye düşünmek yerine, **küçük bir şema + API** veya **Stripe tarafını sonra ekleme** yoluyla ilerlemek yeterli. Detaylı iş listesi, indirim kapsamı netleşince (sadece TRY mi, sadece ebook mi) ayrı bir alt başlık veya faz eki olarak yazılabilir.

---

## 2. Veritabanı Şeması

### 2.1 `orders` Tablosu

```sql
CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  
  -- Durum
  status            VARCHAR(50) NOT NULL DEFAULT 'pending'
                    CHECK (status IN (
                      'pending',       -- Ödeme başlatıldı, henüz tamamlanmadı
                      'processing',    -- Ödeme işleniyor
                      'paid',          -- Ödeme başarılı
                      'failed',        -- Ödeme başarısız
                      'cancelled',     -- Kullanıcı tarafından iptal edildi
                      'refunded',      -- İade edildi
                      'partially_refunded' -- Kısmen iade
                    )),
  
  -- Para ve sağlayıcı (DB’de `provider` / `currency` kullanılmıyor — PG + istemci uyumu)
  payment_provider  VARCHAR(20) NOT NULL CHECK (payment_provider IN ('iyzico', 'stripe')),
  order_currency    VARCHAR(10) NOT NULL, -- 'TRY', 'USD', 'EUR', 'GBP'
  subtotal          DECIMAL(10,2) NOT NULL,
  discount_amount   DECIMAL(10,2) DEFAULT 0,
  total_amount      DECIMAL(10,2) NOT NULL,
  
  -- Adres (TR kullanıcıları için)
  billing_address   JSONB,           -- { name, address, city, zip, country }
  shipping_address  JSONB,           -- hardcopy için
  
  -- Notlar
  notes             TEXT,            -- admin notu
  failure_reason    TEXT,            -- ödeme başarısız olursa sebebi
  
  -- Zaman
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  paid_at           TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  refunded_at       TIMESTAMPTZ
);

CREATE INDEX idx_orders_user_id     ON orders(user_id);
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_payment_provider ON orders(payment_provider);
CREATE INDEX idx_orders_created_at  ON orders(created_at DESC);
```

### 2.2 `order_items` Tablosu

```sql
CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id       UUID NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  
  item_type     VARCHAR(30) NOT NULL CHECK (item_type IN ('ebook', 'hardcopy', 'bundle')),
  
  -- Fiyat (sipariş anındaki değer — sonradan değişse bile korunur)
  unit_price    DECIMAL(10,2) NOT NULL,
  quantity      INTEGER NOT NULL DEFAULT 1,
  total_price   DECIMAL(10,2) NOT NULL,
  
  -- Durum (hardcopy için kargo takibi)
  fulfillment_status  VARCHAR(30) DEFAULT 'pending'
                      CHECK (fulfillment_status IN (
                        'pending', 'processing', 'printed', 'shipped', 'delivered', 'cancelled'
                      )),
  tracking_number     TEXT,
  
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_book_id  ON order_items(book_id);
```

### 2.3 `payments` Tablosu

```sql
CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  
  -- Sağlayıcı bilgisi
  payment_provider      VARCHAR(20) NOT NULL CHECK (payment_provider IN ('iyzico', 'stripe')),
  provider_payment_id   TEXT,   -- iyzico: paymentId | stripe: PaymentIntent ID
  provider_session_id   TEXT,   -- stripe: checkout session ID | iyzico: token
  
  -- Durum
  status                VARCHAR(30) NOT NULL DEFAULT 'initiated'
                        CHECK (status IN (
                          'initiated',    -- Form/session oluşturuldu
                          'pending',      -- 3D Secure bekleniyor (iyzico)
                          'succeeded',    -- Başarılı
                          'failed',       -- Başarısız
                          'cancelled',    -- İptal
                          'refunded'      -- İade
                        )),
  
  -- Tutar
  amount                DECIMAL(10,2) NOT NULL,
  payment_currency      VARCHAR(10) NOT NULL,
  
  -- Raw response (debug için)
  provider_response     JSONB,
  
  -- 3D Secure (iyzico)
  three_d_secure_url    TEXT,
  
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id           ON payments(order_id);
CREATE INDEX idx_payments_provider_payment_id ON payments(provider_payment_id);
CREATE INDEX idx_payments_status             ON payments(status);
```

### 2.4 `payment_events` Tablosu (Webhook Log)

```sql
CREATE TABLE payment_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID REFERENCES orders(id),       -- NULL olabilir (bilinmeyen sipariş)
  payment_id    UUID REFERENCES payments(id),
  
  payment_provider VARCHAR(20) NOT NULL,
  event_type    TEXT NOT NULL,    -- 'payment.success', 'checkout.session.completed' vb.
  
  -- Ham webhook verisi
  raw_payload   JSONB NOT NULL,
  
  -- İşlem durumu
  processed     BOOLEAN DEFAULT FALSE,
  processed_at  TIMESTAMPTZ,
  error_message TEXT,
  
  received_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_events_order_id  ON payment_events(order_id);
CREATE INDEX idx_payment_events_payment_provider ON payment_events(payment_provider);
CREATE INDEX idx_payment_events_processed ON payment_events(processed);
```

### 2.5 Migration dosyaları (gerçek repo)

```
migrations/
  025_create_orders.sql
  025b_orders_indexes.sql
  025c_orders_updated_at_trigger.sql
  026_create_order_items.sql
  027_create_payments.sql
  027b_payments_indexes_triggers.sql
  028_create_payment_events.sql
  028b_payment_events_indexes.sql
```

**DBeaver:** `025` dosyasında tablo gövdesinin bir kısmını seçip çalıştırmayın; hata `syntax error at or near "created_at"` gibi görünür. Tüm dosyayı veya `CREATE TABLE` ifadesini tek seferde çalıştırın. Ayrıntı: [ODEME_NOTLARI.md](ODEME_NOTLARI.md).

---

## 3. Ortam Değişkenleri (`.env`)

### 3.1 iyzico

Sandbox panelinden kopyalanan değerleri **yalnızca** proje kökündeki `.env` veya `.env.local` dosyasına yapıştırın (git’e eklenmez).

```bash
# iyzico — TEST (Sandbox)
IYZICO_API_KEY=sandbox-...        # panelden
IYZICO_SECRET_KEY=sandbox-...     # panelden
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

# iyzico — PROD (Canlı — başvuru sonrası)
# IYZICO_API_KEY=xxxxx
# IYZICO_SECRET_KEY=xxxxx
# IYZICO_BASE_URL=https://api.iyzipay.com
```

### 3.2 Stripe *(şimdilik atlanır — Faz 2’de)*

Stripe entegrasyonu yapılana kadar aşağıdaki değişkenler **zorunlu değildir**. İleride eklenecek şablon:

```bash
# STRIPE_SECRET_KEY=sk_test_xxxxx
# STRIPE_WEBHOOK_SECRET=whsec_xxxxx
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### 3.3 Genel

```bash
# Ödeme aktif/pasif feature flag
PAYMENT_ENABLED=true

# Webhook URL'leri (production domain gerekir)
NEXT_PUBLIC_APP_URL=https://herokidstory.com
```

---

## 4. Ödeme Sağlayıcısı Seçim Mantığı

### 4.1 Yeni Dosya: `lib/payment/provider.ts`

```typescript
export type PaymentProvider = 'iyzico' | 'stripe'

/**
 * Kullanıcının ülke koduna göre ödeme sağlayıcısını belirler
 * TR → iyzico, diğerleri → Stripe (Stripe entegrasyonu gelene kadar:
 *  - ya sadece iyzico döndürülür [geçici],
 *  - ya da TR dışı için "ödeme kapalı" / bilgilendirme gösterilir — ürün kararı)
 */
export function getPaymentProvider(countryCode: string | null): PaymentProvider {
  if (!countryCode) return 'stripe'
  return countryCode.toUpperCase() === 'TR' ? 'iyzico' : 'stripe'
}

/**
 * Sunucu tarafında header'lardan ödeme sağlayıcısını belirler
 */
export function getPaymentProviderFromHeaders(headers: Headers): PaymentProvider {
  const country = 
    headers.get('x-vercel-ip-country') || 
    headers.get('cf-ipcountry') || 
    null
  return getPaymentProvider(country)
}
```

### 4.2 Yeni API: `app/api/payment/provider/route.ts`

```typescript
// GET /api/payment/provider
// Frontend'in hangi ödeme sağlayıcısını kullanacağını öğrenmesi için
// { provider: 'iyzico' | 'stripe', country: 'TR' | 'US' | ... }
```

---

## 5. Sepet Sistemi Revizyonu

Mevcut sepet localStorage tabanlıdır. Ödeme entegrasyonu için sunucu taraflı sepet gerekli değildir — **localStorage sepet checkout'a kadar tutulur**, sonra `orders` tablosuna yazılır. Ancak aşağıdaki güncelleme gereklidir:

### 5.1 Sepet veri modeli güncelleme

```typescript
// contexts/CartContext.tsx — mevcut CartItem tipine eklenecek
interface CartItem {
  bookId: string
  bookTitle: string
  coverImage: string
  price: number
  currency: string        // YENİ: 'TRY' | 'USD' | 'EUR' | 'GBP'
  type: 'ebook' | 'hardcopy' | 'bundle'
}
```

### 5.2 Fiyatlandırma sabitleri

```typescript
// lib/pricing.ts — YENİ DOSYA (3 ürün kalemi; TRY öncelikli)
export const PRICING_TRY = {
  ebook: 299,
  hardcopy: 499,
  bundle: 699,
} as const
// Stripe para birimleri: Faz 2’de eklenecek
```

---

## 6. npm Paketleri

**`iyzipay`** proje kökündeki **`package.json` → `dependencies`** içinde tanımlıdır (ör. `"iyzipay": "^2.0.x"`). Yerelde `npm install iyzipay` veya sadece `npm install` bu paketi kurar.

**Sunucu / CI / deploy:** `package.json` ve **`package-lock.json`** repoya commit edilmeli; EC2 veya build pipeline’da `npm install` / `npm ci` çalıştığında `iyzipay` otomatik kurulur. Sadece `node_modules` commit etmeyin.

```bash
# Yerel (paket zaten dependencies’teyse yeterli)
npm install

# Stripe — Faz 2 başlayınca
# npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

---

## 7. Yapılacaklar Kontrol Listesi

### Kararlar
- [ ] Fiyatları onayla (bölüm 1 — 3 ürün satırı)
- [x] iyzico sandbox hesabı açıldı — `.env` içinde `IYZICO_*` + `IYZICO_BASE_URL` (`.gitignore` ile repoda yok)
- [ ] Stripe test key'leri → **Faz 2’ye kadar bekliyor**

### DB
- [x] Ödeme tabloları: `migrations/025` … `028b` (sıra: [PAYMENT_ROADMAP.md](PAYMENT_ROADMAP.md))
- [ ] Her ortamda (prod) migration’ların uygulandığını doğrula

### Kod
- [x] `.env` içine iyzico sandbox değişkenleri (`IYZICO_*`) — commit etme
- [x] `lib/payment/*`, `lib/pricing/payment-products.ts`, `lib/db/orders.ts`, `GET /api/payment/provider`, `CartItem` güncellemesi (Faz 0 kodu)
- [x] `iyzipay` → `package.json` `dependencies` + lockfile; sunucuda `npm install` ile kurulur

### Test
- [ ] `GET /api/payment/provider` — TR IP ile iyzico döndüğünü doğrula
- [ ] Stripe yokken: TR dışı ülke için davranış kararı (bilgilendirme vs.) uygulandı mı?

---

## ⏭️ Sonraki Faz

Faz 0 tamamlandıktan sonra **Faz 1 (iyzico)** ile devam edilir. **Stripe (Faz 2) sonra.**

→ [FAZ1_IYZICO.md](FAZ1_IYZICO.md)
