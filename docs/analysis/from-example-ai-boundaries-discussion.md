# Örnek kitaptan kişisel kitap: AI sınırları ve mevcut durum

**Amaç (özet):** Examples sayfasında gösterilen örnek kitaplardan yola çıkarak, kullanıcı kendi çocuk fotoğrafı ve yapılandırmasıyla **aynı metin / aynı kitap yapısı** ile kendi kitabını üretmeli. Bu senaryoda **tüm isteklerin modele gitmemesi** beklenir: görseller kullanıcı referansıyla üretilirken, hikâye metninin yeniden yazılması gibi adımlar AI’a gitmemeli. Bu doküman, **mevcut kod tabanının gerçekte ne yaptığını** özetler ve **ürün / mimari tartışması** için notlar içerir.

**Kapsam:** Kod incelemesi (Nisan 2026). Burada yeni özellik tanımlanmıyor; aksiyon maddesi yok.

---

## 1. Ürün akışı (hedeflenen davranış)

| Adım | Beklenti |
|------|----------|
| Örnek kitap | Admin (veya süreç) `is_example = true` tamamlanmış kitap üretir; Examples API (`GET /api/examples`) bunları listeler. |
| Kullanıcı | Örneği seçer, kendi karakter(ler)ini (foto + metadata) bağlar. |
| Çıktı | Örnekteki **sayfa metinleri ve sahne planı** korunur; görseller kullanıcının yüzü / karakter referansına göre yeniden üretilir. |
| AI sınırı (niyet) | Hikâye üretimi (büyük dil modeli ile yeni kitap yazımı) **olmamalı**; sadece görsel (ve gerekirse ses) pipeline’ı tetiklenmeli gibi düşünülür. |

Strateji dokümanı ile uyum: `docs/strategies/EXAMPLES_REAL_BOOKS_AND_CREATE_YOUR_OWN.md` — “story_data + sayfa prompt’ları kopyalanır; görseller karakter swap ile yeniden üretilir.”

---

## 2. Mevcut teknik akış (kısa)

- **Giriş:** `/create/from-example` — örnek kitap yüklenir; kullanıcı formu doldurur; `POST /api/books` gövdesinde `fromExampleId`, kullanıcı `characterIds`, örnekten gelen `theme` / `illustrationStyle` / `language` / `pageCount` vb. gider (`customRequests` UI’da şu an boş string).
- **Sunucu:** `fromExampleId` varsa `isFromExampleMode = true`. Örnek kitap DB’den okunur; `story_data` deep copy + **karakter adı** string replace + **karakter ID** remap (`characterIds`, `suggestedOutfits`, sayfa `characterExpressions` vb.) uygulanır. Yeni kitapta `source_example_book_id` set edilir.
- **Üretim:** Varsayılan yol kitabı kuyruğa atar (`enqueueBookGeneration`); worker `runImagePipeline` çalıştırır (`lib/queue/workers/book-generation.worker.ts` → `lib/book-generation/image-pipeline.ts`).
- **Senkron debug:** Admin `debugRunUpTo` ile `POST` içinde pipeline parçaları doğrudan da koşabilir; ürün yolu async worker ile aynı mantığa yakınsar.

Ödeme sonrası placeholder senaryosu için ayrıca `lib/book-generation/from-example-story-clone.ts` (`cloneExampleStoryForPaidPlaceholder`) aynı klonlama mantığını paylaşır.

---

## 3. AI / model çağrıları: from-example modunda ne oluyor?

### 3.1 Bilerek atlanan (hikâye LLM’i)

`runImagePipeline` içinde:

```806:806:lib/book-generation/image-pipeline.ts
  const needsStoryGeneration = !storyData && !isFromExampleMode && !isCoverOnlyMode
```

From-example’da `storyData` zaten dolu geldiği için **`needsStoryGeneration` false**: buradaki **OpenAI chat + JSON şema ile hikâye üretimi** çalışmaz. Bu, senin “hikâye AI’a gitmesin” beklentisinin **karşılandığı** ana nokta.

Metin tarafında ek bir “yaratıcı yazarlık” yok; sadece örnekteki isimlerin kullanıcı karakter isimleriyle **deterministik replace**’i var (`app/api/books/route.ts` ve `from-example-story-clone.ts` ile uyumlu).

### 3.2 Hâlâ modele / API’ye gidenler

| Adım | Ne gidiyor? | Not |
|------|-------------|-----|
| Master karakter | Kullanıcı referans fotoğrafı + açıklama | `generateMasterCharacterIllustration` — görsel model (edits/generations politikası). From-example’da tema kıyafeti örnek kitabın temasından seçilir. |
| Entity master | `supportingEntities` metinleri | Hayvan / nesne master görselleri; yine görsel API. |
| Kapak — Vision | **Örnek kitabın kapak görseli URL’i** | `describeCoverSceneForPrompt`: kısa sahne betimi için **Vision (chat + image)**. Metin üretimi ama hikâye değil; kapak prompt’unu zenginleştirmek için. |
| Kapak — görsel | Prompt + master referansları | `/v1/images/edits` veya fallback `generations`. |
| Sayfa görselleri | Klonlanmış `imagePrompt` / sahne alanları + karakter prompt’ları | Toplu sayfa üretimi; yine görsel API. `analyzeSceneDiversity` yerel heuristik (LLM değil). |
| TTS | **Sayfa metinleri** (isim değiştiyse yeni metin) | Pipeline sonunda `generateTts` her sayfa için çağrılır; from-example için **özel bir atlama yok**. Ses üretimi ayrı bir “AI / cloud TTS” maliyeti ve gizlilik sınırı. |
| Video (opsiyonel) | TTS + görseller | `SKIP_VIDEO_GENERATION` değilse video adımı; bu da ağır iş. |

Özet: **Hikâye JSON’unu yazan büyük LLM adımı atlanıyor**; buna karşılık **görsel üretimi, (from-example’da) örnek kapağa bakan Vision çağrısı ve TTS** hâlâ devrede.

### 3.3 `customRequests` ve sızıntı riski

From-example UI `customRequests: ""` gönderiyor. API tarafında alan boş değilse kapak sahne metninde `Story: ${customRequests}` ile yer alabilir. Yani **teorik olarak** istemci `customRequests` doldurursa kullanıcı yeni metin / yönerge enjekte edebilir; ürün politikası “from-example’da bu alan yasak” ise backend’de de sıkılaştırma düşünülebilir (tartışma konusu, bu dokümanda uygulanmıyor).

---

## 4. Beklenti ile kodun karşılaştırması

| Beklenti | Mevcut durum |
|----------|----------------|
| Aynı kitap metni | Evet: `story_data` klon + isim/ID remap. |
| Görseller kullanıcıya göre | Evet: master + kapak + sayfalar kullanıcı karakterleriyle. |
| Hikâye LLM’i gitmesin | Evet: from-example dalında story generation kapalı. |
| “Bazı istekler AI’a gitmesin” (genel) | Kısmi: görseller ve TTS ve (from-example’da) örnek kapak Vision hâlâ AI / model servisleri. |
| Örnek kitabın içeriği modele | Evet, sınırlı: kapak URL’i Vision’a gidiyor; sayfa görselleri doğrudan örnek pikselleri değil, çoğunlukla metin prompt’ları. |

---

## 5. Tartışmaya açık konular (ürün / mimari)

1. **TTS:** İsim değişince metin değiştiği için TTS’nin yeniden üretilmesi doğal. İsim aynı kalsa bile (edge case) bugün yine TTS koşar mı? — Evet, pipeline genel yolu sayfa metninden ses üretir; **örnek kitaptan ses kopyalama** yok.
2. **Vision ile örnek kapak:** Sahneyi kopyaya yaklaştırıyor ama ek bir **dil modeli çağrısı** ve örnek görselin modele gönderilmesi. “Sadece görseller kullanıcı fotoğrafı gitsin” denirse bu adım tartışılır; alternatif olarak örnek üretiminde `coverSceneDescriptor` sabit saklanıp Vision atlanabilir.
3. **Gizlilik / veri minimizasyonu:** Kullanıcı fotoğrafı görsel API’ye gider (tasarım gereği). Örnek kapak görseli Vision’a gider — bunun gerekçesi ve KVKK / privacy metinleriyle hizalama ayrı tartışma.
4. **“AI’a gitmeme” tanımı:** Sadece **chat completion / hikâye** mi, yoksa **TTS + image + vision** dahil tüm harici model çağrıları mı? Dokümanda iki katman net ayrılmalı.
5. **Admin “Create example book”:** Bu akışta hikâye **GPT ile sıfırdan** üretilir (`fromExampleId` yok). Bu, kullanıcı “from example” akışı değil; karışıklığı önlemek için dokümantasyon / ekip içi dilde ayrım iyi korunuyor (`docs/analysis/CREATE_BOOK_FLOW_SEQUENCE.md`).

---

## 6. İlgili dosyalar (okuma sırası önerisi)

- `app/[locale]/(public)/create/from-example/page.tsx` — istemci payload.
- `app/api/books/route.ts` — `isFromExampleMode`, story klonlama, kitap oluşturma.
- `lib/book-generation/image-pipeline.ts` — `needsStoryGeneration`, master / kapak / sayfa / TTS.
- `lib/book-generation/from-example-story-clone.ts` — ödeme sonrası klonlama.
- `docs/strategies/EXAMPLES_REAL_BOOKS_AND_CREATE_YOUR_OWN.md` — ürün kararları.
- `docs/analysis/CREATE_BOOK_FLOW_SEQUENCE.md` — örnek kitap oluşturma vs from-example ayrımı.

---

*Bu dosya tartışma amaçlıdır; içerik kod tabanına göre analiz edilmiştir ve gerektiğinde güncellenmelidir.*
