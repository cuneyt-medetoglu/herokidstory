# Read-Along “Video” Deneyimi: Motion Design + Karaoke Metin (Veo Alternatifi)

**Durum:** ~~Analiz~~ → Tamamlandı. Güncel dokümanlar: `docs/audio-story/ROADMAP.md`  
**Tarih:** 30 Mart 2026  
**İlgili:** Post-MVP özellik; PRD’de “video hikayeler” MVP dışı — bu doküman **generative video (Veo) yerine** sürdürülebilir bir yol önerir.  
**Takip:** `@project-manager` — ROADMAP / notlar, faz ve ürün önceliği. Hikaye çıktı şeması veya prompt genişlemesi gerekirse `@prompt-manager` (şema, `lib/prompts/story/base.ts` sürümü); kalite metrikleri aşağıda.

---

## 1. Özet

| Boyut | Generative video (ör. Veo) | Bu dokümandaki yaklaşım |
|--------|----------------------------|-------------------------|
| Maliyet | Üretilen video saniyesi başına yüksek API maliyeti | Çoğunlukla **mevcut görseller + TTS + render**; marjinal maliyet düşük |
| Kalite algısı | Sinematik hareket | **Profesyonel şablon**, ritim, ses–görsel uyumu, **karaoke/altyazı** ile “premium okuma videosu” |
| Risk | Model kota, uzun üretim süresi, watermark | **Zaman senkronu** doğruluğu (kelime/süre), çok dil, erişilebilirlik |
| Kodda mevcut temel | — | Sayfa görselleri, flipbook, **Google TTS** (`lib/tts/generate.ts`), kitap oluşturma akışı |

**Kullanıcı vaadi:** YouTube’daki gibi **metin parça parça (ör. 2–3 kelime)** ekranda belirir; **ses** ile birlikte ilerler — tam da “TTS ile senkron karaoke” deneyimi.

---

## 2. Ürün tanımı

### 2.1 Deneyim

- **Görsel katman:** Mevcut sayfa illüstrasyonu üzerinde hafif hareket (zoom/pan, yumuşak geçiş, isteğe bağlı parallax).  
- **Metin katman:** Ekranın güvenli bölgesinde (alt bant veya üst), **okunan kısım** vurgulanır; sıradaki kelime/kelime grubu **belirir veya highlight** olur.  
- **Ses:** Mevcut **TTS** ile sayfa veya cümle bazlı ses; kullanıcı hızı / ses seçimi Parent Settings ile uyumlu olmalı (bkz. `docs/strategies/TTS_STRATEGY.md`).

### 2.2 Çıktı formatları (ürün seçenekleri)

| Mod | Açıklama | Dağıtım |
|-----|----------|---------|
| **A. Uygulama içi (önerilen MVP)** | `BookViewer` içinde tam ekran “Read-along” veya mevcut otomatik oynatma genişletmesi | Web, mevcut S3 TTS URL’leri |
| **B. İndirilebilir MP4** | Sunucu veya istemci tarafı **FFmpeg** ile video dosyası | Paylaşım, “video gibi kitap” |
| **C. Kısa teaser** | Sadece ilk N sayfa veya tek bölüm | Sosyal / e-posta |

Önce **A** ile doğrulama; **B** talep ve maliyet (depolama, CPU) netleştikten sonra.

---

## 3. Teknik mimari (özet)

```
Sayfa metni + görsel URL + TTS ses (MP3)
        ↓
Zaman çizelgesi: hangi kelime/grup hangi t0–t1 aralığında
        ↓
Oynatıcı: audio.currentTime → aktif metin parçası + görsel motion (CSS/Canvas/WebGL)
        ↓
[İsteğe bağlı] FFmpeg: video + ses + burn-in subtitle → MP4 → S3
```

### 3.1 Görsel hareket (motion)

- **Ken Burns:** Statik PNG/WebP üzerinde `transform: scale() translate()` animasyonu; süre = sayfa süresi veya TTS süresi.  
- **Şablonlar:** Yaş grubuna göre 2–3 “tema” (yumuşak zoom, hafif sway) — tutarlı marka hissi.  
- **Performans:** Mobil için `prefers-reduced-motion` ve düşük FPS fallback.

### 3.2 Karaoke / kelime vurgusu — kritik bileşen

**Hedef:** Metni **2–3 kelimelik** gruplar halinde göstermek; ses ile **aynı anda** ilerlemek.

**Zaman çizelgesi kaynakları (öncelik sırasıyla):**

1. **Zorunlu hizalama (forced alignment)**  
   - Metin + üretilmiş ses dosyasından **kelime veya fonom bazlı** süreler (ör. açık kaynak aligner veya bulut API).  
   - Artı: Gerçek konuşma süresine uyum.  
   - Eksi: Ek işlem veya ek API; çok dilde kalite değişir.

2. **TTS’ten doğrudan zaman damgası**  
   - Bazı TTS API’leri **SSML `<mark>`** veya **timepoint** çıktısı verir; Google Cloud TTS tarafında ürün/evrim durumu **dokümantasyon ve sürüm ile doğrulanmalı**.  
   - Mevcut kod yolu: `synthesizeSpeech` + MP3 (`lib/tts/generate.ts`) — **şu an dönüşte kelime süresi yok**; özellik için ya istek genişletilir ya da (1) kullanılır.

3. **Heuristik (MVP geçiş)**  
   - Ses süresini metin uzunluğuna **oransal böl** (kelime/karakter ağırlıklı).  
   - Artı: Hızlı prototip.  
   - Eksi: Vurgu ritmi doğal değil; üretim kalitesi için yeterli olmayabilir.

**Öneri:** MVP’de (3) ile UX doğrulaması; **Beta’da (1) veya TTS timepoint (2)** ile kalite.

### 3.3 Metin parçalama (görüntü birimi)

- **Girdi:** Sayfa metni (düz string).  
- **Bölme:**  
  - Basit: `split(/\s+/)` ile kelimeler → gruplar (2–3 kelime).  
  - Gelişmiş: dilbilgisel / noktalama ile kısa cümle dilimleri (TR/EN farklı kurallar).  
- **Prompt / içerik tarafı (@prompt-manager):** İleride **hikaye şeması**na isteğe bağlı `readAlongChunks: string[]` eklemek, modelden **anlamlı kesme** sınırlarını verebilir; bu, görsel prompt’tan bağımsız bir **story output** genişlemesidir. Zorunlu değil; başlangıçta sunucu tarafı bölme yeterli.

---

## 4. Veo ile karşılaştırma (iş gerekçesi)

| Kriter | Veo tabanlı | Motion + karaoke |
|--------|-------------|------------------|
| Birim maliyet | Üretilen video sn × yüksek $/sn | TTS + (isteğe bağlı) hizalama + depolama |
| Uzun kitap (12–24 sayfa) | Çok sayıda klip / uzatma → maliyet patlar | Süre = ses süresi; **tek üretim hattı** |
| Tutarlılık | Sahne sahne prompt | **Zaten üretilmiş** illüstrasyonlar aynen kullanılır |
| Yasal/marka | SynthID vb. | Mevcut içerik politikası |

---

## 5. Uygulama fazları (öneri)

| Faz | Kapsam | Çıktı |
|-----|--------|--------|
| **P0** | BookViewer’da tam ekran read-along; heuristik sync; basit Ken Burns | Karar: devam / iptal |
| **P1** | Gerçek zaman çizelgesi (alignment veya TTS timepoints); 2–3 kelime highlight | Üretim kalitesi |
| **P2** | FFmpeg ile MP4 export; kuyruk; S3 | “İndir” özelliği |
| **P3** | Şablon çeşitliliği, erişilebilirlik (kontrast, kapalı altyazı) | Polish |

---

## 6. Riskler ve mitigasyon

| Risk | Mitigasyon |
|------|------------|
| Senkron kayması | Ses süresine göre düzenli **seek** kalibrasyonu; kısa sayfa metinlerinde hata azalır |
| Çok dil | Alignment / heuristik dil başına test; TR kesme kuralları |
| Mobil performans | Canvas yerine CSS animasyon; düşük çözünürlük önizleme |
| Kullanıcı rahatsızlığı | Hızlı yanıp sönen metin yerine **yumuşak geçiş**; ayar: kelime/saniye veya grup boyutu |

---

## 7. Metrikler (ürün; takip @project-manager)

- **Tamamlama oranı:** Read-along modunda oturumun sonuna kadar dinleme.  
- **Şikayet:** “Metin sesden geride/ileride” — zaman çizelgesi kalitesi için sinyal.  
- **Tekrar kullanım:** Aynı kitapta ikinci oynatma.  
- İleride A/B: **heuristik vs alignment** senkron kalitesi.

---

## 8. Kod ve doküman referansları

| Konu | Dosya / konum |
|------|----------------|
| TTS üretim | `lib/tts/generate.ts`, `app/api/tts/generate/route.ts` |
| TTS strateji | `docs/strategies/TTS_STRATEGY.md` |
| Görüntüleyici | `components/book-viewer/book-viewer.tsx`, `hooks/useTTS.ts` |
| Kitap oluşturma akışı | `docs/analysis/CREATE_BOOK_FLOW_SEQUENCE.md` |
| Hikaye metni şeması | `lib/prompts/story/base.ts` (read-along chunk alanı eklenecekse versiyon + changelog) |
| AI maliyet | `docs/guides/AI_COST_AND_USAGE_LOGGING.md` |
| Veo maliyet karşılaştırması | Takım içi önceki özet: saniye başına ücret; bu özellik **Veo kullanmaz** |

---

## 9. Sonuç

HeroKidStory için **“video gibi kitap”** deneyimi, **generative video** yerine **mevcut varlıklar + TTS senkronu + karaoke metin + hafif motion** ile hem maliyet hem kontrol açısından daha sürdürülebilir. Kritik mühendislik parçası **zaman çizelgesi**; MVP’de heuristik, ürün olgunlaştıkça **forced alignment** veya **TTS timepoints** ile yükseltme önerilir. İçerik tarafında anlamlı kesme gerekirse `@prompt-manager` ile **story output** şeması ve sürüm notları güncellenmelidir.

---

**Revizyon:** İlk sürüm 2026-03-30.

---

> **Not (2026-04-11):** Bu analiz fazlandırılarak `docs/read-along-karaoke/` klasörüne taşınmıştır. Güncel yol haritası, faz dokümanları ve detaylı planlar için → [`docs/read-along-karaoke/ROADMAP.md`](../read-along-karaoke/ROADMAP.md)
