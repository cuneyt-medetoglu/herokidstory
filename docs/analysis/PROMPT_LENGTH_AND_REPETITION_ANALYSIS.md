# Prompt Uzunluğu ve Tekrar Analizi

**Tarih:** 8 Şubat 2026  
**Kaynak:** GPT cevapları + Agent incelemesi + trace verileri + **GPT Playground denemeleri** (sinematik 3D storybook dili)  
**Trace:** `kidstorybook-trace-2026-02-07T21-54-35.json` (12 sayfa, 3d_animation, 1 yaş)  
**Durum:** Değerlendirme, aksiyon önerisi, Playground reçetesi plana eklendi. **İlerleme:** Öncelik tablosuna göre uygulama yapılıyor; yapıldıkça bu bölüm güncellenir.

---

## Uygulama Durumu (güncel)

| Aksiyon | Durum | Tarih | Not |
|---------|--------|-------|-----|
| **A4** – Öncelik merdiveni | ✅ Yapıldı | 8 Şubat 2026 | `lib/prompts/image/scene.ts`: generateFullPagePrompt başına PRIORITY satırı. v1.12.0. |
| **A2** – Cover tekrar düzeltme | ✅ Yapıldı | 8 Şubat 2026 | route.ts: customRequests tek yerde. scene.ts: getEnvironmentDescription(useFullSceneDesc), generateLayeredComposition(midgroundOverride), buildSceneContentSection COVER SCENE tek blok. v1.13.0. |
| **A3** – Story prompt sadeleştirme | ✅ Yapıldı | 8 Şubat 2026 | lib/prompts/story/base.ts: # VERIFICATION CHECKLIST tek blok; LANGUAGE verify cümlesi kaldırıldı; OUTPUT FORMAT kuyruk kısaltıldı; karakter bloğunda VERIFICATION satırı kaldırıldı. v2.2.0. |
| **A10** – Referans görsel sırası | ✅ Yapıldı | 8 Şubat 2026 | Sıra zaten doğru: [0] karakter master, [1..] entity master. app/api/books/route.ts cover + pages bloklarına A10 yorumu eklendi. |
| **A7** – GLOBAL_ART_DIRECTION + template | ✅ Yapıldı | 8 Şubat 2026 | style-descriptions: getGlobalArtDirection(illustrationStyle); scene.ts generateFullPagePrompt’a PRIORITY sonrası enjekte. v1.14.0. |
| **A1** – Image prompt konsolidasyonu | ✅ Yapıldı | 8 Şubat 2026 | SHOT PLAN + COMPOSITION RULES short + AVOID short; Composition&Depth, Camera&Perspective, CharacterEnvironmentRatio kaldırıldı. v1.15.0. |
| **A8** – SHOT_PLAN alanları | ✅ Yapıldı | 8 Şubat 2026 | buildShotPlanBlock(sceneInput, isCover, previousScenes): shotType, lens, cameraAngle, placement, 25-30% scale, timeOfDay, mood. v1.15.0. |
| **A11** – Parmak stratejisi | ✅ Yapıldı | 8 Şubat 2026 | negative.ts: getDefaultHandStrategy(), getHandDirectivesWhenVisible(). (Tarihsel: v1.16’da ayrıca scene builder ile bağlanmıştı; v1.24+ iç sayfa 7-blok, v1.30+ `buildAnatomicalAndSafetySection` kaldırıldı.) v1.16.0 / negative v1.3.0. |
| **A9** – Layout-safe master | ✅ Yapıldı | 8 Şubat 2026 | config: masterLayout.characterScaleMin/Max (25–30). lib/prompts/image/master.ts: getLayoutSafeMasterDirectives(). route.ts master prompt’a eklendi. Testte çok küçük kalırsa config’ten büyüt (örn. 30–35). |
| **A5** – shotPlan schema (LLM) | ✅ Yapıldı | 8 Şubat 2026 | Story: shotPlan OUTPUT FORMAT + VERIFICATION’da zorunlu. types: ShotPlan, StoryPage.shotPlan. scene.ts: buildShotPlanBlock(sceneInput.shotPlan); API shotPlan geçiriyor; yoksa fallback. |
| **A12** – input_fidelity | Karar verildi | — | Bkz. Bölüm 14, Madde 17: Master’da zaten high; gpt-image-1’e geçilmez. |
| **Prompts doküman = kod eşitlemesi** | ✅ Yapıldı | 8 Şubat 2026 | docs/prompts/STORY_PROMPT_TEMPLATE.md (2.3.0, shotPlan zorunlu, VERIFICATION CHECKLIST) ve IMAGE_PROMPT_TEMPLATE.md (1.17.0, PRIORITY/SHOT PLAN yapısı) kodla eşitlendi. |
| **Sıra 14** – Kapak ortamı hikayeden | ✅ Yapıldı | 8 Şubat 2026 | Plan A: coverSetting (story), route coverEnvironment = storyData.coverSetting; scene.ts getEnvironmentDescription(..., coverEnvironment); extractSceneElements priorityLocationKeywords (glacier, ice, space, ocean vb.). COVER_PATH_FLOWERS_ANALYSIS.md. |
| **Sıra 15** – Sayfa FOREGROUND İngilizce | ✅ Yapıldı | 8 Şubat 2026 | route.ts: characterActionRaw = sceneContext → sceneDescription → imagePrompt → page.text; FOREGROUND’a Türkçe metin gitmiyor. |
| **Sıra 16** – Çelişkili stil ifadeleri | ✅ Yapıldı | 8 Şubat 2026 | Tek stil profili (filmic, controlled saturation). style-descriptions + scene.ts: vibrant/high contrast → rich, clear, moderate; dramatic → clear/defined. v1.19.0. |
| **Sıra 17** – Story JSON validation + kelime sayısı | ✅ Güncellendi Şubat 2026 | route.ts: suggestedOutfits ve characterExpressions REQUIRED; eksikse retry. Kelime sayısı sadece log; **repair kaldırıldı** (ilk istekte doğru gelmesi VERIFICATION CHECKLIST + STORY REQUIREMENTS ile hedefleniyor). Bkz. WORD_COUNT_REPAIR_ANALYSIS.md. |
| **Sıra 19** – Allow relighting | ✅ Yapıldı | 8 Şubat 2026 | scene.ts: Interior sayfa prompt'una relighting cümlesi (reference face/hair/outfit only; allow relighting). v1.20.0. |

**Sıradaki adım:** Sıra 13–19 tamamlandı. Bölüm 14 Trace aksiyonları tamamlandı; sonrasında 14.2 genel eşitleme ve doküman güncellemesi yapılabilir.

---

## 1. Mevcut Durum – Sayılarla

| Metrik | Değer | Yorum |
|--------|-------|-------|
| Story LLM userPrompt | ~9,859 karakter | Uzun; %40-50'si checklist/verify tekrarı |
| Story LLM toplam token | 5,020 (prompt+completion) | Makul maliyet ama gürültü oranı yüksek |
| Cover image prompt | ~6,000+ karakter | Çok uzun; customRequests metni 3-4 kez tekrar ediyor |
| Sayfa image prompt | ~5,000+ karakter | Her sayfa için neredeyse aynı yapısal bloklar |
| Image prompt "sabit blok" oranı | ~%70-80 | Her sayfada tekrar eden yapısal kurallar |
| Image prompt "sahne-özel" oranı | ~%20-30 | Asıl sinematik değer burası |

---

## 2. GPT'nin Söyledikleri – Kendi Değerlendirmem

### 2a. "Prompt çok uzun mu?" → GPT: Evet, özellikle LLM tarafında

**GPT diyor:** Uzunluk tek başına kötü değil ama "uzun + çok kural + çelişki" birleşince modelin odağı dağılıyor.

**Benim değerlendirmem: Katılıyorum, ama asıl sorun image tarafında.**

Story prompt'ta sorun "gürültü/çakışma oranı" – GPT haklı. Ama trace'e baktığımda image prompt asıl şişkin olan. Her sayfa için **~5,000 karakter** gidiyor ve bunun %70-80'i sabit bloklar:

- `[SCENE_ESTABLISHMENT]` – her sayfada aynı "expansive sky visible, dramatic clouds…" (~400 karakter)
- `[COMPOSITION_DEPTH]` – her sayfada aynı "35mm lens, f/5.6 aperture…" (~600 karakter)
- `[CAMERA_PERSPECTIVE]` – her sayfada aynı "rule of thirds, character 25-35% of frame…" (~300 karakter)
- `[CHARACTER_ENVIRONMENT_RATIO]` – her sayfada aynı "character occupies 25-35%…" (~400 karakter)
- Style description – her sayfada aynı "Pixar-style 3D animation…" (~350 karakter, 2 kez tekrar)
- Cinematic pack – her sayfada aynı "cinematic key light, volumetric sun rays…" (~200 karakter)
- Character integration + cinematic natural – her sayfada aynı (~300 karakter)
- Clothing/consistency/final directives – her sayfada aynı (~200 karakter)

**Toplam sabit: ~2,800+ karakter. Sahne-özel içerik: ~1,500 karakter.**

Yani modelin okuduğu prompt'un %70'i "her sayfada aynı yapısal kural" ve %30'u "bu sayfanın asıl sahnesi". Senin sezgin tam da bu: **model gereksiz zorlanıp ana odaktan (sahne + sinematik) uzaklaşıyor**.

### 2b. Cover prompt'ta customRequests 3-4 kez tekrar ediyor

Cover prompt'unda customRequests metni (tam paragraf) şu yerlerde geçiyor:
1. MIDGROUND bölümünde (tam metin)
2. BACKGROUND bölümünde (tam metin)
3. Scene content bölümünde (tam metin)
4. sceneDescription parametresinde (tam metin)

Bu ~500 karakterlik paragraf 4 kez = ~2,000 karakter sadece aynı metnin tekrarı.

### 2c. "Her sayfa için tekrar gerekli mi?" → GPT: Kısmen, ama bugünkü hali fazla

**GPT diyor:** GPT-Image bağımsız çalıştığı için her çağrıda global kuralların olması normal. Ama master reference zaten karakter görünümünü taşıyor; üstüne metinle tekrar detay vermek "referans mı metin mi?" çatışması yaratıyor.

**Benim değerlendirmem: Katılıyorum. İki ek nokta:**

1. **Composition/depth/ratio blokları birbirini tekrarlıyor.** `[COMPOSITION_DEPTH]` zaten foreground/midground/background anlatıyor; `[CHARACTER_ENVIRONMENT_RATIO]` aynı şeyi "character 25-35%" perspektifinden söylüyor; `[SCENE_ESTABLISHMENT]` zaten sahneyi kuruyor. Üç ayrı blok aslında aynı mesajı üç farklı açıdan veriyor.

2. **Style description 2 kez tam metin olarak geçiyor.** Bir kez ILLUSTRATION STYLE başlığında, bir kez de layered composition'ın background bölümünde. Bu birebir tekrar.

### 2d. GPT'nin "Master quality" yorumu – planda yok

**GPT aynı incelemede:** Master'da quality: low kullanımından bahsetti. Bu dokümanın konusu (prompt uzunluğu/tekrar) ile ilgili değil; API parametresi. **Plandan çıkarıldı** – quality low/medium/high veya model 1 vs 1.5 kararları bu analiz kapsamında değil.

---

## 3. Sorun Özeti (Öncelik Sırasıyla)

| # | Sorun | Etki | Çözüm zorluğu |
|---|-------|------|----------------|
| S1 | Image prompt %70 sabit blok, %30 sahne | Model sahneye odaklanamıyor | Orta |
| S2 | Aynı bilgi 2-3 farklı blokta tekrar | Gürültü artıyor | Kolay |
| S3 | Cover'da customRequests 3-4 kez tekrar | Gereksiz şişkinlik | Kolay |
| S4 | Story prompt'ta checklist/verify tekrarları | LLM odağı dağılıyor | Orta |
| S5 | LLM'den gelen imagePrompt kısa ve yüzeysel | Sinematik plan eksik | Zor (LLM output'u değiştirir) |
| S6 | Öncelik merdiveni yok (conflict resolution) | Model çelişkilerde rasgele seçiyor | Kolay |

---

## 4. Aksiyon Planı

### A1 – Image Prompt Konsolidasyonu (S1 + S2) ⭐ En Büyük Kazanım ✅ Yapıldı (8 Şubat 2026)

**Ne:** 17 ayrı section builder'ı birleştirip 5-6 temiz blok yap.

**Önce (mevcut):**
```
[SCENE_ESTABLISHMENT] → ~400 kar, her sayfada aynı
[ANATOMY] → ~150 kar, her sayfada aynı  
[COMPOSITION_DEPTH] → ~600 kar, her sayfada aynı
[CAMERA_PERSPECTIVE] → ~300 kar, her sayfada aynı
[CHARACTER_ENVIRONMENT_RATIO] → ~400 kar, her sayfada aynı
ILLUSTRATION STYLE → ~350 kar, her sayfada aynı (2x tekrar)
CINEMATIC_PACK → ~200 kar, her sayfada aynı
CHARACTER_INTEGRATION → ~300 kar, her sayfada aynı
SCENE_CONTENT (layered) → ~800 kar, sahne-özel
[CHARACTER_EXPRESSIONS] → ~200 kar, sahne-özel
SPECIAL_PAGE_DIRECTIVES → ~200 kar, duruma göre
CHARACTER_CONSISTENCY → ~150 kar, her sayfada aynı (tekrar)
SCENE_DIVERSITY → ~100 kar, duruma göre
CLOTHING → ~100 kar, her sayfada aynı
FINAL_DIRECTIVES → ~100 kar, her sayfada aynı
= ~4,350+ karakter
```

**Sonra (hedef):**
```
[SCENE] → Sahne + ışık + zaman + atmosfer (~300 kar, sahne-özel) ← EN ÖNEMLİ BLOK
[SHOT] → Kamera açısı + kompozisyon + karakter oranı (~200 kar, sayfa-özel)
[CHARACTER] → İfade + poz (~150 kar, sahne-özel)
[STYLE] → Stil + sinematik kalite (~200 kar, sabit ama 1 kez)
[RULES] → Anatomi + safety + clothing + consistency (~200 kar, sabit ama 1 kez)
= ~1,050 karakter (hedef: %60-70 kısalma)
```

**Prensip:** Sahne-özel içerik önce ve uzun, sabit kurallar kısa ve sonda.

### A2 – Cover customRequests Tekrar Düzeltmesi (S3) ✅ Yapıldı (8 Şubat 2026)

**Ne:** `generateLayeredComposition` ve cover scene description'da customRequests/uzun metni yalnızca 1 yere koy, diğer yerlerde referans ver.

**Beklenen kazanım:** Cover prompt ~1,500-2,000 karakter kısalır.

**Uygulama:** route.ts: customRequests tek blok (`Story: ${customRequests}. `). scene.ts: `getEnvironmentDescription(theme, sceneDesc, useFullSceneDesc)` (cover’da false); `generateLayeredComposition(..., midgroundOverride)` (cover’da kısa metin); `generateScenePrompt(..., isCover)`; `buildSceneContentSection(..., sceneInput, isCover)` cover’da tek “COVER SCENE:” bloğu. v1.13.0.

### A3 – Story Prompt Sadeleştirme (S4) ✅ Yapıldı (8 Şubat 2026)

**Ne:** Story LLM prompt'undaki tekrarlı "verify/check/before returning" maddelerini tek bir VERIFICATION bloğuna topla.

**Mevcut tekrarlar (giderildi):**
- "characterIds REQUIRED per page" → 3 kez geçiyordu
- "verify page text is in Turkish" → 2 kez geçiyordu
- "characterExpressions has one entry per character" → 2 kez geçiyordu
- "suggestedOutfits has one entry per character" → 2 kez geçiyordu

**Hedef:** Tüm verification kuralları tek bir `# VERIFICATION CHECKLIST` bloğu altında, 1 kez.

**Uygulama:** LANGUAGE'dan "Before returning JSON: verify..." kaldırıldı. OUTPUT FORMAT sonundaki uzun REQUIRED satırları "Required fields: see # VERIFICATION CHECKLIST below." ile değiştirildi. buildCriticalRemindersSection → buildVerificationChecklistSection; başlık "# VERIFICATION CHECKLIST (before returning JSON)". Karakter bloğundaki "**VERIFICATION:** Before returning JSON..." satırı kaldırıldı. v2.2.0.

### A4 – Öncelik Merdiveni (S6)

**Ne:** Image prompt'un en başına tek satırlık priority kuralı ekle:

```
PRIORITY: If any conflict, follow this order: 1) Scene composition & character scale, 2) Environment richness & depth, 3) Character action & expression, 4) Reference identity match.
```

Bu, modelin "referans kopyalama vs sahne kompozisyonu" çatışmasında doğru seçimi yapmasını sağlar.

### A5 – LLM'den shotPlan Almak (S5) ✅ Yapıldı (8 Şubat 2026)

**Ne:** LLM'den sayfa başına yapılandırılmış `shotPlan` objesi almak (story JSON'da zorunlu); `buildShotPlanBlock` bunu kullanır, yoksa fallback. Örnek schema:

```json
{
  "shotType": "wide",
  "cameraAngle": "low-angle", 
  "subjectScale": "25%",
  "timeOfDay": "golden hour",
  "lighting": "warm rim light from behind",
  "mood": "wonder",
  "keyAction": "Arya reaching for the glowing door",
  "environment": "grand hallway with towering bookshelves"
}
```

`buildShotPlanBlock(sceneInput, isCover, previousScenes)` bu veriyi kullanarak SHOT PLAN satırını üretir; shotPlan yoksa sayfa/tema/previousScenes ile fallback.

**Uygulama:** Story OUTPUT FORMAT + VERIFICATION’da shotPlan zorunlu; types ShotPlan/StoryPage; scene.ts buildShotPlanBlock; API sceneInput.shotPlan geçiriyor. Fallback: PROMPT_OPTIMIZATION_GUIDE.md “shotPlan yoksa fallback” bölümü.

*(A6 – Master quality: plandan çıkarıldı; konu prompt ile ilgili değil.)*

---

## 5. Öncelik ve Sıralama

| Sıra | Aksiyon | Etki | Risk |
|------|---------|------|------|
| 1 | **A4** – Öncelik merdiveni | Düşük efor, hemen etkili | Çok düşük |
| 2 | **A2** – Cover tekrar düzeltme | Kolay, net kazanım | Düşük |
| 3 | **A3** – Story prompt sadeleştirme | Kolay, net kazanım | Düşük |
| 4 | **A1** – Image prompt konsolidasyonu | ⭐ En büyük kazanım ama dikkatli refactor | Orta (regression riski) |
| 5 | **A5** – shotPlan schema | Büyük mimari değişiklik | Yüksek |

---

## 6. GPT'nin Söylediği Ama Benim Farklı Düşündüğüm Noktalar

| GPT Önerisi | Benim Görüşüm |
|-------------|----------------|
| "LLM prompt'unu %40-60 kısalt" | Katılıyorum ama image prompt'u kısaltmak daha acil ve etkili. Story prompt çıktısı zaten makul; image prompt her sayfa için devasa. |
| "shotPlan objesi al, sinematik prompt'u sen üret" | Doğru yön ama büyük değişiklik. Önce mevcut prompt'u konsolide et (A1), sonra shotPlan'a geç. |
| (Master quality – A6) | Plandan çıkarıldı; konu prompt değil, API/config. |
| "Global kuralları bir kere tanımla, per-page sadece değişkenler" | Tam olarak A1'in amacı. GPT ile aynı sayfadayız. |
| "Match reference metnini yumuşat" | Biz bunu zaten yaptık (7 Şubat güncellemesi). Prompt'ta "ONLY for identity, do NOT copy pose/expression" var. Ama tekrar sayısı hala fazla. |

---

## 7. Sonuç

Senin sezgin doğru: **prompt uzunluğu ve tekrar oranı, sinematik kalite hedefine göre ters orantılı çalışıyor.** Model, sahne ve kompozisyon yerine "kuralları tutturma" moduna kayıyor.

En büyük kazanım **image prompt konsolidasyonu (A1)** olacak – ama riskli. Güvenli başlangıç: **A4 (öncelik merdiveni) + A2 (cover tekrar) + A3 (story sadeleştirme)** ile başla, sonra A1'e geç.

**Bir cümleyle:** Prompt'ta "ne yapma" kuralları uzun, "ne yap" (sahne/sinematik) kısa. Bunu tersine çevirmeliyiz.

---

## 8. GPT Playground Bulguları – Sinematik Paket (3D Animation)

**Kaynak:** Kullanıcının GPT Playground’da deneyip beğendiği (1) ve (3) sinematik görseller; GPT’nin bu sonuçları nasıl elde ettiğini açıklaması.  
**Not:** Aynı sinematik dil tüm illustration stilleri için uyarlanabilir (3D Animation burada örnek).

### 8.1 Neden işe yarıyor?

Playground’daki prompt’larda **odak net:** (Shot → Layout → Lighting → Depth → Grade → Avoid). Eşit ağırlıklı çok kural yok; model “neye öncelik vereceğini” biliyor.

| Bileşen | Playground’da ne yapıldı |
|---------|---------------------------|
| Shot | wide establishing, 24–35mm lens |
| Layout | karakter küçük (25–30%), left/right third, rule of thirds, not centered |
| Depth | layered foreground/midground/background, deep focus |
| Lighting | golden hour volumetric / night moonlight + warm bounce |
| Grade | warm cinematic / deep blues with warm accents |
| Avoid | close-up, centered, chibi, flat lighting, neon, text |

### 8.2 Tekrar: Ne tekrarlanmalı, ne tekrarlanmamalı

| Tekrarla (kısa) | Tekrarlama |
|-----------------|------------|
| Stil çekirdeği (tek cümle): “Cinematic 3D animated storybook illustration (feature-film still)…” | Karakter saç/göz/ten detayını paragraf paragraf yazmak |
| Kompozisyon çekirdeği: “Wide establishing shot, characters 25–30% height, rule of thirds, not centered” | “Exact same face” benzeri cümleleri 5 farklı şekilde yazmak |
| Global negatifler: “no close-up portrait, no chibi, no text/watermark” | Master referans varken “kıyafet şöyle, saç böyle” metnini uzatmak |
| Kimlik koruma: “Preserve identity/outfit from reference; do not redesign” | — |

### 8.3 “Kocaman karakter” neden oluyor?

1. **Master referansın kadrajı** – Master full-body ama kadrajı dolduruyorsa model sayfada da büyütüyor.  
2. **“Match face/outfit” aşırı baskın** – Model kimliği korumak için karakteri öne çekiyor.  
3. **“Wide shot” yeterince bağlayıcı değil** – 24–28mm / 35mm + “no zoom-in” + “full body visible” birlikte daha iyi kilitliyor.

**Pratik çözüm:** Layout-safe master: karakter 25–30% yükseklikte, etrafında çok negatif alan; sayfalarda bu master referans ver. Negatiflere ekle: “waist-up framing, medium shot, close-up, character too large, portrait crop”.

### 8.4 Parmak (5’ten fazla / eksik / birleşik)

- **En etkili:** Eli vurgulamamak – “Hands at sides, relaxed, partially out of frame, no hand gestures, not holding objects”.  
- **Gerekirse:** Hand repair pass – ilk üretimden sonra sadece el bölgesi mask ile inpainting (images/edits).  
- **Eller görünürse:** “exactly five fingers per hand, visible gaps, natural joints, no extra digits, no fused fingers” + “Avoid: extra fingers, six fingers, malformed hands”.

**Öneri:** Varsayılan = el sakla; bazı sayfalarda şartsa mask repair pass.

### 8.5 Referans görsel sırası

OpenAI dokümanına göre çoklu image input’ta **ilk görsel daha zengin detayla korunabiliyor.**  
- `image[0]` = karakter master  
- `image[1..]` = entity master’lar  

Bu sıra kimlik ve stil tutarlılığı için kullanılmalı.

### 8.6 input_fidelity

`input_fidelity` gpt-image-1 için destekleniyor; gpt-image-1.5’te yoksayılıyor olabilir. Kimlik korumayı sıkı istiyorsan: master karakter üretiminde **gpt-image-1 + input_fidelity: high** denemeye değer (özellikle yüz).

---

## 9. Sinematik Paket – Kopyala-Yapıştır Blokları

Aşağıdaki bloklar, Playground’da işe yarayan dili pipeline’a (master → cover → pages) sistematik sokmak için kullanılabilir. **3D Animation** için örnek; diğer stiller için aynı yapı, stil cümlesi değiştirilerek uygulanır.

### 9.1 GLOBAL_ART_DIRECTION (kitap geneli – tek sabit string)

```
Cinematic 3D animated storybook illustration, like a high-quality animated film still (stylized, NOT live-action photo).
Deep focus with crisp environment detail, layered depth (foreground/midground/background).
Soft cinematic lighting, gentle bloom, subtle filmic vignette, rich but controlled color grading.
No text, no watermark, no UI.
Avoid: close-up portrait, headshot, centered composition, chibi big-head proportions, flat lighting, neon oversaturation.
Preserve identity/outfit from the provided reference images; do not redesign the character.
```

Not: “photorealistic” canlı çekim hissini tetikleyebilir; “stylized, NOT live-action photo” net fren.

### 9.2 SHOT_PLAN (sayfa başına – LLM’den veya koddan)

Her sayfa için üretilecek alanlar (kısa):

| Alan | Örnek değerler |
|------|------------------|
| shotType | wide establishing |
| lens | 24–28mm veya 35mm |
| cameraAngle | eye-level / slightly above ground |
| characterPlacement | left third / lower-right third |
| characterScale | 25–30% frame height |
| timeOfDay | morning / golden hour / dusk |
| mood | wonder / excitement / calm |

### 9.3 buildFullPagePrompt şablonu (kısa tekrar + uzun sahne)

```
{GLOBAL_ART_DIRECTION}

SHOT PLAN:
{shotType}. {lens} lens look. Camera: {cameraAngle}.
Characters are SMALL (25–30% of frame height). Placement: {placement}. Not centered.

SCENE:
{sceneDescription}  (environment-first; lots of setting detail)

LIGHTING & COLOR:
{lighting}. Color grade: {colorGrade}.

COMPOSITION RULES:
Environment dominates (65–75%). Strong leading lines, rule of thirds, no zoom-in.

AVOID:
character filling the frame, close-up portrait framing, extra limbs, messy anatomy, blurry background, neon saturation, text/watermark.
```

Kritik fark: **kimlik/appearance tek cümle**, **scene + shot + lighting asıl ağırlık**.

### 9.4 Layout-safe master prompt (karakter %25–30, büyük boşluk)

Master üretimde kullanılacak: karakter 25–30% yükseklikte, etrafında çok negatif alan; böylece sayfalarda “kocaman karakter” azalır.  
Negatiflere ekle: “waist-up framing, medium shot, close-up, character too large, portrait crop”.

(Kitap sayfası portrait 1024x1536 ise master da aynı aspect’te, karakter küçük, boşluklu üretilebilir.)

---

## 10. Plandaki Yeni Aksiyonlar (Playground’dan)

Aşağıdakiler mevcut A1–A6’ya ek; öncelik sırası güncel tabloda.

### A7 – GLOBAL_ART_DIRECTION sabiti ve template uyumu ✅ Yapıldı (8 Şubat 2026)

**Ne:** `lib/prompts/image/` içinde tek seferlik `GLOBAL_ART_DIRECTION` string’i tanımla (stil bazlı: 3d_animation, vb.). `generateFullPagePrompt` (veya yeni buildFullPagePrompt) bu global’i + SHOT_PLAN + SCENE + LIGHTING + AVOID şablonuna göre birleştirsin.  
**Amaç:** Playground’daki “kısa tekrar + uzun sahne” yapısını koda taşımak; A1 ile uyumlu.

### A8 – SHOT_PLAN alanları (LLM veya kod) ✅ Yapıldı (8 Şubat 2026)

**Ne:** Sayfa başına shotType, lens, cameraAngle, characterPlacement, characterScale, timeOfDay, mood (ve isteğe lighting, colorGrade) üret. LLM JSON’a `shotPlan` objesi eklenebilir (A5 ile birleşebilir) veya mevcut sceneDescription/imagePrompt’tan koddan türet.  
**Amaç:** Sinematik dilin deterministik ve kısa kalması.

### A9 – Layout-safe character master ✅ Yapıldı (8 Şubat 2026)

**Ne:** Master karakter üretiminde kadrajı “karakter 25–30% yükseklik, büyük boşluk” olacak şekilde prompt + negatiflerle zorla. Sayfalarda bu master referans ver.  
**Amaç:** “Kocaman karakter” problemini azaltmak.

### A10 – Referans görsel sırası ✅ Yapıldı (8 Şubat 2026)

**Ne:** API’ye gönderilen image listesinde sıra: `[0]` karakter master, `[1..]` entity master’lar. Mevcut kodu kontrol et; gerekirse sırayı sabitle.  
**Amaç:** İlk görselin daha iyi korunmasından faydalanmak.

### A11 – Parmak stratejisi (varsayılan: el vurgulama, opsiyonel: mask repair) ✅ Yapıldı (8 Şubat 2026)

**Ne:**  
- Varsayılan: “Hands at sides, relaxed, partially out of frame, no hand gestures, not holding objects” (ve mevcut anatomical/negative prompt’larla uyumlu).  
- Eller görünürse: “exactly five fingers per hand, visible gaps, natural joints…” + “Avoid: extra fingers, six fingers, malformed hands”.  
- İleride (opsiyonel): Kalite kontrol sonrası bozuk el varsa mask ile hand-fix inpainting çağrısı.  
**Amaç:** Parmak hatalarını azaltmak; Playground yorumu ile uyumlu.

### A12 – input_fidelity (master’da, deneme)

**Ne:** Master karakter için gpt-image-1 + `input_fidelity: high` denemek (gpt-image-1.5’te parametre yoksayılıyorsa dokümantasyon notu düş).  
**Amaç:** Yüz/kimlik korumayı güçlendirmek; önce deneme, sonra karar.

---

## 11. Güncel Öncelik ve Sıralama

**Tamamlanan:** A4, A2, A3, A10, A7, A1, A8, A11, A9, A5, **Sıra 13**, **Sıra 14**, **Sıra 15**, **Sıra 16**, **Sıra 17**, **Sıra 19** (8 Şubat 2026). Bölüm 14 Trace aksiyonları tamamlandı.

| Sıra | Aksiyon | Etki | Risk | Durum |
|------|---------|------|------|--------|
| 1 | **A4** – Öncelik merdiveni | Düşük efor, hemen etkili | Çok düşük | ✅ Yapıldı |
| 2 | **A2** – Cover tekrar düzeltme | Kolay, net kazanım | Düşük | ✅ Yapıldı |
| 3 | **A3** – Story prompt sadeleştirme | Kolay, net kazanım | Düşük | ✅ Yapıldı |
| 4 | **A10** – Referans görsel sırası | Kolay, dokümantasyon + kod kontrolü | Çok düşük | ✅ Yapıldı |
| 5 | **A7** – GLOBAL_ART_DIRECTION + template | Sinematik paketi koda taşır; A1 ile uyumlu | Orta | ✅ Yapıldı |
| 6 | **A1** – Image prompt konsolidasyonu | En büyük kazanım; A7/A8 ile birlikte düşünülmeli | Orta | ✅ Yapıldı |
| 7 | **A8** – SHOT_PLAN alanları | A5 ile birlikte: buildShotPlanBlock kullanıyor | Orta | ✅ Yapıldı |
| 8 | **A11** – Parmak stratejisi | Varsayılan prompt; opsiyonel mask repair ileride | Düşük | ✅ Yapıldı |
| 9 | **A9** – Layout-safe master | “Kocaman karakter” azalır | Orta | ✅ Yapıldı |
| 10 | **A5** – shotPlan schema (LLM) | Story'de shotPlan zorunlu; API → scene; yoksa fallback | Yüksek | ✅ Yapıldı |
| 11 | **A12** – input_fidelity denemesi | Bölüm 14 Madde 17: karar verildi, aksiyon yok | — | Karar verildi |
| 13 | **Prompts doküman = kod eşitlemesi** | docs/prompts/*.md ile lib/prompts/* aynı olmalı | Düşük | ✅ Yapıldı (8 Şubat 2026) |

---

## 12. Kısa Özet (Playground + Plan)

- **Playground’da işe yaran:** Shot → Layout → Lighting → Depth → Grade → Avoid odaklı, kısa tekrar + uzun sahne.  
- **Planda buna karşılık gelenler:** GLOBAL_ART_DIRECTION (A7), SHOT_PLAN/buildFullPagePrompt şablonu (A7, A8), layout-safe master (A9), referans sırası (A10), parmak stratejisi (A11).  
- **Tüm illustration stilleri** için aynı yapı kullanılabilir; sadece stil cümlesi (örn. 3D Animation vs diğer) değişir.

---

## 13. Test Zamanlaması ve Dokümantasyon

### Ne zaman test yapmalıyım?

| Zaman | Ne yap | Amaç |
|--------|--------|------|
| **Her aksiyon sonrası (A4, A2, A3, A7, A1…)** | Hızlı smoke: 1 kitap veya 2–3 sayfa üret; hata / timeout yok mu bak. | Prompt kırılmadığını doğrula. |
| **Bir grup aksiyon sonrası (örn. A7 + A1)** | Orta test: Tam kitap üret; cover + sayfa görsellerine göz at. | Yapısal değişikliklerin görsel çıktıyı bozmadığını kontrol et. |
| **Tüm prompt aksiyonları bittikten sonra veya release öncesi** | Tam test: Tam kitap, farklı yaş/stil; kalite ve tutarlılık kontrolü. | Nihai kalite ve dokümantasyonla uyum. |

**Özet:** Her değişiklikten sonra kısa smoke test yeterli; büyük testi (tam kitap + kalite) tüm aksiyonlar bittikten veya release öncesi yap.

### Prompts doküman = kod eşitlemesi (en son)

- **Ne:** `docs/prompts/` (IMAGE_PROMPT_TEMPLATE.md, STORY_PROMPT_TEMPLATE.md vb.) ile `lib/prompts/` (scene.ts, story/base.ts vb.) içerik ve yapı olarak eşitlenmeli; doküman tek kaynak değil, kod tek kaynak – doküman kodu yansıtmalı.
- **Ne zaman:** Tüm aksiyonlar (en azından A1, A8 ve isteğe bağlı A5) tamamlandıktan **sonra**. Önce kod stabil olsun, sonra doküman güncellenir.
- **Yapılacaklar listesinde:** Öncelik tablosunda **Sıra 13 – En son** olarak eklendi.

---

## 14. Sıra 13 Sonrası – GPT Trace Takip Aksiyonları (8 Şubat 2026)

Trace incelemesi (kidstorybook-trace-2026-02-08T13-48-30.json) ve kod karşılaştırması sonrası, **Sıra 13 (Prompts doküman = kod eşitlemesi) tamamlandıktan sonra** yapılacaklar. Aynı öncelik tablosu formatında:

| Sıra | Aksiyon | Etki | Risk | Durum |
|------|---------|------|------|--------|
| 14 | **Kapak ortamı hikayeden (Cover environment from story)** | Kapak BACKGROUND şu an tema şablonundan (adventure = forest, wildflowers); hikaye buz/uzay/deniz olsa bile orman+çiçek çıkıyor. **Fix:** Kapak için environment'ı hikayeden türet (coverEnvironment veya sceneDesc özeti); locationKeywords'e glacier/ice/space/ocean ekle; tema şablonu sadece fallback. Detay: `docs/analysis/COVER_PATH_FLOWERS_ANALYSIS.md`. | Yüksek (UX) | ✅ Yapıldı (8 Şubat 2026) |
| 15 | **Sayfa prompt’unda Türkçe metin (FOREGROUND)** | characterAction = page.text (Türkçe) → FOREGROUND’a gidiyor; stil/token bozuyor. **Fix:** characterAction için İngilizce kaynak (sceneContext veya sceneDescription); page.text fallback olmamalı veya en son. | Düşük | ✅ Yapıldı (8 Şubat 2026) |
| 16 | **Çelişkili stil ifadeleri** | Aynı prompt’ta "vibrant saturated" + "controlled saturation", "soft cinematic" + "high contrast dramatic". Tek stil profili (örn. FILMIC_WARM_3D); çelişen cümleler kaldırılmalı (style-descriptions, getCinematicPack, getEnhancedAtmosphericDepth uyumlu hale getirilmeli). | Orta | ✅ Yapıldı (8 Şubat 2026) |
| 17 | **Story JSON validation + kelime sayısı** | characterIds, suggestedOutfits, characterExpressions REQUIRED; eksikse validation/retry. Sayfa metni kelime sayısı (getWordCountRange) kontrolü ve gerekirse kısa repair. | Orta | ✅ Yapıldı (8 Şubat 2026) |
| 18 | **A12 notu (model)** | **quality** master/cover/sayfa hep **low**. **input_fidelity** (referans sadakati) **high** kullanılıyor (route.ts). gpt-image-1'e geçilmez; pipeline gpt-image-1.5 ile devam eder. | — | Karar verildi |
| 19 | **Allow relighting** | Sayfa prompt’una "Use reference for face/hair/outfit only; do NOT copy lighting/background; allow relighting." (veya eşdeğeri) ekle. Magicalchildrensbook tarzı sahneye özel ışık/ton için; geliştirmesi düşük risk. | Düşük | ✅ Yapıldı (8 Şubat 2026) |

**Madde 5 (Allow relighting):** Plana eklendi (Sıra 19). Açıklama: `docs/guides/PROMPT_OPTIMIZATION_GUIDE.md` → “Relighting nedir?”.  
**Madde 7 (Prompt linter):** Planda yok (gerek yok). Açıklama rehberde referans için duruyor.

**Kapak tekrarı (orman yolu + çiçekler):** **Sıra 14** olarak planda; Trace aksiyonlarından (15–19) önce yapılacak. Kök neden ve düzeltme → `docs/analysis/COVER_PATH_FLOWERS_ANALYSIS.md`. **Plan A (ek çağrı yok):** Kapak ortamını Story API çıktısında `coverSetting` olarak LLM’e ürettirmek; maddeler A.1–A.8 → aynı doküman, Bölüm 7.

---

### 14.1 Test zamanlaması (Sıra 14, 15, 16, 17, 19)

Hangi maddeden sonra test yapılması gerektiği:

| Madde | Ne değişir | Test ne zaman | Ne yapılır |
|-------|------------|----------------|------------|
| **14** (Kapak ortamı hikayeden) | Kapak environment hikayeden; locationKeywords genişletme; tema şablonu fallback. | **14 tamamlandıktan sonra** | Smoke: Buz / orman (veya uzay) temalı birer kitap; kapak hikaye ortamına uyuyor mu kontrol et. |
| **15** (Türkçe FOREGROUND) | Sayfa prompt'unda characterAction kaynağı (sceneContext/sceneDescription; page.text fallback kaldırılır veya en son). | **15 tamamlandıktan sonra** | Smoke: 1 kitap veya 2–3 sayfa üret; FOREGROUND'da Türkçe metin gidiyor mu kontrol et. Hata/timeout yok mu bak. |
| **16** (Çelişkili stil) | style-descriptions, getCinematicPack, getEnhancedAtmosphericDepth uyumu; çelişen cümleler kaldırılır. | **16 tamamlandıktan sonra** | Orta test: 1 tam kitap; görsel stil tutarlı mı, aşırı doygunluk / çelişkili ışık ifadeleri kalmadı mı kontrol et. |
| **17** (Story JSON validation) | Story API: validation/retry (characterIds, suggestedOutfits, characterExpressions); kelime sayısı kontrolü ve kısa repair. | **17 tamamlandıktan sonra** | Entegre test: 1 tam kitap (story + master + cover + sayfalar); validation tetikleniyor mu, repair çalışıyor mu, görsel pipeline bozulmadı mı kontrol et. |
| **18** | — (A12 karar verildi, kod değişikliği yok.) | Test yok | — |
| **19** (Allow relighting) | Sayfa prompt'una relighting cümlesi eklenir. | **19 tamamlandıktan sonra** | Smoke: 1 kitap veya birkaç sayfa; sahneye özel ışık/ton farkı gözlemlenebilir mi, kimlik bozulmadı mı kontrol et. |

**Özet:** 14, 15 ve 19 sonrası kısa smoke test yeterli; 16 ve 17 sonrası daha kapsamlı (tam kitap / entegre) test önerilir. 18 için test yok.

---

### 14.2 Sıra 14–19 tamamlandıktan sonra: genel eşitleme ve doküman güncellemesi

Tüm Sıra 14–19 maddeleri (ve gerekiyorsa testler) bittikten sonra, **Sıra 13'teki gibi** genel eşitleme ve doküman güncellemesi yapılmalı:

1. **Prompts doküman = kod eşitlemesi (tekrar)**  
   - `docs/prompts/STORY_PROMPT_TEMPLATE.md` ve `docs/prompts/IMAGE_PROMPT_TEMPLATE.md` içerik/yapı olarak `lib/prompts/` ile eşitlenmeli.  
   - Kod = tek kaynak; doküman kodu yansıtmalı. 14–19'da yapılan prompt/validation değişiklikleri dokümana yansıtılmalı (version, blok açıklamaları, örnekler).

2. **Bu analiz dokümanının güncellenmesi**  
   - Bölüm 14 tablosunda ilgili maddelerin **Durum** sütunu "✅ Yapıldı" olarak güncellenmeli.  
   - Üstteki "Uygulama Durumu" ve "Sıradaki adım" metinleri, 14–19 tamamlandıktan sonraki sıraya göre güncellenmeli.  
   - Gerekirse 14.1 (test zamanlaması) ve 14.2 (genel eşitleme) notları tamamlanan tarih ve kısa sonuçla güncellenmeli.

3. **Proje yönetimi / diğer dokümanlar**  
   - `.cursor/rules/project-manager.mdc`: "Prompt optimizasyon planı" altında Sıra 14–19 durumu ve sıradaki işler güncellenmeli.  
   - `docs/roadmap/ILERLEME_TAKIBI.md` veya `docs/ROADMAP.md` içinde bu aksiyonlara referans varsa ilgili işler tamamlandı olarak işaretlenmeli.  
   - `docs/guides/PROMPT_OPTIMIZATION_GUIDE.md`: 14–19'da eklenen/değişen direktifler (relighting, FOREGROUND kaynağı, stil profili vb.) varsa ilgili bölümler güncellenmeli.

**Sıra:** Önce 14 (Kapak) → 15 → 16 → 17 → 19 uygulama ve (yukarıdaki tabloya göre) test; ardından bu genel eşitleme ve doküman güncellemesi yapılır.  
**14.2 tamamlandı (8 Şubat 2026):** Prompts doküman (IMAGE 1.20.0, STORY 2.5.0), analiz dokümanı, project-manager.mdc, ILERLEME_TAKIBI, PROMPT_OPTIMIZATION_GUIDE güncellendi.
