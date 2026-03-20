# Image Generation Prompt Template

**Kod referansları:** `lib/prompts/image/scene.ts`, `character.ts`, `negative.ts`, `style-descriptions.ts`, `master.ts`  
**scene.ts changelog:** son girişler `v1.18.0`–`v1.20.0` (8 Şubat 2026); **Mart 2026 kapak dalı** ayrıca: `isCover === true` → kısa kapak yolu; `getCoverBookLayoutDirectives()`; `Character identity (match reference image)`; iç sayfa için `buildSceneEstablishmentSection(..., hasStoryEnvironment)` (story `environmentDescription` varken outdoor sky paketi kapalı).  
**Versiyon (negative):** 1.3.0 (el/parmak stratejisi, anatomik direktifler)  
**Kapak sahne metni:** `lib/book-generation/image-pipeline.ts` → `resolveCoverEnvironment(storyData)` — sıra: `coverImagePrompt` → `coverDescription` → `coverSetting` → türetme.

---

## Hızlı Akış Özeti

1. **Master Generation** → İnsan karakterler + hayvan/obje için master görseller üret
   - İnsan: Referans foto + prompt → master
   - Hayvan/Obje: Sadece prompt (story'den description) → master
2. **Cover Generation** → Tüm master'lar referans + scene prompt → kapak görseli
3. **Page Generation** → O sayfadaki entity master'ları referans + scene prompt → sayfa görseli
4. **Tutarlılık:** Her varlık için bir kez master, sonra hep o master referans

---

## Master = sadece referans (kimlik)

- **Master görsel:** Sadece karakter kimliği referansıdır (yüz özellikleri, saç, göz, cilt, kıyafet). Poz, ifade ve kompozisyon master'dan kopyalanmaz.
- **Poz / ifade / sahne:** Kapak ve sayfa görsellerinde duruş, yüz ifadesi ve sahne betimlemesi **story çıktısından** gelir. Story'den gelen `characterExpressions` (karakter bazlı görsel ifade tarifi) image prompt'ta [CHARACTER_EXPRESSIONS] bloğunda kullanılır.
- **Kritik talimat:** "Do not copy the reference image's facial expression. Match only face identity (features, skin, eyes, hair) and outfit. Each character's expression for THIS scene is specified above; use those exact visual descriptions. No generic open-mouthed smile unless the scene text clearly indicates joy, laughter, or excitement."

---

## Overview

Bu template, **gpt-image-1.5** (default) / **1024x1536** (portrait) / **quality: low** ayarları için optimize edilmiş görsel üretim prompt'larını içerir. Karakter tutarlılığına özel vurgu yapar.

**Production Defaults:**
- Model: `gpt-image-1.5`
- Size: `1024x1536` (portrait)
- Quality: `low` (master, cover, sayfa hep low)
- input_fidelity: `high` (referans sadakati; master/cover/sayfa çağrılarında kullanılır)
- Rate Limit: 5 images per 90 seconds (Tier 1: 5 IPM)

**Kritik Hedef:** Yüklenen çocuk fotoğrafındaki çocuğa mümkün olduğunca benzeyen karakterler üretmek.

**Cover-as-Reference:** Cover oluşturulduktan sonra tüm sayfalarda hem orijinal fotoğraflar hem de cover referans olarak kullanılır. Cover'da TÜM karakterler görünmeli.

---

## Core Principles

1. **Karakter Tutarlılığı:** Her sayfada aynı çocuk görünmeli
2. **Detaylı Talimatlar:** Prompt ne kadar detaylı olursa sonuç o kadar iyi
3. **Stil Tutarlılığı:** Tüm görseller aynı illustration style'da
4. **Yaş Uygunluğu:** Age-appropriate scenes ve content
5. **Kalite:** Print-ready, professional children's book illustrations
6. **Cover-as-Reference:** Cover tüm sayfalarda referans olarak kullanılır

---

## Cover-as-Reference Yaklaşımı

- **Sorun:** Her sayfa için referans gönderiliyor ama model her seferinde yeniden yorumluyor; tutarlılık %60–70.
- **Çözüm:** Cover oluşturulduktan sonra Pages 2–10’da hem fotoğraflar hem cover referans olarak kullanılıyor.
- **Cover kalitesi kritik:** Tüm sayfalarda referans; cover’daki hata tüm kitaba yansır. TÜM karakterler cover’da görünmeli.
- **Cover vs Page 1 (first interior):** Kapak ile ilk iç sayfa açıkça farklı olmalı (kamera, kompozisyon).
- **Kapak (`isCover=true`):** PRIORITY / GLOBAL_ART_DIRECTION / sinematik “environment 65%” zinciri **yok**. Sıra: stil etiketi → referans/kıyafet kritiği → anatomi → **Character identity** (master ile aynı göz/saç/ten) → **BOOK COVER layout** (`getCoverBookLayoutDirectives`: üstte başlık alanı, tek odak, mockup/typography yok) → **SCENE:** stil + `getStyleSpecificDirectives` + `coverEnvironment` (story’den).  
- **İç sayfa (`isCover=false`):** Aşağıdaki uzun şablon (PRIORITY, SHOT PLAN, SCENE_ESTABLISHMENT, …) geçerli; kapakla aynı değildir.

---

## Template Structure — iç sayfa (`generateFullPagePrompt`, `isCover=false`)

Sayfa görseli prompt'u `lib/prompts/image/scene.ts` → `generateFullPagePrompt()` ile üretilir. Bölüm sırası (kodla aynı):

1. **PRIORITY** – Çatışma çözüm sırası: 1) Scene composition & character scale, 2) Environment richness & depth, 3) Character action & expression, 4) Reference identity match. (A4)
2. **GLOBAL_ART_DIRECTION** – Stil bazlı tek blok (getGlobalArtDirection; 3D Animation / diğer stiller). (A7)
3. **SHOT PLAN** – buildShotPlanBlock: shotType, lens, cameraAngle, placement, characterScale 25–30%, timeOfDay, mood. Story'den gelen shotPlan kullanılır; yoksa kod fallback (bkz. PROMPT_OPTIMIZATION_GUIDE.md “shotPlan yoksa fallback”). (A8, A5)
4. **CRITICAL** – Referans = sadece kimlik / veya “Character MUST wear EXACTLY: [clothing]”.
5. **Allow relighting** (interior only) – "Use reference for face, hair, and outfit only; do NOT copy lighting or background from reference. Allow relighting to match this scene." (Sıra 19, v1.20.0)
6. **Anatomical & Safety** – buildAnatomicalAndSafetySection (el stratejisi, parmak, anatomi). (A11)
7. **Lighting & Atmosphere** – buildLightingAndAtmosphereSection.
8. **COMPOSITION RULES** – Tek kısa satır (environment 65–75%, rule of thirds, no zoom-in). (A1)
9. **Style** – buildStyleSection.
10. **CINEMATIC_PACK** – getCinematicPack().
11. **Character Integration** + **Cinematic Natural** (interior only).
12. **SCENE** – buildSceneContentSection (layered composition, scene prompt, pose, age rules).
13. **CHARACTER_EXPRESSIONS** – buildCharacterExpressionsSection (story'den characterExpressions).
14. **Special Page Directives** – buildSpecialPageDirectives.
15. **Character Consistency** – buildCharacterConsistencySection.
16. **Scene Diversity** – buildSceneDiversitySection.
17. **Clothing** – buildClothingSection.
18. **AVOID** – buildAvoidShort (tek satır negatifler). (A1)

Master, kapak ve entity prompt'ları aynı modülde veya `character.ts` / `master.ts` içinde üretilir. Karakter tutarlılığı (hair, eyes, skin, facial features), çoklu karakter referans eşlemesi, cover talimatları (NO TEXT), interior sayfa talimatları için ilgili builder fonksiyonlarına bakın.

---

## Illustration Style Descriptions

**Toplam Stil Sayısı:** 9 stil

- 3D Animation (Pixar Style), Geometric, Watercolor, Comic Book, Block World, Clay Animation, Kawaii, Collage, Sticker Art

Detaylı açıklamalar ve negative/positive direktifler `lib/prompts/image/style-descriptions.ts` ve ilgili dosyalarda.

---

## Implementation Notes

- **Story Text:** Kullanıcı diline göre (Türkçe/İngilizce)
- **Image Prompts:** HER ZAMAN İngilizce

**Template Variables:** CHARACTER_NAME, AGE, CHARACTER_FEATURES_ENGLISH, THEME, SUBTHEME, ILLUSTRATION_STYLE_DESCRIPTION, AGE_GROUP, LANGUAGE, TITLE, MORAL, PAGES_WITH_TEXT_AND_IMAGE_DESCRIPTIONS

---

## Best Practices

1. Image prompts için her zaman İngilizce kullan
2. Karakter özelliklerini detaylı belirt (saç rengi, uzunluk, stil, göz rengi)
3. Hair length’a özel dikkat (yaygın hata)
4. 3D Animation için photorealistic olmamalı vurgusu
5. Kitap kapağı: flat illustration, book mockup değil
6. Karakter tutarlılığını her sayfada vurgula
7. Cinematic elements (lighting, depth, composition)
8. Foreground/Midground/Background layer sistemi
9. Kıyafet tutarlılığı: match reference kullanıldığında "same outfit every page"; hikayede değişim yoksa aynı kıyafet
10. Anatomik doğruluk (5 parmak, doğru limb sayısı)
11. Sayfa bazlı, karakter bazlı yüz ifadesi: story’den gelen **characterExpressions** (char ID → görsel ifade tarifi) [CHARACTER_EXPRESSIONS] bloğunda kullanılır; referans ifadesi kopyalanmaz. (Eski: "Facial expression: [value]" olarak prompt’a eklenir (hardcoded liste yok)
12. Çocuk–yetişkin boy farkı: Aynı sahnede yetişkin varsa "Adult character(s) clearly taller than child(ren); visible height/size difference. Adult body proportions (not child proportions)." (hardcoded yaşlı tipi yok)

---

## Cinematic Quality / Clothing Consistency / Anatomical Correctness

- **Depth & Layers:** Foreground, midground, background; character ratio 25–35%; environment sharp.
- **Clothing Consistency:** Match reference kullanıldığında "Match reference image exactly (same outfit as in reference). Same outfit every page; do not change clothing." Hikayede kıyafet değişikliği yoksa aynı kıyafet.
- **Per-character expression:** Story’den gelen `characterExpressions` (sayfa bazlı, karakter bazlı görsel ifade) image prompt’a "Facial expression: [value]" olarak eklenir; hardcoded ifade listesi yok.
- **Adult–child height:** Yetişkin karakter varsa "Adult character(s) clearly taller than child(ren); visible height/size difference. Adult body proportions (not child proportions)." Hardcoded yaşlı tipi yok.
- **Anatomical:** Negative prompts (el/parmak/kol/bacak hataları); positive: 5 parmak, 2 el, 2 kol, 2 bacak, doğru oranlar.

Detaylar `lib/prompts/image/scene.ts`, `negative.ts` içinde.

---

## Bilinen konular / İyileştirme alanları

- **Tekrarlayan arka planlar:** Custom request girilmeden de kapak ve sayfa görsellerinde sık tekrar eden sahne (yol, etrafında çiçekler, arkada ev) gözlemlenebilir. Sahne betimlemesi story çıktısından geliyor; görsel modelin generic şablona düşmesi azaltılabilir (ör. "avoid generic road+flowers+house unless scene description specifies" veya story sceneDescription/imagePrompt çeşitliliğinin güçlendirilmesi).
- **Bakış açıları:** Kamera açıları ve kompozisyon kuralları (getCameraAngleDirectives, getCompositionRules) güncel; kullanıcı geri bildirimi: bakış açıları şimdilik daha iyi.

---

## İlgili dokümanlar

- `STORY_PROMPT_TEMPLATE.md` – Hikaye üretimi özeti (sürüm = `base.ts` VERSION)
- `docs/analysis/GORSEL_PROMPT_VE_TEST_REHBERI.md` – Tek giriş: test checklist, doküman haritası
- `docs/analysis/PROMPT_ANALIZ_VE_IYILESTIRME.md` – Pipeline önerileri ve log notları
- `docs/guides/PROMPT_OPTIMIZATION_GUIDE.md` – shotPlan, fallback, GLOBAL_ART_DIRECTION, relighting
- `docs/analysis/PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md` – A1–A12 aksiyon planı ve uygulama durumu
