# Hardcoded örnekler, amaç sapması ve risk analizi

**Tarih:** 20 Mart 2026  
**Kapsam:** Özellikle `lib/prompts/story/base.ts`, ayrıca görsel prompt katmanı (`scene.ts`, `types.ts`, vb.)  
**Niyet:** Ürün amacına geri dönmek — kullanıcının verdiği fikir + karakterlerle **çeşitli**, kişiselleştirilmiş çocuk kitabı; tek bir debug senaryosuna (ör. salon basketbolu) kilitlenmiş çıktı değil.

**Uygulama (onaylı, 20 Mart 2026):** Story prompt `VERSION` **2.7.0** — `coverDescription` / `environmentDescription` / `shotPlan` şema satırları nötrleştirildi; `buildStoryStructureSection` kamp örneği kaldırıldı; `getExampleText` mekân-agnostic; `types.ts` ve `scene.ts` yorumlarındaki basketbol örneği silindi. Kalan borç: `getThemeConfig` listeleri (H6), `extractSceneElements` keyword’leri (M3), vb.

**Test ve diğer dokümanlar:** [`GORSEL_PROMPT_VE_TEST_REHBERI.md`](./GORSEL_PROMPT_VE_TEST_REHBERI.md) · Görsel pipeline / kapak göz rengi / Ö9+ → [`PROMPT_ANALIZ_VE_IYILESTIRME.md`](./PROMPT_ANALIZ_VE_IYILESTIRME.md) (v4.2)

---

## 1. Ürün amacı (odak)

- Kullanıcı hikaye tohumu (STORY SEED), tema, yaş grubu ve karakter(ler) verir.  
- Model **o bağlamdan** tutarlı bir anlatı ve **görsel tarif alanlarını** (İngilizce) üretir.  
- Sabit few-shot örnekler, özellikle **isim + mekân + nesne** içeriyorsa, modele “cevap şablonu” verir; token dağılımı bu örneğe yakınsar → **tekrarlayan “tür” ve sahne**.

Bu dokümandaki “kötü” olan: teknik zorunluluk değil, **regresyon / bug fix** sırasında prompt içine **somut sahne** gömülmesi.

---

## 2. Bu iş neden “kötüleşmiş” gibi görünüyor?

Kısa cevap: **iteratif hata ayıklama** (ör. kapalı salonda ağaç, çiçek sınırı, kıyafet tutarlılığı) sırasında, “model şunu anlasın” diye **tek bir gerçek vakayı** örnek diye string olarak eklendi. Büyük dil modelleri few-shot ve JSON şemasındaki örneklere aşırı duyarlıdır; şemadaki uzun örnek cümle **format örneği değil, içerik ankrajı** haline gelir.

İkinci faktör: Aynı dosyada **çelişen direktifler** var (ör. “fixed example listeleme” / “ormandan türet” ile, şemada somut “Arya + basket sahası + kupa” aynı prompt’ta).

---

## 3. Yüksek risk: Story çıktısını doğrudan çarpıtan sabit içerik

| # | Konum | Ne var? | Risk |
|---|--------|---------|------|
| H1 | `base.ts` `buildOutputFormatSection` → `coverDescription` şema satırı | **Tam cümle örnek:** “Arya stands on a wide basketball court at golden hour, holding a gleaming trophy…” | İsim + spor salonu + kupa + arena ışığı — kullanıcı farklı hikaye verse bile üretimi bu tipe çeker. **En kritik madde.** |
| H2 | `base.ts` aynı bölüm → `environmentDescription` | Örnek: *indoor basketball court, scoreboard, arena seats…* | Salon/spor debug’undan kalma; iç mekân gerektiğinde faydalı görünmüş ama **genelleştirilebilir örnek değil**, anchoring. |
| H3 | `base.ts` aynı JSON şablonu → `shotPlan` örneği | `"golden hour"`, `"wonder"` vb. sabit örnek değerler | Model sık sık aynı shot/mood’u tekrarlar. |
| H4 | `base.ts` `buildStoryStructureSection` | Uzun **kamp hikayesi** adım adım örneği + “camping day, birthday, garden” listesi | “Bir hikaye anlat” iyi niyeti; uygulamada **kamp / doğa** omurgasına bias. |
| H5 | `base.ts` `getExampleText` / `WRITING STYLE` | Yaş grubuna göre **orman, çiçek, çayır, gün batımı** paragrafları | Ana metin dilini göstermek için; fakat sürekli **dış mekân / doğa** tonu — tema spor veya iç mekân olsa bile örnek çekimser. |
| H6 | `base.ts` `getThemeConfig` | `setting`, `clothingExamples` (doğru/yanlış), `clothingStyle` cümleleri | Tema başına kısıtlama ve **“astronaut suit”** gibi sabit kalıplar (changelog’da da geçiyor); kullanıcı hikayesiyle çakışabilir veya daraltır. |

---

## 4. Orta risk: Görsel pipeline / tipler (dolaylı anchoring)

| # | Konum | Ne var? | Risk |
|---|--------|---------|------|
| M1 | `lib/prompts/types.ts` yorumları | Basketbol salonu örneği `environmentDescription` açıklamasında | Kod yorumu modele gitmez; ama **gelecekteki geliştiriciye** “varsayılan sahne bu” mesajı — tekrar kopyalanır. |
| M2 | `scene.ts` `ENVIRONMENT_TEMPLATES`, tema → ortam haritaları | Tema yokken veya yedekte **hazır ortam parçaları** | Story alanları zayıfsa eski şablonlar devreye girer → **tekrarlayan görsel dil**. |
| M3 | `scene.ts` `extractSceneElements` | `priorityLocationKeywords` / `generalLocationKeywords` | Story’den bağımsız substring sınıflama; salon/arena listede yoksa “location” boş kalır — başka tür sapma. |
| M4 | `character.ts` / `negative.ts` | “e.g. pajama party…”, “e.g. 6 fingers” | Çoğu **format** uyarısı; düşük anchoring ama liste uzunluğu gürültü. |

---

## 5. Düşük risk ama “amatör his”: Fallback’ler

| # | Konum | Ne var? |
|---|--------|---------|
| L1 | `base.ts` `buildCharacterPhysicalSection` fallback | Veri yokken “brown round eyes”, “natural hair” — görsel üretimde generic default. |

Bunlar modele doğrudan gitmeyebilir; yine de **ürün kalitesi** açısından “her çocuk kahverengi göz” algısı yaratır.

---

## 6. İlkeler (bundan sonra ne yapalım?)

1. **JSON şeması ve OUTPUT FORMAT** içinde: Sadece **alan adı + kısıt** (dil, uzunluk, yasaklar). Örnek istenirse: **alıcı etiketli, nötr** tek satır (`"<character name> in <setting from user's seed>, …"` gibi placeholder) veya tamamen örneksiz.  
2. **Asla** gerçek kullanıcı/çocuk ismi + gerçek debug sahnesini şemaya gömme.  
3. **Hikaye yapısı** örneği: “kamp” yerine soyut: “başlangıç → gelişen olaylar → sonuç” veya tek cümle; adım örneği kullanıcı tohumundan türet denin.  
4. **Yaş örnek metni** (`getExampleText`): Tema veya STORY SEED’e göre seçilemezse, **kısa ve nötr** (ör. diyalog ritmi gösteren 2–3 cümle, mekân belirtmeden) veya kaldırılıp sadece kelime sayısı/diyalog kuralı.  
5. Görsel tarafta: Ortam bilgisinin **tek kaynağı** story alanları; keyword listeleri mümkünse **sadeleştir veya story alanına taşın**.

---

## 7. Sonraki adım (uygulama — ayrı onay)

Bu doküman **analizdir**. Kod değişikliği için tipik sıra:

1. **H1 + H2 + H3** şemayı temizle (en yüksek getiri).  
2. **H4 + H5** story yapısı ve yazım örneğini nötrleştir.  
3. **H6** tema örneklerini sadeleştir veya sadece “tema ile uyumlu, kullanıcı tohumuna sadık” cümlesi.  
4. İsteğe bağlı: M1–M3 teknik borç temizliği.

İlgili analiz: `docs/analysis/PROMPT_ANALIZ_VE_IYILESTIRME.md` (görsel şablon / pipeline). Bu doküman özellikle **story prompt içeriği ve few-shot anchoring** odaklıdır.
