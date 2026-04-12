# Sesli Hikaye — Doküman & UI Temizlik Planı

**Tarih:** 2026-04-12  
**Durum:** ✅ Tamamlandı

---

## Faz 1: Dokümantasyon Temizliği ✅

| # | Görev | Durum |
|---|--------|-------|
| 1.1 | Klasör rename: `docs/read-along-karaoke/` → `docs/audio-story/` | ☑ |
| 1.2 | Taslak fazlar silindi: faz-4.5 (beklemede), faz-4.7 (superseded) | ☑ |
| 1.3 | Tamamlanan fazlar birleştirildi: faz-1..5, 4.6 → `completed-phases.md` | ☑ |
| 1.4 | ROADMAP.md güncellendi (yeni yollar, temiz format) | ☑ |
| 1.5 | Agent: `read-along-karaoke-manager.mdc` → `audio-story-manager.mdc` | ☑ |
| 1.6 | Eski analysis dokümanında yönlendirme güncellendi | ☑ |

## Faz 2: Dashboard UI ✅

| # | Görev | Durum |
|---|--------|-------|
| 2.1 | Download → DropdownMenu: "PDF İndir" / "Sesli Hikaye İndir (MP4)" | ☑ |
| 2.2 | Trash (silme) ikonu kart alt barından kaldırıldı | ☑ |
| 2.3 | Video download handler eklendi (blob fetch) | ☑ |
| 2.4 | i18n mesajları güncellendi (tr + en) | ☑ |

## Faz 3: Kalan Eksikler

| # | Konu | Öncelik | Not |
|---|------|---------|-----|
| 1 | **Faz 6: Production Deploy** | — | ✅ Tamamlandı (senin tarafında) |
| 2 | **Kitap silme: settings sayfasına taşıma** | Orta | Dashboard'dan kaldırıldı; settings sayfasında zaten mevcut olmalı — doğrulanacak |
| 3 | **Ambient ses / müzik** | Düşük | Gemini önerisi: TTS arkasına hafif ambiyans. Ayrı özellik |
| 4 | **Particle overlay / light leak** | Düşük | Gemini önerisi: stok video asset gerektirir. Ayrı özellik |
| 5 | **Remotion veya benzeri sub-pixel motion** | Düşük | Profesyonel zoom/pan isterse. Ticari lisans gerekli |
