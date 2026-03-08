# HeroBookTransformation Lokalizasyon Analizi

**Tarih:** 8 Mart 2026  
**Durum:** Analiz tamamlandı — Düzeltme uygulandı  
**İlgili:** Localization Agent, DEV-3 kapsamı

---

## 1. Sorun

Ana sayfada dil TR seçili olsa bile **HeroBookTransformation** bileşenindeki metinler İngilizce görünüyor:

- "Your Child, The Hero"
- "Watch the magic happen"
- "Real Photo" / "Story Character"
- "Arya, Age 1" / "Magical Castle" (tema adı)
- "AI Powered" / "100% Personalized"
- "Magic!" (mobil ok)

---

## 2. Neden Yapılmadı?

### 2.1 DEV-3 kapsamı

`docs/implementation/LOCALIZATION_IMPLEMENTATION.md` ve `docs/analysis/LOCALIZATION_ANALYSIS.md` içinde:

- **DEV-3.1** sadece **Hero.tsx** için tanımlı: *"Hero section metin taşıma"* ve *"Hero.tsx — useTranslations('hero'): badge, titlePart1/titleHighlight/titlePart2, subtitle, cta, seeExamples"*.
- **HeroBookTransformation.tsx** ayrı bir bileşen olarak listelenmemiş; DEV-3 kapsamına sadece ana Hero sol sütunu (başlık, alt başlık, CTA butonları) alınmış.

### 2.2 Bileşen ayrımı

- **Hero.tsx**: Sol sütun — badge, başlık parçaları, subtitle, CTA. Bu kısım `useTranslations('hero')` ile lokalize edilmiş; TR’de doğru görünüyor.
- **HeroBookTransformation.tsx**: Sağ sütun — dönüşüm kartları, tema adları, "Real Photo" / "Story Character", stat badge’leri. Bu bileşende hiç `useTranslations` kullanılmıyor; tüm metinler hardcoded İngilizce.

### 2.3 Olası nedenler

1. **Zamanlama:** HeroBookTransformation DEV-3 tamamlandıktan sonra eklenmiş veya refactor edilmiş olabilir; checklist sadece o anki Hero.tsx’e göre doldurulmuş.
2. **Kapsam yorumu:** "Hero section" denince sadece ana Hero.tsx’in metinleri kastedilmiş, alt bileşen (HeroBookTransformation) dahil edilmemiş.
3. **Agent kuralı:** `.cursor/rules/localization-agent.mdc` içinde bileşen listesinde **HeroBookTransformation.tsx** yok; sadece **Hero.tsx** geçiyor.

Sonuç: Eksiklik bir hata değil, kapsam tanımının dar yorumlanmasından kaynaklanıyor. Düzeltme için HeroBookTransformation’ın da i18n kapsamına alınması gerekiyor.

---

## 3. Yapılması Gerekenler (Özet)

| # | İş | Açıklama |
|---|----|----------|
| 1 | **hero.transformation** namespace | messages/en.json ve tr.json içinde `hero.transformation` altında tüm UI metinleri tanımlanmalı. |
| 2 | **HeroBookTransformation.tsx** | `useTranslations('hero.transformation')` (veya `'hero'` + alt key’ler) ile sabit metinler çeviri key’lerine taşınmalı. |
| 3 | **Tema adları** | Config’teki `id` (forest, space, castle, dinosaur) ile eşleşen key’ler (`hero.transformation.themes.forest` vb.) eklenmeli. |
| 4 | **Fotoğraf alt yazısı** | "Arya, Age 1" için ya sabit çeviri (hero.transformation.realPhotoCaption) ya da name + age ayrı key’ler (realPhotoName, realPhotoAge) kullanılmalı. |
| 5 | **Implementasyon dokümanı** | LOCALIZATION_IMPLEMENTATION.md’de DEV-3 altına HeroBookTransformation maddesi eklenmeli / güncellenmeli. |

---

## 4. Teknik Detay

### 4.1 Kullanılacak çeviri key’leri (hero.transformation)

| Key | EN | TR |
|-----|----|----|
| title | Your Child, The Hero | Çocuğunuz, Kahraman |
| subtitle | Watch the magic happen | Büyünün gerçekleşmesini izleyin |
| realPhotoLabel | Real Photo | Gerçek Fotoğraf |
| storyCharacterLabel | Story Character | Hikaye Karakteri |
| magicLabel | Magic! | Sihir! |
| aiPowered | AI Powered | Yapay Zeka Destekli |
| personalized | 100% Personalized | %100 Kişiselleştirilmiş |
| themes.forest | Forest Journey | Orman Yolculuğu |
| themes.space | Space Adventure | Uzay Macerası |
| themes.castle | Magical Castle | Sihirli Kale |
| themes.dinosaur | Dinosaur Jungle | Dinozor Ormanı |
| realPhotoName | Arya | Arya |
| realPhotoAge | Age 1 | 1 Yaşında |
| ariaSwitchTheme | Switch to {name} | {name} temasına geç |

### 4.2 Config kullanımı

`lib/config/hero-transformation.ts` yapısı korunur; `id` alanı (forest, space, castle, dinosaur) çeviri key’i olarak kullanılır: `t(\`themes.${currentItem.id}\`)`. Böylece config’e locale enjekte etmek gerekmez.

---

## 5. Referanslar

- **Localization analiz:** `docs/analysis/LOCALIZATION_ANALYSIS.md`
- **Implementasyon takibi:** `docs/implementation/LOCALIZATION_IMPLEMENTATION.md`
- **Agent kuralı:** `.cursor/rules/localization-agent.mdc`
- **Bileşen:** `components/sections/HeroBookTransformation.tsx`
- **Config:** `lib/config/hero-transformation.ts`
