# Örnek Kitaplar — Eksik Dillere Kopyalama: Uygulama Planı

**Tarih:** 7 Mart 2026  
**Durum:** Planlama (Faz 0 tamamlandı ✅ 7 Mart 2026)  
**İlişkili strateji:** `docs/analysis/EXAMPLES_MULTILINGUAL_COPY_STRATEGY.md`

---

## 1. Amaç ve Kapsam

- **Amaç:** Examples sayfasında ziyaretçi, site diline (locale) göre o dildeki örnek kitapları görsün. Eksik dilde örnek varsa, mevcut bir dildeki örneklerin kopyası hedef dile üretilsin.
- **Kapsam:** Sadece **örnek kitaplar** (`is_example = true`). Kitaplıktaki kullanıcı kitapları değişmez.
- **Diller (ilk aşama):** Sadece site locale'leri: `en`, `tr`.

---

## 2. Alınan Kararlar

| Karar | Açıklama |
|-------|----------|
| **Kopya = yeni kitap kaydı** | Her dil için ayrı `books` satırı. İlişki: `source_example_book_id` (opsiyonel) ile kaynak kitaba bağlanır. |
| **Görseller aynı** | Kopyada `cover_image_url`, `images_data`, `generation_metadata` (görsel referansları) kaynaktan aynen alınır; sadece metin alanları hedef dilde olur. |
| **Metin: AI çeviri** | Başlık, açıklama, `story_data` içindeki sayfa metinleri kaynak dilden hedef dile AI ile çevrilir. İsteğe bağlı: admin sonradan düzenleyebilir. |
| **Script önce, admin sonra** | İlk uygulama: CLI/tek seferlik script (örn. "TR → EN kopyala"). Aynı mantık ileride admin panelde "Eksik dillere kopyala" olarak sunulacak. |

---

## 3. Mevcut Yapı (Özet)

- **`books` tablosu:** `id`, `user_id`, `title`, `theme`, `illustration_style`, `language`, `age_group`, `story_data`, `total_pages`, `images_data`, `cover_image_url`, `status`, `is_example`, `generation_metadata`, …
- **`GET /api/examples`:** `is_example = true` ve `status = 'completed'` ile listeler; şu an **locale/language filtresi yok**.
- **Examples sayfası:** Şu an mock data (`examples/types.ts`) + i18n ile locale'e göre başlık/açıklama gösteriyor; DB örnekleri API'den çekildiğinde dil filtresi olmadığı için karışık dil çıkabiliyor.

---

## 4. İş Kırılımı (Fazlar)

### Faz 0 — Step 6: Örnek kitap için dil seçimi (admin / debug)

Örnek kitabı **en baştan** hedef dilde oluşturmak; böylece aynı içeriği sonradan kopyalamaya gerek kalmaz. Sadece admin kullanıcıda görünür.

| # | İş | Detay |
|---|-----|--------|
| 0.1 | Dil listesi kaynağı | Mevcut site locale'leri kullan: `routing.locales` (`i18n/routing.ts`). Şu an `['en', 'tr']`; yeni dil eklendiğinde buraya eklenir, Step 6'daki liste otomatik güncellenir. |
| 0.2 | Step 6 UI: dil seçici | "Create example book" butonunun olduğu admin-only blokta, butonun üstünde bir **dil seçici** (dropdown veya radio) ekle. Başlık örn. "Example book language" / "Örnek kitap dili". Seçenekler: `routing.locales` içindeki her dil (en, tr, …). Varsayılan: ilk locale veya mevcut site locale. |
| 0.3 | Payload’da dil | `handleCreateExampleBook` içinde `language` değerini Step 3’ten değil, bu **seçilen dil**den al; API’ye `language: selectedExampleLanguage` gönder. Hikaye o dilde üretilir, DB’ye o dilde yazılır. |

**Çıktı:** Admin Step 6’da "EN" veya "TR" (ve ileride eklenen diller) seçip "Create example book" dediğinde kitap doğrudan o dilde oluşur; kopyalama gerekmez.

**Not:** Mevcut "Create example book" zaten sadece `canSkipPayment` (admin/debug) kullanıcıda görünüyor; dil seçici de aynı blokta, debug/admin amaçlı kalır.

---

### Faz 1 — Veritabanı: Kaynak bağlantısı (opsiyonel) ✅

| # | İş | Detay |
|---|-----|--------|
| 1.1 | Migration: `source_example_book_id` | `books` tablosuna `source_example_book_id UUID REFERENCES books(id) ON DELETE SET NULL` ekle. Kopya örneklerin hangi kaynak örneğe ait olduğunu tutar. |
| 1.2 | Tip güncellemesi | `lib/db/books.ts` — `Book` ve `CreateBookInput` içine `source_example_book_id?: string` ekle. Create/insert tarafında kullan. |

**Çıktı:** Kopya kitaplar kaynak kitapla ilişkilendirilebilir; raporlama ve "aynı örneğin EN/TR versiyonu" eşlemesi kolaylaşır.

**Durum:** Tamamlandı (7 Mart 2026). Migration: `migrations/022_books_source_example_book_id.sql`, index: `idx_books_source_example_book_id`. Veritabanına uygulamak için: `psql -h <host> -U <user> -d <db> -f migrations/022_books_source_example_book_id.sql`

---

### Faz 2 — API: Locale / dil filtresi ✅

| # | İş | Detay |
|---|-----|--------|
| 2.1 | Query param: `locale` | `GET /api/examples?locale=en` → sadece `language = 'en'` olan örnekler; `locale=tr` → `language = 'tr'`. Param yoksa `routing.defaultLocale` kullanılır. |
| 2.2 | Frontend locale geçişi | Examples sayfası istek atarken mevcut `locale`'i query ile gönderir: `fetch(\`/api/examples?locale=${locale}\`)`. Dil değişince liste yeniden çekilir. |

**Çıktı:** `/en/examples` EN kitapları, `/tr/examples` TR kitapları getirir.

**Durum:** Tamamlandı (8 Mart 2026). API: `app/api/examples/route.ts` — `locale` param + `language = $2`. Frontend: `app/[locale]/examples/page.tsx` — `useLocale()` + fetch’e `?locale=${locale}`, `useEffect` dependency `[locale]`.

---

### Faz 3 — Kopyalama script’i

| # | İş | Detay |
|---|-----|--------|
| 3.1 | Script konumu ve arayüz | Örn. `scripts/copy-examples-to-locale.ts` (veya `scripts/examples-copy.ts`). Argüman: kaynak dil, hedef dil (örn. `tr`, `en`). |
| 3.2 | Kaynak listesi | DB'den `is_example = true AND status = 'completed' AND language = $sourceLang` kitapları al. Hedef dilde zaten kopyası varsa (`source_example_book_id` veya eşleşen başlık/kaynak eşlemesi) atla. |
| 3.3 | Çeviri | Her kitap için: `title`, `story_data` içindeki sayfa metinleri (ve varsa `generation_metadata` içindeki açıklama) kaynak dilden hedef dile AI ile çevir. Mevcut AI/çeviri altyapısı kullanılacak (örn. GPT API). |
| 3.4 | Yeni kayıt | `createBook` ile yeni satır: aynı `user_id` (veya örnekler için tanımlı sistem/admin `user_id`), `language = targetLang`, `is_example = true`, `source_example_book_id = kaynak.id`, `cover_image_url`/`images_data`/`generation_metadata` (görsel) kopyala, `title` ve `story_data` çevrilmiş metin. |
| 3.5 | Dokümantasyon | Script kullanımı `EXAMPLES_MULTILINGUAL_COPY_STRATEGY.md` veya bu dosyada "Script kullanımı" bölümünde kısaca anlatılır. |

**Çıktı:** Tek komutla (örn. `npx ts-node scripts/copy-examples-to-locale.ts tr en`) TR örnekleri EN’e kopyalanır.

**Not:** Örnek kitapların `user_id`’si: Mevcut yapıda örnek kitap oluşturan admin kullanıcı. Kopyada aynı `user_id` kullanılabilir veya "sistem" kullanıcısı tanımlanır; politika netleştirilmeli.

**Rol:** Yeni örnekler Faz 0 ile doğrudan hedef dilde oluşturulabildiği için kopya script'i özellikle mevcut / eski tek-dilli örnekler veya yeni locale eklendiğinde toplu geri doldurma için kullanılır.

---

### Faz 4 — Frontend: API + locale uyumu

| # | İş | Detay | Examples sayfası (veya ilgili bileşen) `/api/examples` çağrısına `locale` ekler (`useLocale()` veya route’tan gelen locale). |
| 4.2 | Mock / API önceliği | Stratejiye göre: DB’den locale’e göre liste geliyorsa onu kullan; boşsa mock fallback veya "Bu dilde henüz örnek yok" mesajı. Mevcut mock yapısı ile uyumlu karar verilir (sadece mock mu, sadece API mı, hybrid mi). |

**Çıktı:** Examples sayfası site diline göre doğru dilde içerik gösterir.

---

### Faz 5 — Admin panel (sonra)

| # | İş | Detay |
|---|-----|--------|
| 5.1 | "Eksik dillere kopyala" akışı | Admin panelde bir ekran/buton: Desteklenen locale’ler için hangi dillerde örnek eksik listelenir; "Kopyala" ile Faz 3’teki mantık tetiklenir (backend’de script mantığı API veya job olarak çalışır). |
| 5.2 | Dokümantasyon | Bu özellik "Daha sonra bakılacak" ve strateji dokümanında admin panel maddesiyle eşleştirilir. |

**Çıktı:** Script’e gerek kalmadan admin panelden eksik dillere kopyalama yapılabilir.

---

## 8. Script kullanımı (Faz 3)

Örnek kitapları bir dilden diğerine kopyalamak için:

```bash
# .env içinde DATABASE_URL ve OPENAI_API_KEY gerekli
npm run copy-examples-to-locale -- <kaynakDil> <hedefDil>
```

**Örnekler:**
- TR → EN: `npm run copy-examples-to-locale -- tr en`
- EN → TR: `npm run copy-examples-to-locale -- en tr`

Script, kaynak dildeki `is_example = true` ve `status = 'completed'` kitaplarını alır; hedef dilde `source_example_book_id` ile zaten kopyası varsa atlar. Her kitap için başlık ve sayfa metinleri GPT-4o-mini ile çevrilir; kapak ve sayfa görselleri kaynaktan aynen kopyalanır.

---

## 5. Teknik Notlar

- **`story_data` yapısı:** Sayfa metinlerinin nerede tutulduğu (hangi key altında) dokümante edilmeli; script çeviri döngüsü buna göre yazılır.
- **`user_id` kopya için:** Örnek kitaplar bugün bir admin kullanıcıya ait. Kopya da aynı kullanıcıya mı atanacak, yoksa sabit bir "system" kullanıcısı mı kullanılacak — karar verilmeli ve plana işlenmeli.
- **Rate limit / maliyet:** AI çeviri kitap başına token tüketir; toplu kopyada limit ve maliyet göz önünde tutulmalı.
- **Idempotans:** Aynı kaynak kitap için hedef dilde zaten kayıt varsa tekrar kopya oluşturulmamalı (Faz 3.2).

---

## 6. Kabul Kriterleri

- [x] **Faz 0:** Step 6'da sadece admin görür; örnek kitap dil seçici mevcut dilleri (en, tr, …) listeler; seçilen dilde kitap oluşturulur.
- [x] `/en/examples` sadece `language = 'en'` örnekleri listeler; `/tr/examples` sadece `language = 'tr'` örnekleri listeler (API + frontend). Faz 2 ✅
- [ ] Script ile TR → EN (ve gerekiyorsa EN → TR) kopyalama çalışır; kopya kitaplar doğru dilde başlık ve sayfa metni içerir; kapak ve sayfa görselleri kaynakla aynıdır.
- [ ] Kopya kitaplar `source_example_book_id` ile kaynağa bağlanır (Faz 1 altyapısı tamamlandı ✅; kopya oluşturma Faz 3’te).
- [ ] Strateji ve bu plan dokümanları güncel; admin panel maddesi "sonra" olarak işaretli.

---

## 7. Sıra ve Bağımlılıklar

```
Faz 1 (DB) → Faz 2 (API) → Faz 4 (Frontend)   [locale’e göre listeleme çalışır]
Faz 0 (Step 6 dil seçici)   [yeni örnekler doğrudan hedef dilde; önce yapılır]
Faz 1 (DB) → Faz 2 (API) → Faz 4 (Frontend)   [locale'e göre listeleme çalışır]
Faz 1 (DB) → Faz 3 (Script)                   [mevcut tek-dilli örnekler için kopyalama]
Faz 3 + Faz 2/4 → Faz 5 (Admin)               [ileride]
```

Önce Faz 1 + 2 + 4 ile listelemeyi locale’e göre düzeltmek; ardından Faz 3 ile kopyalama script’ini yazmak mantıklı. Faz 5 admin panel roadmap’e bırakılır.

---

*Bu plan, strateji dokümanındaki kararlara göre güncellenebilir.*
