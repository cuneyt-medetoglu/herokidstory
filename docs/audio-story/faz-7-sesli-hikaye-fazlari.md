# Faz 7 — Sesli Hikaye (İsimlendirme, Mimari, Temizlik, Performans)

**Tarih:** 2026-04-11  
**Durum:** Faz 7-A ✅ | Faz 7-B ✅ | Faz 7-C ✅ | Faz 7-D ✅ Tümü Tamamlandı  
**Bağımlılık:** Faz 5 (MP4 pipeline), Faz 6 (opsiyonel — prod deploy)  
**İlgili analiz:** [code-review-v1.md](./code-review-v1.md)

Bu doküman, kullanıcı onayıyla uygulanacak **alt fazları** (A → B → C → D) takip etmek içindir. Her alt faz tamamlandığında aşağıdaki kutuları işaretleyin.

---

## Amaç

- Ürün dilinde **"Video"** yerine **"Sesli Hikaye"** (EN: **Audio Story**).
- Yeni kitaplarda sesli hikaye **satın alma / oluşturma sonunda bir kez** üretilir; kullanıcı hep aynı dosyayı kullanır.
- İleride **kitap düzenleme + "Yeniden oluştur"** için altyapı: versiyon + durum + API.

**Not:** Eski kitaplar (önceden oluşturulmuş, `video_url` yok) bu planda öncelik dışı; odak yeni kitaplar.

---

## Bağımlılık sırası

```
Faz 7-A (İsimlendirme)  →  Faz 7-B (Mimari + regenerate)  →  Faz 7-C (DOM temizlik)  →  Faz 7-D (Performans + güvenlik)
```

**Minimum değerli sürüm:** A + B. C ve D ikinci turda da yapılabilir.

---

## Faz 7-A — İsimlendirme: "Sesli Hikaye"

**Risk:** Düşük (çoğunlukla metin ve URL parametresi)  
**Tahmini süre:** 1–2 saat

| # | Görev | Durum |
|---|--------|-------|
| A1 | `messages/tr.json`: `watchMode` → "Dinle"; `watchModeLoading` → "Sesli hikaye hazırlanıyor..."; `watchModeLabel` → "Sesli hikaye" | ☑ |
| A2 | `messages/en.json`: "Listen"; "Preparing audio story..."; "Audio story" | ☑ |
| A3 | Oluşturma adımı: "Sesli hikaye oluşturuluyor" (tr/en, `stepVideo`, `useBookGenerationStatus`, `generating` page) | ☑ |
| A4 | Dashboard + BookViewer: Headphones ikonu + `t("watch")` → "Sesli Hikaye" / "Audio Story" | ☑ |
| A5 | URL: `?mode=audio-story` (yeni); `?mode=watch` geriye uyumlu kabul ediliyor | ☑ |

---

## Faz 7-B — "Bir kere üret" + düzenleme / yeniden oluştur altyapısı

**Risk:** Orta (migration + pipeline + API)  
**Tahmini süre:** 4–6 saat

### B1 — Veritabanı

Migration: `036_books_audio_story.sql`

| Kolon | Açıklama |
|-------|----------|
| `audio_story_status` | `idle` \| `generating` \| `ready` \| `failed` |
| `audio_story_version` | Her başarılı üretimde artar (yeniden oluşturma için) |
| `audio_story_generated_at` | Son başarılı üretim zamanı |

| # | Görev | Durum |
|---|--------|-------|
| B1 | Migration dosyası + kolonlar (`036_books_audio_story.sql`) | ☑ |
| B2 | `lib/db/books.ts`: `Book`, `UpdateBookInput`, `markAudioStory*` fonksiyonları | ☑ |

### B2 — Pipeline

| # | Görev | Durum |
|---|--------|-------|
| B3 | Sesli hikaye encode başında: `markAudioStoryGenerating()` | ☑ |
| B4 | Başarıda: `markAudioStoryReady()` — `version += 1`, `generated_at`, `video_url` / `video_path` | ☑ |
| B5 | Hata: `markAudioStoryFailed()` — kitap yine `completed` olabilir | ☑ |

### B3 — API (gelecekteki "Düzenle → Yenile")

| # | Görev | Durum |
|---|--------|-------|
| B6 | `POST /api/books/[id]/audio-story/regenerate` — sahip kontrolü; `generating` iken 409; arka planda üretim | ☑ |
| B7 | Response: `{ status, version }` — 202 Accepted | ☑ |

### B4 — Frontend

| # | Görev | Durum |
|---|--------|-------|
| B8 | BookViewer: `audio_story_status` → buton (`ready`=Dinle, `generating`=spinner, diğerleri=gizli) | ☑ |
| B9 | Dashboard: `audioStoryStatus` → buton / spinner rozeti | ☑ |

---

## Faz 7-C — DOM fallback temizliği

**Risk:** Düşük (eski kitaplar öncelik dışı)  
**Tahmini süre:** 2–3 saat

Yeni akış: `ready` + `video_url` → doğrudan oynatıcı; **TTS + timeline ile hazırlık** buton tıklamasında olmamalı.

| # | Görev | Durum |
|---|--------|-------|
| C1 | `book-viewer.tsx`: `useReadAlong` / `ReadAlongPlayer` import + tüm DOM fallback akışı kaldırıldı | ☑ |
| C2 | `hooks/useReadAlong.ts` — silindi | ☑ |
| C3 | `ReadAlongPlayer`, `KaraokeOverlay`, `MotionLayer` — silindi; `components/read-along/` klasörü boş | ☑ |
| C4 | `hooks/useKaraokeSync.ts` — silindi | ☑ |
| C5 | `app/api/read-along/timeline/route.ts` — frontend kullanımı kalktığı için silindi | ☑ |

---

## Faz 7-D — Pipeline ve oynatıcı: performans + güvenlik

**Risk:** Düşük–orta  
**Tahmini süre:** 2–3 saat

| # | Görev | Durum |
|---|--------|-------|
| D1 | `generate-video.ts`: 3 eşzamanlı encode (`ENCODE_CONCURRENCY=3`, sliding window) | ☑ |
| D2 | `read-along/timeline` API: Faz 7-C'de silindi (artık gerekli değil) | ☑ |
| D3 | Signed URL: `GET /api/books/[id]/audio-story/url` + `VideoPlayer bookId` prop | ☑ |
| D4 | `useKaraokeSync` cleanup: Faz 7-C'de silindi | ☑ |
| D5 | VideoPlayer UX: pause=kontroller sabit; video bitti=Replay ikonu; seekbar touch desteği | ☑ |

---

## Takip özeti

| Alt faz | Kısa ad | Bağımlılık | Durum |
|---------|---------|-------------|-------|
| 7-A | İsimlendirme | — | ✅ Tamamlandı |
| 7-B | DB + pipeline + regenerate API + UI | 7-A | ✅ Tamamlandı |
| 7-C | DOM temizlik | 7-B | ✅ Tamamlandı |
| 7-D | Performans + güvenlik | 7-B | ✅ Tamamlandı |

---

## ROADMAP ile ilişki

Ana tablo: [ROADMAP.md](./ROADMAP.md) — Faz 7 satırı bu dosyaya bağlanır.  
Faz 6 (production deploy) bu alt fazlardan **bağımsız** yürütülebilir; ancak gerçek ortamda test için Faz 6'nın tamamlanması faydalıdır.

---

## Onay notu

Bu dokümandaki maddeler **kullanıcı onayından sonra** kodda uygulanır. Onay öncesi sadece plan güncellenir.
