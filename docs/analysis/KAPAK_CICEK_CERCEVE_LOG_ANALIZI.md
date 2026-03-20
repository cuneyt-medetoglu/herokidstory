# Kapakta sağ/sol çiçek çerçevesi — log tabanlı analiz

**Örnek:** “Arya’nın Basketbol Macerası” — sahne basketbol sahası, buna rağmen kapakta alt köşelerde çimen/çiçek benzeri süsleme.

**Kaynak log:** `logs/ai-api-debug.jsonl` (kitap `764225b1-b663-40d4-ac98-43dd5e5b9bb1`, Mar 20, 2026).

---

## Sorunun çıktığı adım (tek cevap)

**Kapak görseli üretimi:** `operationType: image_cover` → **`POST /v1/images/edits`** (`gpt-image-1.5`).

Bu çağrı, kullanıcının gördüğü **kapak PNG’sini** üretir. Kenarlardaki çiçek/çimen etkisi bu adımın çıktısıdır; önceki adımlar doğrudan “çiçekli kenar” çizmiyor.

---

## Diğer adımlar ne diyor? (suçlu değiller)

| Adım | Logda ne var? | Sonuç |
|------|----------------|--------|
| **Hikaye (`story_generation`, chat)** | `coverSetting`: *"basketball court with cheering crowd and a shining trophy"*; sayfa metinleri basketbol/kupa. | Çiçek veya bahçe **istenmiyor**; tema tutarlı. |
| **Master (`image_master`, edits)** | Düz nötr arka plan, spor kıyafeti; sahne betimi yok. | Çiçek **yok**; sadece karakter referansı. |
| **Sayfa görselleri (`image_page`)** | Basketbol sahası / kutlama; ayrı çağrılar. | **Kapak dosyası değil**; kartta gördüğün kapakla aynı adım değil. |

Yani tekrarlayan “çerçeve çiçek” hissi, **hikayenin yanlış yazılmasından** değil; **kapak için tek görsel API çağrısının** ürettiği kompozisyondan geliyor.

---

## Kök neden (neden model çiçek koyuyor?)

Logdaki **kapak request** gövdesinde şunlar bir arada:

- Üst katman: sinematik / storybook kalıbı (“depth”, “layered foreground/mid/background”, “vignette”, “bloom”, “foreground rich textures” vb.).
- Geniş çekim, karakter küçük, ortam baskın (`Environment dominates`, rule of thirds).
- “Children’s book cover” tipi **şablon cümleler** (davetkar, whimsical, göz alıcı kompozisyon — logda prompt’un başında ve ortamda bu dil var).

**Yorum:** Model, boş alanı ve “zengin ön plan / hikaye kitabı kapağı” beklentisini doldururken, spor sahasıyla çelişse bile **süsleyici organik detay** (çimen, çiçek, yol kenarı) üretme eğiliminde. Bu, prompt’ta “çiçek yaz” demesen de oluşan **görsel öncülük (prior)** + **çok katmanlı ortam zorunluluğu** birleşimidir.

---

## Özet cümle

**Sorunlu adım:** Kapak için **`image_cover` / `/v1/images/edits`** çağrısı.  
**Kök neden:** Hikaye tarafı basketbolu doğru tarif ediyor; **kapak prompt yığını ve görsel model**, “kitap kapağı + zengin çevre” dilini **çiçekli/çimenli kenar süslemesine** çeviriyor.

---

*Bu dosya yalnızca analiz içindir; çözüm (prompt kısıtları, negatif prompt, kapak şablonunun sadeleştirilmesi) ayrı adımda ele alınabilir.*
