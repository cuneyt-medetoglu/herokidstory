# AI API tam istek / yanıt dosya logu — plan (analiz)

## Amaç (net ifade)

Kapak ve görsellerde tekrarlayan kompozisyon (ör. kenarlarda çiçek, ortada yol) gibi sorunları **neden** oluştuğunu görmek için, OpenAI’ye giden **her çağrının** mümkün olduğunca tam **request** ve **response** içeriğinin, **base64 görsel ve uzun ham binary metin hariç**, tek veya birkaç dosyada **kronolojik** olarak kaydedilmesi isteniyor.

Bu doküman yalnızca **analiz ve uygulama planı** içindir; kod değişikliği bu aşamada yapılmamıştır.

---

## Bugün ne var, ne eksik?

| Ne | Durum |
|----|--------|
| **`ai_requests` tablosu** + `insertAIRequest` | Maliyet, süre, model, `operation_type`, kısmi `request_meta` / `response_meta` (çoğunlukla usage). **Tam prompt / tam mesaj içeriği** ve **tam JSON yanıt gövdesi** genelde yok. |
| **`chatWithLog`** (`lib/ai/chat.ts`) | Tüm chat çağrıları buradan geçerse log tek noktadan genişletilebilir. |
| **`imageEditWithLog` / `imageGenerateWithLog`** (`lib/ai/images.ts`) | Tüm görsel API çağrıları buradan geçerse aynı şekilde genişletilebilir. FormData’daki prompt ve referans görseller ayrı ele alınmalı. |
| **`STOP_AFTER`** (`lib/book-generation/image-pipeline.ts` vb.) | Pipeline’ı belirli adımda **kasıtlı hata** ile durdurur; **dosyaya istek/yanıt dökümü değildir**. Çalışmıyor hissi: env ayarı, worker vs. Next ayrımı veya adım adı uyumsuzluğu ile ilgili olabilir (ayrıca doğrulanmalı). |
| **Eski “debug / quality / admin” notları** | `docs/archive/2026-02/analysis/DEBUG_QUALITY_IMPLEMENTATION_SUMMARY.md` vb. — UI veya endpoint’ler zamanla kırılmış olabilir; **yeni ihtiyaç dosya tabanlı tam döküm**. |

Özet: Maliyet / özet log **var**; kapak tekrarını teşhis için gereken **tam istek–yanıt dökümü** yok.

---

## Loglanması istenen süreçler (kapsam)

1. **Hikaye** — Chat Completions (`story_generation` ve hikayeyi üreten tüm `chatWithLog` yolları).
2. **Master görselleri** — Karakter / varlık master üretimi (`image_master`, `image_entity`).
3. **Kapak** — `image_cover` (route ve pipeline içi çağrılar).
4. **Sayfa görselleri** — `image_page`, yeniden üretim (`image_regenerate`), düzenleme (`image_edit`) gibi üretim akışları.

**İsteğe bağlı ekler:** karakter analizi (`character_analysis`), TTS — aynı “tam döküm” standardıyla tutarlı olur; öncelik görsel + hikaye ise sonra eklenebilir.

---

## İstenen dosya içeriği (kurallar)

- **Request:** Model, endpoint türü (chat / images generations / images edits), parametreler; chat için `messages` (içerik string); görsel için **metin prompt**; edits için **referans görsel sayısı** ve mümkünse dosya adı / hash (içerik değil).
- **Response:** Chat için `choices` metinleri; görsel için `usage`, `revised_prompt` / hata gövdesi; **`data[].b64_json` ve uzun base64 alanları** yerine `[omitted: base64, N chars]` gibi **placeholder**.
- **Ortak alanlar:** `timestamp`, `bookId`, `userId` (veya hash), `operationType`, `durationMs`, istenirse `promptVersion` / `pageIndex`.

---

## Uygulama yaklaşımı (öneri — tek sayfa özeti)

1. **Tek “sink” fonksiyonu** — Örn. `appendAiDebugLog(entry)`; sadece `process.env.AI_DEBUG_LOG_FILE` (veya `AI_DEBUG_LOG=1`) açıkken çalışır; yazma hatası ana akışı **asla** bozmaz.
2. **Dosya formatı** — Satır başına bir JSON (**JSONL**), kitap bazında ayrım için dosya adı: `ai-debug-{bookId}.log` veya tek dosyada `bookId` alanı (rotation / boyut limiti sonra).
3. **Entegrasyon noktaları** — Mümkün olan her yerde **wrapper içinde** (`chatWithLog`, `imageEditWithLog`, `imageGenerateWithLog`): böylece route ve pipeline sayısı kadar tekrar yazılmaz. FormData için prompt alanları parse veya çağıranın `logContext` ile prompt iletmesi gerekir (mevcut `ImageLogContext` genişletilebilir).
4. **Gizlilik** — Üretim ortamında varsayılan **kapalı**; sadece güvenilen makinede veya geçici debug süresince açılmalı.
5. **Mevcut dokümanlar** — Wrapper mimarisi: `docs/implementation/FAZ_AI_LOGGING_IMPLEMENTATION.md`, maliyet: `docs/guides/AI_COST_AND_USAGE_LOGGING.md` (bu plan **ek** katman; `ai_requests` ile ikame değil).

---

## Sonraki adımlar (uygulama sırası — kontrol listesi)

1. Env ve dosya yolu tasarımı (`AI_DEBUG_LOG_FILE`, opsiyonel max boyut).
2. Redaction yardımcıları (base64, büyük string kesimi).
3. `chatWithLog` içinde serileştirilmiş request/response (log’a yaz, DB’ye ham gövde koyma).
4. `lib/ai/images.ts` içinde JSON body ve FormData için güvenli özet.
5. Eksik kalan doğrudan `fetch` / `openai` çağrısı var mı diye tarama (`grep` ile `openai.` / `images/edits`).
6. Worker (`book-generation.worker`) ile Next API aynı env’i görüyor mu — log dosyasının **hangi süreçte** üretildiğinin netleştirilmesi.

---

*Oluşturulma: 2026-03-20 — sadece plan / analiz.*
