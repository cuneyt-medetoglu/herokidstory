# Kapak sonrası içerik: okuyucu, sesli hikaye (MP4) ve etkiler

**Tarih:** 2026-04-12  
**Amaç:** Kitaba girildiğinde mevcut sayfa okuma, sesli hikaye oynatma ve indirilen MP4’nin **kapak fotoğrafından sonra** (yani hikâyenin “içeriği”yle) hizalanması için etki analizi ve uygulanabilir öneriler.

---

## 1. Kullanıcı beklentisi (özet)

- Bugün kullanıcı deneyiminde akış **görsel/metin olarak** çoğu kitapta doğrudan `story_data.pages` dizisinin ilk elemanıyla (`pageNumber` 1) başlıyor.
- Sesli hikaye videosu (`generateBookVideo`) de **aynı sayfa listesi** üzerinden üretildiği için MP4’nin ilk segmenti yine bu ilk hikâye sayfası.
- İstenen: **Kapak görseli** (`books.cover_image_url`) bir “ön sayfa” gibi ele alınsın; **okuma, TTS otomatik oynatma ve MP4** hikâye içeriğine kapaktan sonra geçsin (fiziksel kitapta ön kapak → iç sayfa sırasına yaklaşım).

> **Not:** Üretim prompt’larında “kapak ile 1. iç sayfa farklı sahne olmalı” kuralı vardır (`lib/prompts/story/base.ts`). Buna rağmen kullanıcıda “1. sayfa = kapak hissi” oluşabiliyorsa bunun nedeni veri modeli (okuyucunun kapak URL’ini hiç göstermemesi), eski/özel veri kopyaları veya `images_data` / `story_data` hizası olabilir. Bu belgede **hem “kapak hiç yok” hem “içerik kapakla çakışıyor”** senaryoları ayrı ele alınır.

---

## 2. Mevcut mimari (kod özeti)

| Alan | Davranış | Ana dosyalar / giriş noktaları |
|------|------------|--------------------------------|
| **Kitap okuyucu (sayfa listesi)** | `mergedPages` yalnızca `bookData.story_data.pages` (+ `images_data` ile `imageUrl`/`audioUrl` birleştirme). `cover_image_url` sayfa dizisine **eklenmiyor**. `currentPage` başlangıç **0** → ilk hikâye sayfası. | `components/book-viewer/book-viewer.tsx` (fetch + `useState(0)`) |
| **Sesli hikaye MP4 (ilk üretim)** | `storyData.pages` + TTS URL’leri; `pageNumber` sırasıyla `generateBookVideo({ pages: videoPages })`. Kapak ayrı alan. | `lib/book-generation/image-pipeline.ts` |
| **Sesli hikaye yeniden üretim** | Worker: `story_data.pages` + `images_data` → TTS eksikse üret → yine `generateBookVideo`. | `lib/queue/workers/book-generation.worker.ts` |
| **Oynatıcı** | `VideoPlayer` doğrudan `book.video_url`; başlangıç zaman damgası yok (native `<video>`, `autoPlay`). | `components/video/VideoPlayer.tsx`, `book-viewer.tsx` (`videoMode`) |
| **PDF export** | Ayrı **ön kapak** HTML’i + spread’ler; hikâye sayfaları kapakla ayrılmış. | `lib/pdf/generator.ts`, `lib/pdf/prepare-book-pdf-input.ts` |

**Sonuç:** PDF tarafında “önce kapak” zaten var; **web okuyucu + MP4** tarafında `cover_image_url` ile hikâye sayfaları **birleştirilmemiş** iki paralel kaynak.

---

## 3. İki yorum (ürün netliği için)

### 3.1 Senaryo A — “Kapak hiç gösterilmiyor”

- Kullanıcı fiziksel kitap alışkanlığıyla **önce kapak görseli**, sonra hikâye istiyor.
- Teknik olarak sayfa 1 ile kapak **farklı görseller** olsa bile, okuyucu kapak URL’sini kullanmadığı için “kitap kapak fotoğrafından sonra” ifadesi bu senaryoya uyuyor.

### 3.2 Senaryo B — “İlk hikâye sayfası kapakla aynı / çok yakın”

- Veri veya eski pipeline sonucu: ilk `imageUrl` kapakla özdeş veya neredeyse aynı.
- Beklenti: MP4 ve okuyucu **ikinci “iç” anlatım anından** başlasın (kapak atlanmış sayılır).

**Öneri:** Ürün kararında tek cümleyle sabitleyin: hedef **A (kapak sayfası ekle)** mi, **B (çakışan ilk sayfayı atla)** mi, yoksa **ikisi** (kapak + içerik hizası) mi?

---

## 4. Etki alanları (detaylı)

### 4.1 `BookViewer` ve UI

- **Başlangıç indeksi:** `currentPage` varsayılanı `0` → kapak “sayfa 0” olacak şekilde model değişirse tüm navigasyon (`goToNextPage`, `goToPrevPage`, `Home`/`End`, swipe) bu indeks uzayına göre güncellenmeli.
- **Sayfa sayacı / i18n:** `pageOf` şu an `current + 1` / `total` kullanıyor. Kapak ayrı gösterilecekse:
  - Seçenek 1: Toplamda kapak dahil “Sayfa 1 = Kapak”, hikâye “İç sayfa 1…” (metinleri ayırma).
  - Seçenek 2: Üst barda “Kapak” + ayrı sayaç (daha az kafa karıştırıcı).
- **`BookPage`:** Kapakta genelde **hikâye metni yok**; `StoryTextPanel` boş veya başlık/teaser; TTS tetiklenmemeli.
- **Küçük resimler:** `PageThumbnails` kapak kartı göstermeli; `pageNumber` rozeti kapak için özel etiket (“Kapak”).
- **Yer imleri (localStorage):** `book-bookmarks-${id}` içindeki indeksler; kapak eklendiyse **+1 kaydırma** veya tek seferlik migrasyon gerekir.
- **Klavye:** `Home` kapak mı, ilk iç sayfa mı? Tutarlı kural yazılmalı.
- **`cover_image_url` yoksa:** Sadece iç sayfalarla devam veya placeholder; “cover-only” kitaplarda (`pages.length === 0`) mevcut empty state korunmalı.

### 4.2 TTS ve otomatik okuma

- `autoplayMode === "tts"` sayfa değişiminde `book.pages[currentPage].text` okunuyor. Kapak indeksinde **TTS çağrılmamalı** (sessiz veya kısa müzik ürün kararı).
- Zamanlı otomatik (`timed`) kapakta süre: sabit birkaç saniye veya kullanıcı ayarı (`reader_defaults` genişletmesi düşünülebilir).

### 4.3 Sesli hikaye video (FFmpeg pipeline)

- **`generateBookVideo`:** Giriş `pages[]` dizisine **ön segment** eklenebilir: `cover_image_url` + sessizlik veya çok kısa lokal TTS yok; sadece görsel + opsiyonel başlık altyazısı (süre: örn. 2–4 sn veya sabit `DEFAULT_COVER_HOLD_SEC`).
- **Birleştirme:** `concatSegmentsWithPageGaps` öncesine kapak segmenti; mevcut “sayfalar arası sessiz boşluk” politikası kapak–sayfa 1 arasında da uygulanmalı.
- **TTS / timeline cache:** Kapak segmentinde `read-along` timeline üretimi ya atlanır ya da sadece başlık metni için minimal timeline (S3 cache anahtarı tasarımı).
- **Boyut / süre:** Toplam video süresi ve dosya boyutu artar; kullanıcıya gösterilen ilerleme yüzdeleri etkilenmez ama encode süresi bir segment kadar uzar.

### 4.4 Pipeline ve yeniden üretim

- **İlk üretim:** `image-pipeline.ts` içinde `generateBookVideo` çağrılmadan önce `cover_image_url` + `title` video modülüne iletilmeli.
- **Regenerate worker:** `processAudioStoryRegenerate` aynı şekilde kapak bilgisini geçmeli; aksi halde yeniden üretilen videolar eski davranışta kalır.
- **`audio_story_version`:** Davranış değişince kullanıcı beklentisi “yeniden üret” ile düzelir; dokümante edilmeli.

### 4.5 API ve örnek kitaplar

- `GET /api/books/[id]` zaten tam `book` döndürüyor; `cover_image_url` mevcut.
- `GET /api/examples/[id]` `cover_image_url` içeriyor; `BookViewer` transformunda bugün kapak **sayfa listesine** konmuyor — örnek kitaplarda da aynı değişiklik gerekir.

### 4.6 İndirme / paylaşım

- `VideoPlayer` indirme dosya adı `title.mp4` aynı kalabilir; içerik süresi değişir.
- İleride “paylaşım linkinde t=X saniye” gibi özellik varsa kapak süresi offset’e eklenmeli (şu an codebase’de zorunlu bağımlılık tespit edilmedi).

### 4.7 PDF ve tutarlılık

- PDF zaten ön kapak kullanıyor; dijital okuyucu kapak eklenirse **ürün tutarlılığı artar**. Ek iş: yok veya çok az (sadece dokümantasyon / QA checklist).

### 4.8 Özel akışlar

- **`create-free-cover`:** `images_data` içinde `pageNumber: 1`, `isCover: true` örneği var; bu kitaplarda “iç sayfa” hangisi netleştirilmeli (kapak sentetik sayfa ile çakışma önlenmeli).
- **Kapak yenileme (`regenerate-image` isCover):** Okuyucu kapaktan canlı çekiyorsa cache busting (URL query) gerekebilir.

### 4.9 Test ve QA

- E2E: açılış indeksi, TTS kapakta sessiz, video ilk karede kapak görseli, bookmark migrasyonu.
- Regresyon: `initialMode=watch`, örnek kitap `useExampleApi`, `pages.length === 0`.

---

## 5. Uygulama seçenekleri (önerilen sıra)

### Seçenek 1 — **Sentetik “kapak sayfası” (index 0)** (önerilen birleşik model)

- `transformedBook.pages` öncesine veya map sonrası `{ kind: 'cover', imageUrl: cover_image_url, text: '', pageNumber: 0 }` benzeri tek giriş.
- Okuyucu, TTS ve (genişletilmiş) video pipeline aynı “sayfa sırası” kavramını paylaşır.
- **Artı:** Tek doğruluk kaynağı; MP4 ile piksel sırası uyumu kolay.  
- **Eksi:** `BookPage` / thumbnail’da `kind === 'cover'` dallanması; bookmark indeks migrasyonu.

### Seçenek 2 — **Sadece video başına kapak intro segmenti**

- Okuyucu değişmez; yalnızca `generateBookVideo` + worker + pipeline.
- **Artı:** Düşük UI riski.  
- **Eksi:** Kullanıcı “okuma hâlâ kapaksız başlıyor” der; A ile çelişir.

### Seçenek 3 — **Açılış tam ekran kapak, sonra mevcut liste**

- Bir `useEffect` ile ilk mount’ta kapak overlay; kullanıcı “Devam” → `currentPage = 0` (mevcut ilk iç sayfa).
- **Artı:** Dizi yapısına dokunma az.  
- **Eksi:** MP4 hâlâ hizasız kalır (2 ile birlikte düşünülmeli); sesli hikaye “İzle” modunda kapak gösterilmez.

**Pratik öneri:** Ürün hedefi “üçü de kapaktan sonra” ise **Seçenek 1 + video tarafında aynı sırayı üret** (Seçenek 1’in video kolu). Seçenek 2/3 yalnızca kısmi geçiş veya A/B için.

---

## 6. Veri ve geriye dönük uyumluluk

| Konu | Yaklaşım |
|------|----------|
| Eski `video_url` | İçerik değiştiği için kullanıcıya “Sesli hikayeyi yenile” veya otomatik `audio_story_version` / status ile yeniden üretim tetikleme politikası |
| Bookmark’lar | Bir kerelik: eski indeksleri `+1` kaydır (kapak eklendiyse) veya sürüm anahtarı ile sıfırla |
| `pageNumber` alanı | Hikâye metninde 1..N korunmalı; UI’da kapak ayrı etiket (story `pageNumber` ile karışmamalı) |

---

## 7. Riskler ve açık sorular

1. **Kapak URL yok:** Ne gösterilir? İlk iç sayfadan başla (feature flag veya graceful degrade).
2. **Örnek / misafir kitaplar:** `cover_image_url` null ise davranış.
3. **Performans:** Kapak görseli büyükse okuyucuda `next/image` / skeleton ile ilk boyama.
4. **Yasal / içerik:** Kapakta başlık/marka metni zaten var; video altyazısında başlık tekrarı istenir mi?

---

## 8. Özet kontrol listesi (implementasyon öncesi)

- [ ] Ürün: Senaryo A mı B mi, yoksa her ikisi mi?  
- [ ] Okuyucu: kapak satırı + navigasyon + sayaç metinleri + TTS kuralları  
- [ ] Yer imleri: migrasyon  
- [ ] `lib/video/generate-video.ts` + pipeline + worker: kapak segmenti + test ffmpeg  
- [ ] Mevcut MP4’ler: yeniden üretim / sürüm notu  
- [ ] i18n: `messages/*.json` `bookViewer`  
- [ ] QA: örnek kitap, `mode=audio-story`, cover-only, free-cover draft  

---

## 9. İlgili dosya listesi (implementasyon için kısa)

- `components/book-viewer/book-viewer.tsx`  
- `components/book-viewer/book-page.tsx`  
- `components/book-viewer/page-thumbnails.tsx`  
- `lib/video/generate-video.ts`  
- `lib/book-generation/image-pipeline.ts`  
- `lib/queue/workers/book-generation.worker.ts`  
- `components/video/VideoPlayer.tsx` (gerekirse `poster` veya ilk kare; çoğu iş segmentte)  
- `messages/tr.json` / `en.json` — `bookViewer`  

Bu belge yalnızca planlama ve etki analizidir; kod değişikliği içermez.
