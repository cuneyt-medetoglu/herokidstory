# Sayfa Sayısı Bug Analizi

## Sorun Özeti

1. Debug'da `3` girilen sayfa sayısı, ödeme sonrası `10` sayfaya dönüşüyor.
2. Hiç girilmezse varsayılan `10` geliyor — oysa sistemin her yerinde `12` yazıyor.

---

## Kök Neden

### `step6/page.tsx` — Kritik Hata (satır 702–728)

```ts
// YANLIŞ — planType bir fiyat bandı ("10" | "15" | "20"), sayfa sayısı değil
const planType = pageCountToPlanType(formData.pageCount)   // 3 → "10"
totalPages: parseInt(planType, 10),                         // → 10
```

`pageCountToPlanType` fiyatlandırma için bir **ödeme planı bandı** döndürür:

| Sayfa sayısı | Band | Sonuç |
|---|---|---|
| `undefined` / geçersiz | `"10"` | **10** ← yanlış varsayılan |
| 3 | `"10"` | **10** ← 3 girildi ama 10 gidiyor |
| 12 | `"15"` | **15** ← fiyat bandı değil sayfa sayısı isteniyor |
| 20 | `"20"` | **20** |

Bu değer `checkout-placeholder` API'sine `totalPages` olarak gönderilir → DB'ye `total_pages = 10` yazılır.

### `paid-checkout-generation.ts` (satır 87)

Ödeme sonrası üretim başlatıldığında:

```ts
const pageCount = Math.max(1, Math.min(64, book.total_pages || 10))
```

DB'de zaten yanlış `10` olduğundan `||` fallback'e bile düşmez — doğrudan `10` sayfa üretilir.

---

## Veri Akışı (Hatalı Hal)

```
Step5: kullanıcı "3" girer → step5.pageCount = 3
Step6: pageCountToPlanType(3) = "10" (fiyat bandı)
     → checkout-placeholder API'ye totalPages: 10 gönderilir
     → DB: books.total_pages = 10
Ödeme tamamlanır:
     → paid-checkout-generation: book.total_pages || 10 = 10
     → Kuyruk: pageCount = 10
     → AI: 10 sayfalık hikaye üretir  ← YANLIŞ
```

---

## Sistemdeki Tutarlı Değerler (Referans)

| Yer | Değer | Açıklama |
|---|---|---|
| `step5/page.tsx:20` | `DEFAULT_PAGE_COUNT = 12` | Kullanıcı arayüzü varsayılanı |
| `step6/page.tsx:56` | `DEFAULT_PAGE_COUNT = 12` | Özet sayfası varsayılanı |
| `app/api/books/route.ts:766` | `effectivePageCount = pageCount \|\| 12` | Üretim API varsayılanı |
| `lib/prompts/story/base.ts:247` | `resolveStoryPageCount`: 2–20 ya da 12 | Prompt varsayılanı |
| `app/api/ai/generate-story/route.ts:116` | `expectedPageCount = override \|\| 12` | Story API varsayılanı |

**Sistemin tüm katmanlarında default = 12. Sadece ödeme yolunda 10 var.**

---

## İkincil Tutarsızlık

`paid-checkout-generation.ts:87` satırındaki `|| 10` de yanlış:

```ts
// Mevcut (yanlış):
const pageCount = Math.max(1, Math.min(64, book.total_pages || 10))

// Olması gereken:
const pageCount = Math.max(1, Math.min(64, book.total_pages || 12))
```

---

## Önerilen Düzeltme

### 1. `step6/page.tsx` — Ana Düzeltme

`handlePayCheckout` fonksiyonunda `totalPages`'i fiyat bandından değil, gerçek sayfa sayısından alın:

```ts
// Önce (YANLIŞ):
totalPages: parseInt(planType, 10),

// Sonra (DOĞRU):
totalPages: (typeof formData.pageCount === 'number' && formData.pageCount > 0)
  ? formData.pageCount
  : DEFAULT_PAGE_COUNT,
```

`planType` sadece `addToCart` için kullanılmaya devam eder — amacı bu zaten.

### 2. `paid-checkout-generation.ts` satır 87 — İkincil Düzeltme

```ts
// Önce:
const pageCount = Math.max(1, Math.min(64, book.total_pages || 10))

// Sonra:
const pageCount = Math.max(1, Math.min(64, book.total_pages || 12))
```

---

## Debug Yolunda Durum (Referans)

Debug modu (`/api/books` direkt çağrısı), ödeme yolundan bağımsızdır:
- `books/route.ts:766`: `effectivePageCount = pageCount || 12` — doğru çalışır
- Kullanıcı 3 girerse 3 gider, boş bırakırsa 12 gider

Bu nedenle debug'da da 3 girmek 10 sonuç veriyorsa, wizard storage'dan `step5.pageCount`'un doğru taşınıp taşınmadığı ayrıca kontrol edilmeli.

---

## Uygulanan Çözüm

Tüm sabitler `lib/constants/book-config.ts` dosyasına taşındı (single source of truth):

```
DEFAULT_PAGE_COUNT = 12       → varsayılan sayfa sayısı
PAGE_COUNT_MIN = 2            → geçerli aralık alt sınırı
PAGE_COUNT_MAX = 20           → geçerli aralık üst sınırı
PAGE_COUNT_DB_MAX = 64        → DB sınırı
PAGE_COUNT_DEBUG_FALLBACK = 4 → sadece debug/step-runner için yedek
resolvePageCount(value)       → tek satır ile geçerli sayfa sayısı çözümleyici
```

### Değiştirilen Dosyalar

| Dosya | Değişiklik |
|---|---|
| `lib/constants/book-config.ts` | **Yeni** — tüm sabitler burada |
| `step6/page.tsx` | `totalPages: parseInt(planType, 10)` → `resolvePageCount(formData.pageCount)` (**ana bug fix**) |
| `paid-checkout-generation.ts` | `\|\| 10` → `\|\| DEFAULT_PAGE_COUNT` |
| `lib/prompts/story/base.ts` | `?? 12`, `>= 2`, `<= 20` → sabitler |
| `app/api/books/route.ts` | `: 12`, `\|\| 5` → sabitler |
| `app/api/ai/generate-story/route.ts` | `>= 2`, `<= 20`, `: 12` → sabitler |
| `step5/page.tsx` | `DEFAULT_PAGE_COUNT` local → import; `resolvePageCount` kullanımı |
| `image-pipeline.ts` | `\|\| 4` → `PAGE_COUNT_DEBUG_FALLBACK` |
| `book-generation.worker.ts` | `\|\| 4` → `PAGE_COUNT_DEBUG_FALLBACK` |

## Test Senaryoları

- [ ] 3 sayfa gir, ödeme yap → DB `total_pages = 3`, üretim 3 sayfa üretmeli
- [ ] Boş bırak, ödeme yap → DB `total_pages = 12`, üretim 12 sayfa üretmeli
- [ ] Debug (skip payment) 3 sayfa → 3 sayfa üretmeli
