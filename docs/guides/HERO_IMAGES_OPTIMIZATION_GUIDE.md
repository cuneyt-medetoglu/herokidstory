# Hero Görselleri — Build-time Optimizasyon ve Yeni Görsel Ekleme

**İlgili dosyalar:** `scripts/optimize-hero-images.mjs`, `lib/config/hero-transformation.ts`, `components/sections/HeroBookTransformation.tsx`

---

## Neden build-time optimizasyon?

Ana sayfadaki hero transformation görselleri `next/image` ile kullanılıyordu. Next.js bu görselleri **ilk istek anında** sunucuda Sharp ile avif’e dönüştürüyor. Burstable CPU’lu sunucularda (örn. T2 Medium) dönüşüm görsel başına **3–7 saniye** sürebiliyor; cache dolana kadar “Waiting for server response” uzuyor.

**Çözüm:** Görselleri **build time’da bir kere** webp’ye dönüştürüp `public/hero-transformation/optimized/` altına kaydediyoruz. Uygulama bu statik dosyaları kullanıyor; runtime’da sunucu dönüşüm yapmıyor.

- İlk ziyaret: ~50 ms (statik dosya)
- Sunucu CPU: sıfır ek yük
- Cache’e bağımlılık yok

---

## Mevcut pipeline (özet)

1. **Kaynak görseller:** `public/hero-transformation/real/`, `public/hero-transformation/stories/` (png/jpg).
2. **Script:** `npm run optimize-images` → `scripts/optimize-hero-images.mjs` Sharp ile 800×800 cover, quality 82 webp üretir → `public/hero-transformation/optimized/`.
3. **Config:** `lib/config/hero-transformation.ts` tüm `src` değerleri `/hero-transformation/optimized/...webp` kullanır.
4. **Bileşen:** `HeroBookTransformation.tsx` içinde `next/image` ile bu `src`’ler kullanılır; **`unoptimized`** verildiği için Next.js tekrar işlemez.
5. **Preload:** Carousel’de sıradaki hikaye görseli `useEffect` ile `new Image()` ile önceden yüklenir.

---

## İleride yeni hero görseli eklerken

Yeni bir **real photo** veya **story character** eklediğinde aşağıdaki sırayı uygula:

### 1. Optimize script’e ekle

`scripts/optimize-hero-images.mjs` içindeki `images` dizisine yeni girdiyi ekle:

```js
const images = [
  // ... mevcut girdiler ...
  {
    input: "public/hero-transformation/stories/yeni-tema.jpg",
    output: "public/hero-transformation/optimized/yeni-tema.webp",
  },
]
```

- **Real photo** için: `input` → `public/hero-transformation/real/dosya.png`, `output` → `.../optimized/arya-real.webp` (veya yeni isim).
- **Story character** için: `input` → `public/hero-transformation/stories/...jpg`, `output` → `.../optimized/...webp`.

### 2. Config’i güncelle

`lib/config/hero-transformation.ts` içinde ilgili `src` yolunu **optimized** dosyaya çevir:

- Eski: `src: "/hero-transformation/real/arya.png"` veya `src: "/hero-transformation/stories/arya-forest.jpg"`
- Yeni: `src: "/hero-transformation/optimized/arya-real.webp"` veya `src: "/hero-transformation/optimized/yeni-tema.webp"`

Yeni bir tema (yeni carousel öğesi) ekliyorsan `heroTransformationConfig` dizisine yeni eleman ekle; `realPhoto` ve `storyCharacter.src` hep optimized path olsun.

### 3. Webp’leri üret

```bash
npm run optimize-images
```

Bu komut `public/hero-transformation/optimized/` altına tanımlı tüm webp dosyalarını (yeniler dahil) oluşturur.

### 4. Çıkan webp’leri commit et

Oluşan `.webp` dosyalarını git’e ekleyip commit et. Böylece deploy’da da statik dosyalar hazır olur; sunucuda runtime dönüşüm gerekmez.

---

## Özet checklist (yeni hero görseli)

| Adım | Dosya / Komut |
|------|----------------|
| 1 | `scripts/optimize-hero-images.mjs` → `images` listesine `input` / `output` ekle |
| 2 | `lib/config/hero-transformation.ts` → ilgili `src` değerlerini `/hero-transformation/optimized/...webp` yap |
| 3 | `npm run optimize-images` çalıştır |
| 4 | `public/hero-transformation/optimized/*.webp` çıktılarını commit et |

---

**İlgili dokümanlar**

- Görsel formatı ve config yapısı: `docs/guides/HERO_YOUR_CHILD_THE_HERO_IMAGES_ANALYSIS.md`
- Performans analizi: `docs/analysis/HERO_TRANSFORMATION_PERFORMANCE_ANALYSIS.md`
