# Edit Images – Sayfa Görselini Baştan Oluşturma Modu (Analiz)

**Tarih:** 2026-03-02  
**Durum:** Taslak analiz – henüz implement edilmedi  
**İlgili sayfa:** `/books/[id]/settings` → **Edit Images** bölümü  

---

## 📝 Kısa Özet

- **İhtiyaç:** Mevcut maske tabanlı "düzeltme" moduna ek olarak, kullanıcı belirli bir sayfanın görselini **tamamen yeni bir sahne olarak** tekrar üretebilmek istiyor (hikaye metni aynı kalabilir, sahne farklı olabilir).
- **Öneri:** Edit Images içinde ikinci bir mod: **"Sayfayı Baştan Oluştur" (Regenerate Page Image)**. Bu mod tek sayfalık mini "image generation pipeline" gibi davranır ve sonuç yine `image_edit_history` içine yeni versiyon olarak kaydedilir.
- **Quota:** Kısa vadede ek bir karmaşıklık yaratmamak için, **düzeltme + yeniden oluşturma aynı ortak kitap içi quota** havuzunu paylaşsın (ör: 3 aksiyon / kitap). Gelecekte ayrı quota veya ücretli paketlerle genişletilebilir.
- **Etkiler:** UI, API, prompt sistemi ve dokümantasyon tarafında orta seviye değişiklik; database tarafında ise mevcut `image_edit_history` + `edit_metadata` alanını kullanarak **ek migration gerektirmeden** çözülebilir.

---

## 1. Problem Tanımı ve Kullanım Senaryoları

### 1.1. Problem

Şu anki Edit Images akışı:
- Sadece **var olan görsel üzerinde düzeltme** (maske ile belirli alanları boyayıp, "şurayı düzelt" tarzı prompt).
- Kullanıcı görselin ana kompozisyonundan memnun değilse (sahne bambaşka olsun, karakter başka açıdan görünsün, arka plan ortamı değişsin vb.) bunu yapmak zor:
  - Maske ile tüm sahneyi boyamak hem zor hem de "orijinalden türetilmiş" kalıyor.

İstenilen yeni davranış:
- Kullanıcı belirli bir sayfayı seçip:
  - "Bu sahneyi tamamen farklı bir kompozisyon ile, ama **aynı hikaye metnini** ve karakter kimliklerini koruyarak baştan üret" diyebilsin.

### 1.2. Örnek Kullanım Senaryoları

- **Sahne varyasyonu:** Çocuk ormanda değil de parkta oynasın; aynı hikaye, farklı ortam.
- **Duygu/perspektif değişimi:** Daha yakın plan yüz ifadesi, farklı kamera açısı.
- **Şikayet düzeltme:** Kullanıcı "bu sayfa fazla karanlık / çok kalabalık / çocuğun yüzü çok uzakta" gibi geri bildirim verip yeni sahne isteyebilir.
- **A/B deneme:** Aynı sayfayı birkaç kez yeniden oluşturup en beğendiğini seçmek (quota sınırı içinde).

---

## 2. Mevcut Sistem Özeti (Referans)

Kaynak dokümanlar:
- `docs/guides/IMAGE_EDIT_FEATURE_GUIDE.md`
- `app/books/[id]/settings/page.tsx` (Book Settings + Edit Images grid)

Bugünkü yapı:
- **Edit Images grid:** Her sayfa için bir kart, tek bir `Edit Image` butonu.
- **Image Edit Modal:** Maske çizimi (ReactSketchCanvas), prompt, OpenAI Image Edit API çağrısı.
- **Quota:** `books.edit_quota_used / edit_quota_limit` → UI'de `X/Y Edits Left`. **Admin kullanıcılar için quota uygulanmaz** (backend'de `getUserRole` ile kontrol edilir; UI'da "Unlimited (Admin)" gösterilir, `edit_quota_used` artırılmaz).
- **History:** `image_edit_history` tablosu, `version` alanı, revert mantığı (`Version 0 = orijinal`).

Sınırlar:
- Sadece **mask-based edit**; "fresh image" konsepti yok.
- `image_edit_history` içinde edit türü (edit vs regenerate) ayrımı yok ama `edit_metadata` JSONB alanı mevcut → genişletmeye uygun.

---

## 3. Yeni Özellik: Sayfa Görselini Baştan Oluştur (Regenerate Page Image)

### 3.1. Kavramsal Tanım

**Regenerate Page Image modu**, seçilen sayfa için:
- Kaynak olarak:
  - Mevcut **hikaye metni** (`story_data.pages[n].text`)
  - Kitabın genel **tema** ve **stil** bilgisi (theme, illustration_style, age_group)
  - Gerekirse kullanıcıdan alınan kısa ek açıklama (örn. "daha gündüz, park ortamı olsun")
- Kullanarak:
  - Ana image generation pipeline'daki **sayfa prompt builder** mantığına çok benzeyen bir prompt ile,
  - OpenAI image generation API (edit değil, normal generate) üzerinden **yeni bir görsel** üretir.

Sonuç:
- Ortaya çıkan görsel, `image_edit_history` içinde yeni bir `version` olarak saklanır.
- `story_data.pages[n].imageUrl` güncellenir (aynı edit akışında olduğu gibi).
- Kullanıcı dilerse revert ile önceki versiyonlara dönebilir.

### 3.2. Kullanıcı Akışı (Önerilen)

1. Kullanıcı `/books/[id]/settings` sayfasında **Edit Images** grid'ini görür.
2. İlgili sayfa kartında:
   - **Seçenek A – İki ayrı buton:**
     - **"Edit Image"** (mevcut maske tabanlı modal)
     - **"Regenerate"** (yeni modal / yeni mod)
   - **Seçenek B – Tek buton, modal içinde mod seçimi:**
     - Kullanıcı `Edit Image` butonuna basar → modal üstünde **"Bölgesel Düzelt" / "Baştan Oluştur"** toggle'ı.
3. Regenerate modunda:
   - Maske alanı tamamen **gizli** (gerek yok).
   - Kullanıcıya:
     - Hikaye metni gösterilebilir (read-only).
     - Kısa açıklama alanı: "Bu sahnenin nasıl görünmesini istersiniz?" (opsiyonel).
   - Gönderildiğinde tek bir OpenAI generate çağrısı yapılır.
4. İşlem bittiğinde:
   - Yeni görsel preview'de görünür.
   - Edit quota 1 azalır.
   - History panelinde yeni versiyon, `mode: regenerate` etiketiyle görünür.

---

## 4. Teknik Taslak

### 4.1. API Tasarımı

#### Seçenek 1 – Ayrı endpoint

- Yeni endpoint: `POST /api/ai/regenerate-image`
- Önerilen payload:

```typescript
{
  bookId: string
  pageNumber: number
  userPrompt?: string // opsiyonel ek açıklama
}
```

**Artıları:**
- Mevcut `edit-image` endpoint'inden tamamen ayrışır; kod daha okunaklı.
- Farklı rate limiting / logging / maliyet analizi kolay (AI logging tablosu ile).

**Eksileri:**
- Yeni dosya + yeni testler gerekiyor.

#### Seçenek 2 – Mevcut edit endpoint'ine "mode" ekleme

- `POST /api/ai/edit-image` payload'ına:

```typescript
mode?: 'mask-edit' | 'regenerate'
```

- `mode === 'regenerate'` iken:
  - `maskImageBase64` zorunlu olmaz.
  - Yeni image generation path'ine dallanılır.

**Artıları:** Tek endpoint, daha az route sayısı.  
**Eksileri:** Tek dosyada iki farklı mantık; ileride bakımı zorlaşabilir.

> **Öneri:** Bu özellik stratejik olarak "yeni bir yetenek" olduğu için, **Seçenek 1 (yeni endpoint)** daha temiz ve uzun vadede sürdürülebilir görünüyor.

### 4.2. Image Generation Mantığı

- Ana kaynak: Mevcut kitap oluşturma pipeline'ındaki **sayfa görseli üretimi**:
  - Karakter master illüstrasyonları
  - Tema, yaş grubu, stil bilgileri
  - `IMAGE_PROMPT_TEMPLATE` + sayfa metni
- Regenerate çağrısında:
  - İlgili sayfanın metni ve kitap meta verisi backend'de çekilir.
  - Özel bir "regenerate" prompt prefix'i eklenir:
    - "Bu kitapta [karakter isimleri / rol bilgisi] aynı kalsın, ama sahne kompozisyonu değişebilir."
    - "Tarz, kalite, güvenlik kuralları ana kitapla aynı olsun."
  - Kullanıcının ek açıklaması, bu prompt'un sonuna güvenli bir şekilde eklenir.
- Model ve config:
  - Aynı model: `gpt-image-1.5`, `size: 1024x1536`, `quality: low`.
  - Aynı negative prompt sistemi (yaş + tema bazlı negatifler).

### 4.3. Versiyonlama ve Database

Mevcut tablo:
- `image_edit_history`:
  - `book_id`, `page_number`, `version`, `original_image_url`, `edited_image_url`, `mask_image_url`, `edit_prompt`, `ai_model`, `edit_metadata JSONB`, ...

Önerilen:
- **Yeni sütun eklemeden**, `edit_metadata` içinde mod bilgisi taşınır:

```json
{
  "mode": "mask-edit" | "regenerate",
  "source": "settings-page",
  "userPrompt": "parent text ...",
  "basePromptVersion": "v2.6.0"
}
```

- `version` sayacı aynı şekilde çalışır:
  - `0` = orijinal kitap görseli
  - `1+` = edit veya regenerate aksiyonları (karışık olabilir)

History panel UI:
- Satır bazında:
  - "v3 – Regenerate" / "v4 – Edit (mask)" gibi bir etiket gösterilebilir (bu implementasyon aşamasında tasarlanır).

### 4.4. Quota ve Limit Kontrolü

Kısa vadeli öneri:
- `books.edit_quota_used / edit_quota_limit` **tüm aksiyonlar için ortak**:
  - `mask-edit` çağrısı: +1
  - `regenerate` çağrısı: +1
- UI metni:
  - Bugünkü "You have X edits remaining" → "**You have X image changes remaining (edit or regenerate).**"

Gelecek için not:
- Ayrı alanlar eklenebilir:
  - `regenerate_quota_used`, `regenerate_quota_limit`
  - Veya `image_edit_quota` / `image_regenerate_quota` gibi iki farklı konsept.
- Bu analizde sadece **ortak quota** senaryosu tasarlandı (daha az değişiklik, MVP uyumlu).

### 4.5. Güvenlik ve Erişim

- Erişim yüzeyi değişmiyor:
  - Sadece `Book Settings` sayfası (parent-only).
  - Çocuk tarafındaki Book Viewer'da ek buton yok.
- Prompt güvenliği:
  - Mevcut positive + negative prompt sistemi aynen kullanılır.
  - Kullanıcı prompt'u, sert bir "sadece uygun içerik" filtresinden geçer (gerekirse ileride server-side validation eklenebilir).

---

## 5. Etkilenen Dokümanlar ve Güncelleme Planı

Bu bölüm, proje yöneticisi / dokümantasyon sorumlusu açısından hangi dokümanların güncelleneceğini listeler. **Bu analiz aşamasında henüz hiçbirini değiştirmiyoruz**, sadece planlıyoruz.

### 5.1. Ürün & Yol Haritası

- `docs/ROADMAP.md`:
  - İlgili faz: büyük olasılıkla **Faz 3 (Backend & AI)** veya **Faz 5 (Polish & Launch)** altında yeni bir iş maddesi.
  - Önerilen başlık:
    - "3.x.x Edit Images – Sayfayı Baştan Oluşturma Modu (Regenerate)"  
  - Eisenhower etiketi: başlangıçta `| 🟡 PLAN` (önemli ama çok acil değil) olabilir.
- `docs/roadmap/PHASE_3_BACKEND_AI.md` veya `PHASE_5_LAUNCH.md`:
  - Detaylı alt görevler:
    - API tasarımı ve implementasyonu
    - UI/UX değişiklikleri
    - Quota ve maliyet kontrolü
    - Testler ve QA

### 5.2. PRD ve Özellik Listesi

- `docs/PRD.md`:
  - "Image Editing" bölümüne:
    - "Parent can regenerate a page image from scratch while keeping story text and character identity." maddesi eklenmeli.
  - Versiyon numarası bir üst minör versiyona çıkarılmalı, tarih güncellenmeli.
- `docs/FEATURES.md`:
  - Image Edit özelliği altına:
    - "Per-page regenerate mode" satırı eklenmeli (MVP veya Post-MVP olarak işaretlenerek).
- `docs/COMPLETED_FEATURES.md`:
  - Özellik shipped olduğunda buraya kısa bir kayıt eklenecek (şu an sadece plan).

### 5.3. Teknik Rehberler ve Prompts

- `docs/guides/IMAGE_EDIT_FEATURE_GUIDE.md`:
  - Yeni bir bölüm:
    - "Regenerate Page Image Mode" → akış, örnek payload, history entegrasyonu.
  - API bölümü:
    - Yeni endpoint (veya mod parametresi) dokümante edilmeli.
  - Testing checklist:
    - Regenerate senaryoları + quota + revert testleri eklenmeli.
- `docs/prompts/IMAGE_PROMPT_TEMPLATE.md`:
  - Regenerate için:
    - "Existing book page – regenerate variant" başlıklı mini bölüm.
  - Prompt örnekleri:
    - Hikaye metni + sahne varyasyonu + karakter tutarlılığı odaklı.

### 5.4. AI Logging ve Analizler

- `docs/analysis/AI_REQUEST_LOGGING_ANALYSIS.md`:
  - Yeni aksiyon tipi:
    - `image_regenerate` veya benzeri bir `action_type`.
  - Maliyet analizi:
    - "Edit vs regenerate" kullanım oranlarını görebilmek için event isimleri.
- Gerekirse ileride:
  - `docs/reports/IMAGE_QUALITY_ANALYSIS.md` içine "regenerate kullanımından gelen geri bildirimler" bölümü eklenebilir.

---

## 6. Kod Seviyesi Değişiklik Alanları (Yüksek Seviye)

Bu bölüm implementasyon aşamasına geçildiğinde referans olarak kullanılmak üzere yüksek seviyede bırakıldı.

- Frontend:
  - `app/books/[id]/settings/page.tsx`
    - Edit Images kart yapısı: ikinci buton veya modal içi mod toggle.
    - Quota metninin "edit or regenerate" olarak güncellenmesi.
  - `components/book-viewer/ImageEditModal.tsx`
    - Seçenek B seçilirse, modal içinde mod değişimi ve UI ayrımı.
  - Gerekirse yeni component:
    - `RegenerateImageModal` (daha sade bir modal ile ayrıştırmak).
- Backend:
  - Yeni route: `app/api/ai/regenerate-image/route.ts`
    - Tek sayfalık image generation pipeline.
  - `image_edit_history` yazımı:
    - `edit_metadata.mode = 'regenerate'`.
  - AI logging:
    - `ai_requests` tablosuna yeni action tipi ile kayıt.

---

## 7. Açık Kararlar / Netleştirilmesi Gereken Noktalar

Bu analizden sonra netleştirilmesi gereken konular:

1. **Quota politikası:**
   - Kısa vadede ortak quota (önerilen) mı kullanacağız, yoksa baştan ayrı quota alanı mı açalım?
2. **UI yaklaşımı:**
   - İki butonlu basit çözüm mü (Edit vs Regenerate), yoksa tek modal içinde mod toggle'lı daha birleşik çözüm mü isteniyor?
3. **Kullanıcı metni zorunlu mu?**
   - Kullanıcı açıklaması opsiyonel mi, yoksa en az 1–2 cümle şart mı olsun?
4. **Hikaye metninin rolü:**
   - Her zaman mevcut sayfa metnini otomatik dahil edip, kullanıcıyı sadece "varyantı tarif etmeye" mi yönlendireceğiz?
5. **Analytics önceliği:**
   - İlk MVP'de sadece temel logging mi, yoksa baştan detaylı "regenerate vs edit" istatistikleri mi toplayalım?

Bu sorular netleştirildikten sonra, ilgili faz dosyasına (PHASE_3 veya PHASE_5) detaylı görevler eklenip implementasyon adımına geçilebilir.

