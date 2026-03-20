# Log analizi: Salon / kapalı saha — yaprak ve dış mekân sızıntısı

**Kaynak:** `logs/ai-api-debug.jsonl` (20 Mart 2026, tüm satırlar)  
**Örnek kitaplar:** `4157081d…` (comic_book), `c7e71575…` (collage) — ikisi de “Arya ve Şampiyonluk Kupası” teması  

**Güncel özet / test rehberi:** [`GORSEL_PROMPT_VE_TEST_REHBERI.md`](./GORSEL_PROMPT_VE_TEST_REHBERI.md)  
**Ana analiz (v4.2 — konuşma özeti):** [`PROMPT_ANALIZ_VE_IYILESTIRME.md`](./PROMPT_ANALIZ_VE_IYILESTIRME.md) — master vs kapak göz rengi, story + kod birlikte, Ö9+ sıradaki işler.

---

## 1. Özet teşhis

| Katman | Bulgu |
|--------|--------|
| **story_generation** | İç mekân + kupa hikâyesi tutarlı; `coverDescription` bazen “golden hour / wooden floor” vb. (hâlâ spor salonu dilinde). Bir koşuda (collage) **3. sayfa `environmentDescription` içinde açıkça “Open park… grass… leaves”** — yaprak **şablon değil, model çıktısı**. |
| **image_page (comic_book, ~17:20)** | `[SCENE_ESTABLISHMENT]` içinde doğru salon cümlesinden hemen sonra **tam outdoor paket** görünüyor: *expansive sky, distant mountains, horizon line, aerial perspective, warm golden mist…* Bu, kodda `getEnhancedAtmosphericDepth()` ile üretilen metin. |
| **image_page (collage, ~18:10)** | Aynı blok **yok**; sadece `rich details, layered depth` — yani **“story environment → outdoor derinlik ekleme” bu koşuda çalışmış.** |
| **image_cover** | Eski ağır prompt (comic): PRIORITY, Environment 65–75%, “hands at sides / not holding” çelişkisi. Yeni minimal prompt (collage): kısa yol kullanılmış; buna rağmen kenarda “yaprak” hissi collage + model yorumu olabilir. |

**Sonuç:** Sorun tek nedene indirgenemez: (A) **Bazı kod yollarında veya eski derlemede** iç sayfada hâlâ outdoor derinlik bloğu ekleniyor; (B) **kapakta** hâlâ “wonder / adventure” + sinematik SCENE birleşimi bias yaratıyor/görseli kılıyor; (C) **hikâye metni** bazen açıkça park/çimen/yaprak yazıyor; (D) **collage** stili yırtık kenar / katman = yaprak benzeri yeşil şekiller tetikleyebilir.

---

## 2. Satır satır log kanıtları

### 2.1 Eski koşu — `gpt-4o-mini`, `764225b1…` (satır 1–12)

- Story cevabında `coverSetting` + `sceneContext` var; **`environmentDescription` yok** (eski şema).
- **image_page** (satır 7–9): Basketbol sahnesi + **expansive sky, horizon, mountains** — tam beklenen “outdoor paket”.

### 2.2 Comic book — `4157081d…` (satır 13–24)

- **story_generation (satır 14–15):** `coverDescription`, her sayfa için `environmentDescription` **indoor basketball** olarak dolu ve tutarlı.
- **image_page request (satır 19–21):** Önce story’den gelen iç mekân cümlesi, **hemen ardından** yine **sky / horizon / aerial / golden mist** bloğu.

Bu kombinasyon, üretim anında **`sceneInput.environmentDescription`’ın `generateFullPagePrompt`’a gitmediği** veya **`hasStoryEnvironment === false` kaldığı** anlamına gelir (aksi halde `getEnhancedAtmosphericDepth()` eklenmez).

Kod incelemesi:

- `lib/book-generation/image-pipeline.ts` — `environmentDescription` **geçiriliyor** ✓  
- `app/api/books/route.ts` — batch sayfa üretiminde `sceneInput` içinde **`environmentDescription` / `cameraDistance` yoktu** (patch ile eklendi) ✓  

Eğer bu kitap API batch yolundan üretildiyse veya eski worker derlemesi kullanıldıysa, logdaki tabloyla uyumlu.

### 2.3 Collage — `c7e71575…` (satır 25–36)

- **story_generation (satır 26):** Sayfa 1 `environmentDescription`: salon, pencerelerden **natural sunlight** — iç mekân + gün ışığı, makul.
- **image_page sayfa 1 (satır 33):** `[SCENE_ESTABLISHMENT]` sonrası **sadece** `rich details, layered depth` — **outdoor “sky” paketi yok.** Pipeline bu job’da doğru çalışmış.
- **image_page sayfa 3 (satır 32):** Story metni: *“Open park with soft grass… sunset sky… gentle breeze **moving leaves**”* — yaprak **doğrudan LLM ortam tarifinde**.

### 2.4 Kapak (collage, satır 29)

- Minimal kapak yolu: `Illustration style: collage… SCENE: … + coverDescription metni.`  
- İçerikte “leaf” yok; fakat **collage** direktifleri (torn edges, layers) + “warm and inviting” tipik çocuk kitabı kompozisyonu modelde **çerçeve bitkisi** üretebilir.

---

## 3. Kodda kalan bias kaynakları (log dışı, `scene.ts` tarama)

- **`getCinematicNaturalDirectives`:** “fire, **sky**, **path**, **horizon**” — iç sayfada sahneyi dış mekâna çeker.  
- **PRIORITY:** “Environment richness & depth” — boş alanları süslemek için ağaç/çalı eklenmesini teşvik eder.  
- **Kapak SCENE (güncel):** Uzun `generateScenePrompt` zinciri kapakta kapalı; `characterAction` nötr — bkz. §6. Kalan risk: **göz rengi** kapak metninde tekrarlanmıyorsa drift → **Ö9**.  
- **`ENVIRONMENT_TEMPLATES['sports']`:** “sunny playground” vb. — story ortamı düşerse fallback dış mekân.

---

## 4. Senin tek tek bakarken kullanacağın kontrol listesi

1. **Hangi `bookId`?** Logda kendi koşuna karşılık gelen satırları filtrele (`grep bookId logs/ai-api-debug.jsonl`).  
2. **image_page prompt’unda** şu dize var mı: *“horizon line visible with soft transition to sky”* → Varsa: `environmentDescription` o istekte yok sayılmış veya eski kod.  
3. **story JSON** içinde sayfa metinlerinde *park / grass / leaves / tree* var mı → Varsa önce hikâye düzeltmesi / doğrulama.  
4. **Kapak:** `Illustration style:` ile başlayan kısa mu yoksa PRIORITY + Environment 65% mi — hangi yol çalışıyor gör.  
5. **Stil:** `collage` ise kenar artefaktı için ayrı değerlendir.  
6. **Kapak göz rengi:** `image_master` promptunda göz rengi var mı, `image_cover` SCENE’de aynı ifade var mı — yoksa **Ö9** gündemi (`PROMPT_ANALIZ` v4.2).

---

## 5. Önerilen teknik aksiyonlar (güncel öncelik)

1. **`route.ts` + kapak SCENE + nötr `characterAction`:** §6’da uygulandı.  
2. **İç sayfa:** `getCinematicNaturalDirectives` / PRIORITY indoor için yumuşatma — **Ö11** (`PROMPT_ANALIZ`).  
3. **Story:** Salon/kapalı mekân tutarlılığı; isteğe bağlı “no flowers/trees” — **Ö10**.  
4. **Kapak göz rengi drift:** Master ile hizalı kısa kimlik satırı — **Ö9** (`PROMPT_ANALIZ` v4.2).

---

## 6. Sonraki kod düzeltmeleri (bu oturumda uygulandı)

- **`app/api/books/route.ts`:** Sayfa görseli batch üretiminde `environmentDescription` ve `cameraDistance` artık `sceneInput` ile `generateFullPagePrompt`’a iletiliyor (worker/pipeline ile aynı davranış).  
- **`lib/prompts/image/scene.ts`:** Kapakta `generateScenePrompt` tam zinciri kapatıldı; SCENE = stil + `getStyleSpecificDirectives` + `coverEnvironment` / `sceneDescription` (wonder/adventure ve “in environment” birleşimi yok).  
- **`lib/book-generation/image-pipeline.ts`:** Kapak `characterAction` metni nötrleştirildi (wonder/adventure kaldırıldı).

Kalan işler (**Ö9–Ö11**, `PROMPT_ANALIZ` v4.2): kapak kimlik özeti; story tutarlılığı / bitkisiz tohum; `getCinematicNaturalDirectives` + PRIORITY indoor yumuşatma.
