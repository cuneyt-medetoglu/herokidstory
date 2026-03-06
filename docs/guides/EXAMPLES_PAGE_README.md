# Examples Sayfası - Hızlı Başlangıç Rehberi

**Tarih:** 25 Ocak 2026  
**Durum:** Tasarım Aşamasında

---

## 📋 Özet

Examples sayfası, kullanıcılara hazır örnek kitapları gösterir ve onları kendi kitaplarını oluşturmaya teşvik eder. **Mobil-first** yaklaşımı ile tasarlanmıştır.

## 🚀 Hızlı Başlangıç

### 1. v0.app Prompt'u Kullan

**Dosya:** `docs/guides/EXAMPLES_PAGE_V0_PROMPT.md`

1. `EXAMPLES_PAGE_V0_PROMPT.md` dosyasını aç
2. İçindeki prompt'u kopyala
3. v0.app'e yapıştır
4. Component'ler oluşturulacak

### 2. Oluşan Kodları Entegre Et

v0.app'den gelen kodları şu yapıya göre yerleştir:

```
app/
  examples/
    page.tsx                    # Ana sayfa (v0.app'den gelecek)
    components/
      ExamplesGrid.tsx         # Grid layout (v0.app'den gelecek)
      BookCard.tsx              # Kitap kartı (v0.app'den gelecek)
      AgeFilterChips.tsx        # Yaş filtreleme (v0.app'den gelecek)
      UsedPhotosModal.tsx       # Fotoğraf modal (v0.app'den gelecek)
      EmptyState.tsx            # Empty state (v0.app'den gelecek)
      LoadingSkeleton.tsx       # Loading (v0.app'den gelecek)
    types.ts                    # ✅ Hazır (mock data yapısı)
```

### 3. Mock Data Entegrasyonu

`app/examples/types.ts` dosyasında mock data hazır. Component'lere entegre et:

```typescript
import { mockExampleBooks } from './types'

// page.tsx içinde
const [books, setBooks] = useState(mockExampleBooks)
const [selectedAge, setSelectedAge] = useState<AgeGroup | 'All'>('All')
```

### 4. Test Et

1. `npm run dev` ile development server'ı başlat
2. `/examples` sayfasına git
3. Mobil görünümde test et (Chrome DevTools)
4. Yaş filtreleme çalışıyor mu kontrol et
5. "Used Photos" thumbnail'ları görünüyor mu (API'den presigned URL ile), modal açılıyor mu kontrol et

**Used Photos (6 Mart 2026):** API `usedPhotos` döndürüyor; S3 görselleri 24 saat geçerli presigned URL ile geliyor. Bölümde sadece karakter fotoğrafları gösteriliyor (ok ve kapak thumbnail'ı kaldırıldı). Modal'da görsel tam görünüyor (`object-contain`). Detay: `docs/features/EXAMPLES_USED_PHOTOS_FEATURE.md`.

## 📱 Mobil Test Checklist

- [ ] Yaş filtreleme chips yatay scroll ediyor mu?
- [ ] Kartlar mobilde 1 sütun mu?
- [ ] Butonlar touch-friendly mi (min 44px)?
- [ ] Modal mobilde full-screen mi?
- [ ] Fotoğraf thumbnails görünüyor mu?
- [ ] Empty state çalışıyor mu?
- [ ] Loading skeleton görünüyor mu?

## 🎨 Tasarım Özellikleri

### Responsive Breakpoints
- **Mobile:** 320px - 767px (1 sütun)
- **Tablet:** 768px - 1023px (2 sütun)
- **Desktop:** 1024px - 1439px (3 sütun)
- **Large:** 1440px+ (4 sütun)

### Renkler
- Primary: Purple to pink gradient
- Secondary: Gray tones
- Background: White cards on light gray

### Animasyonlar
- Card hover: scale(1.02) + shadow (desktop)
- Chip selection: Color transition
- Modal open: Fade + scale

## 📝 Gelecek Adımlar

1. **v0.app'den kod al** → Component'leri oluştur
2. **Mock data entegre et** → `types.ts` kullan
3. **Test et** → Mobil ve desktop'ta kontrol et
4. **API hazır olunca** → Mock data yerine API çağrısı yap
5. **"View Example" fonksiyonu** → Gelecek fazda eklenecek
6. **"Create Your Own" yönlendirme** → Wizard'a geçiş

## 📚 İlgili Dosyalar

- **v0.app Prompt:** `docs/guides/EXAMPLES_PAGE_V0_PROMPT.md`
- **Type Definitions:** `app/examples/types.ts`
- **ROADMAP:** `docs/ROADMAP.md` (Faz 2.7.8)
- **Plan:** `c:\Users\Cüneyt\.cursor\plans\examples_sayfası_tasarım_planı_bc0d508f.plan.md`
- **Ana Sayfa Carousel:** `components/sections/ExampleBooksCarousel.tsx` (Examples sayfası ile uyumlu)

## 🔄 Son Güncellemeler (25 Ocak 2026)

**ExampleBooksCarousel İyileştirmeleri:**
- Desktop/tablet görünümünde yatay slider implementasyonu (grid'den flex'e geçiş)
- Navigation butonları spacing optimizasyonu
- Mock data entegrasyonu (`mockExampleBooks` ile uyumlu)
- Image fallback mekanizması
- Ana sayfa carousel'i ile Examples sayfası arasında tutarlılık sağlandı

## ❓ Sorular?

- Tasarım soruları için plan dosyasına bak
- Teknik sorular için v0.app prompt'una bak
- İş akışı için ROADMAP'a bak
