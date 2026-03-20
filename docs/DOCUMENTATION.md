# 📚 HeroKidStory - Dokümantasyon

Bu klasör projenin tüm dokümantasyonunu içerir.

**Son güncelleme:** 20 Mart 2026 — `books` zaman damgaları: migration `024_books_timestamps_timestamptz.sql`, `pool` UTC oturumu, admin kitap detayında İstanbul saati + üretim süresi (`docs/implementation/FAZ5_5_IMPLEMENTATION.md`). Önceki: AI maliyet satırları (`docs/guides/AI_COST_AND_USAGE_LOGGING.md`); 7 Mart 2026 Design Token (`docs/guides/THEME_AND_COLOR_GUIDE.md`).

---

## 📁 Klasör Yapısı

```
docs/
├── DOCUMENTATION.md             # Bu dosya - Dokümantasyon indeksi
├── DOCUMENTATION_MAP.md         # Tüm dokümanların kategorisi ve özeti
├── ROADMAP.md                   # Ana proje planı (özet + faz dosyalarına linkler)
├── roadmap/                     # Faz bazlı iş listesi ve CSV/viewer
│   ├── PHASE_1_FOUNDATION.md    # Faz 1: Temel altyapı
│   ├── PHASE_2_FRONTEND.md      # Faz 2: Frontend
│   ├── PHASE_3_BACKEND_AI.md    # Faz 3: Backend ve AI
│   ├── PHASE_4_ECOMMERCE.md     # Faz 4: E-ticaret
│   ├── PHASE_5_LAUNCH.md        # Faz 5: Polish ve lansman
│   ├── PHASE_6_PWA.md           # Faz 6: PWA
│   ├── roadmap.csv              # CSV (faz dosyalarından otomatik; npm run roadmap)
│   ├── roadmap-viewer.html      # HTML görüntüleyici - Gizli
│   ├── V0_APP_PROMPT_GUIDE.md   # v0.app prompt rehberi
│   ├── NOTLAR_VE_FIKIRLER.md    # Notlar ve fikirler
│   └── ILERLEME_TAKIBI.md       # İlerleme takibi
├── PRD.md                       # Ürün gereksinimleri (kısa; teknik detay → technical/PRD_TECHNICAL_DETAILS.md)
├── COMPLETED_FEATURES.md        # Tamamlanan özellikler changelog (PRD'den taşındı)
├── FEATURES.md                  # Özellik listesi ve önceliklendirme
├── ARCHITECTURE.md              # Mimari kararlar ve yapı
│
├── implementation/              # İmplementasyon takip dosyaları (Faz bazlı)
│   ├── README.md               # Klasör açıklaması (FAZ 6)
│   ├── DESIGN_TOKEN_IMPLEMENTATION.md # ✅ Design Token renk sistemi (7 Mart 2026) — 2.1.9
│   ├── LOCALIZATION_IMPLEMENTATION.md # Localization (i18n) ilerleme — Faz 5.11, @localization-agent
│   ├── CUSTOM_THEME_IMPLEMENTATION.md # Custom tema + theme merge (1 Mart 2026)
│   ├── FAZ3_IMPLEMENTATION.md   # Faz 3 implementasyon takibi
│   ├── FAZ4_4_5_IMPLEMENTATION.md # Faz 4/5 implementasyon takibi
│   ├── FAZ5_5_IMPLEMENTATION.md   # Faz 5.5 Deployment (EC2 Next.js, env, backup, migration) ilerleme
│   ├── FAZ_AI_LOGGING_IMPLEMENTATION.md  # AI istek loglama (ai_requests tablosu, wrapper, admin dashboard)
│   ├── IMAGE_QUALITY_IMPROVEMENT_PLAN.md # Görsel + sahne kalitesi tek plan
│   └── (FAZ1, FAZ2, FAZ2.4, FAZ3 PDF plan → archive/2026-q1/implementation/)
│
├── checklists/                 # Kontrol listeleri (aktif)
│   ├── PRODUCTION_ENV_5_5_6.md # Production env kontrol listesi (5.5.6)
│   ├── WIZARD_LOADING_QA.md    # Wizard/site loading geri bildirim QA checklist (20 Mart 2026)
│   └── ...
│
├── archive/                    # Arşivlenmiş dosyalar (referans için)
│   ├── README.md               # Arşiv yapısı (FAZ 6)
│   ├── 2026-q1/                # FAZ 6 ile taşınan 17 dosya (implementation, guides, reports, strategies, ai)
│   │   └── README.md           # 2026-q1 özeti
│   ├── 2026-02/                # AWS geçişi sonrası + işi bitmiş analizler
│   │   ├── README.md           # 2026-02 özeti
│   │   ├── analysis/           # Taşınan analiz dokümanları (7 dosya: GPT trace, clothing, vb.)
│   │   ├── supabase-legacy/    # SUPABASE_TEST_GUIDE, SUPABASE_MIGRATION_GUIDE, SUPABASE_PDFS_BUCKET_SETUP
│   │   └── aws-plans/         # SUPABASE_TO_AWS_ANALYSIS, AWS_S3_SINGLE_BUCKET_PLAN, AWS_MIGRATIONS_ORDER
│   ├── FAZ1_2_CHECKLIST.md     # Faz 1.2 kontrol listesi (arşiv)
│   ├── FAZ1_TEST_CHECKLIST.md  # Faz 1 test checklist (arşiv)
│   ├── FAZ1_2_FINAL_REPORT.md  # Faz 1.2 final raporu (arşiv)
│   ├── FAZ1_3_FINAL_REPORT.md  # Faz 1.3 final raporu (arşiv)
│   ├── FAZ1_TEST_REPORT.md     # Faz 1 test raporu (arşiv)
│   ├── sahne_cesitliligi_iyilestirmesi_plan.md
│   ├── SCENE_AND_COVER_IMPROVEMENT_README.md
│   ├── IMAGE_COMPOSITION_AND_DEPTH_ANALYSIS.md
│   ├── SCENE_REPETITION_AND_CLOTHING_CONSISTENCY_ANALYSIS.md
│   ├── VISUAL_CONSISTENCY_AND_STORY_QUALITY_DEEP_DIVE.md
│   └── UNIFIED_ANALYSIS_FOUR_MODELS.md
│
├── guides/                     # Rehberler ve talimatlar
│   ├── README.md               # Klasör açıklaması (FAZ 6)
│   ├── EXAMPLES_PAGE_README.md # Examples sayfası (API, Used Photos, test)
│   ├── ENVIRONMENT_SETUP.md    # Environment variables kurulum rehberi
│   ├── V0_APP_WORKFLOW.md      # v0.app çalışma akışı rehberi
│   ├── THEME_AND_COLOR_GUIDE.md # ✅ Design Token renk sistemi (7 Mart 2026) — tek yerden renk değişimi
│   ├── API_TESTING_GUIDE.md    # API test rehberi (Postman)
│   ├── AUTHENTICATION_ISSUES.md # Authentication sorunları ve geçici çözümler
│   ├── PDF_GENERATION_GUIDE.md # PDF generation rehberi (A4 landscape, double-page spread)
│   ├── IMAGE_EDIT_FEATURE_GUIDE.md # Image edit feature rehberi (ChatGPT-style mask-based editing)
│   ├── EXAMPLES_PAGE_V0_PROMPT.md # Examples sayfası v0.app prompt rehberi (mobil-first tasarım)
│   ├── PRICING_PAGE_V0_PROMPT.md # Pricing sayfası v0.app prompt rehberi
│   ├── MY_LIBRARY_HARDCOPY_V0_PROMPT.md # My Library hardcopy özellikleri v0.app prompt rehberi
│   ├── CART_PAGE_V0_PROMPT.md # Sepet sayfası v0.app prompt rehberi
│   ├── CURRENCY_DETECTION.md # Currency detection sistemi dokümantasyonu
│   ├── STEP6_PAY_AND_GUEST_FREE_COVER_SPEC.md # Step 6 Pay gizleme + Üyesiz ücretsiz kapak (email + IP) spec
│   ├── HERO_YOUR_CHILD_THE_HERO_IMAGES_ANALYSIS.md # "Your Child, The Hero" real photo + story character görselleri (config, format, rehber)
│   ├── HERO_IMAGES_OPTIMIZATION_GUIDE.md # Hero görselleri build-time webp optimizasyonu; yeni görsel eklerken adımlar (script, config, npm run optimize-images)
│   ├── HERO_TRANSFORMATION_CORNER_ARTIFACTS_ANALYSIS.md # HeroBookTransformation kartlarında köşe beyazlığı/iz analizi ve denenen çözümler
│   ├── DB_BACKUP_RUNBOOK.md # DB yedekleme (1.2.7): script, cron, S3, restore
│   ├── EC2_RENAME_KIDSTORYBOOK_TO_HEROKIDSTORY.md # EC2'de proje klasörü kidstorybook → herokidstory yeniden adlandırma
│   ├── PRODUCTION_MIGRATION_RUNBOOK.md # Production şema migration (5.5.10): backup öncesi, psql -f, rollback
│   ├── LOCAL_DB_TUNNEL.md # Local'de prod AWS DB'ye bağlanma: ssh:tunnel vs ssh:server, iki terminal, ECONNREFUSED çözümü
│   ├── AI_COST_AND_USAGE_LOGGING.md # AI cost_usd: OpenAI usage + pricing; TTS Gemini; worker vs worker:dev
│   └── ...
│
├── ROADMAP_CSV_README.md       # CSV kullanım rehberi (roadmap.csv ve viewer docs/roadmap/ içinde)
│
├── reports/                    # Raporlar (aktif)
│   ├── README.md               # Klasör açıklaması (FAZ 6)
│   ├── IMAGE_QUALITY_ANALYSIS.md # Görsel kalite analizi
│   ├── QUALITY_AND_CONSISTENCY_ANALYSIS.md # Görsel ve hikaye kalite analizi (Kıyafet & Kurgu)
│   ├── MULTI_CHARACTER_FEATURE_SUMMARY.md
│   ├── PAYMENT_FLOW_UX_ANALYSIS.md
│   ├── SALES_AND_CART_STRATEGY_ANALYSIS.md
│   └── (CURRENT_STATUS, MISSING_IMPLEMENTATIONS, GPT_IMAGE_COVER → archive/2026-q1/reports/)
│
├── features/                   # Özellik bazlı analiz ve plan (konu odaklı)
│   └── EXAMPLES_USED_PHOTOS_FEATURE.md # Examples Used Photos: API presigned URL, UI (modal, thumbnails)
│
├── strategies/                 # Strateji dokümanları
│   ├── README.md               # Klasör açıklaması (FAZ 6)
│   ├── EXAMPLES_REAL_BOOKS_AND_CREATE_YOUR_OWN.md # Examples: gerçek kitaplar + Create your own
│   ├── EBOOK_VIEWER_STRATEGY.md # E-book Viewer stratejisi
│   ├── TTS_STRATEGY.md         # Text-to-Speech (TTS) strateji ve gereksinimler dokümanı
│   ├── CHARACTER_CONSISTENCY_STRATEGY.md # Master character multi-book tutarlılığı
│   ├── B2B_FEATURE_ANALYSIS.md # B2B (Business-to-Business) özellik analizi
│   ├── EXAMPLES_REAL_BOOKS_AND_CREATE_YOUR_OWN.md # Examples: gerçek kitaplar + Create your own stratejisi
│   ├── EXAMPLE_BOOKS_CUSTOM_REQUESTS.md # Example Books görsel kalite sorunları
│   └── (STEP_1_2_MERGE, CHARACTER_CONSISTENCY_IMPROVEMENT → archive/2026-q1/strategies/)
│
├── plans/                       # Altyapı / geçiş planları
│   ├── README.md                # Plans klasörü açıklaması
│   ├── AWS_ORTAM_SIFIRDAN_KURULUM_REHBERI.md # Tek dokümanda AWS ortamı sıfırdan kurulum (EC2 + PG + S3)
│   ├── SUPABASE_TO_AWS_ANALYSIS.md # Supabase → AWS geçiş analizi (kararlar, maliyet)
│   ├── SUPABASE_TO_AWS_IMPLEMENTATION_PLAN.md # Adım adım uygulama planı (ilerleme buradan takip)
│   ├── AWS_S3_SINGLE_BUCKET_PLAN.md # S3 tek bucket + prefix'ler (photos, books, pdfs, covers) adım adım
│   └── AWS_MIGRATIONS_ORDER.md # EC2 PostgreSQL migration sırası
│
├── database/                   # Database schemas ve migration'lar
│   └── SCHEMA.md               # Database schema dokümantasyonu
│
├── api/                        # API dokümantasyonu
│   ├── API_DOCUMENTATION.md    # API endpoints ve kullanım rehberi
│   └── POSTMAN_COLLECTION.md   # Postman collection kullanım rehberi
│
├── ai/                          # AI ile ilgili dokümanlar
│   ├── README.md                # Klasör açıklaması (FAZ 6)
│   ├── AI_STRATEGY.md           # AI prompt stratejisi
│   ├── CHARACTER_CREATION_FLOW.md # Karakter oluşturma akışı
│   └── (AI_TOOLS_COMPARISON → archive/2026-q1/ai/)
│
├── prompts/                     # AI prompt template'leri ve listeleri
│   ├── IMAGE_PROMPT_TEMPLATE.md # Görsel üretimi prompt template
│   ├── STORY_PROMPT_TEMPLATE.md # Hikaye üretimi prompt template
│   ├── HERO_TRANSFORMATION_PROMPTS.md # Hero sahne prompt örnekleri (FAZ 9)
│   └── ...
│
├── research/                    # Araştırma notları (referans; FAZ 9)
│   ├── README.md
│   └── GPT_ANATOMICAL_RESEARCH.md # GPT-4 Vision / DALL·E parmak-anatomi araştırması
│
└── technical/                   # Teknik dokümanlar
    ├── TECHNICAL_DECISIONS.md   # Teknik kararlar (Next.js, Supabase, vb.)
    ├── TECHNICAL_RESEARCH.md    # Teknik araştırma
    ├── DATABASE_COMPARISON.md   # Veritabanı karşılaştırması
    ├── PLATFORM_EXPLANATION.md  # Platform açıklamaları
    └── MONOLITH_VS_SPLIT_ANALYSIS.md  # Monolit vs backend/frontend ayrıştırma, PWA, Puppeteer riski (referans)
```

### 📋 Ana Dosyalar (docs/ root)

**Ana dosyalar (docs/ root):**
1. **DOCUMENTATION.md** - Bu dosya (dokümantasyon indeksi)
2. **ROADMAP.md** - Ana proje planı ve iş listesi
3. **PRD.md** - Ürün gereksinimleri (kısa; teknik detay: technical/PRD_TECHNICAL_DETAILS.md)
4. **COMPLETED_FEATURES.md** - Tamamlanan özellikler changelog
5. **FEATURES.md** - Özellik listesi ve önceliklendirme
6. **ARCHITECTURE.md** - Mimari kararlar ve yapı

**Diğer tüm dosyalar alt klasörlerde:**
- `implementation/` - Faz bazlı implementasyon takibi
- `checklists/` - Kontrol listeleri
- `guides/` - Rehberler
- `plans/` - Altyapı / geçiş planları (örn. Supabase → AWS analizi)
- `reports/` - Raporlar
- `strategies/` - Strateji dokümanları

---

## 🎯 Önemli Dosyalar

### Başlamak İçin
1. **ROADMAP.md** - Tüm işlerin listesi, buradan takip et
2. **PRD.md** - Ürün gereksinimleri
3. **FEATURES.md** - Özellik listesi ve önceliklendirme
4. **DOCUMENTATION_MAP.md** - Tüm dokümanların kategorisi; hangi dosya nerede, güncel mi?
5. **archive/** - Tamamlanmış/tek seferlik dokümanlar (2026-q1, 2026-02; ARCHIVE_LIST archive içinde)

### İş Takibi ve CSV Yönetimi
1. **roadmap.csv** - Google Sheets'e import edilebilir CSV dosyası (Gizli - `docs/roadmap/` klasöründe)
   - Faz dosyalarından (docs/roadmap/PHASE_*.md) otomatik oluşturulur (`npm run roadmap`)
   - Google Sheets'te filtreleme, sıralama, grafik oluşturma
   - Draft fikirler ekleme
2. **roadmap-viewer.html** - HTML tablo görüntüleyici ⭐ (Gizli - `docs/roadmap/` klasöründe)
   - Tarayıcıda çalışan interaktif tablo
   - CSV otomatik yükleme (aynı klasörde `roadmap.csv`)
   - Filtreleme, sıralama, arama özellikleri
   - İstatistikler ve renklendirme
   - Responsive tasarım
   - **Güvenlik:** Son kullanıcılar erişemez (public/ klasöründe değil)
3. **ROADMAP_CSV_README.md** - CSV kullanım rehberi
   - HTML Viewer kullanımı (önerilen)
   - Google Sheets import adımları
   - Filtreleme örnekleri
   - Draft fikir ekleme rehberi
   - Sync (senkronizasyon) bilgileri

### Teknik Kararlar
1. **technical/TECHNICAL_DECISIONS.md** - Next.js 14, Supabase seçimleri
2. **technical/TECHNICAL_RESEARCH.md** - Detaylı teknik araştırma
3. **technical/MONOLITH_VS_SPLIT_ANALYSIS.md** - Monolit vs backend/frontend ayrıştırma analizi; PWA etkisi; Puppeteer (PDF) riski; ileride karar için referans

### Deployment (Faz 5.5)
1. **analysis/DEPLOYMENT_SERVER_ANALYSIS.md** - Deployment kapsamı, roadmap eşlemesi, önerilen sıra (domain/SSL sonraya)
2. **implementation/FAZ5_5_IMPLEMENTATION.md** - Adım adım ilerleme, 5.5.1 alt adımları, olası analiz/geçici dosya listesi
3. **plans/AWS_ORTAM_SIFIRDAN_KURULUM_REHBERI.md** - EC2 + PostgreSQL + S3 sıfırdan kurulum

### AI Request Loglama
1. **analysis/AI_REQUEST_LOGGING_ANALYSIS.md** - Analiz ve tasarım; tablo şeması, maliyet hesaplama, admin dashboard planı
2. **implementation/FAZ_AI_LOGGING_IMPLEMENTATION.md** - Faz takibi (Faz 1 ✅, Faz 2 ⬜, Faz 3 ⬜)

### AI ve Prompt'lar
1. **ai/AI_STRATEGY.md** - AI stratejisi ve prompt engineering
2. **ai/CHARACTER_CREATION_FLOW.md** - Karakter oluşturma akışı (referans görsel + kullanıcı girdileri)
3. (AI_TOOLS_COMPARISON → archive/2026-q1/ai/)
4. **prompts/** - Tüm prompt template'leri
5. **analysis/STORY_AND_IMAGE_AI_FLOW.md** - Story ve Image için AI’a ne gönderildiği / ne döndüğü (request-response akışı, inceleme için)
6. **analysis/CREATE_YOUR_OWN_FROM_EXAMPLE.md** - Create Your Own from Example: akış, characterIds eşleştirmesi, kapak Vision
7. **analysis/DEBUG_QUALITY_IMPLEMENTATION_SUMMARY.md** - Debug kalite butonları (admin, trace export)
8. **analysis/STORY_PROMPT_ACTION_PLAN.md** - Hikaye + görsel kalite aksiyon planı
9. **analysis/PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md** - Prompt uzunluk/tekrar analizi, öncelik tablosu (A1–A9 tamamlandı, A5/A12/Sıra 13 sonrası), kaynak: GPT trace + kod
10. **analysis/STORY_IDEAS_GENERATION_ANALYSIS.md** - Örnek hikaye fikirleri üretimi (GPT prompt, kategoriler, 12 sayfa senaryo, yaş aralığı, TR; prompt saklama; Custom Request / aynı örnekten kitap)
11. **analysis/STORY_FLOW_AND_EXAMPLES_ANALYSIS.md** - Hikaye akışı (başlangıç–gelişme–sonuç) ve Examples için Debug akışı; custom request formatı; sadece analiz
12. **analysis/CREATE_BOOK_TIMING_ANALYSIS.md** - Create Book timing özeti; entity master paralel ve TTS pipeline örtüştürme (Şubat 2026)
13. **analysis/PARALLEL_PROCESSING_ANALYSIS.md** - Kitap oluşturma paralel işleme (sayfa batch, TTS batch ve pipeline örtüştürme)
14. **analysis/CREATE_BOOK_FLOW_SEQUENCE.md** - Kitap oluşturma akışı, sıra ve paralellik (TTS prewarm, master→kapak→sayfa, Step 6 butonları, timing summary, Google TTS quota); optimizasyon önerileri (OPT-1/2/3)
15. **analysis/CHARACTER_LIMIT_3_TO_5_ANALYSIS.md** - Kitap oluşturma karakter limiti 3→5 analizi; etkilenen yerler ve dokümantasyon güncellemeleri
16. **analysis/VISION_ANALYSIS_NECESSITY.md** - Karakter oluşturmada OpenAI Vision analizi; Vision kaldırıldı (2026-03-01), form + referans fotoğraf
17. **analysis/LOCALIZATION_ANALYSIS.md** - Localization (i18n) analiz ve kararlar; next-intl, URL yapısı, örnek hikaye/karakter isimleri; DEV-1…DEV-10 fazları; ilerleme: implementation/LOCALIZATION_IMPLEMENTATION.md; sorumlu: @localization-agent
18. **prompts/STORY_IDEAS_PROMPT.md** - Hikaye fikri üretim prompt'u (GPT’ye kopyala-yapıştır; kategori, yaş, çıktı formatı)
19. **guides/PROMPT_OPTIMIZATION_GUIDE.md** - Prompt optimizasyon rehberi (Sıra 13 sonrası aksiyonlar, relighting, linter açıklamaları)
20. **archive/2026-02/analysis/** - Arşivlenen analizler
21. **analysis/AI_REQUEST_LOGGING_ANALYSIS.md** - AI istek/yanıt loglama analizi; `ai_requests` tablo tasarımı, maliyet takibi, entegrasyon noktaları (story/image/TTS/karakter analizi)
22. **analysis/BRAND_RENAME_KIDSTORYBOOK_TO_HEROKIDSTORY_ANALYSIS.md** - KidStoryBook → herokidstory marka/proje adı değişikliği (tamamlandı); fazlama (Faz 1–4), kod/doküman/S3/DB/repo liste.

### Strateji Dokümanları
1. **strategies/TTS_STRATEGY.md** - Text-to-Speech (TTS) strateji ve gereksinimler dokümanı
   - Mevcut özellikler (MVP)
   - Planlanan özellikler (yaş grubuna göre, modlar, çok dilli destek)
   - Teknik detaylar
   - Maliyet analizi
2. **strategies/CHARACTER_CONSISTENCY_STRATEGY.md** - Master Character çoklu kitap tutarlılığı
   - Master Character konsepti
   - Çoklu kitap stratejisi
   - Database schema
   - Kullanıcı akışları
3. **strategies/DEBUG_AND_FEATURE_FLAGS_ANALYSIS.md** - Debug ve feature flags sistemi analizi
   - Ödemesiz create book testi (admin/DEBUG)
   - Config + kullanıcı rolü (admin) önerisi
   - İleride admin dashboard görünürlüğü

### Database
1. **database/SCHEMA.md** - Database schema dokümantasyonu
   - Characters table
   - Books table
   - RLS policies
   - Triggers ve functions
   - Index strategies
   - Storage buckets

**Database Agent:** `@database-manager` - Database ile ilgili tüm işlerden sorumlu agent

### API
1. **api/API_DOCUMENTATION.md** - Tüm API endpoint'leri ve kullanım örnekleri
2. **api/POSTMAN_COLLECTION.md** - Postman collection kullanım rehberi
3. **postman/HeroKidStory_API.postman_collection.json** - Postman collection (tüm endpoint'ler)
4. **postman/HeroKidStory_Environment.postman_environment.json** - Postman environment (local dev)
5. **tests/api/README.md** - API test senaryoları ve rehberi

**API Agent:** `@api-manager` - API endpoint'leri, Postman collection'ları ve testlerden sorumlu agent

---

## 📝 Dokümantasyon Kuralları

- Her dosya kendi klasöründe olmalı
- Süre/tahmin belirtilmemeli
- Sürekli güncellenmeli
- Türkçe yazılmalı (kod yorumları İngilizce olabilir)

**Archive stratejisi:** Tamamlanmış veya tek seferlik analiz dokümanları `docs/archive/` altına taşınır (örn. `archive/2026-q1/`, `archive/2026-02/`). Hangi dosyanın nerede olduğu için [DOCUMENTATION_MAP.md](DOCUMENTATION_MAP.md) ve archive içindeki README/ARCHIVE_LIST kullanılır.

---

## 🔄 Güncelleme

Dokümantasyon sürekli güncellenir. Son güncellemeler:
- **6 Mart 2026:**
  - **Examples Used Photos:** GET /api/examples cevabında `usedPhotos` S3 için 24 saat geçerli presigned URL döndürüyor (bucket private). Modal'da görsel kırpılmıyor (`object-contain`). Used Photos bölümünde sadece karakter thumbnail'ları; ok ve kapak/oluşan görsel kaldırıldı. Detay: `docs/features/EXAMPLES_USED_PHOTOS_FEATURE.md`.
- **27 Ocak 2026:**
  - Step 6 Pay gizleme: "Pay & Create My Book" sadece üyeli gösteriliyor; üye olmadan ödeme/satın alma yok
  - Üyesiz 1 ücretsiz kapak: email zorunlu, `guest_free_cover_used` (1/email), create-free-cover içinde IP 5/24h, `drafts` (user_id=null)
  - Migration 014: `guest_free_cover_used` tablosu, `drafts` için "Allow guest draft insert" RLS
  - Spec: `docs/guides/STEP6_PAY_AND_GUEST_FREE_COVER_SPEC.md`
  - HeroBookTransformation köşe izi: Analiz `docs/guides/HERO_TRANSFORMATION_CORNER_ARTIFACTS_ANALYSIS.md`; 5.1 (footer dışarı alındı) denendi – geri bildirim bekleniyor.
  - HeroBookTransformation tema göstergesi + navigation dots: Gradient kaldırıldı, solid tema rengi (`sparkleColors[0]`). Görünürlük iyileşti. ✅

- **4 Ocak 2026:** 
  - Faz 1.3: Environment ve yapılandırma tamamlandı
    - `lib/config.ts` oluşturuldu (environment-based configuration)
    - `next.config.js` optimize edildi
    - Environment setup rehberi eklendi (`docs/guides/ENVIRONMENT_SETUP.md`)
  - Dokümantasyon yapısı yeniden düzenlendi
  - `implementation/` klasörü oluşturuldu (faz bazlı implementasyon takibi)
  - `checklists/`, `guides/`, `reports/`, `strategies/` klasörleri oluşturuldu
  - Geçici dosyalar uygun klasörlere taşındı
  - IMPLEMENTATION.md → `docs/implementation/FAZ1_IMPLEMENTATION.md` olarak taşındı
  - Faz 1.2: Supabase kurulumu dokümantasyonu eklendi
  - ARCHITECTURE.md oluşturuldu (mimari kararlar)
  - AI dokümanları `ai/` klasörüne taşındı
  - Ücretsiz kapak hakkı eklendi
  - OAuth girişleri eklendi
  - AI tool seçenekleri eklendi
  - Referans görsel sistemi eklendi

---

- **10 Ocak 2026:**
  - Faz 3: Backend ve AI Integration başladı
  - Prompt Management System kuruldu
    - Prompt versiyonlama sistemi (`lib/prompts/`)
    - Story generation prompts (`lib/prompts/story/base.ts`)
    - Image generation prompts (`lib/prompts/image/`: character, scene, negative, style-descriptions)
    - Prompt Manager Agent oluşturuldu (`.cursor/rules/prompt-manager.mdc`)
  - Character Consistency System
    - Master Character konsepti tasarlandı
    - Multi-book consistency stratejisi oluşturuldu
    - Database migrations oluşturuldu (`migrations/`)
    - Characters table ve triggers eklendi
    - Database helper functions (`lib/db/characters.ts`)
    - `docs/database/SCHEMA.md` oluşturuldu
    - `docs/strategies/CHARACTER_CONSISTENCY_STRATEGY.md` oluşturuldu
  - Authentication Issues & Workarounds
    - Register sonrası email verification durumu çözüldü (geçici çözüm)
    - Login sayfasında email verification kontrolü eklendi
    - Dashboard auth protection eklendi (client-side)
    - Header auth state eklendi (User Menu, Logout)
    - Migration 005 hazır (henüz uygulanmadı - trigger yok)
    - `docs/guides/AUTHENTICATION_ISSUES.md` oluşturuldu (bypass'lar ve geçici çözümler)
    - `docs/ROADMAP.md` güncellendi (bypass notları eklendi)
  - Create Book Akışı Düzeltmeleri
    - Create book hatası düzeltildi (`buildCharacterDescription` null check'leri)
    - Step 6 görsel sorunu düzeltildi (localStorage'dan gerçek görsel gösterimi)
    - Step 2'de yüklenen görselin data URL'i localStorage'a kaydediliyor
    - Character API response'una `reference_photo_url` eklendi
    - Character API GET endpoint'inde Bearer token desteği eklendi
  - Odaklanma ve Netleştirme
    - Roadmap netleştirildi (çok fazla şeye aynı anda bakıyoruz uyarısı eklendi)
    - Odaklanma kuralları belirlendi (bir iş bitmeden diğerine geçme)
    - `docs/implementation/FAZ3_IMPLEMENTATION.md` güncellendi (tüm yapılanlar not edildi)
  - GPT-image API Entegrasyonu
    - Organization verification onaylandı ✅
    - Cover generation API test edildi ve çalışıyor ✅
    - Step'ler arası veri transferi düzeltildi ✅
    - Create Book butonu aktif edildi ✅
    - Debug: Sayfa sayısı override eklendi (Step 5) ✅
    - Backend log temizliği yapıldı ✅
    - `docs/reports/GPT_IMAGE_COVER_GENERATION_ERROR_ANALYSIS.md` oluşturuldu
    - `docs/reports/CURRENT_STATUS_ANALYSIS.md` oluşturuldu (mevcut durum ve eksikler)

**Son Güncelleme:** 7 Şubat 2026

- **7 Şubat 2026 (Commit öncesi doküman toparlama):**
  - Root ve docs altındaki migration/temp dosyalar archive'a taşındı: MIGRATION_SESSION_2_SUMMARY, MIGRATION_STATUS, MIGRATION_BUILD_FIXES → docs/archive/2026-02/; TEMP_CREATE_BOOK_TEST_ANALYSIS → archive/2026-02; ARCHIVE_LIST → docs/archive/ARCHIVE_LIST.md.
  - Auth/migration rehberleri archive'a taşındı: AUTH_USERS_VS_PUBLIC_USERS, DELETE_AUTH_SCHEMA, RUN_MIGRATION_ON_EC2 → docs/archive/2026-02/guides-auth/.
  - DOCUMENTATION.md güncellendi (ARCHIVE_LIST referansları kaldırıldı, archive notu eklendi).

- **4 Şubat 2026 (AWS geçiş – Faz 4, sıfırdan kurulum rehberi):**
  - Supabase → AWS uygulama planında **Faz 4 (S3 tek bucket + prefix’ler)** tamamlandı olarak işaretlendi.
  - **docs/plans/AWS_ORTAM_SIFIRDAN_KURULUM_REHBERI.md** eklendi: EC2 + PostgreSQL + S3 ortamını tek dokümanda sıfırdan kurma rehberi (bölge, güvenlik grubu, migration sırası, IAM, bucket policy, AWS CLI kurulumu dahil).
  - DOCUMENTATION.md ve docs/plans/README.md güncellendi (yeni rehber ve Faz 4 durumu).

- **2 Şubat 2026 (FAZ 10 – README ve dokümantasyon):**
  - README.md güncellendi: proje yapısı (app/, components/, lib/), özellikler (TTS, Multi-character, Currency Detection), hızlı başlangıç (port 3001), dokümantasyon tablosu, teknoloji stack
  - DOCUMENTATION.md: son güncelleme tarihi ve archive stratejisi notu eklendi
  - .cursorrules güncellendi: güncel proje yapısı, önemli dosyalar, logger kullanımı

- **23 Ocak 2026:**
  - **ROADMAP CSV Sistemi eklendi:**
    - `docs/roadmap/roadmap.csv` - Google Sheets'e import edilebilir CSV dosyası
    - `scripts/generate-roadmap-csv.js` - Faz dosyalarından CSV oluşturma script'i
    - `docs/ROADMAP_CSV_README.md` - CSV kullanım rehberi
    - ROADMAP.md'den otomatik CSV oluşturma
    - Google Sheets'te filtreleme, sıralama, grafik oluşturma
    - Draft fikirler ekleme desteği
    - Project-manager agent'ına CSV yönetimi sorumluluğu eklendi

- **Şubat 2026:**
  - **Anasayfa UI iyileştirmeleri (tamamlandı):**
    - Trust Indicators (10,000+ happy families, 4.9/5 rating) anasayfadan kaldırıldı. Kullanıcı review’leri için ileride ayrı bir sayfa yapılacak (`docs/ROADMAP.md` → Gelecek Özellikler).
    - Hero: tablet/web’te `min-height` kaldırıldı (`md:min-h-0 lg:min-h-0`); How It Works yukarı çekildi.
    - How It Works: üst padding responsive ayarlandı (mobil `pt-8`, tablet/web `md:pt-4 lg:pt-5`). Tablet görünümünde 3 adım yan yana gösteriliyor (`md:grid-cols-3`).
    - Real Photo & Story Character: iPad/web’de büyütüldü (max-width, grid).
    - Wave separator: Mobilde How It Works section'ın bir parçası, badge'lerin altında görünüyor. Tablet/web'de Hero section'ın altında.
    - "24 Pages" badge'i kaldırıldı (HeroBookTransformation ve PricingSection'dan).
    - HeroBookTransformation: Badge'lerin altına margin eklendi (`mb-20` mobil, `sm:mb-6`) - wave separator ile boşluk için.

- **25 Ocak 2026:**
  - **Pricing Sayfası ve Hardcopy Satın Alma Sistemi tamamlandı:**
    - Pricing sayfası (`/pricing`) oluşturuldu - Sadece E-Book satışı
    - Currency detection sistemi (IP-based geolocation) eklendi
    - Sepet sistemi (CartContext, API endpoints, Cart page) tamamlandı
    - My Library'ye hardcopy satın alma özellikleri eklendi (bulk selection, sepete ekleme)
    - Step 6'ya email input eklendi (unauthenticated users için)
    - Rate limiting API eklendi (bot koruması)
    - `docs/guides/PRICING_PAGE_V0_PROMPT.md` - Pricing sayfası v0.app prompt rehberi
    - `docs/guides/MY_LIBRARY_HARDCOPY_V0_PROMPT.md` - My Library hardcopy v0.app prompt rehberi
    - `docs/guides/CART_PAGE_V0_PROMPT.md` - Sepet sayfası v0.app prompt rehberi
    - `docs/guides/CURRENCY_DETECTION.md` - Currency detection dokümantasyonu
    - Ana sayfa PricingSection güncellendi (E-Book + Printed Book info card)

- **17 Ocak 2026:**
  - Image Edit Feature tamamlandı
    - ChatGPT-style mask-based editing sistemi
    - OpenAI Image Edit API entegrasyonu
    - Version history ve revert sistemi (Version 0 - Original support)
    - Parent-only access (Book Settings page)
    - Prompt security enhancements (positive + negative prompts)
    - `docs/guides/IMAGE_EDIT_FEATURE_GUIDE.md` oluşturuldu

