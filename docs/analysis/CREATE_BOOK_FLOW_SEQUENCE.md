# Kitap Oluşturma Akışı — Sıra ve Paralellik

**Kaynak:** `app/api/books/route.ts` (koddan çıkarıldı)  
**Tarih:** 2026-03-01  
**Güncelleme:** 2026-03-01 — Paralellik iyileştirme önerileri eklendi

---

## Kısa cevap

**Evet — TTS ve görsel (master + kapak + sayfa) aynı anda ilerliyor.**

- **TTS:** Hikaye bittikten hemen sonra arka planda başlatılıyor, **await edilmeden** devam ediyor.
- **Görsel tarafı:** Sırayla master → kapak → sayfa görselleri (her adım bittikten sonra sıradaki başlıyor).
- **En sonda:** Sayfa görselleri bittikten sonra `await ttsPrewarmPromise` ile TTS'in bitmesi bekleniyor.

Yani TTS, master + kapak + sayfa görselleri üretilirken **paralel** çalışıyor; toplam süre "görsel süresi + TTS'in kalanı" şeklinde kısalıyor.

---

## Adım adım akış (sıra ve paralellik)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. HİKAYE (GPT) — Sıralı, tek istek                                          │
│    await story generation → storyData                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. TTS PREWARM BAŞLAT — Arka plan (await YOK)                                │
│    ttsPrewarmPromise = (async () => { ... })()  ← fire-and-forget            │
│    Sayfalar 5'li batch; her batch içinde Promise.allSettled (5 paralel)     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. KİTAP KAYDI — Sıralı                                                     │
│    await createBook(...) → book                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
         ┌────────────────────────────┴────────────────────────────┐
         │  Bu noktadan itibaren TTS arka planda çalışıyor          │
         │  Aşağıdaki adımlar sırayla await ediliyor                │
         └─────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. MASTER İLLÜSTRASYONLAR — Karakter sayısı kadar sıralı                    │
│    for (char of characters) { await generateMasterCharacterIllustration() }  │
│    (From-example modunda da aynı yapı)                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4.5. ENTITY MASTER'LAR (varsa) — Paralel                                    │
│    Promise.allSettled(supportingEntities.map(...))                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. KAPAK GÖRSELİ — Sıralı, tek istek                                        │
│    await cover generation → generatedCoverImageUrl                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. SAYFA GÖRSELLERİ — Batch'ler sıralı, batch içi paralel                   │
│    BATCH_SIZE = 15                                                           │
│    for (batchStart = 0; batchStart < totalPages; batchStart += 15) {         │
│      batchPromises = batchPages.map(page => generate page image)              │
│      await Promise.allSettled(batchPromises)  ← 15 sayfa aynı anda           │
│    }                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│ 7. TTS BİTİŞİNİ BEKLE — Sıralı                                              │
│    if (ttsPrewarmPromise) await ttsPrewarmPromise                            │
│    (TTS zaten paralel çalıştığı için çoğu zaman bitmiş oluyor)               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 8. KİTAP GÜNCELLE (sayfa URL'leri, status: completed) → Response             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Özet tablo

| Adım | Ne | Sıralı mı / paralel mi | Kod (yaklaşık satır) |
|------|----|------------------------|----------------------|
| 1 | Hikaye (GPT) | Sıralı (tek await) | Story generation |
| 2 | TTS prewarm başlat | Arka plan (await yok) | 1054–1088: `ttsPrewarmPromise = (async () => {...})()` |
| 3 | createBook | Sıralı | 1090–1129 |
| 4 | Master illüstrasyonlar | Sıralı (her karakter için await) | for loop → `generateMasterCharacterIllustration` |
| 4.5 | Entity master'lar | Paralel (hepsi aynı anda) | `Promise.allSettled(entityMasters)` |
| 5 | Kapak görseli | Sıralı | Cover generation |
| 6 | Sayfa görselleri | Batch'ler sıralı, batch içinde 15 sayfa paralel | for batch → `Promise.allSettled(batchPromises)` |
| 7 | TTS bitişini bekle | Sıralı | 2679–2682: `await ttsPrewarmPromise` |

---

## Paralel çalışanlar

- **TTS** ile **görsel pipeline (master + kapak + sayfa)** birbirine paralel.
- **Sayfa görselleri:** Aynı batch'teki en fazla 15 sayfa paralel (batch'ler sırayla).
- **Entity master'lar:** Hepsi aynı anda (`Promise.allSettled`).
- **TTS batch'leri:** Her batch'te 5 sayfa paralel (`TTS_BATCH_SIZE = 5`).

---

## Sıralı kalanlar

- Hikaye → (TTS başlat + createBook) → Master'lar (karakter sırasıyla) → Kapak → Sayfa batch 1 → Sayfa batch 2 → … → TTS'i bekle → Response.

---

## Notlar

- From-example modunda TTS prewarm başlatılmıyorsa, sayfa görsellerinden sonra TTS burada sıralı çalıştırılıyor (2683–2715: `else if (allImagesGenerated && pages?.length)`).
- Cover-only modunda sayfa görselleri atlanıyor; yine de varsa `await ttsPrewarmPromise` çağrılıyor.
- Loglar: `[Create Book] 🔊 TTS prewarm (background)` = TTS'in paralel başladığı; `🔄 Processing batch X` = sayfa görselleri batch'i.

---

## Paralellik İyileştirme Analizi (2026-03-01)

### 1) TTS prewarm nedir?

**TTS** = Text-to-Speech (metni sese çevirme). Her sayfadaki hikaye metni için ses dosyası (MP3) üretiliyor; kullanıcı kitabı okurken “play”e basınca bu sesler çalınıyor.

**Prewarm** = Kitap oluşturma sırasında bu sesleri **önden**, arka planda üretmek. Böylece kitap hazır olduğunda sesler de hazır oluyor, kullanıcı beklemek zorunda kalmıyor. “Prewarm” kelimesi “önceden ısıtmak” anlamında — yani sesleri önceden üretip cache’lemek.

---

### 2) Step 6’daki iki buton vs “Create from example”

Burada **üç farklı senaryo** var; karışan kısım bunlar:

| Ne | Nerede | API’ye giden | Akış |
|----|--------|--------------|------|
| **Create without payment (Debug)** | Step 6, admin/debug | `fromExampleId` yok, `isExample` yok | **Full Book**: GPT hikaye üretir → TTS prewarm başlar → createBook → master → kapak → sayfalar. Ödeme sonrası “Pay & Create my book” ile aynı akış (sadece ödeme atlanıyor). |
| **Create example book** | Step 6, admin only | `fromExampleId` yok, **`isExample: true`** | **Aynı Full Book akışı.** Tek fark: Kitap DB’de `is_example: true` ile kaydedilir → Örnekler sayfasında listelenir. Hikaye yine GPT ile sıfırdan üretilir. |
| **Create from example** | Örnekler sayfası → “Bu örneğe benzer kitap oluştur” | **`fromExampleId: <örnek kitap id>`** | **From-example modu**: Örnek kitabın `story_data`’sı kopyalanır, GPT hikaye üretmez. Kitap bu blokta oluşturulur, TTS prewarm bu dallanmada **başlatılmaz** (kod bu dala hiç girmez). |

Yani:

- **Step 6’daki iki buton** (“Create without payment” ve “Create example book”) **aynı teknik akışı** kullanıyor: ikisinde de hikaye GPT ile üretilir, TTS prewarm başlar, master → kapak → sayfalar aynı sırayla gider. Fark sadece: “Create example book” ile oluşturulan kitap `is_example: true` olur ve Örnekler sayfasında görünür.
- **Farklı** olan akış: Kullanıcı Örnekler sayfasından bir kitap seçip “buna benzer kitap oluştur” dediğinde (`fromExampleId` gönderilir). O zaman “from-example” modu çalışır: hikaye kopyalanır, TTS prewarm başlatılmaz.

---

### 3) Neden “example book’da story_data kullanılır” demiştim?

Ben “example book” derken **from-example** akışını (kullanıcının örnek seçerek kitap oluşturması) kastetmiştim; Step 6’daki “Create example book” butonunu değil. O yüzden kafan karıştı — özür dilerim.

- **Step 6 “Create example book”** → Hikaye **GPT ile üretilir**, story_data kopyalanmaz. Sadece oluşan kitap “örnek” olarak işaretlenir.
- **Örnekler sayfasından “Create from example”** → Hikaye **kopyalanır** (story_data), GPT hikaye üretmez.

---

### Kullanıcı Sorusu: "TTS bitmeden image generation başlamıyor mu?"

**Kısa cevap: Normal modda HAYIR — TTS ve görsel pipeline zaten paralel.**

Mevcut durumu doğru anlamak için şu ayrımı yapmak gerekiyor:

| Mod | TTS durumu |
|-----|-----------|
| Normal (standart kitap) | TTS prewarm `fire-and-forget` başlıyor → görsel pipeline ile **paralel** çalışıyor |
| From-example modu | `ttsPrewarmPromise` set **edilmiyor** → TTS sayfa görsellerinden **sonra** sıralı başlıyor |

TTS ve image'ın neden birbirini beklediği sorusu için cevap: **Beklemiyor** — normal modda TTS fire-and-forget olarak başlatılıyor. Görsel pipeline (master + kapak + sayfa) paralelde çalışıyor. Sadece en sonda `await ttsPrewarmPromise` ile TTS'in tamamlanması bekleniyor; o noktada TTS büyük ihtimalle zaten bitmiş oluyor.

---

### Asıl Darboğazlar

Koddaki gerçek sıralı beklemeler şunlar:

#### 1. Karakter Master Görselleri — Sıralı for...await (EN BÜYÜK KAYIP)

Satır 1254–1318, `route.ts`:

```typescript
// MEVCUT (sıralı: her karakter bir öncekini bekliyor)
for (const char of characters) {
  const masterUrl = await generateMasterCharacterIllustration(...)
  masterIllustrations[char.id] = masterUrl
}
```

- 1 karakter: fark yok
- 2 karakter: yaklaşık 20–30s ek bekleme
- 5 karakter: yaklaşık 80–120s ek bekleme (4 master sıralı çalışıyor)

Her karakter master'ı OpenAI image API'ye bağımsız bir istek; aralarında hiçbir bağımlılık yok. Birbirlerini beklememeleri gerekiyor.

#### 2. Kapak → Sayfa Görselleri — Gereksiz Sıralı Bağımlılık

Mevcut akışta kapak bittikten sonra sayfa döngüsü başlıyor. Ancak sayfa üretimi kapak URL'ini **kullanmıyor**. Satır 2077–2078, `route.ts`:

```typescript
// Get cover image URL (needed for fallback - not used as reference anymore)
const coverImageUrl = generatedCoverImageUrl || book.cover_image_url || null
```

`coverImageUrl` değişkeni sayfa üretim döngüsünde hiçbir yerde referans görsel olarak geçmiyor. Kapak ve sayfalar **tamamen bağımsız** — ikisi de yalnızca hazır olan `masterIllustrations` nesnesine bağlı.

#### 3. From-example Modunda TTS Gecikmesi

`ttsPrewarmPromise` yalnızca hikaye üretim bloğu (`!storyData`) içinde set ediliyor. From-example modunda `storyData` baştan mevcut olduğundan bu blok çalışmıyor, `ttsPrewarmPromise` null kalıyor. Sonuç olarak `else if` dalı devreye giriyor ve TTS, tüm sayfa görselleri bittikten sonra sıralı başlıyor. TTS süresi toplam süreye tam olarak ekleniyor.

---

### Önerilen Optimizasyonlar

#### OPT-1: Karakter master'larını paralel üret

**Kazanım:** (N-1) x ~20–30s (N = karakter sayısı)  
**Risk:** Düşük  
**Uygulama kolaylığı:** Yüksek  
**Mevcut sistemi bozar mı:** Hayır — sadece for...await yerine `Promise.allSettled` kullanılıyor

```typescript
// ÖNERI: Tüm master'lar aynı anda
const charsWithPhoto = characters.filter(c => c.reference_photo_url)
const masterResults = await Promise.allSettled(
  charsWithPhoto.map(char => generateMasterCharacterIllustration(
    char.reference_photo_url,
    char.description,
    char.id,
    illustrationStyle,
    user.id,
    /* includeAge */ char.id === characters[0].id || (char.character_type?.group === 'Child' && char.description?.age > 0),
    char.gender,
    charOutfit,
    // ...diğer parametreler
  ))
)

// Ana karakter başarısız olduysa hata fırlat (mevcut davranış korunuyor)
const mainCharIdx = charsWithPhoto.findIndex(c => c.id === characters[0].id)
if (mainCharIdx >= 0 && masterResults[mainCharIdx].status === 'rejected') {
  const err = (masterResults[mainCharIdx] as PromiseRejectedResult).reason
  throw new Error('Character illustration generation failed...')
}

// Başarılı olanları masterIllustrations map'ine ekle
masterResults.forEach((result, idx) => {
  if (result.status === 'fulfilled') {
    masterIllustrations[charsWithPhoto[idx].id] = result.value
  }
})
```

> **Dikkat:** Ana karakterin hata durumu `Promise.allSettled` sonrasında ayrıca kontrol edilmeli. Mevcut `for` döngüsündeki `isMainCharacter` hata fırlatma ve moderation mesajı mantığı korunmalı.

---

#### OPT-2: Kapak ve sayfa görsellerini paralel üret

**Kazanım:** ~10–20s (kapak üretim süresi)  
**Risk:** Düşük  
**Uygulama kolaylığı:** Orta  
**Mevcut sistemi bozar mı:** Hayır — kapak URL'i sayfa üretiminde referans olarak kullanılmıyor

```typescript
// ÖNERI: Kapak ve sayfalar aynı anda başlıyor (her ikisi de masterIllustrations'a bağlı)
await Promise.allSettled([
  (async () => { /* mevcut kapak üretim bloğu */ })(),
  (async () => { /* mevcut sayfa batch döngüsü */ })(),
])
```

> **Dikkat:** Kapak üretiminin başarı/hata durumu ayrıca işlenmeli. `updateBook` çağrıları farklı DB alanlarını güncelliyor (`cover_image_url` vs `images_data`/`story_data`) — çakışma yok.

---

#### OPT-3: From-example modunda TTS prewarm başlat

**Kazanım:** TTS süresi toplam süreden çıkıyor (~10–30s)  
**Risk:** Çok düşük  
**Uygulama kolaylığı:** Çok yüksek

TTS prewarm kodunu `!storyData` bloğundan çıkarıp, `storyData` hazır olduktan hemen sonra her mod için çalışacak şekilde taşımak yeterli. From-example modunda da `storyData` zaten hazır olduğundan TTS prewarm anında başlayabilir.

---

### Birleşik Kazanım Tahmini

| Optimizasyon | Kazanım (tahmini) | Uygulama riski |
|---|---|---|
| OPT-1: Master'lar paralel (2 karakter) | ~20–30s | Düşük |
| OPT-1: Master'lar paralel (5 karakter) | ~80–120s | Düşük |
| OPT-2: Kapak + sayfalar paralel | ~10–20s | Düşük |
| OPT-3: From-example TTS prewarm | ~10–30s (from-example'da) | Çok düşük |
| **Toplam (2 karakter, normal mod)** | **~30–50s** | |
| **Toplam (5 karakter, normal mod)** | **~90–140s** | |

---

### TTS süresi logda neden 290s görünüyordu? (Düzeltme: 2026-03-01)

TIMING SUMMARY'de "TTS audio: 290.4s" yazan değer, **gerçek TTS üretim süresi değildi**. Hesaplama şöyleydi: `ttsMs = Date.now() - ttsPrewarmStartTime` tam **await** anında alınıyordu. TTS arka planda başlayıp ~45s'te bitiyor; await ise sayfa görselleri bittikten sonra (toplam ~342s) yapıldığı için `ttsMs` ≈ 290s çıkıyordu. Yani "TTS başlangıcından await anına kadar geçen duvar saati" raporlanıyordu.

**Yapılan düzeltme:** Prewarm tamamlandığında gerçek süre `ttsActualMs` olarak kaydediliyor; TIMING SUMMARY'de artık bu gerçek süre (örn. ~45s) kullanılıyor. 12 sayfa için TTS gerçekte ~45s sürüyor; 290s bir raporlama hatasıydı.

---

### TTS: tüm sayfalar eşzamanlı (batch kaldırıldı — 2026-03-01)

**Resmi Google TTS kota sayfası (tek kaynak):**  
[https://cloud.google.com/text-to-speech/quotas](https://cloud.google.com/text-to-speech/quotas)

Bu sayfada: TTS prewarm artık batch yok; tüm sayfalar paralel. 125 QPM yeterli. Link: quotas.

---
- **İstek limitleri (dakikada istek, proje bazlı):**
  - Neural2 / Polyglot / Standard: **1.000/dk**
  - **Gemini-TTS:** `gemini-2.5-flash-tts` **150 QPM**, `gemini-2.5-pro-tts` **125 QPM** (Queries Per Minute)
  - Chirp3: 200, Studio: 500, Long Audio: 100, vb.
- **Concurrent streaming:** Proje başına **100** eşzamanlı oturum.
- Kota artışı: Sadece **istek limiti** Google Cloud Console üzerinden artırılabilir; content limit sabit.  
  Genel kota yönetimi: [Quotas and system limits](https://cloud.google.com/docs/quotas/quotas)

**Projede kullanılan model:** `lib/tts/generate.ts` içinde varsayılan `gemini-2.5-pro-tts` (veya ayarlardan gelen model). Yani **125 QPM** limiti geçerli.

**"5" değeri nereden geliyor?**  
Kodda `TTS_BATCH_SIZE = 5` **resmi dokümandan türetilmiş bir sayı değil**; yorum veya commit mesajı da yok. Muhtemelen güvenli bir eşzamanlı istek sayısı olarak seçilmiş. 125 QPM ile 12 sayfayı tek batch’te (12 paralel) göndermek dakika başına limiti zorlamaz; yine de tek seferde çok paralel istek bazen geçici 429 veya yük nedeniyle gecikme yaratabilir. İstersen batch size 8–12 aralığına çıkarılıp test edilebilir; limit açısından 12 paralel 125 QPM altında.

**OpenAI tier vs Google TTS:**  
OpenAI’da image/API için tier (Tier 1, 2, …) ve buna göre RPM/dakika limitleri var. Google Cloud TTS’te böyle “tier” yok; proje bazlı **tek bir Requests Per Minute** (ve model bazlı QPM) var. Limit artırmak için Console’dan “Request quota increase” ile başvurulur; fiyatlandırma ayrı (kullanım bazlı).

---

### Görsel: Mevcut vs Önerilen Akış

```
MEVCUT (normal mod, 2 karakter):
─────────────────────────────────────────────────────────────────
  Hikaye │ TTS░░░░░░░░░░░░░░░░ (arka plan)
         │ Master-1 ──► Master-2 ──► Kapak ──► Sayfalar ──► await TTS
─────────────────────────────────────────────────────────────────
         └──────────────── toplam süre ────────────────────────►

OPT-1 + OPT-2 UYGULANDIKTAN SONRA:
─────────────────────────────────────────────────────────────────
  Hikaye │ TTS░░░░░░░░░░░░░░░░ (arka plan)
         │ Master-1 ┐
         │ Master-2 ┘ (paralel) ──► Kapak ┐
         │                        Sayfalar ┘ (paralel) ──► await TTS
─────────────────────────────────────────────────────────────────
         └──────── toplam süre (daha kısa) ────────────────────►
```

---

### Uygulama Önceliği

1. **OPT-3** — En kolay, sıfır risk, from-example kullanıcılarını direkt etkiliyor. Tek satır taşıma işlemi.
2. **OPT-1** — En büyük kazanım (özellikle çok karakterli kitaplarda). Ana karakter hata kontrolü dikkatli yapılmalı.
3. **OPT-2** — Daha az kazanım ama sıfır bağımlılık var; kapak-sayfa paralellığı temiz bir iyileştirme.

> **Not:** OPT-1 ve OPT-2 uygulanırken OpenAI image API rate limit durumu izlenmeli. Normalin üzerinde eş zamanlı istek artışı olabilir; mevcut `BATCH_SIZE=15` ve `TTS_BATCH_SIZE=5` sınırları bu yük artışını genellikle absorbe eder.
