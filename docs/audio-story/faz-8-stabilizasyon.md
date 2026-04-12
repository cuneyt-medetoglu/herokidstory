# Faz 8 — Sesli Hikaye: Stabilizasyon & Mimari Düzeltme

**Tarih:** 2026-04-12  
**Durum:** ✅ Tamamlandı  
**Bağımlılık:** Faz 7 (tamamlandı)  
**Tetikleyen:** Faz 7 sonrası test — `ffprobe ENOENT`, çift adım gösterimi, CTA semantik karışıklığı, regenerate'in worker dışı çalışması

---

## Sorun Analizi

| # | Sorun | Etki | Kök Neden |
|---|-------|------|-----------|
| 1 | `spawn ffprobe ENOENT` — sesli hikaye yerelde (ve potansiyel olarak prod'da) her seferinde fail | Sesli Hikaye hiçbir kitapta oluşmuyor | `ffprobe` için `FFPROBE_PATH` env desteği yok; hardcoded `"ffprobe"` |
| 2 | "Dinle" butonu `idle`/`failed` kitaplarda da görünüyor ve tıklanınca regenerate başlatıyor | Kullanıcı playback bekliyor, üretim tetikleniyor | CTA semantiği `ready` / `idle` / `failed` ayrıştırılmamış |
| 3 | Regenerate işi API request içinde fire-and-forget async ile çalışıyor | Restart/timeout'ta yarım kalır; worker'la tutarsız | `POST /audio-story/regenerate` worker yerine kendi içinde `generateBookVideo()` çağırıyor |
| 4 | Progress UI'da "Sesli anlatım" ve "Sesli hikaye oluşturuluyor" iki ayrı satır | Kullanıcıya aynı şey iki kez söyleniyor | TTS ve video ayrı step olarak UI'a yansıtılıyor |
| 5 | Progress yüzdesi geri atlıyor (TTS %92 → video %90) | UI'da kafa karıştırıcı geri sıçrama | TTS `80+12=92`, video hard-reset `90` |

---

## Çözüm Planı

### A — `ffprobe` Bağımlılığı (`generate-video.ts`)

| # | Görev | Durum |
|---|--------|-------|
| A1 | `FFPROBE_PATH` env desteği ekle (`FFMPEG_PATH` pattern'ıyla aynı) | ☑ |
| A2 | `.env.example`'a `FFPROBE_PATH` + `FFMPEG_PATH` ekle, yorumla | ☑ |
| A3 | Pipeline başında `ffmpeg`/`ffprobe` varlık kontrolü: bulunamazsa anlamlı log + hata fırlat | ☑ |

**Risk:** Düşük — tek dosya (`generate-video.ts`) + env  
**Tahmini süre:** 15 dk

---

### B — CTA Ayrımı: `Dinle` vs `Hazırla` / `Yeniden Oluştur`

| # | Görev | Durum |
|---|--------|-------|
| B1 | `book-viewer.tsx`: **`Dinle`** butonu sadece `audio_story_status === 'ready'` iken gösterilir; tıklayınca doğrudan VideoPlayer açılır | ☑ |
| B2 | `book-viewer.tsx`: **`Sesli Hikaye Hazırla`** butonu `idle` durumunda gösterilir (farklı renk/ikon); tıklayınca regenerate API'sini çağırır, sonra spinner'a geçer | ☑ |
| B3 | `book-viewer.tsx`: **`Yeniden Oluştur`** butonu `failed` durumunda gösterilir (uyarı tonu); tıklayınca aynı regenerate API'sini çağırır | ☑ |
| B4 | `book-viewer.tsx`: `generating` durumunda tüm CTA'lar disabled, spinner gösterilir | ☑ |
| B5 | Dashboard'da aynı mantık: `ready` → Dinle, `generating` → spinner, `idle`/`failed` → Hazırla/Yeniden Oluştur | ☑ |
| B6 | `messages/tr.json` + `messages/en.json`: yeni CTA metinleri (`prepareAudioStory`, `retryAudioStory`) | ☑ |

**Risk:** Düşük — UI değişikliği  
**Tahmini süre:** 30 dk

---

### C — Regenerate'i Worker'a Taşı

| # | Görev | Durum |
|---|--------|-------|
| C1 | `lib/queue/client.ts`: `AudioStoryJobData` interface + `enqueueAudioStoryRegenerate()` helper ekle | ☑ |
| C2 | `lib/queue/workers/book-generation.worker.ts`: yeni job tipi `regenerate-audio-story` dinle; DB'den kitabı oku, TTS eksikse üret, sonra `generateBookVideo()` çalıştır | ☑ |
| C3 | `POST /api/books/[id]/audio-story/regenerate`: fire-and-forget async kaldırıldı; sadece `markAudioStoryGenerating()` + `enqueueAudioStoryRegenerate()` çağırıyor, 202 dönüyor | ☑ |
| C4 | Worker `processAudioStoryRegenerate()` tamamlanınca: `markAudioStoryReady()` çağırılıyor | ☑ |
| C5 | Worker `failed` callback'inde: `markAudioStoryFailed()` çağırılıyor | ☑ |

**Risk:** Orta — worker'a yeni job tipi ekleniyor  
**Tahmini süre:** 1–2 saat

---

### D — Progress UI Sadeleştirme

| # | Görev | Durum |
|---|--------|-------|
| D1 | `generating/[bookId]/page.tsx` STEPS: `tts_generating` satırı kaldırıldı; `video_generating` label `"Sesli hikaye hazırlanıyor"`, threshold 100 | ☑ |
| D2 | `payment/success/page.tsx` STEPS: aynı değişiklik uygulandı | ☑ |
| D3 | `useBookGenerationStatus.ts` `getStepLabel`: `tts_generating` / `video_generating` / `watch_preparing` hepsi "Sesli hikaye hazırlanıyor..." | ☑ |
| D4 | `image-pipeline.ts`: TTS span 80→89 (video 90'da başlar — geri sıçrama yok), step `video_generating` olarak raporlanıyor | ☑ |

**Risk:** Düşük — label ve yüzde değişikliği  
**Tahmini süre:** 20 dk

---

## Uygulama Sırası

```
A (ffprobe fix)  →  C (worker-based regenerate)  →  B (CTA ayrımı)  →  D (progress sadeleştirme)
```

**A** en kritik: bu olmadan sesli hikaye hiçbir ortamda çalışmaz.  
**C** mimari düzeltme: A'dan sonra test edilebilir.  
**B** ve **D** UI — C'nin üstüne binebilir, paralel de yapılabilir.

---

## Başarı Kriterleri

- [ ] `npm run deploy:local` + `npm run dev:worker` ile kitap oluşturduktan sonra Sesli Hikaye otomatik hazır
- [ ] `Dinle` butonu sadece `ready` iken görünür ve tek tıkla video oynatır
- [ ] `idle` kitaplarda `Sesli Hikaye Hazırla` butonu görünür; tıklayınca worker'a iş düşer
- [ ] `failed` kitaplarda `Yeniden Oluştur` butonu görünür
- [ ] Progress ekranında tek "Sesli hikaye hazırlanıyor" satırı var
- [ ] Worker terminalinde tüm TTS + video logları görünür (app terminalinde değil)
- [ ] `ffprobe` ve `ffmpeg` yoksa anlamlı hata logu + kitap yine `completed` olur

---

## ROADMAP ile ilişki

Ana tablo: [ROADMAP.md](./ROADMAP.md) — Faz 8 satırı eklenecek.  
Bu faz, Faz 7'de kurulan mimariyi stabilize eder ve ürün davranışını kullanıcı beklentisiyle hizalar.
