# HeroKidStory – Refactoring Analiz Raporu

**Tarih:** 15 Mart 2026  
**Toplam kaynak dosya:** ~180 (.ts/.tsx)  
**Toplam satır (tahmini):** ~25.000+

---

## 0. Önce Kısaltma, Gerekirse Bölme (Genel Bakış)

**Soru:** Dosyaları başka dosyalara taşıyıp fonksiyonları ayırmak şart mı? Yoksa sadece içeriği sadeleştirip (gereksiz kod silme, tekrarları azaltma) satır sayısını düşürmek yeterli mi?

**Cevap:** Önce **içeriği sadeleştirmek** (trim) yeterli. Fonksiyonları **ayrı dosyaya taşımak zorunlu değil**; aynı dosyada helper fonksiyonlara bölmek bile büyük kazanç sağlar. Sadece gereksiz/tekrarlı kodu temizleyerek 2.8k → ~2k’ya inmek mümkün.

### Sektör / Genel Değerlendirme

- **Kısa dosyalar tercih edilir:** Çoğu ekip 200–500 satırı “rahat okunur”, 800–1000+ satırı “refactor adayı” görür. 2000+ satır tek dosyada genelde “çok uzun” kabul edilir.
- **“Kısa” = önce az kod:** Önce gereksiz log, ölü kod, tekrarlar silinmeli; sonra aynı dosya içinde fonksiyonlara bölünmeli; **en son** ihtiyaç kalırsa birkaç modüle ayrılmalı.
- **Bu proje:** Büyük dosyaların çoğunda asıl şişkinlik “çok fazla sorumluluk”tan çok **aşırı log**, **aynı blokların kopyala-yapıştırı** ve **tekrarlanan sabitler**. Yani önce **trim**, sonra (istersen) **aynı dosyada helper**, gerekirse **modül bölme**.

### Örnek: `app/api/books/route.ts` (2811 satır) — Sadece sadeleştirerek

| Ne yapılabilir | Tahmini kazanç | Yeni dosya gerekir mi? |
|----------------|----------------|-------------------------|
| `console.log` / `console.warn` / `console.error` sayısını azaltmak (sadece hata + tek satır özet; detayı `DEBUG_CREATE_BOOK=true` ile açmak) | **~350–500 satır** | Hayır |
| Kapak ve sayfa görseli için “referans URL → Blob, edits API çağrısı, fallback generations” bloğu **aynı dosyada** tek bir `generateImageWithReference(...)` helper’a indirgemek | **~250–400 satır** | Hayır (helper aynı dosyada) |
| `themeClothingForMaster` objesini iki yerde tanımlamak yerine bir kez tanımlamak | **~15 satır** | Hayır |
| Boş blokları ve gereksiz uzun yorumları kısaltmak | **~30–50 satır** | Hayır |

**Toplam:** 2811 → **yaklaşık 1900–2150 satır** tek dosyada, **hiçbir fonksiyonu başka dosyaya taşımadan** mümkün.

**Sonuç:** “Fonksiyonları ayırma” derken: **aynı dosya içinde** helper’lara bölmek bile büyük fayda sağlar; **yeni modül/dosya açmak** ise isteğe bağlı. Önce trim + aynı dosyada toplama yeterli.

---

## 1. En Büyük Dosyalar (Kritik)

| # | Dosya | Satır | Aciliyet |
|---|-------|-------|----------|
| 1 | `app/api/books/route.ts` | 2811 | 🔴 Kritik |
| 2 | `lib/prompts/image/scene.ts` | 1768 | 🔴 Kritik |
| 3 | `app/[locale]/create/step6/page.tsx` | 1464 | 🔴 Kritik |
| 4 | `app/[locale]/create/step2/page.tsx` | 1425 | 🔴 Kritik |
| 5 | `components/book-viewer/book-viewer.tsx` | 1225 | 🔴 Kritik |
| 6 | `lib/prompts/story/base.ts` | 908 | 🟡 Orta |
| 7 | `app/[locale]/dashboard/page.tsx` | 800 | 🟡 Orta |
| 8 | `app/[locale]/dashboard/settings/page.tsx` | 682 | 🟡 Orta |
| 9 | `app/[locale]/examples/page.tsx` | 662 | 🟡 Orta |
| 10 | `app/[locale]/create/from-example/page.tsx` | 643 | 🟡 Orta |
| 11 | `app/[locale]/create/step3/page.tsx` | 629 | 🟡 Orta |
| 12 | `lib/prompts/image/character.ts` | 603 | 🟢 Düşük |
| 13 | `components/layout/Header.tsx` | 595 | 🟡 Orta |
| 14 | `app/[locale]/books/[id]/settings/page.tsx` | 595 | 🟡 Orta |

---

## 2. Kritik Dosya Detayları ve Öneriler

### 2.1 `app/api/books/route.ts` (2811 satır) — EN ACİL

**Sorun:** Çok satırın nedeni büyük ölçüde: aşırı log, kapak/sayfa için neredeyse aynı blokların iki kez yazılması, tekrarlanan sabitler. Mantık tek dosyada olsa da okunabilirlik düşüyor.

**Öneri (öncelik sırasıyla):**
1. **Sadece sadeleştir (yeni dosya yok):** Log’ları kısalt/DEBUG’a bağla, `themeClothingForMaster`’ı tek yerde tanımla, kapak + sayfa görsel üretimini **aynı dosyada** `generateImageWithReference(...)` benzeri tek helper’da topla → **~1900–2150 satıra** iner.
2. **İstersen sonra böl:** Hâlâ uzun geliyorsa `lib/services/` ile servis katmanına taşıma yapılabilir (story, master, cover, page-images).
**Kazanım (sadece trim):** ~700–900 satır azalır, dosya tek başına daha anlaşılır olur. Bölme zorunlu değil.

---

### 2.2 `lib/prompts/image/scene.ts` (1768 satır)

**Sorun:** Ortam, ışık, kompozisyon, shot plan, çeşitlilik, risk algılama hepsi tek dosyada.

**Öneri:**
```
lib/prompts/image/scene/
  ├── index.ts              — generateFullPagePrompt, generateScenePrompt
  ├── environment.ts        — ortam şablonları
  ├── lighting.ts           — ışık/hava/mood
  ├── composition.ts        — kompozisyon kuralları
  ├── shot-plan.ts          — kamera açıları
  └── diversity.ts          — sahne çeşitliliği & risk tespiti
```

---

### 2.3 `components/book-viewer/book-viewer.tsx` (1225 satır)

**Sorun:** Veri çekme, TTS, animasyonlar, ayarlar, tam ekran, bookmark, paylaşım, klavye kısayolları tek bileşende.

**Öneri:**
```
components/book-viewer/
  ├── book-viewer.tsx             — ana orchestrator (~300 satır)
  ├── BookViewerHeader.tsx        — üst bar
  ├── BookViewerFooter.tsx        — alt bar
  ├── BookViewerSettingsMenu.tsx  — ayarlar dropdown
  ├── TtsAdminDialog.tsx          — TTS admin dialogu
  ├── page-transition-variants.ts — animasyon varyantları
  └── useBookViewer.ts            — veri çekme, state yönetimi hook'u
```
**Ek:** `mockBook` (51–109 satır) kullanılmıyor → silinmeli.

---

### 2.4 Create Wizard Sayfaları (step1-6, from-example) — Toplam ~5000+ satır

**Sorun:** Her step'te tekrar eden yapılar:
- `DecorativeFloatingElements` (her step'te aynı animasyonlu elementler)
- Progress bar + header + navigation (aynı layout)
- `console.log` / `console.error` (30+ yer)
- `validateFile`, `formatFileSize` (step2 ve from-example'da aynı)
- Payload hazırlama mantığı (step6 ve from-example'da tekrar)

**Öneri:**
```
components/create/
  ├── CreateStepLayout.tsx          — ortak layout (progress, header, nav)
  ├── DecorativeFloatingElements.tsx — dekoratif elementler
  ├── CharacterFormFields.tsx       — karakter formu (step2 + from-example paylaşır)
  ├── PhotoUploadZone.tsx           — fotoğraf yükleme alanı
  └── SummarySectionCard.tsx        — özet kartları (step6)

hooks/
  ├── useWizardStep.ts              — ortak wizard mantığı
  └── useWizardData.ts              — localStorage okuma/türetme

lib/
  └── file-utils.ts                 — validateFile, formatFileSize
```
**Kazanım:** Her step dosyası ~250-350 satıra iner.

---

## 3. Tekrarlanan Kod Desenleri

### 3.1 Gradient Butonlar (30+ yerde)
```tsx
className="bg-gradient-to-r from-primary to-brand-2"
```
**Öneri:** `components/ui/button.tsx` içine `variant="gradient"` ekle.

### 3.2 Modal Layout (3 dosyada aynı)
`ImageEditModal`, `EditHistoryPanel`, `RegenerateImageModal` aynı modal shell'i kullanıyor.  
**Öneri:** `components/ui/modal-layout.tsx` oluştur.

### 3.3 Navigasyon Linkleri (Header + Footer)
Aynı linkler iki yerde tanımlı.  
**Öneri:** `lib/nav-links.ts` ile merkezi tanım.

### 3.4 Debug Panel Tekrarları
`DebugQualityPanel.tsx` içinde `themeKey/styleKey/language` çıkarma mantığı 4 kez tekrarlanıyor.  
**Öneri:** `buildDebugRequest()` helper fonksiyonu.

---

## 4. Console.log Temizliği

| Alan | Yaklaşık Sayı |
|------|---------------|
| Create step1-6 | ~20 |
| Dashboard | ~7 |
| Book viewer | ~5 |
| Book settings | ~4 |
| Toplam | **~36** |

**Öneri:** Tümünü `lib/logger.ts` üzerinden yönlendir veya production build'de kaldır.

---

## 5. Ölü Kod / Kullanılmayan Yapılar

| Ne | Nerede | Aksiyon |
|----|--------|---------|
| `mockBook` objesi | `book-viewer.tsx:51-109` | Sil |
| `mockBooks` objesi | `dashboard/page.tsx:31-53` | Sil |
| `handleShareBook` (sadece console.log) | `dashboard/page.tsx:259` | Implement et veya sil |
| `jspdf` paketi | `package.json` | Kaldır (Puppeteer kullanılıyor) |
| `useSearchParams` import | `examples/page.tsx` | Kaldır |
| Kullanılmayan export'lar | `lib/prompts/image/character.ts` | Temizle |
| `SHOW_CURRENCY_SELECTOR = false` kodu | `Header.tsx:147-176` | Kaldır veya feature flag'e bağla |

---

## 6. Bağımlılık Sorunları

| Sorun | Detay |
|-------|-------|
| **Yanlış kategoride** | `@types/node`, `@types/react`, `@types/react-dom`, `eslint-config-next`, `typescript` → `devDependencies`'e taşınmalı |
| **Kullanılmayan paket** | `jspdf` — PDF üretimi Puppeteer ile yapılıyor |
| **Port tutarsızlığı** | `package.json` dev: port 3000, `next.config.js` default: 3001 |
| **Image optimization kapalı** | `next.config.js` → `images.formats: []` — AVIF/WebP açılabilir |

---

## 7. docs/ Klasörü

| Metrik | Değer |
|--------|-------|
| Toplam dosya | 186 |
| Toplam boyut | ~1.93 MB |
| Archive (eski notlar) | 67 dosya |
| Kod tarafından okunan | Sadece 2 dosya (`docs/prompts/` altında) |

**Öneri:** `docs/archive/` gözden geçirilip gereksiz dosyalar silinebilir. Kod tarafından okunan `docs/prompts/STORY_PROMPT_TEMPLATE.md` ve `docs/prompts/IMAGE_PROMPT_TEMPLATE.md` korunmalı.

---

## 8. scripts/ Klasörü

`scripts/` içinde ~6.7 MB görsel dosya var (test output görselleri).  
**Öneri:** `.gitignore`'a eklenip repodan çıkarılabilir.

---

## 9. Önerilen Refactoring Sıralaması

### Faz 1 — Hızlı Kazanımlar (1-2 gün)
1. ✅ `jspdf` kaldır, bağımlılıkları düzelt (devDependencies)
2. ✅ `mockBook`, `mockBooks`, kullanılmayan import'ları temizle
3. ✅ `console.log` → `lib/logger.ts` veya sil
4. ✅ Port tutarsızlığını düzelt
5. ✅ Gradient buton varyantı ekle (`variant="gradient"`)

### Faz 2 — Ortak Bileşenler (2-3 gün)
1. `CreateStepLayout` + `DecorativeFloatingElements` çıkar
2. `ModalLayout` bileşeni oluştur
3. `PhotoUploadZone` + `CharacterFormFields` paylaşılabilir yap
4. `useWizardStep` + `useWizardData` hook'ları oluştur
5. `lib/file-utils.ts` çıkar

### Faz 3 — Büyük Dosyaları Kısaltma (önce aynı dosyada, 2-3 gün)
1. **`app/api/books/route.ts`:** Log azaltma + aynı dosyada `generateImageWithReference` helper → ~2k satıra iner (yeni dosya gerekmez).
2. **`lib/prompts/image/scene.ts`:** Gerekirse aynı dizinde alt modüllere böl (isteğe bağlı).
3. **`book-viewer.tsx`:** mockBook sil, gereksiz log’ları kısalt; istenirse bileşen/hook’lara böl.
4. Create step’ler: Ortak layout/bileşenler (Faz 2) ile sayfa boyları zaten düşer.
5. **`Header.tsx`:** İstersen `MobileNavMenu` vb. aynı dosyada alt bileşen olarak çıkar.

**Not:** “Bölme” = önce aynı dosya içinde fonksiyon/bileşen; yeni dosya açmak sadece gerçekten ihtiyaç kalırsa.

### Faz 4 — İnce Ayar (1-2 gün)
1. Kullanılmayan export'ları temizle
2. `docs/archive/` gözden geçir
3. `scripts/` görsellerini `.gitignore`'a ekle
4. Image optimization aç (AVIF/WebP)

---

## 10. Mevcut Yapının İyi Yanları

- ✅ Next.js App Router doğru kullanılmış
- ✅ i18n (next-intl) düzgün entegre
- ✅ Auth (NextAuth) middleware ile korunuyor
- ✅ Tip güvenliği: `strict: true`, Zod validasyon
- ✅ `lib/db/` dosyaları makul boyutta ve sorumlulukları net
- ✅ Prompt versiyonlama sistemi (`version-sync.ts`) iyi düşünülmüş
- ✅ Tailwind CSS değişkenleri ile temiz renk paleti
- ✅ UI bileşenleri (shadcn/ui tarzı) standart

---

*Bu rapor, projenin mevcut durumunu analiz etmek ve refactoring önceliklendirmesi yapmak amacıyla hazırlanmıştır.*
