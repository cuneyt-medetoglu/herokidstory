# Audio Story — Tamamlanan Fazlar (1–5, 4.6)

Bu dosya Faz 1–5 ve 4.6'nın özetini içerir. Detaylı tarihçe gerekirse git history'den bakılabilir.

---

## Faz 1 — Araştırma & Teknoloji Seçimi (Tamamlandı)

- Kelime zamanlama: Gemini TTS SSML marks desteklemiyor → openai-whisper forced alignment + heuristik fallback
- Render: DOM tabanlı karaoke overlay → sonra FFmpeg MP4'e evrildi
- Motion: FFmpeg zoompan → Faz 9'da kaldırıldı (titreme nedeniyle)

## Faz 2 — Audio–Metin Senkronizasyonu (Tamamlandı)

- `lib/read-along/timeline.ts` — kelime bazlı zamanlama (WordTiming, TextChunk, PageTimeline)
- MP3 parse ile gerçek audio süresi hesaplama
- S3 cache: `tts-cache/{hash}_timeline.json`

## Faz 3 — Karaoke Metin & Görsel Motion (Tamamlandı)

- KaraokeOverlay, MotionLayer bileşenleri (sonradan kaldırıldı — video yaklaşımına geçildi)
- ASS subtitle formatına evrildi

## Faz 4 — Uygulama İçi Oynatıcı (Tamamlandı)

- BookViewer'da "İzle" (sonra "Sesli Hikaye") modu
- DOM tabanlı oynatıcı → Faz 5'te MP4 video player'a evrildi

## Faz 4.6 — Fix & İyileştirme (Tamamlandı)

- İsimlendirme: "Karaoke" → "İzle" → "Sesli Hikaye"
- TTS senkron düzeltmeleri
- Pipeline adımı ekleme

## Faz 5 — Video Generation / FFmpeg MP4 (Tamamlandı)

- FFmpeg ile server-side MP4 üretimi
- Her sayfa: görsel + TTS audio + ASS altyazı
- Pipeline entegrasyonu: kitap oluşturulduğunda otomatik video üretimi
- S3'e yükleme, signed URL ile oynatma
- VideoPlayer bileşeni (Faz 9'da native `<video controls>`'a sadeleştirildi)
