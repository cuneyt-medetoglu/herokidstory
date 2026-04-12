# Sesli Hikaye / İzle-Dinle — Kod İnceleme Raporu

**Tarih:** 2026-04-11  
**Kapsam:** `lib/read-along/`, `lib/video/`, `components/read-along/`, `components/video/`, `hooks/useReadAlong.ts`, `hooks/useKaraokeSync.ts`, `book-viewer.tsx`

**Uygulama planı (faz takibi):** [faz-7-sesli-hikaye-fazlari.md](./faz-7-sesli-hikaye-fazlari.md) — ROADMAP’ta **Faz 7**.

---

## 1. Genel Mimari Değerlendirmesi

### Katmanlı Yapı (İyi)

```
lib/read-along/          → Core iş mantığı (server-side)
  types.ts               → Shared tip tanımları
  timeline.ts            → Orchestrator: cache + strategy selection
  timeline-heuristic.ts  → Heuristic word timing
  timeline-whisper.ts    → Whisper forced alignment
  chunker.ts             → Word → chunk gruplama

lib/video/               → FFmpeg video üretimi (server-side)
  types.ts               → Video-specific tipler
  ffmpeg-filters.ts      → Motion template → zoompan filter
  generate-ass.ts        → Timeline → ASS subtitle
  generate-video.ts      → Orchestrator: encode + concat + S3

components/read-along/   → DOM-based fallback oynatıcı
  ReadAlongPlayer.tsx    → Tam ekran oynatıcı
  KaraokeOverlay.tsx     → Metin vurgu overlay
  MotionLayer.tsx        → Framer Motion hareket

components/video/        → Pre-generated video oynatıcı
  VideoPlayer.tsx        → HTML5 <video> player

hooks/
  useReadAlong.ts        → TTS + Timeline fetch orchestration
  useKaraokeSync.ts      → Audio ↔ Chunk sync (rAF tabanlı)
```

**Yorum:** Dosya ayrımı iyi yapılmış. Her modül tek sorumluluk prensibi (SRP) izliyor. `types.ts` dosyasının shared olması doğru.

---

## 2. İyi Olan Taraflar

### a) Timeline Engine (`lib/read-along/`)
- **Strategy pattern:** Whisper ↔ Heuristic otomatik fallback — sağlam
- **Heuristic kalitesi:** Karakter ağırlığı + noktalama durakları → uniform split'ten çok daha iyi
- **MP3 frame parser:** Native, bağımlılığı yok, doğru süre hesabı
- **S3 cache katmanı:** Hash bazlı cache → tekrar hesaplama önlenir (ama sorun var, bkz. #3)
- **Chunker:** Cümle/virgül sınırlarını, kelime uzaklığını, hedef boyutu dikkate alıyor

### b) Video Pipeline (`lib/video/`)
- **Separation of concerns:** ASS, FFmpeg filter, orchestrator ayrı dosyalar
- **Temp directory + cleanup:** `finally` bloğunda temizlik — güvenli
- **Per-page → concat:** Doğru yaklaşım; paralel encode potansiyeli var
- **Motion variety:** 3 farklı template + döngüsel uygulama — görsel tekrar azaltılmış
- **Progress callback:** Pipeline'a entegre, UI'a yansıyor

### c) Karaoke Sync (`useKaraokeSync`)
- **requestAnimationFrame:** `setInterval`'den çok daha doğru
- **Optimized re-render:** `setState` karşılaştırma ile gereksiz render önlenir
- **Chunk-level sync:** Kelime değil, chunk bazlı → daha temiz UX

### d) Genel Kod Kalitesi
- TypeScript throughout — tip güvenliği iyi
- Hook'lar `useCallback` ile memoize edilmiş
- Error handling ve fallback mekanizmaları mevcut

---

## 3. Kritik Sorunlar

### SORUN-1: `forceRefresh: true` — Timeline Her Seferinde Yeniden Oluşturuluyor

**Dosya:** `hooks/useReadAlong.ts:71`

```typescript
body: JSON.stringify({
  text: bp.text,
  audioUrl: ttsResults[i].audioUrl,
  language,
  pageNumber: bp.pageNumber || i + 1,
  forceRefresh: true,  // ← BU SATIR
}),
```

**Etki:**
- Her "İzle" tıklamasında S3'ten audio indirilip frame parse ediliyor
- Her seferinde yeni timeline JSON oluşturulup S3'e yükleniyor
- 3 sayfalık kitap → 3 audio download + 3 S3 upload = ~3-5 sn boşuna bekleme
- Logda açıkça görünüyor: `FORCE REFRESH — skipping cache`

**Kök neden:** Bu flag eski bir debug/fix döneminden kalmış. Timeline artık heuristic ile doğru çalışıyor, forceRefresh gereksiz.

**Çözüm:** `forceRefresh: false` yapılmalı. Ya da daha iyisi: bu parametre tamamen kaldırılmalı ve `useReadAlong` sadece video olmayan kitaplar için çalışmalı.

---

### SORUN-2: Video Olmayan Kitaplarda DOM Fallback Hâlâ TTS + Timeline İstiyor

**Dosya:** `hooks/useReadAlong.ts:47-57`

Kitabın `video_url`'si yoksa, `useReadAlong.prepare()` çağrılıyor. Bu:
1. `/api/tts/generate` × N sayfa (TTS cache hit olsa bile roundtrip)
2. `/api/read-along/timeline` × N sayfa (forceRefresh + audio download)

Mevcut kitaplar video_url'siz olduğu için her "İzle" tıklaması bu döngüyü başlatıyor.

**Çözüm:** Timeline'lar kitap oluşturma sırasında pre-generate edilmeli ve book data'da saklanmalı. Yoksa minimum olarak `forceRefresh: false` yapılmalı.

---

### SORUN-3: Cache Key Tutarsızlığı

**Dosya:** `lib/read-along/timeline.ts:21`

```typescript
function timelineCacheKey(text: string, audioUrl: string, language: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(`timeline|${text}|${audioUrl}|${language}`)
    .digest("hex")
```

`audioUrl` S3 signed URL'dir → her çağrıda farklı expiry/signature → hash değişir → CACHE HER ZAMAN MISS OLUYOR.

Bu, `forceRefresh: true` ile birleşince çift sorun yaratıyor. Ama `forceRefresh: false` olsa bile signed URL değiştiği için cache yine miss olacak.

**Çözüm:** Cache key'den `audioUrl`'yi kaldırıp sadece `text + language` veya `text + audioHash` kullanmak.

---

### SORUN-4: İndirme Butonu Görünmüyor (UI Render Sırası)

**Dosya:** `components/video/VideoPlayer.tsx`

Kontroller `showControls` state'ine bağlı. Video oynarken 3 saniye sonra kontroller kayboluyor. Kullanıcı ekrana dokunduğunda geri geliyor AMA:
- Video autoplay ile başlayınca kontroller hemen kaybolabiliyor
- Mobilde dokunma `handleScreenTap` → `showControls = true` → ama hemen `hideControlsAfterDelay` çağrılıyor

Ayrıca download butonu S3 cross-origin URL kullandığı için `<a download>` çalışmayabilir — browser URL'yi yeni sekmede açar, indirmez.

**Çözüm:**
- İlk yüklemede kontroller en az 4-5 saniye görünsün
- Download için blob fetch → `URL.createObjectURL` → download trigger kullanılmalı
- Pause durumunda kontroller süresiz görünsün (zaten yapılmış ama initial state'te sorun olabilir)

---

### SORUN-5: İsimlendirme Tutarsızlığı

Kodda birden fazla terim kullanılıyor:
- `readAlong` / `read-along` / `ReadAlong`
- `karaoke` / `Karaoke`
- `watch` / `İzle`
- `video` / `Video`

Kullanıcıya dönük metin "İzle" ama kod hâlâ `ReadAlongPlayer`, `useReadAlong`, `KaraokeOverlay` kullanıyor.

---

## 4. İsim Önerileri

"Video" veya "Karaoke" yerine daha uygun isimler:

| Öneri | TR | EN | Neden |
|-------|----|----|-------|
| **Sesli Hikaye** | Sesli Hikaye | Audio Story | Basit, anlaşılır, çocuk/ebeveyn dostu |
| **Hikaye Zamanı** | Hikaye Zamanı | Story Time | Sıcak, çocuksu his |
| **Dinle & İzle** | Dinle & İzle | Listen & Watch | Açıklayıcı, fonksiyon belirten |
| **Sesli Kitap** | Sesli Kitap | Audiobook | Tanıdık kavram ama sadece ses çağrıştırıyor |
| **Canlı Hikaye** | Canlı Hikaye | Live Story | Video hissiyatı verici |

**Önerim:** "**Sesli Hikaye**" — hem sesi hem görsel deneyimi kapsıyor, ebeveynler hemen anlıyor.
Buton metni: "Sesli Hikaye" veya kısa hali "Dinle".

---

## 5. Performans İyileştirme Önerileri

### a) Video Pipeline — Paralel Encoding
`generate-video.ts` şu an sequential encode yapıyor (`for` loop). Sayfalar bağımsız → `Promise.all` veya batched paralel encode daha hızlı olur (CPU izin verdiği kadar, genelde 2-3 paralel).

### b) ReadAlongPlayer Cleanup Eksikliği
`useKaraokeSync.start()` listener'lar döndürüyor ama `ReadAlongPlayer` bu return değerini kullanmıyor → memory leak potansiyeli.

### c) MotionLayer Image Preloading
`AnimatePresence` ile sayfa geçişinde yeni sayfa Image'ı yüklenene kadar boş frame → `priority` var ama önceki sayfa cache'lenmemiş olabilir.

### d) Book Viewer — Çift API Çağrısı
Logda `GET /api/books/[id]` iki kez görünüyor (book-viewer mount + başka bir component). Single fetch + context paylaşımı daha verimli olur.

---

## 6. Güvenlik Notları

- TTS API'si rate limit kontrol edilmeli (`forceRefresh: true` ile birleşince her tıklama 3+ API çağrısı yapıyor)
- Timeline API'si auth kontrolü yok — herhangi bir text + audioUrl gönderilip timeline ürettirilabilir
- Video download URL'si public S3 URL — signed URL olmalı (mevcut implementasyonda zaten `getPublicUrl` kullanılıyor, `getSignedObjectUrl` ile değiştirilmeli)

---

## 7. Kalan İş Listesi

### Acil (Bug/UX)

| # | İş | Öncelik | İlgili Dosya |
|---|---|---------|-------------|
| 1 | `forceRefresh: false` yap veya tamamen kaldır | Kritik | `hooks/useReadAlong.ts` |
| 2 | Cache key'den signed URL kaldır (sadece text hash) | Kritik | `lib/read-along/timeline.ts` |
| 3 | Download butonu blob fetch ile çalışsın | Yüksek | `components/video/VideoPlayer.tsx` |
| 4 | İlk yüklemede kontroller daha uzun görünsün | Yüksek | `components/video/VideoPlayer.tsx` |
| 5 | ReadAlongPlayer kontrol butonları belirgin yapılsın | Yüksek | `components/read-along/ReadAlongPlayer.tsx` |

### Kısa Vadeli

| # | İş | Öncelik | İlgili Dosya |
|---|---|---------|-------------|
| 6 | İsimlendirme tutarlılığı (Sesli Hikaye / Audio Story) | Orta | Tüm `read-along`, `karaoke` referansları |
| 7 | Video pipeline paralel encoding | Orta | `lib/video/generate-video.ts` |
| 8 | Timeline API auth kontrolü | Orta | `app/api/read-along/timeline/route.ts` |
| 9 | useKaraokeSync cleanup return value kullanımı | Düşük | `components/read-along/ReadAlongPlayer.tsx` |
| 10 | Çift book API çağrısını tekile indir | Düşük | `components/book-viewer/book-viewer.tsx` |

### Orta Vadeli (Faz 6 Sonrası)

| # | İş |
|---|---|
| 11 | Eski kitaplara toplu video üretimi (backfill script) |
| 12 | Video kalite seçenekleri (480p/720p/1080p) |
| 13 | Whisper integration tamamlama (şu an heuristic-only) |
| 14 | Farklı yaş gruplarına göre chunk boyutu ayarı |
| 15 | Video önizleme/thumbnail üretimi |

---

## 8. Sonuç

**Genel Kalite:** Orta-İyi. Mimari ayrım doğru, tip güvenliği iyi, strategy pattern sağlam.

**Ana Sorun:** `forceRefresh: true` + signed URL cache key = **her tıklamada boşuna 3-5 saniye bekleme + gereksiz S3 upload**. Bu tek fix bile UX'i ciddi ölçüde iyileştirir.

**Yaklaşım doğru mu?** Evet — pre-generated MP4 video yaklaşımı doğru karar. DOM-based fallback geçici olarak kalmalı ama Faz 6 sonrası tüm kitaplarda video olacağı için DOM katmanı kademeli olarak deprecated edilebilir.
