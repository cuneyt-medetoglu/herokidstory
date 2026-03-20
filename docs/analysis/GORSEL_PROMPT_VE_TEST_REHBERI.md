# Görsel prompt, log ve test — dokümantasyon özeti

**Son güncelleme:** 20 Mart 2026 (v4.2 ile hizalı)  
**Amaç:** Regresyon testi öncesi/sonrası tek giriş noktası: hangi doküman ne işe yarıyor, kodda ne uygulandı, konuşmalarda ne netleşti, testten sonra ne paylaşılmalı.

---

## 1. Doküman haritası (okuma sırası önerisi)

| Dosya | İçerik |
|--------|--------|
| [**GORSEL_PROMPT_VE_TEST_REHBERI.md**](GORSEL_PROMPT_VE_TEST_REHBERI.md) | Bu özet + test checklist |
| [**PROMPT_ANALIZ_VE_IYILESTIRME.md**](PROMPT_ANALIZ_VE_IYILESTIRME.md) | **v4.2:** Konuşmalardan netleşenler (göz rengi, story+kod), Ö1–Ö11, tarihsel log tablosu |
| [**LOG_YAPRAK_SORUNU_20_MART_2026.md**](LOG_YAPRAK_SORUNU_20_MART_2026.md) | Salon / yaprak / sky: satır satır log, `route.ts` patch, §3 kalan maddeler |
| [**HARDCODED_ORNEKLER_VE_AMAC_ANALIZI.md**](./HARDCODED_ORNEKLER_VE_AMAC_ANALIZI.md) | Story few-shot; **v2.7.0** |
| [**LOG_TURKCE_OZET.md**](./LOG_TURKCE_OZET.md) | `ai-api-debug.jsonl` adım adım Türkçe özet |
| [**../plans/AI_API_TAM_ISTEK_YANIT_LOG_PLANI.md**](../plans/AI_API_TAM_ISTEK_YANIT_LOG_PLANI.md) | AI istek/yanıt loglama planı |

İlgili ürün akışı: [`STORY_AND_IMAGE_AI_FLOW.md`](./STORY_AND_IMAGE_AI_FLOW.md)

---

## 2. Konuşmalarda netleşenler (kısa)

| Konu | Özet |
|------|------|
| **Master = göz rengi garantisi mi?** | Hayır; referans + metin birlikte çalışır. Log örneğinde **master** promptunda `hazel eyes` varken **kapak** SCENE’de göz rengi satırı yok → **drift** olası. **Ö9:** kapakta master ile hizalı **kısa kimlik** (göz + saç). |
| **Kenar çiçek/yaprak nereden?** | **Hem** story (`coverDescription` / outdoor, kutlama, park dili) **hem** pipeline (`PRIORITY`, cinematic doğa blokları, stil). Tek katman değil. |
| **Regresyon mu?** | Kapak yolu sadeleşince fiziksel betim düşmüş olabilir; story varyansı ve model rastgeleliği de var. Yerel kod ≠ remote commit her zaman. |

Detay: [`PROMPT_ANALIZ_VE_IYILESTIRME.md`](./PROMPT_ANALIZ_VE_IYILESTIRME.md) § “Konuşmalardan netleşenler”.

---

## 3. Kodda uygulanmış durum (özet)

**Story (`lib/prompts/story/base.ts`)**  
- `VERSION` **2.7.0** — JSON şemada somut basket/kupa örnekleri kaldırıldı; yapı örneği nötr.

**Görsel — kapak (`lib/prompts/image/scene.ts` + `image-pipeline.ts`)**  
- Kapak: ağır GLOBAL/PRIORITY/CINEMATIC zinciri yok; SCENE = stil + `getStyleSpecificDirectives` + `coverEnvironment`.  
- Pipeline kapak `characterAction`: nötr (wonder/adventure kaldırıldı).

**Görsel — iç sayfa**  
- `environmentDescription` varsa `[SCENE_ESTABLISHMENT]` içinde outdoor “sky / horizon / aerial” paketi **eklenmez**.  
- **`app/api/books/route.ts`:** Batch sayfa üretiminde `environmentDescription` + `cameraDistance` `sceneInput` ile geçirilir.

**Henüz uygulanmadı (onay + sprint)**  
- **Ö9** kapak kimlik özeti; **Ö10** story/tutarlılık veya “no flowers/trees” tohumu; **Ö11** Ö5–Ö7 (PRIORITY, `getCinematicNaturalDirectives`, indoor cinematic). Bkz. `PROMPT_ANALIZ` Ö9+ ve `LOG_YAPRAK` §3.

---

## 4. Test öncesi kontrol

1. **Next.js** ve **worker** (`npm run worker`) güncel kodla yeniden başlatılmış olsun.  
2. Log: `AI_DEBUG_LOG` / `AI_DEBUG_LOG_FILE` (varsayılan `logs/ai-api-debug.jsonl`).  
3. Statik log okuyucu: `public/ai-debug-log-viewer.html` (varsa).

---

## 5. Test sonrası paylaşılacaklar

Mümkün olduğunca şunlar — sonra **API isteği bazında** derin inceleme yapılır:

- **bookId** (URL veya DB)  
- **Illustration style** + kısa senaryo (tema, tohum)  
- **Ekran görüntüsü** veya “hangi sayfa / kapak”  
- **`logs/ai-api-debug.jsonl`** içinden ilgili satırlar (aynı `bookId`’ye filtre) veya dosyanın o koşuya ait kopyası  

Sorun sürerse inceleme sırası:

1. `story_generation` — `coverDescription` / `environmentDescription` outdoor veya çiçek/yaprak dili var mı?  
2. `image_master` vs `image_cover` — **göz rengi** aynı metinde tekrarlanıyor mu? (Kapakta yoksa Ö9 gündemi.)  
3. `image_page` — *horizon line visible with soft transition to sky* geçiyor mu? (Geçiyorsa `environmentDescription` o istekte düşmüş veya ek cinematic blok aktif olabilir.)

---

## 6. Sonraki adım ve isteğe bağlı test tohumu

- **Başarılıysa:** §3 “uygulanmış durum” doğrulanmış sayılır; Ö9–Ö11 ayrı sprint.  
- **Sorunluysa:** `bookId` + log ile üstteki sırayı izle.

**Çiçek/kenarı azaltmak için örnek tohum (ürün dili — İngilizce story girdisi önerisi):**  
Kapalı mekân + bitkisiz: örn. *indoor public library*, *quiet reading room*, *wooden shelves and warm lamps*, açıkça *no plants, flowers, trees, or grass* isteği kullanıcı tarafında tohumda belirtilebilir; story modelinin `coverDescription` / sayfa ortamlarını buna hizalayıp hizalamadığını logdan kontrol et.

---

## 7. Sürüm notu

Bu dosya **PROMPT_ANALIZ v4.2** ile senkron: “konuşmalardan netleşenler” ve **Ö9+** öncelik sırası orada ana kaynak.
