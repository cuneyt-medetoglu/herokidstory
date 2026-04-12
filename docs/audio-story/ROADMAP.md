# Audio Story (Sesli Hikaye) — Yol Haritası

**Tarih:** 2026-04-12  
**Durum:** Faz 9 tamamlandı  
**Agent:** `.cursor/rules/audio-story-manager.mdc`

---

## Ne yapıyoruz?

Mevcut hikaye görselleri + TTS sesleri üzerinden otomatik **MP4 video** üretiyoruz: statik illüstrasyon + sesli anlatım + altyazı.

**Girdi:** Sayfa görseli (PNG) + TTS ses (MP3)  
**Çıktı:** MP4 video — statik kare + vignette + altyazı fade + sayfalar arası sessiz geçiş

---

## Fazlar

| # | Faz | Durum | Doküman |
|---|-----|-------|---------|
| 1–5 | Araştırma, Senkronizasyon, Motion, Oynatıcı, Video Gen | ✅ Tamamlandı | [completed-phases.md](./completed-phases.md) |
| 6 | Production Deploy | Beklemede | [faz-6-production-deploy.md](./faz-6-production-deploy.md) |
| 7 | Sesli Hikaye (isimlendirme, mimari, temizlik) | ✅ Tamamlandı | [faz-7-sesli-hikaye-fazlari.md](./faz-7-sesli-hikaye-fazlari.md) |
| 8 | Stabilizasyon (ffprobe, CTA, worker, progress) | ✅ Tamamlandı | [faz-8-stabilizasyon.md](./faz-8-stabilizasyon.md) |
| 9 | Native Player & Crossfade | ✅ Tamamlandı | [video-player-analiz.md](./video-player-analiz.md) |

---

## Mevcut Altyapı

| Bileşen | Konum |
|---------|-------|
| TTS ses üretimi (Google Cloud) | `lib/tts/` |
| Timeline (kelime zamanlama) | `lib/read-along/timeline.ts` |
| ASS altyazı üretimi | `lib/video/generate-ass.ts` |
| Video üretimi (FFmpeg) | `lib/video/generate-video.ts` |
| Video player (native) | `components/video/VideoPlayer.tsx` |
| Pipeline entegrasyonu | `lib/book-generation/image-pipeline.ts` |
| DB: audio_story_status | `migrations/036_books_audio_story.sql` |
| Worker: regenerate job | `lib/queue/workers/book-generation.worker.ts` |

---

## Referanslar

- [Kod inceleme raporu](./code-review-v1.md)
- [Video player & motion analizi](./video-player-analiz.md)

---

## Kapsam Dışı

- Generative video (Veo, Sora vb.)
- Kullanıcının kendi sesiyle okuma
- Ambiyans müzik / ses efektleri (ayrı özellik olarak değerlendirilebilir)
