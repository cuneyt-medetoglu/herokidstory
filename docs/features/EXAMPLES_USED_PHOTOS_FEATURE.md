# Examples Sayfasi - Used Photos (Karakter Gorselleri) Ozelligi

**Tarih:** 6 Mart 2026  
**Kapsam:** Sadece `/examples` sayfasi  
**Durum:** Tamamlandi (6 Mart 2026)

---

## 1. Ne Istiyoruz?

- Ornek kitap kartinda **"Used Photos"** bolumunde (View Example butonunun hemen ustunde) karakterlerin **orijinal gorsellerini** kucuk kutular halinde gostermek.
- Kutuya tiklaninca gorsel **buyusun** (modal ile).
- Su an bu alanda "Photos will be added soon" yaziyor; bu metni gercek veriyle degistiriyoruz.

---

## 2. Karar: Burada (kod tabaninda) yapildi

- **UI zaten vardi.** `app/examples/page.tsx` icinde:
  - `usedPhotos.length > 0` ise thumbnail grid + tiklayinca acilan modal (PhotoModal) kodu mevcuttu.
  - Sadece API `usedPhotos: []` dondugu icin "Photos will be added soon" gorunuyordu.
- v0 ile yeni bir sayfa/komponent tasarlamaya gerek yoktu; tek eksik **veri**ydi.

---

## 3. Implementasyon (6 Mart 2026)

### Degistirilen Dosya
`app/api/examples/route.ts`

### usedPhotos Cozumleme Sirasi

1. **`generation_metadata.usedPhotos`** (explicit array) → varsa ve dolu ise direkt don.
2. **`generation_metadata.characterIds` + `characters` tablosu** → batch sorgu ile `reference_photo_url` + `name` al.
3. **`[]` fallback** → veri yoksa bos array → frontend "Photos will be added soon" gosteriyor.

### Performans
- N+1 sorgu yok.
- Tum kitaplarin characterId'leri once toplaniyor, tek `WHERE id = ANY($1::uuid[])` sorgusuyla cekiliyor.
- Sonra map icinde her kitaba eslestirilip `usedPhotos` array'i olusturuluyor.

---

## 4. Yapilacaklar

- [x] **Backend:** `app/api/examples/route.ts` icinde `usedPhotos` dolduruldu.
- [ ] **Ileride:** Ornek kitap olusturma akisinda `generation_metadata.usedPhotos`'i otomatik yazacak mantigi eklemek (yeni ornekler olusturuldugunda cover image + karakter fotolari burada saklansin).

---

## 5. Veri Kaynagi Notu

Mevcut ornek kitaplar icin:
- `generation_metadata.characterIds` varsa ve bu karakterler `characters` tablosunda mevcutsa otomatik calisir.
- Eger karakterler tablodan silindiyse veya `characterIds` yoksa `usedPhotos: []` doner (graceful fallback).

---

## 6. Sorun: S3 403 (Private Bucket)

- `reference_photo_url` S3 URL'si; bucket **private**.
- Frontend (next/image) bu URL'e anonymous GET atiyor → S3 **403 Forbidden**.
- Sonuc: thumbnails bos, modal bos.

**Cozum:** Backend'de bu URL'ler icin **presigned GET URL** uretip frontend'e onu vermek. Bucket private kalir; sadece gecici imali URL ile erisim saglanir.

---

## 7. Plan: Presigned URL (Fazlara Gore)

Mevcut yapi korunur: `/api/examples` cevabi ayni formatta kalir, sadece `originalPhoto` alanlari presigned URL ile doldurulur.

### Faz 1 – [x] Tamamlandi (6 Mart 2026)

- `lib/storage/s3.ts` icinde `getSignedObjectUrl` ve `getKeyFromOurS3Url` zaten mevcuttu; yeni dosya acilmadi.
- `app/api/examples/route.ts` icine `presignPhotoUrl` yardimci eklendi:
  - S3 URL ise key cikarip `getSignedObjectUrl(key, 86400)` (24 saat) cagiriyor.
  - S3 URL degilse (test/public gorsel) oldugu gibi geciyor.
  - Hata olursa `null` donuyor → foto atlanıyor.
- `books.map` → `Promise.all(books.map(async ...))` yapildi.
- `generation_metadata.usedPhotos` ve `characterIds` yollarinda her `originalPhoto` presigned URL ile degistiriliyor.
- `next.config.js` icinde `kidstorybook.s3.eu-central-1.amazonaws.com` zaten `remotePatterns`'de; ek degisiklik gerekmedi.

### Faz 2 – [x] Tamamlandi (6 Mart 2026)

- Presign hatasında `null` donus → foto `usedPhotos`'tan atlanıyor, 403 olusmuyor.
- Degisiklik sadece `GET /api/examples` ile sinirli; baska endpoint'ler etkilenmiyor.

### Faz 3 – Dokuman

- [x] Bu dosya guncellendi (6 Mart 2026).
- Presign suresi `PRESIGN_EXPIRY_SECONDS = 24 * 60 * 60` sabiti olarak route dosyasinda tanimlandi.

---

## 8. Ozet

Tum fazlar tamamlandi.
- **API:** `app/api/examples/route.ts` – S3 URL'leri 24 saat gecerli presigned URL olarak donuyor; bucket private kaliyor.
- **UI (6 Mart 2026):** Modal'da gorsel kırpılmasın diye `object-cover` → `object-contain`. Used Photos bolumunde sadece karakter thumbnail'lari; ok (→) ve kapak/olusan gorsel kaldirildi.

**Test:** `/examples` sayfasinda "Used Photos" kutularinin ve modal'in gorsel yukleyip yuklemedigi tarayicidan kontrol edilmeli.
