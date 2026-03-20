# Prompt Analizi ve İyileştirme Önerileri (v4.3)
**Kapsam:** `logs/ai-api-debug.jsonl`; `scene.ts` / pipeline; kullanıcı geri bildirimi (kapak göz rengi, çiçek/kenar, story vs kod)  
**Durum (20 Mart 2026):**  
- **Ö1–Ö3 + ek patch’ler uygulandı** (kapak minimal yol, iç sayfada `environmentDescription` varken outdoor derinlik paketi yok, `route.ts` alan iletimi, kapak SCENE sadeleştirmesi, vb.).  
- **Kullanıcı testi:** Bazı koşularda hâlâ çiçek/kenar ve **kapakta göz rengi drift** raporlandı — kök neden tek değil; aşağıda **konuşmalardan netleşenler** ve **sıradaki öneriler (Ö9+)**.  
- **Story:** `base.ts` **v2.7.0** → [`HARDCODED_ORNEKLER_VE_AMAC_ANALIZI.md`](./HARDCODED_ORNEKLER_VE_AMAC_ANALIZI.md).  
- **Detaylı log incelemesi:** [`LOG_YAPRAK_SORUNU_20_MART_2026.md`](./LOG_YAPRAK_SORUNU_20_MART_2026.md).  

**Tek giriş:** [`GORSEL_PROMPT_VE_TEST_REHBERI.md`](./GORSEL_PROMPT_VE_TEST_REHBERI.md)

**Güncelleme (v4.3 / story v2.8.0):** `coverImagePrompt` — story JSON’da kapak için ayrı İngilizce görsel brief; pipeline `resolveCoverEnvironment`: `coverImagePrompt` → `coverDescription` → `coverSetting` → derive. `scene.ts` kapak dalında sabit `getCoverBookLayoutDirectives()` (poster + üstte başlık alanı, çiçek çerçevesi yok).

---

## Konuşmalardan netleşenler (20 Mart 2026)

### A) Master referansı = göz rengi garantisi değil

`images/edits` çağrısında **master PNG + metin prompt** birlikte gider. Referans, yüz/kıyafet için güçlü ipucu verir; **iris rengi piksel kopyası değildir**. Metin, kimliği sabitlemede yardımcı olur.

- **image_master** isteğinde log örneğinde **`hazel eyes` metinde var**.  
- **image_cover** isteğinde (ör. `f52f0673…` koşusu) **SCENE içinde göz rengi satırı yok** — sadece hikâye `coverDescription` + stil + “reference identity”.  
- Sonuç: **“Master verildi, kapakta tekrar yazmaya gerek yok”** idealdir; pratikte **kapak promptuna master ile aynı kısa kimlik özeti (en az göz rengi + saç)** eklemek drift’i azaltır. Bu, **her sayfada üç kez aynı paragraf** demek değil; **kapak + master hizası** demektir.

### B) Kenar çiçek / yeşillik: hem story hem kod

| Katman | Rol |
|--------|-----|
| **story_generation** | `coverDescription` / `environmentDescription` içinde **outdoor, kutlama, park, yaprak, açık gökyüzü** vb. yazılırsa görsel model doğayı/kenar süsünü **metinden** tamamlar. |
| **Pipeline (`scene.ts`)** | `PRIORITY` → “Environment richness”, iç sayfada `getCinematicNaturalDirectives` (sky/path/horizon), collage/watercolor stil metinleri → **boşluğu doldurma** baskısı. |

Yani soru “sadece story mi?” → **Hayır, ikisi birden**; hangi koşuda hangisi baskın logdan ayrılır (`bookId` ile filtre).

### C) “Eskiden yoktu” — regresyon mu, tesadüf mü?

Olasılıklar bir arada:

1. **Kapak yolu sadeleşince** uzun `generateScenePrompt` zincirindeki **fiziksel betim** (göz dahil) kapak metninden **düşmüş olabilir** → kapak/sayfa tutarsızlığı **yan etki** ile uyumlu.  
2. **Story varyansı** — aynı tohumda bile bir koşuda **indoor**, diğerinde **outdoor basketball + open sky** (`f52f0673` logu).  
3. **Model / çekirdek rastgeleliği** — aynı promptta küçük fark.  

Remote **GitHub son commit** ile yerel prompt kodu **her zaman aynı olmayabilir**; “tek commit suçlu” demek zor.

### D) Somut “var / yok” (örnek: log `f52f0673…`)

| Adım | `hazel eyes` (veya ela) metinde |
|------|----------------------------------|
| image_master | **Var** |
| image_cover | **Yok** (SCENE’de yok) |
| image_page | Genelde **reference + karakter bloğu**; her satırda göz şart değil |

---

## Sıradaki öneriler (onay sonrası uygulama — Ö9+)

**Ö9 — Kapak promptuna kimlik özeti**  
Master ile aynı kaynaktan: göz rengi, saç, ten (kısa tek satır). Amaç: `image_cover` drift’ini kesmek.

**Ö10 — Story doğrulama / tohum kuralları**  
Kullanıcı “kapalı salon” istiyorsa: `coverDescription` ve sayfa ortamlarının **outdoor’a kaymaması**; isteğe bağlı “no flowers, trees, grass” gibi **açık yasak** satırı (ürün kararı).

**Ö11 — İç sayfa (devam)**  
Ö5–Ö7: PRIORITY, `getCinematicNaturalDirectives`, `getCinematicPack` indoor için yumuşatma.

---

## Çalışma modu

| Tamamlandı | Sıradaki |
|------------|----------|
| Ö1–Ö3, route hizası, story v2.7.0 | **Ö9** (kapak kimlik) + **Ö10** (story/tutarlılık) öncelikli; sonra Ö11 |
| Analiz dokümantasyonu | Üretim öncesi/sonrası log + `bookId` ile doğrulama |

---

## Çözüm önerileri özeti (Ö1–Ö3: uygulandı; Ö4–Ö8: beklemede)

**Ö1 — Kapak: story görsel tarifi tek kaynak** ✅ (minimal kapak yolu; SCENE = stil + cover metni)  
Önceki tam metin: `coverDescription` baskın; GLOBAL/CINEMATIC / Environment 65% kapak yolunda kaldırıldı.

**Ö2 — Kapak: el / poz çelişkisi** ✅  
Kapak yolunda `getDefaultHandStrategy` (“hands at sides / not holding”) yok.

**Ö3 — İç sayfa: `[SCENE_ESTABLISHMENT]` outdoor şablonu koşullu** ✅  
`environmentDescription` doluysa `getEnhancedAtmosphericDepth()` eklenmez; ayrıca API route sayfa üretiminde alan iletilir.

**Ö4 — İsteğe bağlı: story’den `locationType` / `settingType`**  
Henüz yok. Heuristik/liste yerine story JSON’a açık alan (`indoor_arena`, `outdoor`, `home_interior` vb.) ile şablon seçimini deterministik yapma adayı.

**Ö5 — Öncelik merdiveni ve “environment richness”**  
`PRIORITY` içindeki **“Environment richness & depth”** ikinci sıra, iç mekanda dekoratif doğa üretimini tetikleyebilir. Metin, sahne tanımına bağlı “tutarlılık” vurgusuna çekilebilir veya indoor’da farklı sıralama kullanılabilir.

**Ö6 — `imagePrompt`’u gerçekten kullanmak veya kaldırmak**  
Story zaten sayfa başı görsel tarif üretiyor; pipeline hâlâ büyük ölçüde `sceneDescription` + kod şablonları ile birleştiriyor. **Ya** `imagePrompt`’u görsel API’ye doğrudan taşıyıp şablonları azaltmak **ya** alanı kaldırıp token tasarrufu — ikisinden biri bilinçli seçilmeli.

**Ö7 — `getCinematicPack` / `getGlobalArtDirection` (iç sayfa)**  
İç mekanda ağaç sorununu doğrudan yaratmasa da, “volumetric sun rays”, “atmospheric perspective” gibi ifadeler zayıf bağlamda outdoor’a kaydırabilir. Indoor tespitinde bu paketi kısaltmak veya devre dışı bırakmak değerlendirilebilir (Ö3 ile birlikte).

**Ö8 — Doğrulama**  
Onay sonrası değişikliklerden sonra aynı seed ile (kapalı salon basketbol) yeniden üretim + `ai-api-debug.jsonl` ile final prompt içinde **sky/horizon** geçişinin kesildiğini kontrol etmek.

---

> **Not:** Aşağıdaki tablo **tarihsel** iki koşuyu karşılaştırır. Güncel anlayış (master vs kapak göz rengi, story + kod, Ö9+) için üstteki **“Konuşmalardan netleşenler”** ve [`LOG_YAPRAK_SORUNU_20_MART_2026.md`](./LOG_YAPRAK_SORUNU_20_MART_2026.md) bölümlerine bak.

## Son durum: log karşılaştırması (tarihsel — 20 Mart 2026)

### İki koşu (aynı dosyada)

| | **Eski koşu** (satır 1–12, `764225b1-…`) | **Yeni koşu** (satır 13–24, `4157081d-…`) |
|---|------------------------------------------|-------------------------------------------|
| Story model | `gpt-4o-mini` | `gpt-4.1-mini` |
| Story çıktısı | `coverSetting` kısa; `sceneContext`; `coverDescription` yok | `coverDescription` zengin; sayfalarda `environmentDescription`, `cameraDistance` |
| Örnek cover metni | — | *"polished wooden floor… arena lights… cheering fans…"* (iç mekan dili doğru) |
| Master referans (kapak öncesi) | ~1.85 MB | ~265 KB (resize çalışıyor; token düşüşü logda) |
| Kapak promptu | Uzun sinematik şablon + `%65 ortam` + eski `coverSetting` | Aynı şablon yapısı devam; `comic_book` stili; referans küçük |

### Ne işe yaradı (etki pozitif)

1. **Story tarafı:** `gpt-4.1-mini` + `coverDescription` / `environmentDescription` gerçekten **kapalı salon, parke, tribün, yapay ışık** gibi doğru sahne dilini üretiyor. Sorun artık “hikaye yanlış ortam yazıyor” değil.
2. **Maliyet / girdi:** Kapak için referans görsel küçültme logda yansıyor (`reference_1.png` boyutu düşmüş).
3. **Master:** Kompozisyon “%25–30 frame” satırları master prompttan çıkarılmış (yeni koşuda master metni sade).

### Hâlâ soruna yol açan yerler (tarihsel log + güncel kod notu)

**1) Sayfa görseli: outdoor “sky / horizon” paketi**

**Ö3 sonrası:** `environmentDescription` doluysa `getEnhancedAtmosphericDepth()` **eklenmez**. Yine de sorun görülüyorsa kontrol et: (a) o istekte `environmentDescription` gerçekten `sceneInput`’a gidiyor mu (`route.ts` / worker), (b) story **outdoor** yazdığı için model doğayı tamamlıyor mu, (c) `getCinematicNaturalDirectives` vb. başka bloklar hâlâ sky/path üretiyor mu — bkz. `LOG_YAPRAK` §3.

**2) Kapak görseli**

**Ö1 sonrası:** Uzun PRIORITY / Environment 65% kapak yolunda kaldırıldı. Kullanıcı raporlarında kalan: **göz rengi drift** (master’da metin var, kapak SCENE’de yok) ve **story’nin outdoor/kutlama** yazmasıyla birleşen kenar çiçek — üstte **Ö9 / Ö10**.

**3) Öncelik / “environment richness”**

`PRIORITY` ve benzeri ifadeler iç mekanda dekoratif flora baskısı yaratabilir — **Ö5 / Ö11**.

### Sonuç (güncel)

Kenar çiçek/yaprak: **story metni + pipeline şablonları + model tamamlaması** birlikte. Kapak göz rengi: **referans tek başına yeterli sayılmamalı**; **Ö9** ile kapak metninde kısa kimlik hizası önerilir.

*(Ö1–Ö8 özeti aşağıda **“Çözüm önerileri özeti”** içinde; sıradaki işler **Ö9+** üst bölümde.)*

---

## Geliştirme sırası (referans — çoğu tamamlandı)

Aşağıdaki 1–8 maddesi **büyük ölçüde uygulandı** (story alanları, `gpt-4.1-mini`, kapak/sayfa sadeleştirme, master sadeleştirme, referans resize, test döngüsü). **Kalan görsel sapmalar** için üstteki **Ö9+** (kapak kimlik özeti, story tutarlılığı, iç sayfa cinematic paketleri) ve `LOG_YAPRAK` §3 önceliklidir.

1. Story generation şeması (`coverDescription`, `environmentDescription`, `cameraDistance`, …).  
2. Story prompt sadeleştirme.  
3. `story_generation` → `gpt-4.1-mini`.  
4. Kapak promptu yeniden kurma (minimal yol).  
5. Sayfa promptları (`environmentDescription` koşulu, vb.).  
6. Master prompt sadeleştirme.  
7. Kapak referans görseli küçültme.  
8. Test + log karşılaştırma (tekrarlanır).

### Çalışma Notu

Bu geliştirme planı iteratif ilerleyecek: her değişiklikten sonra test edilecek, çıkan görseller ve loglar birlikte incelenecek, sonra bir sonraki adım netleştirilecek.

---

## Temel Mimari Gözlem

Tüm sorunların ortak kökü aynı: **görsel kararlar story_generation yerine sabit şablonlarda alınıyor.**

Kapak nasıl görünmeli? → Şablonda.  
Sahne atmosferi ne olmalı? → Şablonda.  
Karakter ne giyecek? → Şablonda.  
Karakter ne kadar küçük görünmeli? → Şablonda.

Bu yüzden her kitap birbirine benziyor. story_generation hikayeyi biliyor ama görsel kararlar ona sorulmuyor. Önerilen yön: story_generation'ı tüm görsel kararların tek kaynağı haline getirmek.

### Model notu (story_generation)

İlk uygulama adımında story_generation modeli **`gpt-4.1-mini`** olarak denenecek.  
Amaç: `coverDescription`, `environmentDescription`, `cameraDistance`, `outfit` gibi alanlarda daha tutarlı ve kaliteli çıktı almak.

Eğer hedeflenen kaliteye ulaşılamazsa ikinci adımda **`gpt-4.1`** ile tekrar test edilecek.

---

## Adım 1–2: `story_generation`

### Sorun 1 — UUID çift tekrar
Promptta karakter UUID'si iki farklı yerde açıklanıyor:

```
CHARACTER_ID_MAP: {"b08bf369-b2fd-...": "Arya"}
...
CRITICAL - REQUIRED FIELD: include "characterIds": ["b08bf369-b2fd-..."]
```

Model JSON çıktısında bu UUID'yi üretmek zorunda; ancak bunu nasıl yapacağı iki ayrı blokta anlatılıyor. Tek bir kısa yönergede birleştirilebilir.

**→ Aksiyon:** İki bloğu tek kısa satıra indir.

---

### Sorun 2 — `imagePrompt` alanı üretiliyor ama hiç kullanılmıyor
Story_generation her sayfa için bir `imagePrompt` alanı döndürüyor (İngilizce, bu doğru — görsel modeller İngilizce prompt ister). **Sorun dilde değil:** bu alan sonraki adımlarda (`image_page`) kullanılmıyor. Sistem bunu görmezden geliyor ve `sceneDescription` + `shotPlan` + uzun şablonları birleştirerek yeni bir prompt kendisi yazıyor.

Sonuç: story_generation'ın hazırladığı görsel tarif çöpe gidiyor ve üstüne bir de token harcanmış oluyor.

**→ Aksiyon:** Ya `imagePrompt` alanını story_generation'dan kaldır, ya da tam tersine bunu tek kaynak yap ve şablonları kaldır (ikinci seçenek daha doğru yön).

---

### Sorun 3 — `sceneContext` ve `sceneDescription` çakışması
Aynı bilgi hem `sceneDescription` (~2 cümle) hem `sceneContext` (~8 kelime) olarak iki ayrı alanda geliyor.

**→ Aksiyon:** `sceneContext` kaldırılacak.

---

### Sorun 4 — Kapak için görsel karar story_generation'dan istenmiyor ⚠️
Story_generation `coverSetting: "basketball court with cheering crowd and a shining trophy"` döndürüyor. Bu değer kapak promptuna **hiç taşınmıyor.** Kapak promptu şablonu bunu bilmiyor; genel "sinematik çocuk kitabı kapağı" kalıplarına yaslanıyor. Model boşluğu kendi varsayımlarıyla dolduruyor: çiçek, yaprak, yol.

Ama asıl çözüm yalnızca `coverSetting`'i taşımak değil. Çünkü `coverSetting` zaten kısa ve yetersiz. Doğru çözüm: **story_generation'dan tam bir kapak kompozisyonu isteyin.**

**→ Aksiyon (yapılacak):**  
Story_generation response'una `coverDescription` alanı eklenecek. Model şu soruları cevaplayacak şekilde yönlendirilecek:
- Sahnede ne var, odak nokta ne?
- Işık ve atmosfer nasıl?
- Karakterin konumu ve eylemi ne?
- Bu hikayeyi diğerlerinden ayıran görsel detay ne?

Örnek çıktı (basketbol hikayesi için):
```json
"coverDescription": "Arya a basketball court at golden hour, holding a gleaming trophy above her head with both hands. 
The court stretches wide behind her with blurred crowd in the background. 
Warm arena lights reflect off the trophy. Celebratory, victorious mood."
```

Bu alan kapak promptunun ana sahne girdisi olacak. Üstüne yalnızca stil (clay_animation) ve teknik parametreler (çekim tipi, boyut) eklenecek.

---

## Adım 3–4: `image_master`

### Sorun 5 — `input_fidelity: high` doğru, ama neden bazen kimlik tutmuyor?
`input_fidelity: high` doğru bir tercihtir — amaç referans fotoğraftaki çocuğun yüz ve vücudunun illüstrasyona taşınması. Varsa daha yüksek değer de kullanılabilir.

Asıl mesele şu: master görsel nötr duruşta (standing, neutral pose) üretiliyor. Bu aşamada doğru. Ancak sonraki sayfa görsellerinde aynı master referans olarak kullanılıyor ve model dinamik sahneleri (koşma, zıplama, dans) bu durağan referansa bakarak üretiyor. `input_fidelity: high` olunca model kimliği mükemmel tutuyor ama **pose de referansa çekiyor** — böylece karakter sahneye göre hareket etmek yerine biraz "durağan" kalıyor.

Kısa özet: `input_fidelity: high` kimlik için doğru. Ama prompt, modele "poz referanstan alma, sadece yüz ve kıyafeti al" diye net söylemeli. Şu an söylüyor ama etkinliği sınırlı.

**→ Aksiyon:** Bu madde şimdilik not olarak kalacak. Development aşamasında prompt wording'inde "pose override" ifadesini güçlendireceğiz.

---

### Sorun 6 — Master için kompozisyon talimatları anlamsız ✅ Kaldırılacak
"Character small in frame (25-30%)", "wide shot", "lots of empty space" gibi talimatlar master görselde anlam taşımıyor. Master sadece referans; kimse onu kitapta görmeyecek.

**→ Aksiyon:** Bu satırlar master prompt'tan kaldırılacak.

---

## Adım 5–6: `image_cover` ⚠️ Ana problem

### Sorun 7, 8, 9 — Şablon kapağı tek tipe mahkum ediyor (birleştirildi)
Kapak şablonu şu anda şunları içeriyor:
- `"Environment dominates (65-75%)"`
- `"foreground: rich textures, clear detail"`
- `"whimsical storybook illustration"`
- `"rich layered environment"`
- `"Deep focus with crisp environment detail"`

Bu talimatların hiçbiri hikayeye özel değil. Model her kitap için aynı şeyi görüyor → her kapakta aynı estetik çıkıyor: çiçekli ön plan, doğa çerçevesi, "masal kitabı" dekorasyonu.

"NO flowers, NO grass" gibi yasaklar doğru yol değil. Model ne ekleyeceğini zaten bilmeli — eğer sahne tanımı yeterince zenginse boş alan dolduracak şey hikayeden geliyor.

**→ Aksiyon (yapılacak):**  
Kapak promptundan tüm sabit şablon talimatları kaldırılacak. Tek kaynak `coverDescription` alanı olacak (yukarıda Sorun 4'te tanımlandı). Üstüne yalnızca bunlar eklenecek:
1. Stil: `clay_animation` veya seçilen stil
2. Teknik: boyut, format
3. Kimlik: "karakter referans görseldeki ile aynı yüz ve kıyafette olmalı"

Sahnenin ne içereceğini, ortamın nasıl görüneceğini, ışığı, kompozisyonu — bunların hepsi `coverDescription`'dan gelecek. Model hikaye bazlı karar verecek.

---

### Sorun 10 — Master görsel boyutu kapak maliyetini şişiriyor
Kapak isteğinde master görsel **1.85 MB** olarak gönderiliyor → `input_tokens: 7.886` (6.563'ü görsel token).

Kapak görseli genellikle geniş çekimde karakter küçük yer alır, dolayısıyla yüksek çözünürlüklü referans gerekmez. Referans görsel ~512×768'e boyutlandırılarak gönderilirse:
- Görsel token tahminen 6.563 → **~1.640**'a düşer (yaklaşık %75 azalma)
- Toplam input token 7.886 → **~2.963** civarına iner
- Kalite etkisi: kapakta karakter küçük göründüğü için yüz detayı azalması görsel kaliteyi ölçülü etkiler, kabul edilebilir düzeyde.

**→ Aksiyon:** Kapak için ayrı bir "küçültülmüş master" referans gönderilecek.

---

## Adım 7–9: `image_page`

### Sorun 11 — Atmosfer bloğu sabit ve sahneyle çelişiyor
Her sayfaya aynı atmosfer bloğu ekleniyor:
```
expansive sky visible, dramatic clouds or clear sky, distant mountains or horizon line,
atmospheric haze in distance, background elements fade into soft mist
```
Ama basketbol maçı sahnesi açık ova değil. Bu blok sahneyle çelişiyor ve model hybrid/tutarsız arka planlar üretiyor.

Genel olarak: atmosfer, ortam, zaman bilgisi hikayenin kendisinden gelmeli. Story_generation `sceneDescription` içinde zaten bunu verebilir. Sabit blok yanlış.

**→ Aksiyon (yapılacak):** Sabit atmosfer bloğu kaldırılacak. Story_generation'ın `sceneDescription` alanı bu bilgiyi zaten içermeli — ve sayfa promptu doğrudan bunu kullanacak.

---

### Sorun 12 — shotPlan çift tekrar ✅ Kaldırılacak
shotPlan bilgisi promptta hem üstte hem altta tekrar ediyor. Tek seferlik yeterli.

**→ Aksiyon:** Tekrar eden shotPlan satırları kaldırılacak.

---

### Sorun 13 — Kıyafet uyarıları her sayfada tekrar ediyor; kıyafetin story_generation'dan gelmesi gerekiyor
Şu an her sayfa promptunda "same outfit every page" uyarısı tekrar ediyor (~400 token × 3 sayfa). Gereksiz.

Daha önemlisi: kıyafetin ne olacağına story_generation karar vermeli. Astronot hikayesinde karakter astronot kıyafetinde olmalı, denizci hikayesinde denizci kıyafetinde. Şu an kıyafet ya kullanıcı formundan alınıyor ya da şablona göre genel "colorful sports outfit" gibi şeyler yazılıyor.

**→ Aksiyon (yapılacak):** Story_generation response'una her karakter için `outfit` alanı eklenecek. Bu alan sahneye ve hikayeye göre model tarafından belirlenecek. Sayfa promptlarındaki tekrar eden uyarılar kaldırılacak.

---

## Özel not: Sinematik görsel kalite hedefi

Paylaşılan referans görseller incelendi. Hedef estetik net:
- Karakter frame'in ~30-40%'ini kaplıyor
- Ortam hikayeyi anlatıyor (pencere sahnesi: karakter küçük, ama bisiklet, gece gökyüzü, ışık her şeyi anlatıyor)
- Işık ve atmosfer sahneyi tanımlıyor, karakter içine oturmuş

Şu an üretilen görsellerde karakter %50+ yer kaplıyor çünkü:
- Şablon talimatları birbiriyle çelişiyor (hem "small" deniyor hem "identity match" baskısı yüksek)
- `sceneDescription` kısa ve ortamı yeterince tanımlamıyor
- Model belirsizliği karakter büyütmekle çözüyor (güvenli alan)

**Bu sorunun çözümü büyük ölçüde story_generation kalitesine bağlı.** Story_generation her sayfa için zengin ortam tanımı üretirse, model sahneyi doldurmak için karakteri küçültmek zorunda kalır. Şu an ortam bilgisi zayıf geldiği için model boşluğu karakterle dolduruyor.

**→ Aksiyon (yapılacak):** Story_generation prompt'u her sayfa için şunları içerecek şekilde güçlendirilecek:
- Zengin `environmentDescription`: ortamda ne var, derinlik nasıl
- `cameraDistance`: close / medium / wide / establishing
- `characterFocus`: karakter mü ortam mı ön planda?

---

## Özet — Yapılacaklar tablosu

| # | Sorun | Aksiyon | Öncelik |
|---|-------|---------|---------|
| 1 | UUID çift tekrar | Tek satıra indir | Düşük |
| 2 | imagePrompt kullanılmıyor | Kaldır veya tek kaynak yap | Orta |
| 3 | sceneContext çakışması | **Kaldır** | Düşük |
| 4 | coverDescription yok | **Story_generation'a ekle** | Kritik |
| 5 | input_fidelity + pose çakışması | Prompt wording'de "pose override" güçlendir | Orta |
| 6 | Master'da kompozisyon talimatları | **Kaldır** | Düşük |
| 7-9 | Kapak şablon kalıpları | **Şablonu kaldır, coverDescription kullan** | Kritik |
| 10 | Master görsel boyutu yüksek | Kapak için resize edilmiş versiyon kullan | Orta |
| 11 | Sabit atmosfer bloğu | **Kaldır, story_generation'dan al** | Yüksek |
| 12 | shotPlan çift tekrar | **Kaldır** | Düşük |
| 13 | Kıyafet uyarıları tekrar + kıyafet kararı | **Kaldır + story_generation'a outfit alanı ekle** | Yüksek |
| — | Karakter çok büyük / sahne küçük | Story_generation'a environmentDescription + cameraDistance ekle | Kritik |
