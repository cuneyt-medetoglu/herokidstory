# Localization (i18n) Analysis

**Tarih:** 7 Mart 2026
**Durum:** Analiz tamamlandı — Development'a hazır
**Kapsam:** TR + EN (genişletilebilir yapıda)

---

## 1. Mevcut Durum

### Problem
- UI metinleri **İngilizce + Türkçe karışık** şekilde hardcoded
- `app/layout.tsx` → `lang="tr"` sabit
- i18n kütüphanesi **yok**
- ~200+ İngilizce metin, ~35+ Türkçe metin bileşenlere dağılmış
- HowItWorks ve CampaignBanners'da `title` / `titleTr` şeklinde geçici çift dil yapısı var
- API hata mesajları TR/EN karışık
- Meta taglar Türkçe, UI genel olarak İngilizce

### Mevcut Dil-İlgili Yapılar
| Yapı | Konum | Açıklama |
|------|-------|----------|
| Hikaye dili seçimi | Step 3 | 8 dil desteği (TR, EN, DE, FR, ES, ZH, PT, RU) — hikaye **içeriği** için |
| Currency detection | `lib/currency.ts` | Browser locale'den para birimi algılama |
| TTS dil desteği | `lib/prompts/tts/` | Her dil için özel okuma prompt'ları |

> **Önemli ayrım:** Hikaye dili (hikaye metni hangi dilde üretilecek) ≠ Site dili (UI hangi dilde gösterilecek). Bu iki kavram birbirinden **bağımsız** çalışır. Bir kullanıcı siteyi EN'de kullanıp hikayeyi TR'de oluşturabilir.

---

## 2. Alınan Kararlar

| # | Karar | Detay |
|---|-------|-------|
| 1 | **Default dil: EN** | Global pazar hedefi. TR'den gelen kullanıcılar browser dili algılanarak otomatik `/tr/`'ye yönlendirilir |
| 2 | **URL yapısı: Subdirectory** | `/en/`, `/tr/` — SEO equity tek domain'de kalır |
| 3 | **Teknoloji: `next-intl`** | Next.js 14 App Router ile doğal, Server Components desteği, ~2KB |
| 4 | **Örnek kitaplar: Her dil için ayrı set** | AI ile üretim ucuz, kalite en yüksek |
| 5 | **Hikaye dili ≠ Site dili** | Bağımsız çalışır |
| 6 | **Admin/debug metinleri** | Şimdilik kapsam dışı — daha sonra bakılacak |
| 7 | **Konfigüratif öğeler** | Karakter isim mapping, dil ekleme/çıkarma gibi config işler admin panel bekliyor |

---

## 3. Teknoloji: `next-intl`

| Kriter | next-intl | next-i18next |
|--------|-----------|--------------|
| App Router desteği | Doğal, first-class | Adapter gerekli |
| Bundle size | ~2KB | ~15KB+ |
| Server Components | Tam destek | Sınırlı |
| Type safety | ICU + TypeScript | Ek config gerekli |
| Topluluk | Aktif, Next.js önerili | Eski ama olgun |

---

## 4. URL Yapısı ve Routing

### Subdirectory Yaklaşımı
```
kidstorybook.com/en/          → İngilizce (default)
kidstorybook.com/tr/          → Türkçe
kidstorybook.com/de/          → Almanca (gelecekte)
```

### Dosya Yapısı Değişikliği
```
app/
├── [locale]/                  ← Tüm sayfalar buraya taşınır
│   ├── layout.tsx             ← locale-aware root layout
│   ├── page.tsx               ← Ana sayfa
│   ├── examples/
│   ├── create/
│   ├── dashboard/
│   ├── auth/
│   ├── books/
│   ├── cart/
│   ├── checkout/
│   └── pricing/
├── api/                       ← API routes locale dışında kalır
```

### Middleware — Dil Algılama Sırası
```
Kullanıcı siteye geldiğinde → middleware.ts:
  1. URL'de locale var mı? (/tr/..., /en/...) → Devam et
  2. Cookie'de tercih var mı? (NEXT_LOCALE) → O dile yönlendir
  3. Accept-Language header → Tarayıcı dili algıla (TR browser → /tr/)
  4. Fallback → /en/
```

---

## 5. Çeviri Dosyası Yapısı

```
messages/
├── en.json          ← İngilizce (referans dil — fallback)
├── tr.json          ← Türkçe
└── de.json          ← (gelecekte)
```

### Namespace Organizasyonu (tek dosya, iç yapı)
```json
{
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "back": "Back",
    "next": "Next",
    "error": "Error",
    "success": "Success"
  },
  "nav": {
    "home": "Home",
    "examples": "Examples",
    "pricing": "Pricing",
    "createBook": "Create a children's book",
    "signIn": "Sign In",
    "signUp": "Sign Up",
    "logout": "Logout",
    "myLibrary": "My Library"
  },
  "hero": { "badge": "...", "title": "...", "subtitle": "...", "cta": "..." },
  "howItWorks": { ... },
  "features": { ... },
  "auth": { ... },
  "create": { ... },
  "dashboard": { ... },
  "examples": { ... },
  "pricing": { ... },
  "checkout": { ... },
  "bookViewer": { ... },
  "footer": { ... },
  "cookies": { ... },
  "errors": { ... },
  "metadata": {
    "home": { "title": "...", "description": "..." },
    "examples": { "title": "...", "description": "..." }
  }
}
```

### Yeni Dil Ekleme (Gelecekte)
1. `messages/xx.json` dosyasını `en.json`'dan kopyala
2. Tüm value'ları çevir (key'ler aynı kalır)
3. `lib/i18n.ts` config'e locale ekle
4. **Bu kadar.** Routing, middleware, component'ler otomatik çalışır.

> **Not:** Karakter isim mapping, dil bazlı config yönetimi gibi işler ileride admin panel üzerinden yapılabilir. Şimdilik kod/JSON dosyası ile yönetilir.

---

## 6. Örnek Hikayeler ve Çok Dilli İçerik

### A) Karakter İsimleri — Locale Mapping
```typescript
// lib/examples/character-names.ts
export const characterNameMap: Record<string, Record<string, string>> = {
  "luna":          { "en": "Luna",          "tr": "Ayşe"          },
  "alex":          { "en": "Alex",          "tr": "Ali"           },
  "emma":          { "en": "Emma",          "tr": "Elif"          },
  "princess-aria": { "en": "Princess Aria", "tr": "Prenses Aylin" }
}
```
> Yeni dil eklenirken buraya bir satır eklenir. Admin panel hazır olunca bu mapping UI'dan yönetilebilir.

### B) Örnek Hikaye Title/Description — Çeviri Dosyasında
```json
// messages/en.json → examples.books
{
  "lunas-forest": {
    "title": "Luna's Magical Forest",
    "description": "Little Luna meets talking animals in a hidden forest..."
  }
}

// messages/tr.json → examples.books
{
  "lunas-forest": {
    "title": "Ayşe'nin Sihirli Ormanı",
    "description": "Küçük Ayşe gizli bir ormanda konuşan hayvanlarla tanışır..."
  }
}
```

### C) Gerçek Kitaplar (DB)
Her dil için ayrı example kitap seti oluşturulacak (`language` kolonu ile filtreleme).
- `/en/examples` → `WHERE is_example = true AND language = 'en'`
- `/tr/examples` → `WHERE is_example = true AND language = 'tr'`

---

## 7. Dikkat Edilmesi Gerekenler

| Konu | Detay |
|------|-------|
| **Hikaye dili vs Site dili** | Bağımsız çalışır. Step 3'teki hikaye dili seçimi i18n'den etkilenmez |
| **Admin/Debug metinleri** | Şimdilik kapsam dışı — daha sonra bakılacak |
| **Prompt/AI metinleri** | `lib/prompts/` i18n dışında kalır (AI'a İngilizce gider). Prompt'lardaki Türkçe örnekler temizlenmeli |
| **RTL dil desteği** | Kapsam dışı. Arapça eklenecekse Tailwind RTL plugin gerekir |
| **Fallback** | Eksik çeviri key'i varsa EN gösterilir, console'da warning basılır |
| **Pluralization** | ICU format: `{count, plural, one {# book} other {# books}}` |
| **Tarih/Saat/Sayı** | `next-intl` format API — TR: 7 Mart 2026 / EN: March 7, 2026 |
| **Currency + Locale** | Site TR → default ₺, Site EN → default $. Kullanıcı bağımsız değiştirebilir |
| **Legal sayfalar** | Privacy Policy, Terms → çeviri dosyası yerine ayrı MDX sayfaları |
| **Email şablonları** | Email altyapısı kurulduğunda locale-aware olacak — daha sonra bakılacak |
| **Metin içeren görseller** | Banner/promo görselleri dil bazlı: `hero-en.jpg`, `hero-tr.jpg` |

---

## 8. Development Fazları

### DEV-1: Altyapı Kurulumu
**Öncelik:** İlk yapılacak — her şey bunun üzerine inşa edilir
**Tahmini süre:** 1-2 gün

- [ ] **1.1** `next-intl` paket kurulumu
- [ ] **1.2** `lib/i18n.ts` — locale config (locales, defaultLocale, fallback)
- [ ] **1.3** `messages/en.json` ve `messages/tr.json` iskelet dosyaları
- [ ] **1.4** `middleware.ts` güncelleme — locale algılama (cookie → browser → EN fallback)
- [ ] **1.5** `app/[locale]/layout.tsx` — locale-aware root layout (`<html lang={locale}>`)
- [ ] **1.6** Mevcut `app/` altındaki sayfaları `app/[locale]/` altına taşıma
- [ ] **1.7** `next-intl` provider entegrasyonu (Server + Client Components)
- [ ] **1.8** Mevcut `middleware.ts` auth kontrollerini locale routing ile birleştirme
- [ ] **1.9** Smoke test: `/en/` ve `/tr/` route'ları çalışıyor mu?

### DEV-2: Çeviri Dosyaları + İlk Component'ler
**Öncelik:** Altyapı hazır olunca hemen başlanır
**Tahmini süre:** 1 gün

- [ ] **2.1** `messages/en.json` — tüm namespace'leri doldur (common, nav, hero, auth, create, vb.)
- [ ] **2.2** `messages/tr.json` — EN'den kopyala, tüm value'ları Türkçeye çevir
- [ ] **2.3** Header component — `useTranslations('nav')` ile metin taşıma
- [ ] **2.4** Footer component — metin taşıma
- [ ] **2.5** Header'a dil seçici ekleme (EN/TR toggle, cookie'ye kayıt)
- [ ] **2.6** Doğrulama: Dil değişince Header/Footer doğru gösteriyor mu?

### DEV-3: Ana Sayfa + Genel Bileşenler
**Tahmini süre:** 1 gün

- [ ] **3.1** Hero section metin taşıma
- [ ] **3.2** HowItWorks — mevcut `title`/`titleTr` yapısını kaldır, `useTranslations` kullan
- [ ] **3.3** FeaturesSection metin taşıma
- [ ] **3.4** PricingSection metin taşıma
- [ ] **3.5** FAQSection metin taşıma
- [ ] **3.6** CampaignBanners — `title`/`titleTR` yapısını kaldır, `useTranslations` kullan
- [ ] **3.7** CookieConsentBanner metin taşıma
- [ ] **3.8** `app/layout.tsx` metadata — `generateMetadata` ile locale-aware

### DEV-4: Auth + Create Wizard
**Tahmini süre:** 1-1.5 gün

- [ ] **4.1** Login sayfası — tüm label, placeholder, hata mesajları, butonlar
- [ ] **4.2** Register sayfası — aynı şekilde
- [ ] **4.3** Forgot password sayfası
- [ ] **4.4** Create step1 — label ve placeholder'lar
- [ ] **4.5** Create step2 — karakter tipleri, fotoğraf ipuçları (mevcut TR ipuçları → çeviri dosyasına)
- [ ] **4.6** Create step3 — tema isimleri, yaş grupları, dil seçenekleri
- [ ] **4.7** Create step4 — illüstrasyon stilleri
- [ ] **4.8** Create step5 — placeholder ve label'lar
- [ ] **4.9** Create step6 — review label'ları, butonlar, toast mesajları
- [ ] **4.10** Create from-example sayfası

### DEV-5: Dashboard + Kitap Sayfaları
**Tahmini süre:** 1 gün

- [ ] **5.1** Dashboard — tab isimleri, butonlar, boş durum mesajları, tooltip'ler
- [ ] **5.2** Book settings sayfası — label'lar, toast mesajları
- [ ] **5.3** BookViewer — hata mesajları, aria-label'lar, TTS UI metinleri
- [ ] **5.4** RegenerateImageModal — title, label, placeholder, butonlar
- [ ] **5.5** ImageEditModal — aynı şekilde
- [ ] **5.6** EditHistoryPanel — aynı şekilde

### DEV-6: E-ticaret Sayfaları
**Tahmini süre:** 0.5-1 gün

- [ ] **6.1** Pricing sayfası
- [ ] **6.2** PlanSelectionModal
- [ ] **6.3** Cart sayfası
- [ ] **6.4** Checkout sayfası + CheckoutForm
- [ ] **6.5** Draft preview sayfası

### DEV-7: Örnek Hikaye İçerik Lokalizasyonu
**Tahmini süre:** 1 gün

- [ ] **7.1** `lib/examples/character-names.ts` — karakter isim mapping oluştur
- [ ] **7.2** Mock example books → key-based yapıya dönüştür
- [ ] **7.3** `messages/en.json` ve `tr.json` → `examples.books` namespace'ini doldur
- [ ] **7.4** Examples sayfası — locale-aware karakter isimleri ve title/description
- [ ] **7.5** ExampleBooksCarousel — aynı locale-aware yapı
- [ ] **7.6** From-example akışı — seçilen dile göre karakter isimleri

### DEV-8: API Hata Mesajları
**Tahmini süre:** 0.5 gün

- [ ] **8.1** `lib/api/response.ts` — locale-aware hata mesaj helper'ı
- [ ] **8.2** Kullanıcıya görünen API hata mesajlarını çeviri dosyasına taşı
- [ ] **8.3** Mevcut Türkçe API hata mesajlarını (`regenerate-image`, `characters` vb.) i18n'e al

### DEV-9: SEO ve Meta
**Tahmini süre:** 0.5 gün

- [ ] **9.1** Her sayfa için `generateMetadata` — locale-aware title/description
- [ ] **9.2** `<link rel="alternate" hreflang="...">` tagları
- [ ] **9.3** Sitemap.xml — her dil için URL'ler
- [ ] **9.4** Open Graph tagları — locale-aware

### DEV-10: Test ve QA
**Tahmini süre:** 0.5-1 gün

- [ ] **10.1** Tüm sayfalarda EN↔TR geçiş testi
- [ ] **10.2** Middleware dil algılama testi (cookie, browser, fallback)
- [ ] **10.3** Missing key kontrolü — tüm key'ler her iki dilde var mı?
- [ ] **10.4** SEO kontrolü — hreflang doğru mu?
- [ ] **10.5** Link'lerde locale prefix kontrolü (`/en/examples`, `/tr/examples`)
- [ ] **10.6** Auth akışında locale korunuyor mu? (login → redirect → doğru locale)

### Toplam Tahmin: ~7-9 gün

---

## 9. Daha Sonra Bakılacak Konular

| Konu | Ne Zaman | Not |
|------|----------|-----|
| **Kitaplığım / Hikaye içeriği dil uyumu** | Sonraki faz | Site EN iken kullanıcı kitaplarının başlık ve sayfa metinleri hâlâ kitabın oluşturulduğu dilde (örn. TR). İstenirse: site locale’e göre DB’den ilgili dil versiyonu çekmek veya çeviri üretmek — analizde “her dil için ayrı DB kaydı / AI ile çeviri” olarak ertelendi. |
| Admin/debug metinleri i18n | Admin panel sonrası | DebugQualityPanel, TraceViewerModal vb. |
| **Örnek kitapları eksik dillere kopyalama** | Admin panel / script | Examples sayfası tanıtım amaçlı; her site dilinde (en, tr) o dilde içerik gösterilmeli. Bir dildeki örneklerin diğer dillere kopyası: önce script, sonra admin panelde "Eksik dillere kopyala" benzeri akış. Ayrı analiz: `docs/analysis/EXAMPLES_MULTILINGUAL_COPY_STRATEGY.md`. |
| Karakter isim mapping UI yönetimi | Admin panel hazır olunca | Şimdilik `character-names.ts` dosyasında |
| Dil ekleme/çıkarma UI | Admin panel hazır olunca | Şimdilik `lib/i18n.ts` config'de |
| Email şablonları lokalizasyonu | Email altyapısı kurulunca | Resend/SendGrid sonrası |
| RTL dil desteği | Arapça vb. eklenecekse | Tailwind RTL plugin gerekir |
| Prompt'lardaki Türkçe örnekler | Prompt refactor sırasında | `lib/prompts/` altındaki TR metinler |

---

## 10. Roadmap Entegrasyonu

Mevcut roadmap'te **Faz 5** altına eklenmeli:

```
### 5.11 Localization (i18n) Sistemi
- [ ] 5.11.1  Altyapı: next-intl kurulumu, [locale] routing, middleware (DEV-1)
- [ ] 5.11.2  Çeviri dosyaları oluşturma + Header/Footer + dil seçici (DEV-2)
- [ ] 5.11.3  Ana sayfa bileşenleri metin taşıma (DEV-3)
- [ ] 5.11.4  Auth + Create wizard metin taşıma (DEV-4)
- [ ] 5.11.5  Dashboard + Kitap sayfaları metin taşıma (DEV-5)
- [ ] 5.11.6  E-ticaret sayfaları metin taşıma (DEV-6)
- [ ] 5.11.7  Örnek hikaye içerik lokalizasyonu (DEV-7)
- [ ] 5.11.8  API hata mesajları lokalizasyonu (DEV-8)
- [ ] 5.11.9  SEO: hreflang, locale-aware metadata, sitemap (DEV-9)
- [ ] 5.11.10 Test ve QA (DEV-10)
```

---

*Son güncelleme: 7 Mart 2026 — Tüm kararlar alındı, development'a hazır.*
