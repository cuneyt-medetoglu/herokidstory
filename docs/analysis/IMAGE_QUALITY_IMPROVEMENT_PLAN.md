# Görsel Kalite İyileştirme Planı

**Tarih:** 4 Nisan 2026  
**Önceki çalışmalar:** `STORY_GENERATION_DEV_ROADMAP.md`, `PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md`, `MASTER_ILLUSTRATION_CONTRACT.md`

---

## Problem özeti

Kapak ve sayfa görselleri hedeflenen "sinematik kitap illüstrasyonu" seviyesinin gerisinde. Karakterler çoğu sayfada oturuyor. Kapak ile iç sayfa arasında görsel dramatizm yok.

**Kök nedenler (öncelik sırasıyla):**

| # | Neden | Durum |
|---|-------|-------|
| **K1** | Story modeli (gpt-4.1-mini) pasif, checklist tarzı hikaye üretiyor | ✅ Faz 0 ile çözüldü |
| **K2** | Pipeline prompt'u çelişkili ve uzun (~1900 token); story'nin iyi içeriği boğuluyor | ✅ Faz 2.1 çelişkileri giderdi + Faz 2.2 yapıyı 7 bloğa indirdi (~%55 azalma) |
| **K3** | Kelime sayısı sınırlı -> hikaye sığ, sahne betimi zayıf | ✅ Faz 0 ile çözüldü |
| **K4** | Stil izolasyonu test edilmedi | ✅ Faz 3 ile ele alındı (statik analiz + clay “stop-motion” düzeltmesi) |

---

## Neden görsel fark hissedilmiyor?

Story kalitesi Faz 0 ile ölçülebilir şekilde iyileşti (pasif sahne %67 -> %25, 12 farklı lokasyon, anlatı yayı). Ama bu iyileşme görsele tam yansımıyor çünkü:

**Pipeline (K2) hala story'nin iyi içeriğini ~1900 token kuralın içine gömüyor.** Model neye öncelik vereceğini bilemiyor ve en güvenli sonuca (portremsi orta plan) gidiyor. K1'i çözmek K2 çözülene kadar görsel çıktıda tam etkisini gösteremiyor.

> **NOT (Faz 2.2 sonrası):** K2 artık büyük ölçüde çözüldü. Prompt ~4000 karakterden ~1800 karaktere indi (%55 azalma). Sahne içeriğinin oranı ~%20'den ~%35+'a yükseldi. Sonraki testlerde (T2b) bu değişimin görsele yansıması ölçülecek.

---

## Genel durum tablosu

| Faz | Konu | Durum |
|-----|------|-------|
| **Faz 0** | Model + kelime config | ✅ Tamamlandı |
| **Faz 2.1** | Çelişki temizliği (pipeline) | ✅ Tamamlandı |
| **Faz 1.1** | Story anti-pattern kuralları | ✅ Tamamlandı |
| **Faz 2.2** | Prompt 7-blok yapıya geçiş | ✅ Tamamlandı |
| **Faz 2.2b** | [SCENE] tekrar temizliği + AVOID anatomi sadeleştirme | ✅ **A + B + T2c** tamam |
| **Faz 1.3** | Story “staging” + bakış hedefi; image tarafında negatif sadeleştirme | ✅ Tamamlandı |
| **Faz 1.2** | Sahne çeşitliliği validator | ✅ Tamamlandı |
| **Faz 3** | Stil izolasyon analizi + düzeltme | ✅ Tamamlandı |
| **Faz 4** | Kapak özel iyileştirme | ✅ Tamamlandı |

---

## Sıradaki faz (özet)

| | |
|--|--|
| **Önerilen sıra** | Tüm planlı fazlar ✅ (2.2b-B dahil). Kalan: dokümandaki **V1/V2** backlog (isteğe bağlı story/repair). |
| **Bir sonraki iş** | **V1/V2** backlog veya ürün önceliğinize göre yeni iş kalemleri. |
| **Dosya / kapsam** | **2.2b-B:** ✅ `scene.ts` — iç sayfa `[7] AVOID` + kapak `buildAvoidShort` (parmak/ekstremite/messy anatomy kaldırıldı). |
| **Test** | **T2c:** ✅. **T1.3:** ✅ kullanıcı koşusu (4 Nisan 2026, Step Runner export) — sinematik ışık/aksiyon güçlü; staging JSON’da P1–P2 gaze cümleleri mevcut; saç uzunluğu bazen referanstan sapıyor (negatif prompt ile düzeltme önerilmez). |

---

## Cursor / ajan model önerileri (bundan sonraki fazlar)

Aynı iş için **geliştirme** ile **test + sonuç analizi** farklı model seviyesi ister. Aşağıdaki isimler Cursor'da gördüğün model seçeneklerine karşılık gelir (güncel sürüm numaraları değişebilir).

### Ne zaman hangi güç?

| İş türü | Öneri | Gerekçe |
|---------|--------|---------|
| **Büyük mimari refactor** (Faz 2.2 gibi: tek dosyada çok fonksiyon, çelişki riski) | **Opus 4.6** veya **GPT-5.4** (veya listedeki en yetenekli seçenek) | Uzun bağlam, tutarlılık, "bir şeyi kaldırırken başka yeri kırmama" kritik. |
| **Orta karmaşıklık** (validator, tek route, sınırlı diff) | **Sonnet 4.6** | Hız/maliyet iyi; yapı net kodda yeterli. |
| **Çok uzun dosya + doküman taraması** | **Gemini 3.1 Pro** (veya uzun bağlamı güçlü model) | Tek seferde geniş metin okuma; yine de kritik merge için son kontrolü güçlü modelle yap. |
| **Test çıktısı analizi** (JSON export, tablo, checklist, "şu sayfada ne eksik") | **Auto** veya **Sonnet** | Çoğunlukla okuma + özet; frontier şart değil. Auto senin kullanımın için uygun. |
| **Görsel A/B "hangisi daha iyi kompozisyon"** | İnsan + kısa **Auto** notu | Saf estetik karar modellerde güvenilir değil; senin final onayın esas. |

**Kural özeti:** Risk ve diff büyüdükçe modeli yükselt; ölçüm ve raporlama için Auto yeterli.

### Faz bazında hızlı tablo

| Faz | Geliştirme (kod / prompt) | Test & analiz |
|-----|---------------------------|----------------|
| **2.2** | ✅ **Opus 4.6** ile tamamlandı | **Auto** (export karşılaştırma, token sayımı, checklist) |
| **2.2b** | **Sonnet 4.6** (minimal `scene.ts` / tekrar + isteğe bağlı AVOID) | **Auto** (T2c: uzunluk + isteğe bağlı A/B el) |
| **1.3** | **Sonnet 4.6** (`base.ts` + `scene.ts`; ister iki küçük PR) | **Auto** + senin görsel notun |
| **1.2** | **Sonnet 4.6** (validator); karmaşık repair metni -> **Opus** | **Auto** |
| **3** | Az kod; çoğunlukla pipeline/config denemesi -> **Sonnet** | **Auto** + senin görsel kararın |
| **4** | **Sonnet** veya **Opus** (kapak dalı + `image-pipeline`) | **Auto** |

---

## Tamamlanan fazlar

### ✅ FAZ 0 -- Config değişiklikleri (4 Nisan 2026)

| İş | Dosya | Sonuç |
|----|-------|-------|
| DEFAULT_STORY_MODEL -> `gpt-4.1` | `lib/ai/story-generation-config.ts` | ✅ |
| Kelime aralıkları %50 artış | `lib/config/reading-age-brackets.ts` | ✅ |

**Kelime tablosu (yeni):**

| Bant | Eski | Yeni |
|------|------|------|
| 0-1 | 5-14 | 8-21 |
| 1-3 | 15-38 | 23-57 |
| 3-5 | 40-75 | 60-113 |
| 6+ | 85-150 | 128-225 |

**TEST T0 (story):** ✅ Geçti  
**TEST T0b (görsel):** ✅ Geçti -- story kalitesi görsel kaliteye kısmen yansıdı; tam etki için K2 çözülmeli

**T0 story analizi özeti:**

| Metrik | Önceki | Yeni | Hedef |
|--------|--------|------|-------|
| Pasif sahne oranı | 8/12 = %67 | 3/12 = %25 | <=%25 ✅ |
| Farklı lokasyon | ~5 | 12 | >=8 ✅ |
| cameraDistance çeşitliliği | close/medium | wide/medium/close/establishing | Karışık ✅ |
| Anlatı yayı | Checklist | Keşif -> Araştırma -> Anlama -> Çözüm | ✅ |
| Kelime/sayfa (P1) | ~22 | ~32 | 23-57 ✅ |

---

## Sıradaki fazlar

### ✅ FAZ 2.1 -- Çelişki temizliği (4 Nisan 2026)

**Neden önce?** Prompt içinde birbirini yutan kurallar vardı. Model çelişki gördüğünde en "güvenli" çıktıya (portremsi, statik pose) gidiyordu. Bu temizlenmeden diğer iyileştirmelerin etkisi sınırlı kalacaktı.

**Uygulanan değişiklikler:**

| # | Çelişki | Çözüm | Dosya |
|---|---------|-------|-------|
| C1 | `POSE_VARIATIONS[1]` ("looking directly at viewer") + `getGazeDirectionForPage` index-0 ("looking toward viewer") <-> `getCinematicNaturalDirectives` ("do NOT look at camera") | Viewer-facing gaze/pose tamamen kaldırıldı; tüm seçenekler sahneye yönelik | `scene.ts` |
| C2 | `getDefaultHandStrategy` ("not holding objects, no hand gestures") <-> story'den gelen `characterAction` (holding, pointing, waving) + POSE_VARIATIONS (pointing, arms raised) | "not holding objects, no hand gestures" kaldırıldı; el konumu artık sahne aksiyonunu takip eder | `negative.ts` |
| C3a | `buildCharacterConsistencySection()` içinde `buildStyleDirectives[2]` ve `buildCharacterConsistencyDirectives[2]` -- kelimesi kelimesine AYNI string iki kez push ediliyordu | İkisi de kaldırıldı; stil `getGlobalArtDirection()` + `buildStyleSection()` tarafından kapsanıyor | `scene.ts` |
| C3b | `generateScenePrompt()` başında `buildStyleDirectives[0]` (full styleDesc ~150 karakter) -- `getGlobalArtDirection()` + `buildStyleSection()` ile bu 3. tekrardı | Kaldırıldı | `scene.ts` |
| C4 | `buildFirstInteriorPageDirectives()` "NOT centered" -> SHOT PLAN bloğunda zaten var | "NOT centered" kaldırıldı; cover'dan farklı kompozisyon mesajı korundu | `scene.ts` |

**Tahmini etki:** Style description token sayısı ~100-150 azaldı. Gaze/pose çelişkisi giderildi -> model artık "story sahnesine bakan karakter" yönünde tutarlı gidecek. El aksiyonu çelişkisi giderildi -> holding, pointing, waving sahneleri artık bloke edilmiyor.

**Test (T2a):** Aynı story, aynı sayfa -> görsel üret -> çelişen direktif yok mu kontrol et.

---

### ✅ FAZ 1.1 -- Story anti-pattern kuralları (4 Nisan 2026)

**Uygulanan değişiklikler (`lib/prompts/story/base.ts` -> v3.1.0):**

| Alan | Değişiklik | Fonksiyon |
|------|------------|-----------|
| Visual safety kaldır | `"avoid holding hands, complex gestures. Prefer hands at sides"` silindi -- GPT Image 1.5 (4.47/5) bunu artık hallediyor, kısıtlama aksiyonsuz sahne yazdırıyordu | `buildIllustrationSection()` |
| Aktif sahne zorunluluğu | Her imagePrompt'ta spesifik fiil+nesne zorunlu. Bad: "stands in garden" -- Good: "reaches toward the beehive, eyes wide" | `buildIllustrationSection()` |
| Ardışık fiil yasağı | Aynı dominant fiil (sit/stand/walk/look) 2 art arda yasak; her sayfa farklı aksiyon türü | `buildVisualDiversitySection()` |
| Checklist yasağı | "Checklist rhythm is FORBIDDEN" açık kural olarak eklendi -- sebep-sonuç zorunluluğu vurgulandı | `buildVisualDiversitySection()` |
| Kapak vs Sayfa 1 | Kapak = zirve dramatik an; Sayfa 1 = hikayenin başlangıcı. Farklı yer+aksiyon+kamera açısı ZORUNLU | `buildStoryStructureSection()` |
| Cover direktifi | "En dramatik an zorunluluğu" + karakterler aksiyon içinde + kapak/sayfa1 farklı sahne garantisi | `buildStorySystemPrompt()` |

**Test (T1) -- 4 Nisan 2026 (örnek koşu: Arya/Bal, bahçe + kavanoz):** ✅ Geçti (hedefler karşılandı).

| Kontrol | Sonuç |
|---------|--------|
| Kapak = dramatik an, aktif poz | Uygun (kovan / yukarı uzanma / zıplama) |
| Sayfa 1 != kapak (yer, aksiyon, kamera) | Uygun (çimenlikte kavanoz keşfi vs kapak kovan sahnesi) |
| `imagePrompt`'larda somut aksiyon | Güçlü; yavaş sayfa (bankta düşünme) anlatı olarak yerinde |

**T1 -- İyileştirme backlog'u (sırası gelince; ayrıntı Faz 1.2 tablosunda V1-V2):**

1. **coverDescription <-> coverImagePrompt:** Örnek koşuda özet ilk cümlesi kavanoz keşfine kayarken kapak görseli kovana odaklıydı. Story prompt'ta özetin kapaktaki ikonik anla hizalanması ve/veya Faz 1.2'de uyumsuzluk uyarısı veya repair.

2. **Ardışık gözleme fiilleri:** Örnek P4 (`watching` / `peering`) -> P5 (`looking thoughtful`). Validator veya prompt sıkılaştırması: ardışık iki sayfada `look` / `watch` / `peer` / `gaze` ağırlığı tekilleştirilsin; diğer sayfada farklı eylem kategorisi zorunlu olsun.

---

### ✅ FAZ 2.2 -- Prompt 7-blok yapıya geçiş (4 Nisan 2026)

**Uygulanan değişiklikler (`lib/prompts/image/scene.ts` -> v1.24.0):**

İç sayfa prompt'u ~14 dağınık bloktan **7 odaklı bloğa** indirildi. Kapak dalı dokunulmadı (zaten kompakt).

| # | Yeni Blok | Eski blokları değiştiren |
|---|-----------|--------------------------|
| [1] | PRIORITY + CONTEXT | Eski PRIORITY + buildFirstInteriorPageDirectives |
| [2] | STYLE | GLOBAL_ART_DIRECTION + buildStyleSection + getCinematicPack (3 blok -> 1) |
| [3] | SHOT PLAN | SHOT PLAN + buildCompositionRulesShort + buildSceneDiversitySection |
| [4] | SCENE | generateScenePrompt + SCENE_ESTABLISHMENT + LIGHTING + SCENE_CONTENT + layeredComp + charIntegration + cinNatural + poseVariation (8 blok -> 1) |
| [5] | CHARACTER IDENTITY | reference identity + relighting + consistency + clothing + specialPage |
| [6] | EXPRESSIONS | Aynı (değişmedi) |
| [7] | AVOID | buildAvoidShort + [ANATOMY] (ayrı blok kaldırıldı, anahtar kelimeler buraya) |

**Kaldırılan tekrarlar:**

| Tekrar | Önceki | Yeni |
|--------|--------|------|
| Ortam (environment) | 3x (SCENE_ESTABLISHMENT + generateScenePrompt + layeredComp BACKGROUND) | 1x ([4] SCENE) |
| Aydınlatma (lighting) | 2x (LIGHTING_ATMOSPHERE + generateScenePrompt) | 1x ([4] SCENE) |
| Stil tanımı | 3x (GLOBAL_ART_DIRECTION + buildStyleSection + getCinematicPack) | 1x ([2] STYLE) |
| Karakter tutarlılığı | 4x+ (generateScenePrompt 2x + buildCharacterConsistencySection 2x) | 1x ([5] IDENTITY) |
| Kompozisyon kuralları | 2x (SHOT PLAN + buildCompositionRulesShort) | 1x ([3] SHOT PLAN) |

**Kaldırılan dolgu satırları:** "professional children's book illustration", "high quality, print-ready", "detailed but age-appropriate", "warm and inviting atmosphere", "natural pose variation NOT same" (toplam ~5 satır, ~200 karakter)

**[ANATOMY] -> [7] AVOID taşıması:** Ayrı `[ANATOMY]` bloğu (~115 karakter) kaldırıldı. Anahtar kelimeler ("extra or fused fingers, extra limbs, messy anatomy") AVOID satırına eklendi. GPT Image 1.5 el kalitesi 4.47/5 -- ayrı blok gereksiz.

**Tahmini etki:** İç sayfa prompt uzunluğu ~4000 -> ~1800 karakter (~%55 azalma). Sahne içeriğinin ([4] SCENE) toplam prompt'taki oranı ~%20 -> ~%35+ arttı.

**Test (T2b):** Step Runner'da aynı story ile 1-2 sayfa görsel üret -> JSON export ile:
1. `image_page` request `prompt` metin uzunluğunu ölç (hedef: <=2000 karakter veya belirgin düşüş)
2. Görselde sahne aksiyonu/ortam doğru mu, karakter tutarlı mı kontrol et
3. Önceki koşuyla (Faz 2.1 sonrası) yan yana karşılaştır

---

### ✅ FAZ 2.2b (A) -- [SCENE] tekrar temizliği (ara faz) — **T2c geçti (4 Nisan 2026)**

**T2c ölçümü (iki Step Runner export karşılaştırması, farklı kitap oturumu — metrik yine de A etkisini gösterir):**

| Metrik | Önce (v1.24, Step Runner export — önce) | Sonra (v1.25, Step Runner export — sonra) |
|--------|---------------------------|----------------------------|
| `page_1` `prompt` karakter | ~4637 | ~4094 |
| `image_page` API `text_tokens` (input) | ~1028 | ~933 |

**Görsel (kullanıcı):** Kapak — kovan/arı dramı güçlü; sayfa 1 — bahçe yolu, sinematik ışık; el anatomisi bu koşuda ciddi sorun görünmüyor; köpek tarifinde kameraya bakış notu var (Faz 1.3 ile ele alınabilir).

---

### ✅ FAZ 2.2b (B) -- AVOID anatomi sadeleştirme — **Tamamlandı (4 Nisan 2026)**

**A özeti:** `scene.ts` v1.25.0 — `Depth` satırında `characterAction` tekrarı kaldırıldı; MIDGROUND kısa `environment`. Detay ve T2c tablosu yukarıda.

**B — uygulama (`scene.ts` v1.29.0):**

| # | İş | Sonuç |
|---|-----|--------|
| B1 | İç sayfa `[7] AVOID`: “extra or fused fingers”, “extra limbs”, “messy anatomy” kaldırıldı | Kompozisyon + arka plan + teknik yasaklar kaldı |
| B2 | Kapak `buildAvoidShort()`: aynı anatomi maddeleri kaldırıldı (tutarlılık) | `[ANATOMY]` / `getAnatomicalCorrectnessDirectives` kapak dalında ayrı; bu PR’da dokunulmadı |

**Gerekçe:** Kısa kısıtlar; parmak negatifleri token gürültüsü / sınırlı fayda (ürün kararı + önceki araştırma özeti).

**Test (T2c-B):** İsteğe bağlı — yeni koşuda el kalitesi kötüleşirse tek satırlık pozitif kısıt veya çok kısa “coherent hands” denenebilir.

---

### ✅ FAZ 1.3 -- Story “staging” + bakış / kamera hizalaması (ara faz) — **Tamamlandı**

**Problem:** Image prompt’ta “kameraya bakma”, “do NOT look at camera” gibi **negatif** kurallar, story’de “yürüyor / heyecanlı” gibi **yüzü kameraya dönük** okunan sahnelerle çelişebilir; model genelde güvenli tercih olarak portremsi kadraj seçer.

**Yön:** Öncelik **pozitif yönetmen notu** — story tarafında (kısa, İngilizce görsel alanlarında):

- Kimin nerede durduğu / ne yaptığı (1–2 cümle).
- Bakış **hedefi**: örn. “Arya looks toward the path ahead and the archway”, “Bal looks at a daisy beside the path” — kamera yasağı yerine **sahne içi hedef**.

**Image tarafı (ikinci adım, kısa):**

- `scene.ts`: “Do NOT look at camera” / AVOID “looking directly at camera” ifadelerini yumuşat veya kaldır (1.3 story değişikliği sonrası).
- `SHOT PLAN` / `pose` havuzu: story’de açık “facing camera” yoksa varsayılanları sahneye bakan tutarlı tut.

**Model (geliştirme):** **Sonnet 4.6** (story `base.ts` + `scene.ts` iki küçük PR’a bölünebilir). Karmaşık şema/validator değişmezse Opus şart değil.

**Test (T1.3):** Aynı tema ile yeni story; sayfa 1–2 görselde “kameraya doğru yürüyüş” azaldı mı, bakış sahne öğesine mi bağlandı (subjektif + isteğe bağlı checklist).

**Uygulanan değişiklikler (4 Nisan 2026):**

| Dosya | Değişiklik | Versiyon |
|-------|------------|----------|
| `lib/prompts/story/base.ts` | `buildIllustrationSection()` içine STAGING direktifi eklendi: her `sceneDescription`'a 1 İngilizce cümle gaze hedefi zorunluluğu (sahne elemanı: yol, nesne, arkadaş, ufuk). Negatif kamera yasağı yerine pozitif yönetmen notu. | v3.2.0 |
| `lib/prompts/image/scene.ts` | `getCinematicNaturalDirectives()`: "do NOT look at camera" yerine "look toward scene elements" pozitif yönlendirme. | v1.26.0 |
| `lib/prompts/image/scene.ts` | `[4] SCENE` bloğu: "Do NOT look at camera" ifadesi kaldırıldı, "look toward the scene: at each other, at the object they interact with, toward the path" ile değiştirildi. | v1.26.0 |
| `lib/prompts/image/scene.ts` | `[7] AVOID`: "looking directly at camera" kaldırıldı — pozitif yönlendirme ile gereksizleşti. | v1.26.0 |

---

### ✅ FAZ 1.2 -- Sahne çeşitliliği validator — **Tamamlandı (4 Nisan 2026)**

**Ne?** Story response'unu doğrulayan kurallara çeşitlilik kontrolleri ekle.

**Öncelik:** Düşük — diğer fazlar bittikten sonra uygulandı. ✅ Uygulandı.

**Eklenecek kontroller:**
- Ardışık 3 sayfa aynı `location` -> repair
- 12 sayfanın 6+'sı aynı `cameraDistance` -> uyarı
- imagePrompt'ta aksiyon fiili yok -> uyarı

**Uygulanan değişiklikler (`lib/ai/story-response-validator.ts`):**

| # | Kontrol | Etki | Tetik |
|---|---------|------|-------|
| C1 | Ardışık 3 sayfa aynı `location` | `issues[]`'e uyarı + `sceneMap` **repair** tetiklenir | Evet |
| C2 | Sayfaların ≥%50'si aynı `cameraDistance` | `issues[]`'e uyarı | Hayır |
| C3 | `imagePrompt`'ta gerund / aksiyon fiili yok | `issues[]`'e uyarı | Hayır |
| V2 | Ardışık iki sayfada gaze-dominant `imagePrompt` | `issues[]`'e uyarı | Hayır |

`buildRepairPrompt` sceneMap notuna diversity ipucu eklendi: repair sırasında LLM'e "no 3 consecutive pages with the same location" kuralı hatırlatılır.

**T1 gözlemlerinden ek backlog (uygulama sırası Faz 1.2):**

| # | Konu | Öneri |
|---|------|--------|
| V1 | **coverDescription vs coverImagePrompt** | İlk cümle / özet odak nesnesi kapak görseliyle hizalanmalı (ör. kapak kovansa özet "jar discovery" ile başlamamalı). Repair: `coverDescription`'ı `coverImagePrompt` ana fikrine göre tek cümleyle hizala. |
| V2 | **Ardışık gözleme fiilleri** | `imagePrompt` metninde ardışık sayfalarda `look` / `watch` / `peer` / `gaze` ağırlıklı sahne -> uyarı veya otomatik repair önerisi (T1 örnek: P4->P5). |

---

### ✅ FAZ 3 -- Stil izolasyon analizi + düzeltme — **Tamamlandı (4 Nisan 2026)**

**Ne?** Aynı story + aynı sayfa ile 3 farklı stil (3d_animation, clay_animation, watercolor) üret. Stilin **sadece çizim estetiğini** etkilediğini doğrula -- sahne aksiyonunu değil.

**Statik analiz (T3-analiz):** 3 stilin tüm direktifleri tarandı:

| Stil | `getStyleSpecificDirectives` | `usesCinematicImageLayers` | Sorun |
|------|------------------------------|---------------------------|-------|
| `3d_animation` | Pixar-style 3D, rounded shapes, rich appealing colors, soft shadows | ✅ sinematik | Temiz |
| `watercolor` | Transparent watercolor, soft brushstrokes, paper texture visible | ✅ sinematik | Temiz |
| `clay_animation` | ~~Clay-like texture, fingerprints visible, matte finish, **stop-motion**~~ → **claymation handcrafted look** | ✅ sinematik | ⚠️ Fix uygulandı |

**Uygulanan düzeltme (v1.27.0):**

| # | Sorun | Çözüm | Dosya |
|---|-------|-------|-------|
| S1 | `clay_animation`: "stop-motion" kelimesi → model sahneyi dondurulmuş / hareketsiz kare olarak yorumlayabilir; dinamik aksiyon azalır | "stop-motion aesthetic" → "claymation handcrafted look" (hem `STYLE_DESCRIPTIONS` hem `getStyleSpecificDirectives`) | `style-descriptions.ts` + `scene.ts` |
| S2 | `get3DAnimationNotes` kullanılmıyordu | Önce `scene.ts` import temizlendi; P2’de `style-descriptions.ts` içindeki fonksiyon da kaldırıldı | `style-descriptions.ts` |

**3d_animation ve watercolor:** Stil direktiflerinde sahne aksiyonunu, pozu veya kompozisyonu kısıtlayan ifade yok. İzolasyon sağlanmış.

**Test (T3):** Aynı story + sayfa ile 3 stilde görsel üret → sahne aksiyonu/kompozisyonu aynı kalıyor mu kontrol et (subjektif görsel karşılaştırma).

---

### ✅ FAZ 4 -- Kapak özel iyileştirme — **Tamamlandı (4 Nisan 2026)**

**Ne?** Kapak prompt'u iç sayfa şablonundan tamamen bağımsız hale getir. Görsel API `quality` parametresi **değiştirilmez** — kapak için `high` veya benzeri bir yükseltme **planlanmıyor** (ürün politikası).

| Alan | İyileştirme |
|------|-------------|
| Prompt yapısı | Kapak = poster-layout + stil + SADECE hikayenin en dramatik anı |
| coverImagePrompt zorunluluğu | Faz 1.1 ile story tarafında zaten güçlendirilecek |
| Referans sayısı | Sadece karakter master'ları; entity master gönderme |

**Uygulanan değişiklikler (4 Nisan 2026):**

| # | Sorun | Çözüm | Dosya |
|---|-------|-------|-------|
| F4-1 | Entity master URL'leri kapak referans listesine ekleniyordu — model kapağı entity (arı, kavanoz vb.) etrafında kurguluyordu; karakter kimliği ve sahne seçimi bozulabiliyordu | Kapak referans listesi artık yalnızca `masterIllustrations` (karakter master'ları) içeriyor; entity master'lar hariç bırakıldı | `image-pipeline.ts` |
| F4-2 | Cover PATH [1]: `"Illustration style: ... Children's picture book, digital art."` genel satırı — iç sayfa ile farklı (daha zayıf) stil profili; sinematik/grafik ayrımı yoktu | `getGlobalArtDirection(illustrationStyle)` ile değiştirildi — interior sayfalarla aynı, stil dalına göre (sinematik / grafik) doğru profil | `scene.ts` v1.28.0 |
| F4-3 | Cover PATH [4] SCENE başında `buildStyleDirectives[0]` (~150 karakter) ekleniyor — [1]'deki `getGlobalArtDirection` zaten stil tanımını kapsıyor; bu tekrardı | `buildStyleDirectives[0]` satırı kaldırıldı | `scene.ts` v1.28.0 |

**T1'den not (story JSON, Faz 4 ile ilişkili):** Okuyucu özeti `coverDescription` bazen kapak görselinin odak nesnesinden sapabiliyor; Faz 4 öncesi veya paralelinde Faz 1.2'deki **V1** maddesi ile hizalamak, pazarlama / önizleme metninde de tutarlılık sağlar.

**Test (T4):** Kapak üret → kapak vs iç sayfa yan yana — poster hissi var mı? Entity (arı, kavanoz) kapak sahnesine müdahale ediyor mu?

---

## Uygulama sırası (güncel)

```
✅ FAZ 0   -> T0 (story) + T0b (görsel) -> GEÇTİ
         |
         v
✅ FAZ 2.1  Çelişki temizliği -> TAMAMLANDI (4 Nisan 2026)
         |
         v
       TEST T2a: Faz 2.1/2.2 sonrası pratikte T2b/T2c ile kapatıldı; ayrı “bekleyen” blok yok
         |
         v
✅ FAZ 1.1  Story anti-pattern kuralları -> TAMAMLANDI (4 Nisan 2026)
         |
         v
       TEST T1: ✅ Geçti (örnek koşu); küçük backlog -> Faz 1.2 notları (V1, V2)
         |
         v
✅ FAZ 2.2  7-blok prompt yapısı -> TAMAMLANDI (4 Nisan 2026)
         |
         v
       TEST T2b: Görsel karşılaştırma yapıldı; T2c ile uzunluk ölçümü tamamlandı
         |
         v
✅ FAZ 2.2b-A [SCENE] tekrar temizliği -> T2c GEÇTİ (4 Nisan 2026)
         |
         v
✅ FAZ 2.2b-B AVOID anatomi sadeleştirme → TAMAMLANDI (4 Nisan 2026)
         |
         v
✅ FAZ 1.3  Story staging + bakış hedefi; image negatif sadeleştirme -> TAMAMLANDI (4 Nisan 2026)
         |
         v
✅ FAZ 3    Stil izolasyon analizi + clay_animation stop-motion fix -> TAMAMLANDI (4 Nisan 2026)
         |
         v
       TEST T3: Statik analiz tamamlandı; clay_animation fix uygulandı; görsel test opsiyonel
         |
         v
✅ FAZ 1.2  Diversity validator → TAMAMLANDI (4 Nisan 2026)
         |
✅ FAZ 4    Kapak özel iyileştirme -> TAMAMLANDI (4 Nisan 2026)
```

---

## Maliyet tahmini

| Değişiklik | Ek maliyet (kitap başına) |
|------------|--------------------------|
| gpt-4.1 (mini yerine) story | +~$0.06 |
| Toplam (şu anki plan) | **+~$0.06/kitap** |

---

## İlişkili dokümanlar

- `STORY_GENERATION_DEV_ROADMAP.md` -- story A/B/C/D
- `PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md` -- önceki A1-A12 prompt analizi
- `IMAGE_STEPS_REQUEST_RESPONSE_ANALYSIS.md` -- görsel adım sözleşmeleri
- `MASTER_ILLUSTRATION_CONTRACT.md` -- master M1-M3
