# Monolit vs Backend/Frontend Ayrıştırma Analizi

**Tarih:** 6 Mart 2026  
**Durum:** Referans doküman — ileride karar verildiğinde kullanılacak.

Bu doküman, KidStoryBook projesinin mevcut monolitik mimarisinin (Backend + Frontend aynı Next.js uygulamasında) analizini, olası riskleri, PWA etkisini ve “ayırma” kararının ne zaman/zorlukta olacağını özetler.

---

## 1. Özet (TL;DR)

| Soru | Yanıt |
|------|--------|
| **Mevcut durum** | Next.js 14 App Router üzerinde tam-stack monolit: API, DB, AI, frontend aynı projede. |
| **Ayırmak şu an gerekli mi?** | Hayır. Belirli büyüme eşiğinde veya mobil uygulama kararı verildiğinde gündeme alınmalı. |
| **Zorluk** | Orta. `lib/` yapısı iyi ayrışmış; ayırma işi “sıfırdan yazmak” değil, taşıma ve arayüz çıkarmak. |
| **PWA** | Monolit PWA geliştirmeyi engellemez. `next-pwa` + `manifest.json` ile monolit içinde PWA yapılabilir. |
| **En riskli parça** | **Puppeteer (PDF üretimi)** — aynı Node/Next.js process içinde Chromium çalıştığı için bellek/CPU riski. İleride ayrı servis veya worker’a taşınması önerilir. |

---

## 2. Mevcut Mimari Özeti

- **Framework:** Next.js 14 (App Router) + TypeScript + React 18.
- **Backend:** `app/api/` altında API route’lar; `lib/db/`, `lib/ai/`, `lib/storage/`, `lib/tts/`, `lib/pdf/` gibi katmanlar.
- **Veritabanı:** PostgreSQL (`pg`), doğrudan EC2’de.
- **Auth:** NextAuth.js v5 (Credentials, Google, Facebook), JWT session.
- **AI:** OpenAI (hikaye + görsel), Google Cloud TTS; görsel üretimi için kuyruk yapısı mevcut.
- **PDF:** Puppeteer + HTML/CSS template ile kitap → PDF (A4 landscape).
- **Deploy:** EC2’de Next.js tek process (Docker yok); PM2 ile port 3000.

Güçlü yön: `lib/` altındaki modüller framework’e sıkı bağımlı değil; ileride taşınabilir.

---

## 3. Monolitik Yapının Riskleri

| Risk | Açıklama | Ne Zaman Tetiklenir |
|------|----------|---------------------|
| Tek deployment = tek hata noktası | Tüm uygulama birlikte deploy edilir; bir hata tüm sistemi etkiler. | Şimdi de geçerli. |
| Ağır işler sunucuyu yavaşlatır | AI (DALL-E, TTS) ve özellikle **Puppeteer (PDF)** aynı process’te çalışır; CPU/RAM paylaşılır. | Trafik arttıkça belirginleşir. |
| Puppeteer/Chromium aynı process’te | Her PDF isteği yeni Chromium açar; bellek (~150–400 MB/instance) ve bloklama riski. | Eşzamanlı PDF istekleri. |
| Scale = tüm uygulamayı scale etmek | Sadece API veya sadece PDF’i ayrı scale edemezsin. | Trafik artınca. |

---

## 4. PWA Konusu

- **Monolit PWA’yı engellemez.** Next.js ile PWA (Service Worker, manifest, offline) eklenebilir; backend/frontend ayrımı gerekmez.
- Projede şu an PWA konfigürasyonu (manifest, `next-pwa`, Service Worker) yok; eklenmesi 1–2 günlük iş olarak değerlendirilebilir.
- **Native mobil uygulama** (React Native / Flutter) kararı verilirse, API’nin frontend’den bağımsız olması gerekir; o noktada backend ayrıştırması gündeme gelir.

---

## 5. Puppeteer (PDF) — En Riskli Parça

### 5.1 Projede Puppeteer Ne Yapıyor?

- **Puppeteer:** Headless Chromium ile HTML/CSS’i render edip PDF çıktısı alan kütüphane.
- **KidStoryBook’ta kullanım:**
  - Kullanıcı “PDF indir” dediğinde `POST /api/books/[id]/generate-pdf` tetiklenir.
  - `lib/pdf/generator.ts` içindeki `generateBookPDF()`:
    - `puppeteer.launch()` ile **yeni bir Chromium process** açar,
    - Kitap verisinden üretilen HTML’i bu tarayıcıda açar,
    - Görseller yüklenene kadar bekler (navigation timeout 120 saniyeye kadar),
    - `page.pdf()` ile PDF üretir, buffer döner, tarayıcıyı kapatır.
  - PDF S3’e yüklenir, kullanıcıya link dönülür.

Yani Puppeteer = “Kitap HTML’ini gerçek bir tarayıcıda açıp PDF’e basan” motor.

### 5.2 Neden Riskli?

- **Bellek:** Her `puppeteer.launch()` bir Chromium process açar; process başına ~150–400 MB RAM.
- **CPU:** HTML render + PDF yazma yoğun; aynı makinede çalışan Next.js yanıtları etkilenir.
- **Bloklama:** PDF üretimi 30–120 saniye sürebilir; bu süre boyunca ilgili API isteği ve aynı Node process’teki diğer işler etkilenir.
- **Eşzamanlı kullanım:** 2–3 kullanıcı aynı anda PDF üretirse 2–3 Chromium aynı anda açılır → RAM/CPU spike → site donabilir veya 502/503.

### 5.3 “Puppeteer’ı Ayırmak” Ne Demek?

- **Şu an:** PDF üretimi Next.js sunucusunun içinde, aynı process’te çalışıyor.
- **Ayırma:** PDF üretimini **ayrı bir servise** (veya kuyruk + worker’a) taşımak.
  - Next.js, PDF üretmek için kendi içinde `puppeteer.launch()` çağırmak yerine ayrı bir servise HTTP isteği atar (örn. `POST https://pdf-service/generate`).
  - PDF servisi sadece Puppeteer ile PDF üretir; isteğe bağlı olarak kuyruk ile tek seferde tek PDF üretilir.

Böylece Chromium yükü ana uygulama process’inden çıkar; “en riskli parça” ana uygulamayı doğrudan çökertme riskini azaltır.

---

## 6. Ne Zaman Backend/Frontend Ayırmak Gerekir?

Aşağıdaki senaryolardan **biri veya birkaçı** geçerli olduğunda ayırma gündeme alınmalı:

- **Yüksek trafik / scaling:** AI ve PDF işleri aynı process’i tıkıyorsa; AI/PDF ayrı worker veya servis olarak çıkarılmalı.
- **Native mobil uygulama:** React Native / Flutter ile uygulama yapılacaksa backend’in bağımsız API olması gerekir (NextAuth session’ı JWT’ye uyumlu kullanılabilir).
- **Ekip büyümesi:** Ayrı frontend ve backend geliştiricileri çalışacaksa, monolitik repo çakışma ve sorumluluk sınırları açısından zorlaşır.
- **Farklı teknoloji ihtiyacı:** Backend’de örn. Python/FastAPI (ML pipeline) kullanılacaksa ayrıştırma zorunlu hale gelir.

---

## 7. Ayırma İşi Ne Kadar Zor?

### Kolaylaştıran Faktörler

- `lib/db/`, `lib/ai/`, `lib/storage/`, `lib/tts/`, `lib/pdf/` zaten modüler; Next.js’e özel değiller.
- API handler’lar sadece `req/res` kullanıyor; bu katmanlar Express/Fastify vb. ile taşınabilir.
- Auth zaten JWT tabanlı; stateless API’ye uyumlu.

### Zorluk Kaynakları

- **next-auth session:** API tarafında JWT/stateless auth’a geçiş (zaten JWT kullanılıyorsa orta seviye).
- **CORS:** Ayrı frontend domain’i için backend’de CORS yapılandırması (kolay).
- **Env:** İki proje için ortam değişkenlerinin bölünmesi (kolay).
- **Puppeteer’ı ayrı servise taşımak:** En anlamlı ve en çok emek gerektiren adım; bellek/izolasyon açısından faydası büyük.

### Kademeli Yol Haritası (Öneri)

1. **Şimdi (monoliti koruyarak):**
   - PWA ekle (next-pwa + manifest); monolite dokunmadan.
   - **Puppeteer’ı ayır:** PDF üretimini ayrı bir Node.js servisine taşı; Next.js API’si HTTP ile bu servisi çağırsın.
   - Görsel üretim kuyruğunu (mevcut queue) tam bağımsız worker’a dönüştür (BullMQ + Redis vb.).
2. **6–12 ay sonra (ihtiyaca göre):**
   - Trafik artarsa backend’i Express/Fastify + PostgreSQL olarak ayır; frontend Next.js (SSR/SEO) kalsın.
   - Native mobil uygulama kararı verilirse API’yi CORS ve JWT ile hazır hale getir.
3. **Yapılmaması önerilen:** Aceleyle tüm backend’i ayırmak (şu an için net kazanç yok); frontend’i SPA’ya çevirip Next.js SSR/SEO’dan vazgeçmek.

---

## 8. Sonuç Tablosu

| Konu | Özet |
|------|------|
| Monolit şu an sorun mu? | Hayır; büyüyünce ve eşzamanlı PDF/AI yükü artınca risk artar. |
| PWA için sorun var mı? | Hayır; monolit içinde PWA eklenebilir. |
| Ayırmak gerekli mi? | Şu an zorunlu değil; kademeli (önce PDF/AI worker) mantıklı. |
| Ayırma zor mu? | Orta; mevcut `lib/` yapısı taşınabilir. |
| İlk odaklanılacak | **Puppeteer (PDF)** — ayrı servis veya worker’a taşınması en kritik iyileştirme. |

---

## 9. İlgili Dosyalar

- **Mimari genel:** `docs/ARCHITECTURE.md`
- **PDF teknik detay:** `docs/guides/PDF_GENERATION_GUIDE.md`
- **Kod:** `lib/pdf/generator.ts`, `app/api/books/[id]/generate-pdf/route.ts`

Bu doküman ileride “Backend/Frontend ayıralım mı?”, “Puppeteer’ı neden ayırmalıyız?” veya “PWA monoliti bozar mı?” sorularına referans olarak kullanılabilir.
