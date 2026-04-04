# Kitap oluşturma kalitesi — kod incelemesi takip planı

**Tarih:** 4 Nisan 2026  
**Önceki / bağlantılı plan:** [`IMAGE_QUALITY_IMPROVEMENT_PLAN.md`](./IMAGE_QUALITY_IMPROVEMENT_PLAN.md) (görsel prompt ve fazlar), [`STORY_GENERATION_DEV_ROADMAP.md`](./STORY_GENERATION_DEV_ROADMAP.md)  
**Kaynak:** Harici inceleme (Claude) + repo içi doğrulama (Cursor).  
**Amaç:** Create book sürecinde **kaliteyi korumak ve artırmak**; süreçte **hatalı, çelişkili veya gereksiz** kalan yerleri **toparlamak**. Bu dosya yol haritasıdır; **kod değişikliği** ayrıca "geliştirmeye geç" onayıyla başlar.

---

## Problem özeti

Görsel/story tarafında yapılan fazlar (ör. Faz 2.2b-B, Faz 4) **tek kod yolunda** netleşmiş olsa bile, **ikinci bir yol** (senkron `POST /api/books`) veya **yan API** (`edit-image`) aynı "ürün gerçeği"ni paylaşmayabilir. Sonuç:

- Aynı kitap akışı **worker vs senkron** farklı referans görseliyle kapak üretebilir (**tutarsızlık**).
- Dokümanda "şu negatifler kaldırıldı" denilen yerde **başka endpoint** hâlâ eski listeyi kullanabilir (**iddia / gerçek çelişkisi**).
- **Ölü kod** ve **eski plan SHA** gibi şeyler ileride hata ve yanlış debug'a yol açar (**gereksiz karmaşa**).

---

## Kök bulgular (özet tablo)

| Kod | Konu | Kitap kalitesine etkisi | Durum |
|-----|------|-------------------------|--------|
| **Q1** | Kapak `edits` referans listesi: `image-pipeline` ≠ `books/route` (entity master) | Kapak kompozisyonu / kimlik karışması riski; iki yol farklı ürün | ✅ Tamamlandı (P0) |
| **Q2** | `getNegativePrompt` + `edit-image` vs iç sayfa AVOID (Faz 2.2b-B) | Mask-edit çıktısı farklı "kurallarla" üretilir; doküman yanıltıcı olabilir | ✅ Tamamlandı (P1) |
| **Q3** | `buildAnatomicalAndSafetySection` çağrılmıyor; yorumlar kafa karıştırıcı | Bakım maliyeti, yanlış refactor | ✅ Tamamlandı (P2) |
| **Q4** | Plan / test notlarında eski commit SHA | İzlenebilirlik | ✅ Tamamlandı (P2) |
| **Q5–Q10** | Validator, gaze, timing log, dead export, `STOP_AFTER`, V1/V2, doc commit | Çoğu **doğrulandı** veya **düşük öncelik** | Aşağıda "Backlog" |

---

## Genel durum tablosu

| Paket | Konu | Öncelik | Cursor model (geliştirme) |
|-------|------|---------|---------------------------|
| **P0** | Q1 — Kapak referansları tek politika (`pipeline` + `books/route`) | ✅ Tamamlandı | **Opus** (ortak helper + iki çağrı) |
| **P1** | Q2 — `edit-image` negatif politikası: doküman mı kod mu | ✅ Tamamlandı | Seçenek B (kod) — **Sonnet** |
| **P2** | Q3, Q4, dead export, `STOP_AFTER` notu | ✅ Tamamlandı | **Auto** / **Sonnet** |
| **P3** | Q5–Q10 backlog | İhtiyaç halinde | **Auto** (çoğunlukla) |

---

## Sıradaki iş (özet)

| | |
|--|--|
| **Önerilen sıra** | ~~P0~~ → ~~P1~~ → ~~P2~~ → ~~P3 öncesi tarama~~ → **P3** (backlog, ihtiyaç halinde). |
| **Bir sonraki somut iş** | Aşağıdaki **P3 backlog** tablosundan ürün önceliğine göre 1–2 kalem seç; çoğu doc/operasyon notu, zorunlu kod değişikliği değil. |
| **Test** | P0 sonrası: aynı story + master seti ile **worker** ve **senkron** kapakta referans sayısı ve URL sırasının eşleştiğini doğrula (manuel veya log). |

---

## Cursor model önerileri

[`IMAGE_QUALITY_IMPROVEMENT_PLAN.md`](./IMAGE_QUALITY_IMPROVEMENT_PLAN.md) içindeki **"Cursor / ajan model önerileri"** bölümüyle aynı mantık geçerli: diff ve çapraz dosya riski arttıkça modeli yükselt; ölçüm ve doc için **Auto** yeterli.

| İş türü | Öneri |
|---------|--------|
| P0 (iki büyük dosya + ortak API) | **Opus** veya listedeki en yetenekli model |
| P1 (prompt + tek route veya sadece `.md`) | **Sonnet**; yalnız metin → **Auto** |
| P2 (ölü kod sil, SHA düzelt) | **Auto** veya **Sonnet** |
| Test çıktısı / checklist | **Auto** |

---

## P0 — Kapak referans listesi (Q1) — ✅ Tamamlandı

**Sorun:** `image-pipeline.ts` kapakta entity master kullanmıyordu (Faz 4). `books/route.ts` senkron yolda `karakter + entity` birleştiriyordu.

**Çözüm:** `lib/book-generation/cover-reference-images.ts` — tek export `getCoverReferenceImageUrls(masterIllustrations, characters)`. Yalnızca **karakter master** URL'leri; yoksa `reference_photo_url`. Entity master kapak `edits` listesine eklenmez. Her iki çağrı noktası bu yardımcıyı kullanır.

| Alan | Dosya | Değişiklik |
|------|--------|-----------|
| **Helper (yeni)** | `lib/book-generation/cover-reference-images.ts` | Tek politika |
| Worker | `lib/book-generation/image-pipeline.ts` | `getCoverReferenceImageUrls` çağrısı |
| Senkron | `app/api/books/route.ts` | `getCoverReferenceImageUrls` çağrısı; eski `entityMasterUrls` + `allCoverMasters` kaldırıldı |

---

## P1 — Mask-edit negatifleri (Q2) — ✅ Tamamlandı

**Sorun:** İç sayfa `generateFullPagePrompt` [7] AVOID sadeleşti (Faz 2.2b-B). `edit-image` rotası `getNegativePrompt()` + `slice(0,10)` kombinasyonu kullanıyordu:
- `COMPOSITION_NEGATIVE` dahil ediliyordu — mask-edit'te kompozisyon sabit, alakasız.
- `slice(0,10)` ile listenin yalnızca ilk 10 güvenlik kelimesi alınıyordu — zaten proz olarak yazılmış "DO NOT introduce violence..." ile çakışan ve anlamsız bir bug.
- Anatomi hem negatif listede hem pozitif direktifte — çift çakışma.

**Karar: Seçenek B (kod)** — `edit-image` iç sayfa felsefesiyle hizalandı:

| Alan | Değişiklik |
|------|-----------|
| `lib/prompts/image/negative.ts` | `getMaskEditAvoid()` (v1.5.0); anatomi pozitif tarafta. **Sonra (P2.5):** kullanılmayan `getNegativePrompt` + negatif sabit yığını kaldırıldı — v1.6.0. |
| `app/api/ai/edit-image/route.ts` | `getNegativePrompt` kaldırıldı; `getMaskEditAvoid()` kullanılıyor; `slice(0,10)` bug temizlendi |

**Politika özeti:** Anatomi → `getAnatomicalCorrectnessDirectives()` (pozitif prefix). Güvenlik → proz "DO NOT" bloku. Kısa AVOID → `getMaskEditAvoid()` (5 madde, kompozisyon ve stil odaklı).

---

## P2 — Temizlik ve iz (Q3, Q4, …) — ✅ Tamamlandı

| İş | Sonuç |
|----|--------|
| **Q3** `buildAnatomicalAndSafetySection` | `scene.ts` v1.30.0 — fonksiyon kaldırıldı (hiç çağrılmıyordu; kapakta anatomi `getAnatomicalCorrectnessDirectives` ile doğrudan). |
| **Q4** Plan SHA | `IMAGE_QUALITY_IMPROVEMENT_PLAN.md` — sabit commit kısaltmaları → "Step Runner export" ifadesi. |
| **Dead export** `get3DAnimationNotes` | `style-descriptions.ts` — fonksiyon kaldırıldı; S2 satırı planda güncellendi. |
| **`STOP_AFTER`** | `books/route.ts` + `image-pipeline.ts` — JSDoc: yalnızca yerel geliştirme, prod’da boş. |
| **Tarihsel doc** | `PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md` (A11), `PHASE_3_BACKEND_AI.md` (Faz 3 builder listesi) — güncel gerçeğe uyarlandı. |

---

## P2.5 — P3 öncesi ikinci kod taraması (4 Nisan 2026) — ✅ Tamamlandı

**Yöntem:** Tüm `.ts/.tsx` içinde `lib/prompts/image/scene.ts` ve `negative.ts` importları tarandı; `npx tsc --noEmit` ile doğrulandı.

| Bulgu | Aksiyon |
|------|--------|
| `scene.ts`: `getCameraAngleDirectives`, `getPerspectiveForPage`, `getCompositionForPage`, `getSceneDiversityDirectives` dışarıdan hiç import edilmiyordu (yalnızca `generateFullPagePrompt` / `analyzeSceneDiversity` zinciri içinde) | Named export kaldırıldı. `scene.ts` → v1.33.0. |
| `negative.ts`: `getNegativePrompt`, yaş/stil/tema/karakter negatif sabitleri, `getContentSafetyFilter`, el stratejisi API’leri hiçbir route/script tarafından kullanılmıyordu (yalnızca `getAnatomicalCorrectnessDirectives` + `getMaskEditAvoid` canlı) | Ölü yığın kaldırıldı; modül sadeleştirildi. `negative.ts` → v1.6.0. Eski listeler için git geçmişi. |
| `cover-reference-images.ts`, `edit-image` importları | Ek ölü export yok. |

**Not:** Arşiv / analiz `.md` dosyalarında eski `getNegativePrompt` veya `AGE_SPECIFIC_NEGATIVE` ifadeleri tarihsel olarak kalabilir; ürün kodu artık bu listeleri içermiyor.

### Üçüncü tarama (aynı gün, derinlemesine) — ✅ Tamamlandı

Tüm `lib/prompts/image/*.ts` named/default export’ları import grafiğine göre tek tek kontrol edildi; `tsc` + `lint` yeşil.

| Bulgu | Aksiyon |
|------|--------|
| `scene.ts` `export default scenePrompts` | Hiçbir dosyada default import yoktu → kaldırıldı (`scene.ts` v1.34.0). `RiskySceneAnalysis` dış export gereksizdi → modül içi tip. |
| `negative.ts` default `negativePrompts` | Import yoktu → kaldırıldı (v1.6.1). |
| `character.ts` ~250 satır: `CONSISTENCY_KEYWORDS`, `MasterCharacter`, `formatCharacterForStorage`, `getCharacterForBookGeneration`, `MULTI_BOOK_STRATEGY`, `generateSubsequentBookPrompt`, kapak tutarlılık yardımcıları, default `characterPrompts` | Hiçbir `.ts/.tsx` import etmiyordu → kaldırıldı (v1.5.0). |
| `style-descriptions.ts` `is3DAnimationStyle` | Tanım dışında referans yoktu → kaldırıldı. |
| `master.ts` `getLayoutSafeMasterScaleText` | Tanım dışında referans yoktu → kaldırıldı. |
| `story/base.ts` `export default baseStoryPrompts` | Import yoktu → kaldırıldı (`base.ts` v3.2.1). |
| `version-sync.ts` | Önce default kaldırıldı; sonra dördüncü taramada **dosyanın tamamı** silindi (hiç import yoktu). |

### Dördüncü tarama — ✅ Tamamlandı

| Bulgu | Aksiyon |
|------|--------|
| `lib/prompts/version-sync.ts` | Tüm repo’da import yok → dosya silindi. Cursor kuralları güncellendi. |
| `lib/prompts/config.ts` | `PROMPT_CONFIG` içinde yalnızca `masterLayout` `master.ts` tarafından okunuyordu; diğer alanlar (activeVersions, A/B, feature flags, safety, performance, cost) **hiç referans alınmıyordu** → yalnızca `masterLayout` bırakıldı. |
| `style-descriptions.ts` `STYLE_DESCRIPTIONS` | Dışarıdan import edilmiyordu → `export` kaldırıldı (modül içi). |

### Beşinci tarama — ✅ Tamamlandı (kanıt: grep + `tsc` + `lint`)

| Bulgu | Doğrulama | Aksiyon |
|------|-----------|--------|
| `lib/prompts/types.ts` — ~200 satır arayüz | `AgeGroupRules`, `ThemeConfig`, `SafetyRules`, `ImageGenerationInput`/`Output`, `StyleConfig`, `NegativePrompt`, A/B, şablon tipleri: **hiçbir `.ts/.tsx` import etmiyordu** | Kaldırıldı; story + karakter tipleri korundu. |
| `normalizeIllustrationStyleKey` | Yalnızca `style-descriptions.ts` içinde kullanım | `export` kaldırıldı. |
| `getWordCountMinForStoryInput` (`base.ts`) | Tanım dışında **çağrı ve import yok** | Fonksiyon silindi (`base.ts` v3.2.2). |
| `lib/wizard-state.ts` | `from …wizard-state` / sabit adları: **0 import**; `herokid-wizard-storage.ts` aktif anahtarlar kullanıyor | Dosya silindi; `ARCHITECTURE.md` güncellendi. |

**Knip notu:** `npx knip` ek adaylar listeler (UI barrel export’lar, DB yardımcıları, `package.json` bağımlılıkları). Bunlar **dinamik import / admin / gelecek kullanım** olabilir; bu turda yalnızca yukarıdaki gibi **sıfır referans** kanıtlananlar işlendi.

---

## P3 — Backlog (doğrulandı / düşük öncelik)

**P3’e başlarken:** Aşağıdakileri tek tek “şu an bir sorun var mı?” diye değerlendir; çoğu için yanıt “hayır” ise PR açmadan doc notu yeterli olabilir.

Bu kalemler Claude tarafından işaretlendi; çoğu **mevcut davranışla uyumlu** veya **ürün hatası değil**.

| Konu | Sonuç |
|------|--------|
| `supportingEntities` max 2, şema, validator | Tutarlı |
| `suggestedOutfits` / `preGeneratedStoryData` | Edge case; bug çıkarsa dokümante et |
| Repair + `sceneMap` + diversity `Set` | Çift alan yok |
| Gaze / `POSE_VARIATIONS` (C1) | Uygulama tutarlı |
| Timing log (worker vs senkron) | Farklı yollar; isteğe bağlı doc notu |
| V1/V2 backlog | Planla uyumlu "isteğe bağlı" |
| Analiz `.md` commit | Bilinçli |

---

## İlgili dosyalar

- `lib/book-generation/image-pipeline.ts`
- `lib/book-generation/cover-reference-images.ts` ← P0 ile eklendi
- `app/api/books/route.ts`
- `lib/prompts/image/negative.ts`, `scene.ts`, `style-descriptions.ts`
- `app/api/ai/edit-image/route.ts`
- `docs/prompts/IMAGE_PROMPT_TEMPLATE.md`

---

## El sıkışma

1. ~~**P0** kabul: Kapak referans politikası **tek** ve worker ile senkron **aynı**.~~ ✅  
2. ~~**P1** için önce **A veya B** seçilir.~~ ✅ (B uygulandı)  
3. ~~**P2**~~ ✅ · **P3** ayrı küçük PR'lar olabilir.  
4. Kod yazımı, ayrı "geliştirmeye geç" talimatıyla başlar.
