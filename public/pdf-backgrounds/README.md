# PDF Background Patterns

Bu klasör PDF generation için kullanılan arka plan desenlerini içerir.

## Mevcut Desenler

### yildizli-kiyi-p48.svg (aktif — metin sayfaları)
- **Kaynak:** `public/dev/bg-alternatives.html` desen **#48** “Yıldızlı Kıyı”.
- **Açıklama:** Altta iki yumuşak dalga yıkaması; üstte teal/pembe squiggle + yıldız süsleri. A5 oranı (`viewBox` 100×141.4), tam yarım sayfa `background-size: 100% 100%`.
- **HTML:** `lib/pdf/generator.ts` — `getTextPageBackgroundSvgInline()` dosyayı okuyup metin yarımına `.text-page-bg-layer` + `<svg>` olarak gömer (Puppeteer’da CSS arka planı yerine; **böylece desen PDF’de görünür**).
- **CSS:** `lib/pdf/templates/book-styles.css` — `.text-page`, `.text-page-bg-layer`
- **Kullanım:** Hem **dashboard** hem **admin print** PDF’lerinde metin yarımlarında.
- **embedPdfBackgroundSvgs():** CSS’te `url(/pdf-backgrounds/…)` kalan varsa base64 gömme (isteğe bağlı).

### children-pattern.svg
- **Durum:** Geçmişte köşe desenleri için referans; metin sayfası arka planı şu an **yildizli-kiyi-p48.svg**.

### default-pattern.svg
- **Açıklama:** Hafif, noktalı pattern. Metin okunabilirliğini korur.
- **Renkler:** Pastel tonlar (pembe, mavi, sarı, yeşil)
- **Kullanım:** Varsayılan arka plan deseni (şu an `.text-page` tarafından kullanılmıyor)

## Gelecek İyileştirmeler

Aşağıdaki arka plan desenleri eklenebilir:
- Yıldız pattern
- Kalp pattern
- Bulut pattern
- Geometrik şekiller
- Tema bazlı desenler (deniz, orman, uzay vb.)

## Tasarım Kuralları

1. **Okunabilirlik:** Arka plan deseni metin okunabilirliğini engellememeli
2. **Opacity:** Desenlerin opacity değeri 0.2-0.4 arasında olmalı
3. **Renkler:** Pastel ve yumuşak tonlar tercih edilmeli
4. **Format:** SVG (vektörel, küçük dosya boyutu) veya PNG
5. **Boyut:** Tekrar eden pattern için 200x200px yeterli

## Kullanım

PDF generator (`lib/pdf/generator.ts`) bu klasördeki desenleri kullanır.
