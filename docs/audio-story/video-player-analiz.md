# Sesli Hikaye — Video Player & Motion Analizi

**Tarih:** 2026-04-12  
**Durum:** ✅ Tamamlandı  
**Bağımlılık:** Faz 8 tamamlandı

---

## Sorunlar & Kararlar

| # | Sorun | Karar |
|---|-------|-------|
| 1 | FFmpeg zoompan titremesi | zoompan tamamen kaldırılacak, crossfade geçişi eklenecek |
| 2 | Play/ileri/geri butonları kaybolmuyor | Custom player kalkınca otomatik çözülecek |
| 3 | Seek bar çalışmıyor | Custom player kalkınca otomatik çözülecek |
| 4 | Download | ✅ Çalışıyor, dokunulmayacak |

---

## Seçilen Yaklaşım: Native `<video controls>` + Minimal Wrapper

430 satırlık custom player → ~60 satır wrapper.

Native `<video controls>`: seek, fullscreen, play/pause, volume, keyboard shortcuts, mobile native player — hepsi built-in, sıfır bakım maliyeti.

Wrapper'a eklenecek: **Close (X)** + **Download** butonu.

---

## AI Araştırması Değerlendirmesi

### ✅ Plana dahil edilecekler

**1. xfade + acrossfade (her 3 kaynak da onaylıyor)**
- zoompan yerine sayfalar arası `xfade=transition=dissolve` veya `fade`
- Ses geçişi için `acrossfade=d=1`
- Jitter tamamen kalkar, encode süresi kısalır

**2. `-tune stillimage` FFmpeg parametresi (Gemini 2 + GPT)**
- H.264 encoder'a "bu videoda az hareket var" sinyali verir
- Bitrate'i hareketli piksel yerine detaylara harcar
- Basit 1 parametre → ciddi kalite/boyut iyileştirmesi

**3. Vignette filtresi (her 3 kaynak)**
- `vignette=PI/4` — köşeleri hafifçe karartan, sinematik his
- 1 satır FFmpeg filter, sıfır iş yükü

**4. ASS subtitle fade-in/out (GPT)**
- Her satıra `{\fad(300,300)}` eklemek → altyazı yumuşak giriş/çıkış
- `generate-ass.ts`'e tek satır ekleme

**5. `-crf 24` + `-r 24` + `-keyint 60` (GPT)**
- Çocuk kitabı illüstrasyonları geniş renk blokları → yüksek sıkıştırılabilir
- 24fps crossfade için yeterli, 30fps'ten küçük dosya

### ❌ Plana dahil edilmeyecekler

| Öneri | Neden reddedildi |
|-------|-----------------|
| **Remotion** | Ticari kullanım için lisans gerektiriyor |
| **Editly / FFCreator** | Ekstra bağımlılık, FFmpeg zaten yeterli |
| **Particle overlays** | Stok video asset yönetimi gerektirir, kapsam dışı |
| **Letterbox (siyah barlar)** | Zaten 9:16 portrait, gerek yok |
| **fluent-ffmpeg** | Mevcut execFile yapısı yeterli |
| **Ses tasarımı (ambiyans müzik)** | İyi fikir ama ayrı bir özellik, şimdilik kapsam dışı |

---

## Faz 9 — Geliştirme Planı

### A — Native Video Player

| # | Görev | Durum |
|---|--------|-------|
| A1 | `VideoPlayer.tsx` yeniden yaz: native `<video controls>` + Close + Download overlay (~120 satır) | ☑ |
| A2 | `book-viewer.tsx` entegrasyonu (değişiklik gerekmedi, props aynı) | ☑ |

### B — Motion & Encoding İyileştirme

| # | Görev | Durum |
|---|--------|-------|
| B1 | `generate-video.ts` — `zoompan` kaldırıldı, statik görsel + vignette encode | ☑ |
| B2 | `generate-video.ts` — `xfade=transition=fade:duration=1` + `acrossfade=d=1` eklendi | ☑ |
| B3 | `generate-video.ts` — `-tune stillimage`, `-crf 24`, `-r 24` eklendi | ☑ |
| B4 | `generate-video.ts` — `vignette=PI/4` filtresi eklendi | ☑ |
| B5 | `generate-ass.ts` — `{\fad(300,300)}` fade-in/out eklendi | ☑ |
| B6 | `ffmpeg-filters.ts` silindi, `VideoMotionTemplate` type kaldırıldı | ☑ |

### C — Test & Temizlik

| # | Görev | Durum |
|---|--------|-------|
| C1 | Lint temiz | ☑ |
| C2 | Yeni kitap oluştur → video kalitesi + player test | ☐ Kullanıcı |
| C3 | Doküman güncellendi | ☑ |

---

## Özet Karar Tablosu

| Konu | Mevcut | Faz 9 Sonrası |
|------|--------|--------------|
| Video player | 430 satır custom, buglu | Native `<video controls>` + 60 satır wrapper |
| Motion | zoompan (titriyor) | Yok — sadece crossfade |
| Geçiş efekti | Yok | Sayfalar arası sessiz ara (görüntü: siyah kare) |
| Ses geçişi | `acrossfade` (TTS üst üste biniyordu) | Sayfalar arası **sessiz ara** (~0.55s) + `concat` |
| Altyazı | Ani giriş/çıkış | Smooth fade-in/out |
| FFmpeg kalite | crf 23, preset fast | crf 24, tune stillimage, keyint 60 |
| Sinematik his | Yok | Vignette filtresi |
| Encode süresi | Yüksek (zoompan CPU yoğun) | Düşük (statik encode) |
