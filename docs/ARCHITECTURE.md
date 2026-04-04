# 🏗️ HeroKidStory - Mimari Kararlar ve Yapı

**Tarih:** 2 Şubat 2026  
**Durum:** AKTİF – Güncel (FAZ 5 çıktısı)

**Detaylı şema:** [docs/database/SCHEMA.md](database/SCHEMA.md)  
**API dokümantasyonu:** [docs/api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md)

---

## 📦 Monorepo vs Ayrı Repo Kararı

### Mevcut Durum: **Monorepo (Tek Repo)**

Proje şu anda **tek bir repository** içinde hem frontend hem backend kodlarını barındırıyor:

```
herokidstory/
├── app/              # Next.js App Router (Frontend)
├── components/        # React Components
├── lib/              # Utility functions
├── api/              # Next.js API Routes (Backend)
├── docs/             # Dokümantasyon
└── poc/              # Proof of Concept
```

### Neden Monorepo?

#### ✅ Avantajlar
1. **Hızlı Geliştirme:** Frontend ve backend aynı repo'da, değişiklikler senkronize
2. **Kod Paylaşımı:** TypeScript type'ları, utility fonksiyonları paylaşılabilir
3. **Tek Deploy:** Vercel'de tek bir deploy ile hem frontend hem API routes deploy edilir
4. **Basit Yapı:** Küçük ekip için daha basit yönetim
5. **Next.js API Routes:** Next.js'in built-in API routes kullanılıyor (ayrı backend server'a gerek yok)
6. **Maliyet:** Tek bir hosting (Vercel) yeterli

#### ⚠️ Dezavantajlar
1. **Ölçeklenebilirlik:** Büyüdükçe repo karmaşıklaşabilir
2. **Bağımsız Deploy:** Frontend ve backend ayrı deploy edilemez (şu an sorun değil)
3. **Ekip Büyümesi:** Farklı ekipler çalışırsa conflict riski artar

### Alternatif: Ayrı Repo Yapısı

Eğer ayrı repo yapısı tercih edilirse:

```
herokidstory-frontend/   # Next.js Frontend
herokidstory-backend/    # Node.js/Express Backend (veya başka)
herokidstory-api/        # API Server
```

#### Ne Zaman Ayrı Repo'ya Geçilmeli?

1. **Ekip büyüdüğünde** (5+ developer)
2. **Backend kompleksleştiğinde** (microservices, queue systems)
3. **Farklı deployment stratejileri gerektiğinde**
4. **Backend başka bir teknoloji stack'e geçildiğinde** (Go, Python, vb.)

### 🎯 Öneri: **Şimdilik Monorepo, Gelecekte Değerlendir**

**MVP için monorepo yeterli ve doğru seçim çünkü:**
- ✅ Next.js API Routes ile backend zaten Next.js içinde
- ✅ Tek bir deployment (Vercel) yeterli
- ✅ Hızlı geliştirme ve test
- ✅ Kod paylaşımı kolay

**Gelecekte ayrı repo'ya geçiş yapılabilir:**
- Backend bağımsız bir service olarak çalıştırılmak istenirse
- Farklı teknolojiler kullanılmak istenirse
- Ekip büyürse ve farklı deployment stratejileri gerektiğinde

---

## 🐳 Docker Desteği

### Durum: **Gelecekte Eklenecek**

Docker desteği şu an yok, ama planlanıyor:

#### Docker Kullanım Senaryoları

1. **Local Development**
   - PostgreSQL (local veya EC2)
   - Database migrations (migrations/)
   - Consistent development environment

2. **CI/CD Pipeline**
   - Automated testing
   - Build process
   - Deployment

3. **Production Deployment** (Opsiyonel)
   - Vercel yerine kendi server'ında çalıştırma
   - Container orchestration (Kubernetes, Docker Swarm)

#### Eklenecek Dosyalar

- `Dockerfile` - Production image
- `docker-compose.yml` - Local development
- `.dockerignore` - Docker build optimization

**Tahmini Ekleme Zamanı:** Faz 1.3 veya Faz 5 (Polish ve Lansman)

---

## 🔐 Environment Variables

### Durum: **✅ Oluşturuldu (Faz 1.2)**

`.env.local` dosyası **Faz 1.2'de oluşturuldu**; production altyapı **AWS** (EC2 PostgreSQL + S3).

#### Oluşturulma Zamanı

**Faz 1.2'de (Auth/DB kurulumu); güncel (Şubat 2026) production:**
- ✅ Database: PostgreSQL (EC2), `DATABASE_URL`
- ✅ Storage: AWS S3 tek bucket, `AWS_S3_BUCKET`, `AWS_REGION` (IAM role ile key gerekmeyebilir)
- ✅ `.env.local` / `.env` template hazır
- ✅ `.gitignore`'da (güvenlik)

#### İçerik (örnek – production AWS)

```bash
# PostgreSQL (EC2)
DATABASE_URL=postgresql://herokidstory:***@localhost:5432/herokidstory

# AWS S3
AWS_S3_BUCKET=herokidstory
AWS_REGION=eu-central-1

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3001
NODE_ENV=development
```

#### Güvenlik

- ✅ `.env.local` `.gitignore`'da
- ✅ `.env.example` template olarak commit edilebilir
- ✅ API key'ler asla commit edilmemeli
- ✅ Production'da Vercel environment variables kullanılacak

---

## 📁 Proje Yapısı

### Mevcut Yapı (Güncel – 2 Şubat 2026)

```
herokidstory/
├── app/                        # Next.js App Router
│   ├── layout.tsx, page.tsx    # Root, Homepage
│   ├── globals.css             # Global styles
│   ├── api/                    # API Routes (29 endpoint – aşağıda özet)
│   │   ├── ai/                 # generate-story, generate-images, generate-cover, edit-image
│   │   ├── auth/               # test-login
│   │   ├── books/              # CRUD, [id], generate-pdf, edit-history, revert-image, create-free-cover, purchase-from-draft
│   │   ├── cart/               # Sepet CRUD
│   │   ├── characters/         # CRUD, analyze, [id], set-default
│   │   ├── currency/           # Para birimi tespiti
│   │   ├── debug/              # can-skip-payment
│   │   ├── draft(s)/           # share, transfer, [draftId]
│   │   ├── email/              # send-ebook
│   │   ├── examples/           # Örnek kitaplar
│   │   ├── rate-limit/         # Rate limiting
│   │   ├── tts/                # generate (Text-to-Speech)
│   │   ├── users/              # free-cover-status
│   │   └── test/               # storage
│   ├── auth/                   # login, register, callback, forgot-password, verify-email
│   ├── books/[id]/             # view, settings
│   ├── cart/                   # Sepet sayfası
│   ├── checkout/               # Checkout, success
│   ├── create/step1..6/        # Kitap oluşturma wizard
│   ├── dashboard/              # Kitaplık, settings
│   ├── examples/               # Örnek kitaplar sayfası
│   ├── pricing/                # Fiyatlandırma
│   └── draft-preview/          # Taslak önizleme
├── components/                 # React Components
│   ├── book-viewer/            # book-viewer, book-page, ImageEditModal, EditHistoryPanel, page-thumbnails
│   ├── checkout/               # CartSummary, CheckoutForm, PlanSelectionModal
│   ├── layout/                 # Header, Footer, CookieConsentBanner
│   ├── providers/               # ThemeProvider, ToastProvider
│   ├── sections/               # Hero, HowItWorks, FAQ, Pricing, CampaignBanners, HeroBookTransformation, vb.
│   └── ui/                     # shadcn/ui (button, card, dialog, input, select, tabs, vb.)
├── lib/                        # Utility ve business logic
│   ├── api/response.ts         # API response formatı
│   ├── config.ts               # Environment, app config
│   ├── currency.ts             # Currency detection (IP → TRY/USD/EUR/GBP)
│   ├── db/                     # books.ts, characters.ts (DB helpers)
│   ├── draft-storage.ts        # Taslak depolama
│   ├── pdf/                    # generator, image-compress (50 MB limit), templates (PDF üretimi)
│   ├── prompts/                # Prompt Management (config, story, image, tts v1.0.0 dil dosyaları)
│   ├── queue/                  # image-generation-queue
│   ├── │   ├── utils.ts                # cn, helpers
│   ├── herokid-wizard-storage.ts  # Sihirbaz localStorage (aktif)
├── migrations/                 # PostgreSQL migrations (AWS)
├── middleware.ts                # Next.js middleware (auth)
├── docs/                       # Dokümantasyon (roadmap, PRD, guides, database, api, vb.)
└── public/                     # Static files
```

### API Routes Özeti (29 endpoint)

| Grup | Endpoint'ler |
|------|--------------|
| **AI** | POST generate-story, generate-images, generate-cover, edit-image |
| **Books** | GET/POST books, GET/PATCH/DELETE books/[id], POST generate-pdf, edit-history, revert-image, create-free-cover, purchase-from-draft |
| **Characters** | GET/POST characters, GET/PATCH/DELETE characters/[id], POST analyze, set-default |
| **Cart** | GET/POST/PATCH/DELETE cart |
| **Currency** | GET currency |
| **Drafts** | GET/POST drafts, GET/PATCH/DELETE drafts/[draftId], POST share, transfer |
| **TTS** | POST tts/generate |
| **Users** | GET free-cover-status |
| **Diğer** | email/send-ebook, examples, rate-limit, debug/can-skip-payment, auth/test-login, test/storage |

Detaylı liste: [docs/api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md).

---

## 🚀 Deployment Stratejisi

### Şu An: **Vercel (Monorepo)**

- Frontend ve API routes birlikte deploy edilir
- Tek bir Vercel projesi
- Automatic deployments (Git push → Deploy)

### Gelecekte (Ayrı Repo'ya Geçilirse)

- **Frontend:** Vercel
- **Backend:** Railway, Render, AWS, Azure, vb.
- **Database:** PostgreSQL (EC2 veya ayrı sunucu)

---

## 📊 Teknoloji Stack Özeti

| Katman | Teknoloji | Versiyon | Not |
|--------|-----------|----------|-----|
| **Frontend** | Next.js (App Router) | 14.2.35 | SSR, SEO, Performance |
| **UI Framework** | Tailwind CSS | 3.4.19 | Utility-first CSS |
| **UI Components** | shadcn/ui (Radix) | - | button, card, dialog, select, tabs, vb. |
| **Backend** | Next.js API Routes | Built-in | 29 endpoint, serverless |
| **Database** | PostgreSQL (EC2) | - | DB (migrations: migrations/) |
| **Storage** | AWS S3 | - | Tek bucket, prefix'ler: photos, books, pdfs, covers |
| **TypeScript** | TypeScript | 5.9.3 | Type safety |
| **React** | React | 18.3.1 | UI library |
| **AI** | OpenAI (GPT-4o, GPT-image) | openai ^6.16.0 | Hikaye, görsel, kapak, edit |
| **TTS** | Google Cloud Text-to-Speech | @google-cloud/text-to-speech ^6.4.0 | 8 dil |
| **PDF** | jsPDF, Puppeteer | jspdf ^4.0.0, puppeteer ^24.35.0 | PDF üretimi |
| **Ödeme** | Stripe + İyzico | TBD | Planlanıyor |
| **Hosting** | Vercel | - | Next.js için optimize |
| **Theme** | next-themes | 0.4.6 | Dark/Light mode |
| **Form** | react-hook-form, zod | ^7.70.0, ^4.3.5 | Validasyon |
| **Animasyon** | framer-motion | ^12.23.26 | UI animasyonları |

---

## ✅ Sonuç ve Öneriler

### Şu An İçin Doğru Olan: **Monorepo**

1. ✅ MVP için yeterli
2. ✅ Hızlı geliştirme
3. ✅ Basit yönetim
4. ✅ Tek deployment

### Gelecekte Değerlendirilecekler

1. ⏳ Docker desteği (Faz 1.3 veya Faz 5)
2. ⏳ Ayrı repo'ya geçiş (eğer gerekiyorsa)
3. ⏳ Microservices mimarisi (çok büyürse)

### Tamamlananlar (Faz 1.2)

1. ✅ Monorepo yapısı ile devam ediliyor
2. ✅ Next.js API Routes kullanılıyor (ayrı backend server yok)
3. ✅ Faz 1.2: Auth/DB kurulumu tamamlandı; **Şubat 2026: AWS altyapı (Faz 1–4) tamamlandı**
   - Database: PostgreSQL EC2 üzerinde, migration'lar uygulandı
   - Storage: AWS S3 tek bucket (photos, books, pdfs, covers)
   - Auth: NextAuth.js (Google, Facebook, email); Supabase kaldırıldı
   - DB-level RLS kaldırıldı; auth uygulama katmanında (NextAuth)
4. ✅ Environment variables oluşturuldu (`.env.local` / `.env`)
5. ✅ Test infrastructure (AWS production)

### Tamamlananlar (Faz 1.3)

1. ✅ Faz 1.3: Environment ve yapılandırma tamamlandı
   - `.env.local` kontrolü ve optimizasyonu
   - `next.config.js` image/API için optimize edildi
   - `lib/config.ts` oluşturuldu (development/production ayrımı)
   - Image domains eklendi ve optimize edildi
   - Environment setup rehberi oluşturuldu

### Tamamlananlar (Faz 2–4 – Mimari Bileşenler)

1. ✅ **Prompt Management System** – `lib/prompts/` (config, story, image, tts dil dosyaları); sürüm bilgisi modül içi `VERSION` + şablon dokümanlar
2. ✅ **TTS Architecture** – `/api/tts/generate`, 8 dil, Google Cloud TTS
3. ✅ **Currency Detection** – `lib/currency.ts`, `/api/currency`, IP → TRY/USD/EUR/GBP
4. ✅ **Cart System** – `/api/cart`, `/cart`, checkout components, My Library bulk selection
5. ✅ **Image Edit Feature** – `/api/ai/edit-image`, revert-image, edit-history, ImageEditModal
6. ✅ **Multi-character Support** – characters tablosu (description JSONB), CRUD + analyze + set-default, 5 karakter kotası
7. ✅ **API Routes** – 29 endpoint (AI, books, characters, cart, currency, drafts, tts, users, vb.)
8. ✅ **Database** – public.users (role), characters, books; migrations 001–003, 015 uygulandı (bkz. docs/database/SCHEMA.md)

### Sıradakiler

1. ⏳ Ödeme: Stripe/İyzico entegrasyonu, checkout akışı
2. ⏳ Admin panel: sipariş/kullanıcı/kitap yönetimi
3. ⏳ Gelecekte: Docker desteği (opsiyonel)
4. ✅ AWS S3 storage geçişi tamamlandı (tek bucket, prefix’ler); bkz. docs/plans/AWS_ORTAM_SIFIRDAN_KURULUM_REHBERI.md

---

---

## 💾 Storage Stratejisi

### Mevcut Durum: **AWS S3 (Tek Bucket + Prefix’ler)** ✅

**Şubat 2026’da geçiş tamamlandı (Faz 4):**
- ✅ **Tek bucket** (örn. `herokidstory`), bölge: eu-central-1
- ✅ **Prefix’ler:** `photos/`, `books/`, `pdfs/`, `covers/` (books, pdfs, covers public read; photos private)
- ✅ IAM role EC2’ye atandı; uygulama S3’e doğrudan erişir
- ✅ Sıfırdan kurulum: `docs/plans/AWS_ORTAM_SIFIRDAN_KURULUM_REHBERI.md`

**Neden Supabase’ten geçildi?**
- Supabase Storage free tier limiti; maliyet ve ölçeklenebilirlik için AWS S3 seçildi.
- Database EC2’de PostgreSQL olarak taşındı; auth NextAuth.js ile tamamlandı (Supabase tamamen kaldırıldı).

---

## 📝 Prompt Management System

**Konum:** `lib/prompts/`  
**Amaç:** Hikaye ve görsel üretimi için prompt versiyonları, dil dosyaları ve konfigürasyon.

### Yapı
- **config.ts** – Yalnızca kodda kullanılan ayarlar (ör. layout-safe master ölçeği `masterLayout`); story/görsel model ve limitler `lib/ai/` + route’lar.
- **story/** – Hikaye prompt base.
- **image/** – Görsel prompt’ları (character, scene, style-descriptions, negative, master).
- **tts/v1.0.0/** – TTS için 8 dil (tr, en, de, fr, es, zh, pt, ru).

### Gerekçe
- Tek yerden prompt metni; anlamlı değişikliklerde ilgili dosyada `VERSION` + changelog.

---

## 🔊 TTS (Text-to-Speech) Mimarisi

**Konum:** `app/api/tts/generate`, `lib/prompts/tts/`  
**Amaç:** E-book görüntüleyicide sesli okuma (8 dil).

### Akış
1. Frontend: metin + dil kodu → POST `/api/tts/generate`.
2. Backend: Google Cloud Text-to-Speech API (veya yapılandırılmış provider).
3. Dil dosyaları: `lib/prompts/tts/v1.0.0/{tr,en,de,...}.ts` – dil bazlı ayarlar.

### Gerekçe
- Erişilebilirlik ve çocuk kullanıcı deneyimi.
- Dil bazlı prompt/ayar dosyaları ile tutarlı ses çıktısı.

---

## 💱 Currency Detection

**Konum:** `lib/currency.ts`, `app/api/currency/route.ts`  
**Amaç:** Kullanıcı bölgesine göre para birimi (TRY, USD, EUR, GBP) tespiti.

### Akış
1. Frontend veya middleware: GET `/api/currency` veya `getCurrencyFromRequest()`.
2. IP tabanlı ülke: Vercel header (`X-Vercel-IP-Country`), fallback (Cloudflare, Accept-Language).
3. `COUNTRY_CURRENCY_MAP`: TR→TRY, US→USD, EU ülkeleri→EUR, GB→GBP.
4. Fiyat gösterimi: `lib/currency.ts` içindeki `CurrencyConfig` (symbol, price string).

### Gerekçe
- Tek fiyat alanı; gösterim bölgeye göre otomatik.
- Stripe/İyzico entegrasyonu öncesi doğru para birimi seçimi.

---

## 🛒 Cart System

**Konum:** `app/api/cart/route.ts`, `app/cart/`, `components/checkout/`  
**Amaç:** Sepet CRUD, checkout öncesi ürün toplama.

### Bileşenler
- **API:** GET/POST/PATCH/DELETE `/api/cart` – sepetteki öğeler (kitap/draft, plan, miktar).
- **Sayfa:** `app/cart/page.tsx` – sepet görüntüleme ve düzenleme.
- **Checkout:** `CartSummary`, `CheckoutForm`, `PlanSelectionModal` – ödeme akışına hazırlık.
- **My Library:** Basılı kitap toplu seçim → sepete ekleme.

### Gerekçe
- Tek sepet; e-book ve basılı kitap aynı akışta.
- Rate limiting (`api/rate-limit`) ile API koruması.

---

## 🖼️ Image Edit Feature

**Konum:** `app/api/ai/edit-image/route.ts`, `app/api/books/[id]/revert-image/route.ts`, `components/book-viewer/ImageEditModal.tsx`  
**Amaç:** ChatGPT tarzı mask-based görsel düzenleme; version history ve revert.

### Akış
1. Book viewer’da “Edit image” → mask çizimi (react-sketch-canvas).
2. POST `/api/ai/edit-image`: orijinal görsel + mask + talimat → yeni görsel (OpenAI edits API).
3. Edit history: `api/books/[id]/edit-history`, `revert-image` – önceki sürüme dönme.
4. Parent-only: Book Settings sayfası yetki kontrolü.

### Gerekçe
- Kullanıcı tek sayfayı revize edebilir; tüm kitabı yeniden üretmeye gerek yok.
- Version history ile geri alım ve deney takibi.

---

## 👥 Multi-character Support

**Konum:** `lib/db/characters.ts`, `app/api/characters/`, `docs/database/SCHEMA.md` (characters tablosu)  
**Amaç:** Kullanıcı başına 5 karaktere kadar (çocuk + pet/oyuncak); ana/yan karakter; hikayede tutarlı kullanım.

### Veri modeli
- **characters:** user_id, name, age, gender, reference_photo_url, description (JSONB), analysis_raw, is_default, used_in_books, total_books, version, previous_versions.
- **description JSONB:** physicalFeatures, hair, body, clothing; AI analiz çıktısı ve master description.
- Karakter türü: Child / Family / Pet / Other / Toy (AI analyze ile sınıflandırma).

### API
- POST `/api/characters/analyze` – referans fotoğraf + bilgiler → AI analiz → description.
- CRUD `/api/characters`, `/api/characters/[id]`, POST `set-default`.
- Kitaplar: karakter ID’leri ile ilişki; wizard’da seçilen karakterler hikaye/görsel prompt’larına enjekte edilir.

### Gerekçe
- Aynı çocuk birden fazla kitapta tutarlı görünsün (master description).
- Pet/oyuncak hikayeye dahil edilebilsin; 5 karakter kotası ile sınır.

---

## 🧪 Test Infrastructure

### Mevcut Test Araçları

**Faz 1.2'de oluşturuldu (legacy):**

- ✅ `app/api/test/storage` - Storage API test endpoint (production: S3)

**Kullanım:**
- Production: AWS EC2 PostgreSQL + S3; test için DB ve S3 bağlantısı kullanılır.
- Sıfırdan kurulum: `docs/plans/AWS_ORTAM_SIFIRDAN_KURULUM_REHBERI.md`

---

## 📜 Mimari Değişiklik Geçmişi

### 4 Ocak 2026 - Faz 1.2 Tamamlandı (başlangıç altyapı)
**Ne değişti:**
- Database schema oluşturuldu; test infrastructure eklendi.

**Şubat 2026 – Production AWS’e taşındı (Faz 1–4):**
- Database: EC2 üzerinde PostgreSQL; migrations/ klasöründe.
- Storage: AWS S3 tek bucket (photos, books, pdfs, covers).
- Auth: NextAuth.js (tamamlandı). Supabase tamamen kaldırıldı.
- Rehber: `docs/plans/AWS_ORTAM_SIFIRDAN_KURULUM_REHBERI.md`

### 4 Ocak 2026 - Dark/Light Mode Kararı ✅
**Ne değişti:**
- Dark mode ve Light mode desteği eklendi (Faz 2.1.3)
- Renk paleti dark/light mode uyumlu olacak şekilde tasarlandı
- next-themes kullanılacak (theme provider)

**Neden:**
- Kullanıcı tercihi (bazı kullanıcılar dark mode tercih eder)
- Modern web standartı
- Göz yormayan deneyim (özellikle akşam saatlerinde)

**Alternatifler:**
- Custom theme provider (daha fazla kontrol)
- CSS variables only (daha basit ama daha az özellik)

**Karar:**
- next-themes seçildi çünkü: Next.js ile mükemmel entegrasyon, sistem tercihini otomatik algılar, kolay kullanım

### 4 Ocak 2026 - Faz 1.3 Tamamlandı ✅
**Ne değişti:**
- `lib/config.ts` oluşturuldu (environment-based configuration)
- `next.config.js` optimize edildi (image domains, production optimizations)
- Development/Production config ayrımı yapıldı
- Environment setup rehberi oluşturuldu (`docs/guides/ENVIRONMENT_SETUP.md`)
- Configuration validation eklendi

**Neden:**
- Environment variable'ların merkezi yönetimi gerekiyordu
- Development ve production arasında farklı ayarlar olacak
- Image optimization için Next.js config'i optimize edilmeliydi
- Vercel deployment için hazırlık yapılmalıydı

**Alternatifler:**
- Her yerde `process.env` kullanmak (merkezi yönetim yok)
- Config dosyası olmadan (validation yok)

**Karar:**
- `lib/config.ts` ile merkezi configuration yönetimi
- Type-safe configuration
- Otomatik validation (production'da hata verir)

### 2 Şubat 2026 - FAZ 5: ARCHITECTURE Güncelleme ✅
**Ne değişti:**
- Proje yapısı güncellendi (app/, components/, lib/ – güncel klasör ve dosya listesi)
- API Routes özeti eklendi (29 endpoint, gruplu tablo)
- Yeni bölümler: Prompt Management System, TTS Architecture, Currency Detection, Cart System, Image Edit Feature, Multi-character Support
- Teknoloji stack güncellendi (Next.js 14.2.35, React 18.3.1, OpenAI, TTS, PDF, form/animasyon kütüphaneleri)
- Tamamlananlar (Faz 2–4) listesi eklendi; Sıradakiler güncellendi
- docs/database/SCHEMA.md ve docs/api/API_DOCUMENTATION.md referansları eklendi

**Neden:**
- Mimari dokümanın mevcut koda ve özelliklere uyumlu olması gerekiyordu
- Yeni eklenen sistemlerin (TTS, Currency, Cart, Image Edit, Multi-character) tek yerde özetlenmesi

**Çıktı:**
- ARCHITECTURE.md güncel; FAZ 5 tamamlandı

---

**Son Güncelleme:** 2 Şubat 2026

