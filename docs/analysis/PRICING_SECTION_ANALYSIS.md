# PricingSection — Kapsamlı Analiz & Geliştirme Planı

**Tarih:** 2026-04-11  
**Kapsam:** `components/sections/PricingSection.tsx` + `app/[locale]/(public)/pricing/page.tsx`  
**Referans ekran görüntüsü:** Kullanıcı tarafından iletilen mevcut görünüm (asimetrik layout, $34.99 hardcoded fiyat)

---

## 1. Mevcut Durum — Sorun Tespiti

### 1.1 Tasarım Asimetrisi (Kritik UX Sorunu)

```
Mevcut grid: grid-cols-[1fr_auto]
```

E-kitap kartı tam genişliği alırken, baskı kitap kartı `auto` (içeriğe göre daralan) bir sütunda sıkışmıştır.  
Sonuç olarak ekranda soldaki kart büyük, sağdaki kart küçük ve sıkışık görünmektedir — kullanıcı bakışı dengesiz dağılmaktadır.

**Sorunlar:**
- İki ürün yan yana karşılaştırılabilir olmalı, ancak biri dominant öteki ikincil konumda
- Baskı kitap kartı `rounded-2xl` iken e-kitap `rounded-3xl` → stil tutarsızlığı
- Baskı kitap fiyatı büyük font (`text-3xl`) ama kart içindeki diğer öğeler `text-xs` → orantısız
- Mobilde iki kart üst üste geldiğinde baskı kartı görsel hiyerarşide neden ikinci sırada olduğu anlaşılmıyor
- İkon boyutları farklı: e-kitap ikonunda `md:h-8 md:w-8`, baskı kitapta `md:h-6 md:w-6`

### 1.2 Fiyat Tutarsızlığı (Kritik Veri Sorunu)

| Konum | Değer | Kaynak |
|-------|-------|--------|
| `PricingSection.tsx` satır 158 | `$34.99` | **Hardcoded** |
| `app/api/cart/route.ts` `HARDCOPY_PRICE` | `34.99` | Hardcoded (USD) |
| `lib/pricing/payment-products.ts` `PRICES.hardcopy.TRY` | `499` | **Tek gerçek kaynak** |
| `lib/pricing/payment-products.ts` `PRICES.hardcopy.USD` | `0` (henüz aktif değil) | Katalog |

**Sonuç:** UI'da gösterilen `$34.99` değeri:
1. Yanlış para birimi ($ = USD, ama ürün yalnızca TRY'de mevcut)
2. `payment-products.ts` kayıt dışı (katalog `₺499` diyor)
3. TR kullanıcısına USD fiyat göstermek hem yanıltıcı hem de tutarsız

### 1.3 Baskı Kitap Kartının Geo-Gate Edilmemesi (Kritik Mantık Hatası)

`PRODUCT_CATALOG.hardcopy.availableCurrencies = ['TRY']` şeklinde tanımlanmış.  
`DashboardClient` doğru davranıyor: `isProductAvailableInCurrency("hardcopy", currency)` kontrolü yapıyor.  
Ancak **`PricingSection`** bu kontrolü yapmıyor — baskı kitap kartı TR dışındaki tüm kullanıcılara gösterilmektedir.

**Etki:** ABD'den gelen bir kullanıcı `$34.99` hardcopy görmekte, ancak satın alma akışında bu ürün mevcut değil.  
→ Kullanıcı hayal kırıklığı + güven kaybı.

### 1.4 Eksik Değer Önerileri (UX / Dönüşüm Kaybı)

Şu anda pricing section'da olmayan, dönüşüm için faydalı olacak öğeler:

- **Garanti rozeti** (30 gün para iade) — güven sinyali
- **Bundle teklifi** (E-Kitap + Baskı = `₺699`) — yalnızca TR için, daha yüksek AOV
- **Karşılaştırma matrisi** — ürünler arası fark netleşmeli
- **Sosyal kanıt** — kaç kitap oluşturuldu, yorum/puan
- **Anında indirme vurgusu** — dijital ürünün hız avantajı
- **FAQ önizlemesi** — en sık sorulan iki soruyu doğrudan section'da göstermek

---

## 2. Mimari Analiz

### 2.1 Veri Akışı

```
payment-products.ts
  └─ PRODUCT_CATALOG (fiyatlar, availableCurrencies)
       └─ getProductPrice(productId, currency) → number
            └─ formatEbookListPrice() → string
                 └─ getCurrencyConfig(currency) → CurrencyConfig
                      └─ /api/currency (server, IP-based)
                           └─ CurrencyContext → useCurrency()
                                └─ PricingSection (sadece ebook kullanıyor)
```

**Sorun:** `PricingSection` `hardcopy` fiyatını katalogdan çekmiyor; hardcoded `$34.99` kullanıyor.

### 2.2 Geo-Detection Zinciri

```
Vercel x-vercel-ip-country header
  ↓ (yoksa)
Cloudflare cf-ipcountry header
  ↓ (yoksa)
Accept-Language: tr → TRY
  ↓ (default)
USD
```

TR tespiti gerçekleştikten sonra `currencyConfig.currency === 'TRY'` koşulu baskı kitap kartını göstermek için kullanılabilir.  
Mevcut `isProductAvailableInCurrency` helper'ı zaten bu kontrolü yapıyor — sadece bağlanması gerekiyor.

### 2.3 i18n Durumu

`homePricing` namespace'i hem `tr.json` hem `en.json`'da tanımlı.  
Ancak `hardcover.feature3 = "Ücretsiz kargo"` yalnızca TR bağlamında doğru.  
TR dışında baskı kitap gösterilmeyeceğinden bu kısa vadede sorun değil; uzun vadede lokalize edilmeli.

---

## 3. Önerilen Geliştirme Planı

### Faz 1 — Kritik Düzeltmeler (Blocker)

> Bu aşama olmadan mevcut UI kullanıcıyı yanlış bilgilendiriyor.

#### F1-1: Baskı kitap fiyatını katalogdan çek

**Dosya:** `components/sections/PricingSection.tsx`

- `useCurrency()` hook'u zaten `currencyConfig` döndürüyor
- `getProductPrice('hardcopy', currencyConfig.currency)` + sembol ile fiyat oluşturulmalı
- Hardcoded `$34.99` satırı kaldırılmalı
- Yalnızca `currencyConfig.currency === 'TRY'` durumunda anlamlı (499 TRY)
- `lib/pricing/payment-products.ts` → `getProductPrice` + `isProductAvailableInCurrency` import edilmeli

**Kod değişikliği:**
```tsx
// ÖNCE (yanlış):
<div>$34.99</div>

// SONRA (doğru):
import { getProductPrice, isProductAvailableInCurrency } from "@/lib/pricing/payment-products"

const hardcopyPrice = getProductPrice("hardcopy", currencyConfig.currency)
const hardcopySymbol = currencyConfig.symbol  // TRY için "₺"
// ...
<div>{hardcopySymbol}{hardcopyPrice}</div>
```

#### F1-2: Baskı kitap kartını geo-gate et

**Dosya:** `components/sections/PricingSection.tsx`

- `isProductAvailableInCurrency("hardcopy", currencyConfig.currency)` kontrolü ekle
- `false` döndüğünde baskı kitap kartı render edilmemeli
- Loading state'de kart gösterilmemeli (`isLoadingCurrency` kontrolü)

```tsx
const showHardcopy = !isLoadingCurrency && 
  isProductAvailableInCurrency("hardcopy", currencyConfig.currency)

// Grid'i koşullu yap:
<div className={cn(
  "mx-auto max-w-5xl",
  showHardcopy ? "grid gap-6 md:grid-cols-2 md:gap-8" : "flex justify-center"
)}>
  <EbookCard />
  {showHardcopy && <HardcopyCard />}
</div>
```

---

### Faz 2 — Tasarım Düzeltmeleri

> Layout dengeleme ve görsel tutarlılık.

#### F2-1: Simetrik iki-kolon grid

- `grid-cols-[1fr_auto]` → `grid-cols-1 md:grid-cols-2` (eşit sütunlar)
- Her iki kart `h-full` ile tam yükseklik almalı
- Her iki kart `rounded-3xl` olmalı (şu an baskı `rounded-2xl`)
- İkon boyutları eşitlenmeli (`h-8 w-8` her ikisinde de)
- Feature list satır sayısı eşitlenmeli (her ikisi 4 madde)

#### F2-2: Baskı kitap kartı için CTA mantığı

Şu anki baskı kartındaki "Kitaplıkta Görüntüle" butonu kullanıcıyı dashboard'a yönlendiriyor.  
Kullanıcının henüz kitabı yoksa bu link anlamsız.  

Önerilen davranış:
- Oturum açık + kitap var → `/dashboard` (mevcut)
- Oturum açık + kitap yok → `/create/step1?new=1`
- Oturum kapalı → `/create/step1?new=1`

Bu bilgi session hook'undan alınabilir (`useSession` + dashboard data).  
Kısa vadede CTA metni `"Kitabını Oluştur ve Bastır"` → `/create/step1?new=1` şeklinde de yapılabilir.

#### F2-3: Fiyat loading skeleton eşitleme

E-kitap kartında `isLoadingCurrency` için skeleton var, baskı kartında yok.  
Baskı kartına da aynı skeleton eklenmeli.

---

### Faz 3 — Değer Teklifi Güçlendirme

> Dönüşüm artırıcı eklentiler.

#### F3-1: Bundle teklifi (TR only)

`PRODUCT_CATALOG.bundle = { TRY: 699, availableCurrencies: ['TRY'] }`  
Mevcut pricing section bunu hiç göstermiyor.

Önerilen: TR kullanıcısına üçüncü bir kart veya "ikisini birden al" banner'ı  
- `isProductAvailableInCurrency("bundle", currency)` koşuluyla göster
- `E-Kitap + Baskı` başlığı, `₺699` fiyat
- "En Popüler" veya "Tasarruf" badge'i (`₺499 + ₺299 = ₺798 → ₺699`)

#### F3-2: Garanti ve güven rozetleri

Şu an sadece tek satır metin: `"Güvenli ödeme • Para iade garantisi • Binlerce ebeveyn tarafından güvenilen"`  
Önerilen: Shield, RefreshCw, Users iconlarıyla görsel rozetler  
- Fiyat kartlarının altına, trust satırının yerine

#### F3-3: Sosyal kanıt sayacı

`/api/stats` veya benzeri bir endpoint'ten (varsa) oluşturulmuş kitap sayısı çekilebilir.  
Statik fallback olarak `"5.000+ kişiselleştirilmiş kitap"` da kullanılabilir.

#### F3-4: "Nasıl çalışır" mini akış

Fiyat kartı altında 3 adım ikonu:  
`Hikayeni oluştur → Öde → Anında indir`  
Bu `HowItWorks` section'ına gerek kalmadan satın alma kararını kolaylaştırır.

---

### Faz 4 — Pricing Page (`/pricing`) Uyumu

> Full pricing sayfası ile homepage section'ı senkronize etmek.

#### F4-1: `/pricing` sayfasında da geo-gate

`app/[locale]/(public)/pricing/page.tsx` aynı sorunu içeriyor mu kontrol et.  
Aynı `isProductAvailableInCurrency` mantığı uygulanmalı.

#### F4-2: PricingFAQSection i18n kontrolü

`components/sections/PricingFAQSection.tsx` içinde İngilizce copy hardcoded.  
`useTranslations("pricingFaq")` namespace'e taşınmalı.

#### F4-3: SEO meta — dinamik fiyat

`pricing/layout.tsx` metadata'sı statik.  
Locale'e göre dinamik `title` / `description` üretilebilir (zaten `tr.json`'da mevcut).

---

## 4. İş Listesi (Fazlandırılmış)

### Faz 1 — Kritik Düzeltmeler ✅ Öncelik: YÜKSEK

| # | Görev | Dosya | Süre |
|---|-------|-------|------|
| 1.1 | `$34.99` hardcoded değeri kaldır, `getProductPrice("hardcopy", currency)` ile değiştir | `PricingSection.tsx` | 30 dk |
| 1.2 | Baskı kitap kartını `isProductAvailableInCurrency` ile geo-gate et | `PricingSection.tsx` | 30 dk |
| 1.3 | Loading state'de baskı kartını gizle | `PricingSection.tsx` | 15 dk |
| 1.4 | `cart/route.ts` içindeki hardcoded `HARDCOPY_PRICE = 34.99` → katalog referansına geçir | `app/api/cart/route.ts` | 20 dk |

### Faz 2 — Tasarım Düzeltmeleri ✅ Öncelik: YÜKSEK

| # | Görev | Dosya | Süre |
|---|-------|-------|------|
| 2.1 | Grid'i `grid-cols-[1fr_auto]` → `grid-cols-1 md:grid-cols-2` yap | `PricingSection.tsx` | 20 dk |
| 2.2 | Kart stillerini eşitle (border-radius, ikon boyutu, font boyutu) | `PricingSection.tsx` | 30 dk |
| 2.3 | Baskı kartına fiyat skeleton ekle | `PricingSection.tsx` | 15 dk |
| 2.4 | Baskı kartı CTA mantığını güncelle | `PricingSection.tsx` | 20 dk |
| 2.5 | TR'de baskı kartı yokken e-kitap kartını ortalanmış tek kart olarak göster | `PricingSection.tsx` | 20 dk |

### Faz 3 — Değer Teklifi ✅ Öncelik: ORTA

| # | Görev | Dosya | Süre |
|---|-------|-------|------|
| 3.1 | Bundle kart/banner ekle (TR only, `₺699`) | `PricingSection.tsx` | 45 dk |
| 3.2 | Trust rozetlerini icon'larla görsel hale getir | `PricingSection.tsx` | 30 dk |
| 3.3 | i18n: `tr.json` + `en.json` bundle için anahtar ekle | `messages/tr.json`, `en.json` | 20 dk |
| 3.4 | "Nasıl çalışır" mini akış (3 icon) kart altına ekle | `PricingSection.tsx` | 30 dk |

### Faz 4 — Pricing Page Uyumu ✅ Öncelik: DÜŞÜK

| # | Görev | Dosya | Süre |
|---|-------|-------|------|
| 4.1 | `/pricing` sayfasında hardcopy geo-gate kontrolü | `pricing/page.tsx` | 20 dk |
| 4.2 | `PricingFAQSection` hardcoded copy'yi i18n'e taşı | `PricingFAQSection.tsx` | 45 dk |
| 4.3 | `pricing/layout.tsx` meta'yı locale'e göre dinamikleştir | `pricing/layout.tsx` | 20 dk |

---

## 5. Etkilenen Dosyalar Özeti

```
components/sections/PricingSection.tsx          ← Ana çalışma alanı (Faz 1+2+3)
app/[locale]/(public)/pricing/page.tsx          ← Faz 4
components/sections/PricingFAQSection.tsx       ← Faz 4
app/api/cart/route.ts                           ← Faz 1.4
messages/tr.json                                ← Faz 3.3
messages/en.json                                ← Faz 3.3
lib/pricing/payment-products.ts                 ← Sadece okuma (değişiklik yok)
lib/currency.ts                                 ← Sadece okuma (değişiklik yok)
```

---

## 6. Teknik Notlar

### Fiyat Formatlama

TR kullanıcısı için baskı kitap fiyatı şöyle formatlanmalı:

```tsx
// payment-products.ts'den
const hardcopyAmount = getProductPrice("hardcopy", currencyConfig.currency)
// currencyConfig.symbol TRY için "₺"
const hardcopyFormatted = `${currencyConfig.symbol}${hardcopyAmount}`
// → "₺499"
```

### Geo-Gate Pattern

```tsx
const { currencyConfig, isLoading } = useCurrency()

const showHardcopy = !isLoading && 
  isProductAvailableInCurrency("hardcopy", currencyConfig.currency)
  
const showBundle = !isLoading && 
  isProductAvailableInCurrency("bundle", currencyConfig.currency)
```

### Grid Davranışı

```
TR kullanıcısı:
  [E-Kitap | Baskı Kitap]        md: 2 kolon
  [Bundle (en altta / banner)]   md: full-width

TR dışı kullanıcısı:
  [    E-Kitap (ortalanmış)   ]  md: tek kart max-w-lg
```

---

## 7. Gelecek Dönem (Bu Analizin Dışında)

- **Stripe entegrasyonu açılınca:** `hardcopy.USD/EUR/GBP` fiyatları doldurulacak → `availableCurrencies` genişleyecek → geo-gate otomatik çalışacak
- **Bundle satışı:** Checkout akışı bundle ürün tipini destekliyor mu? `CartContext` + `calculateOrderTotals` kontrolü gerekebilir
- **Promo/indirim kodu:** `HARDCOVER_PRINT_PROMO_DISCOUNT_TRY = 250` mevcut; pricing section'da "kampanya" gösterimi düşünülebilir

---

---

## 8. Uygulama Durumu

### Tamamlanan İşler (2026-04-11)

**Faz 1 — Kritik Düzeltmeler**
- [x] `$34.99` hardcoded değer kaldırıldı → `formatProductPrice("hardcopy", currency)` ile değiştirildi
- [x] Baskı kitap kartı `isProductAvailableInCurrency("hardcopy", currency)` ile geo-gate edildi
- [x] Loading state'de baskı kartı gizleniyor
- [x] `cart/route.ts` hardcoded `HARDCOPY_PRICE = 34.99` → `getProductPrice("hardcopy", currency)` ile değiştirildi

**Faz 2 — Tasarım Düzeltmeleri**
- [x] Grid: `grid-cols-[1fr_auto]` → `md:grid-cols-2` (simetrik iki kolon)
- [x] Kart stilleri eşitlendi: her iki kart `rounded-3xl`, aynı padding, aynı ikon boyutu
- [x] TR dışında tek kart ortalanmış (`mx-auto max-w-lg`)
- [x] Baskı kartı CTA: `/dashboard` → `/create/step1?new=1` (oluştur akışına yönlendir)
- [x] Her iki kartta `flex-col h-full` ile eşit yükseklik, CTA `mt-auto` ile alt kenar

**Faz 3 — Değer Teklifi Güçlendirme**
- [x] Bundle banner eklendi (TR only, `₺699`, tasarruf badge'i ile)
- [x] Trust rozetleri iconlu hale getirildi (Shield, RefreshCw, Users)
- [x] Mini "nasıl çalışır" akışı eklendi (Sparkles → ArrowRight → ...)
- [x] i18n: `tr.json` + `en.json` tüm yeni anahtarlar eklendi (bundle, trust, miniSteps, hardcover.feature4, hardcover.cta)

**Faz 4 — Pricing Page Uyumu**
- [x] `/pricing` sayfasında hardcover info section geo-gate edildi
- [x] "Book Appearance" section geo-gate edildi (yalnızca TR/TRY kullanıcılarına)

### Eklenen Yardımcı Fonksiyonlar
- `lib/currency.ts` → `formatProductPrice(productId, currency)`: Herhangi bir ürün için doğru para birimi sembolü ile formatlanmış fiyat döndürür

---

*Analizi hazırlayan: Cursor AI Agent — 2026-04-11*
