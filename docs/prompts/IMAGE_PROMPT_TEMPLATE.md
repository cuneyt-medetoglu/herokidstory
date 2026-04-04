# Image / Scene Prompt — özet (kodla senkron)

**Tek kaynak:** `lib/prompts/image/scene.ts` (`generateFullPagePrompt`, `SceneInput`, `VERSION`)  
**Negatif / anatomi metinleri:** `lib/prompts/image/negative.ts` (`getAnatomicalCorrectnessDirectives`, `getMaskEditAvoid` — mask-edit; `VERSION`)  
**Stil profili:** `lib/prompts/image/style-descriptions.ts` (`getGlobalArtDirection`, `getStyleSpecificDirectives`, vb.)  
**Pipeline (referans görseller, kapak):** `lib/book-generation/image-pipeline.ts`  
**Kapak referans yardımcısı:** `lib/book-generation/cover-reference-images.ts` (`getCoverReferenceImageUrls`)

Sürüm numaraları bu dosyada sabit tutulmaz; güncel değerler için `scene.ts` ve `negative.ts` içindeki `VERSION.version` alanına bakın.

---

## Giriş noktası: `generateFullPagePrompt`

Üretilen metin **iki dala** ayrılır: `isCover === true` (kapak) ve iç sayfa (`isCover === false`).

| Parametre | Anlam |
|-----------|--------|
| `characterPrompt` | Karakter kimliği metni (`buildCharacterPrompt` / `buildMultipleCharactersPrompt`) |
| `sceneInput` | Sayfa/kapak sahne alanları (`SceneInput`) |
| `illustrationStyle` | UI'dan gelen stil anahtarı |
| `ageGroup` | Story `metadata.ageGroup` veya pipeline varsayılanı |
| `additionalCharactersCount` | Ek karakter sayısı |
| `isCover` | Kapak dalı |
| `useCoverReference` | `true` iken prompt'ta `buildCoverReferenceConsistencyDirectives` metni eklenir. **Değer çağrı yerine göre değişir** (aşağıdaki tablo). |
| `previousScenes` | Çeşitlilik ipucu (`getSceneDiversityDirectives`) |
| `totalPages` | Poz çeşitliliği dağılımı |
| `characterListForExpressions` | İfade etiketleri (id → isim) |

**Not:** İç sayfa yolu için `generateScenePrompt()` / `generateLayeredComposition()` **artık çağrılmıyor**; içerik 7 blokta toplanıyor (`scene.ts` changelog v1.24.0).

---

## Kapak dalı (`isCover: true`)

Sıra (özet — tam string'ler `scene.ts`):

1. **`getGlobalArtDirection(illustrationStyle)`** — iç sayfa ile aynı global stil profili (Faz 4).
2. **Referans / kıyafet:** `clothing === 'match_reference'` ise kimlik-only; aksi halde zorunlu kıyafet metni.
3. **`getAnatomicalCorrectnessDirectives()`** — kapakta sahne aksiyonuna izin verilir (eller "yanlarda" zorunluluğu kapak dalında yok).
4. **Kimlik:** `Character identity (match reference image): …` + `characterPrompt`.
5. **`getCoverBookLayoutDirectives()`** — poster hissi, üst üçte bir başlık alanı, mockup/typography yok.
6. **`SCENE:`** — `getStyleSpecificDirectives` + `coverEnvironment || sceneDescription` (stil tekrarı üst blokta kaldırıldı, Faz 4).
7. **İfadeler** — `characterExpressions` varsa `buildCharacterExpressionsSection`.
8. **`buildClothingSection`** — kıyafet kilidi.
9. **`buildAvoidShort()`** — kısa AVOID (parmak/ekstremite "messy anatomy" satırları Faz 2.2b-B ile kaldırıldı).

**Pipeline — kapak referansları (tek politika, P0):**

- `getCoverReferenceImageUrls(masterIllustrations, characters)` (`lib/book-generation/cover-reference-images.ts`): önce **karakter master** görselleri; yoksa `reference_photo_url`.
- **Entity master URL'leri kapak listesine eklenmez** (Faz 4 — entity görselleri kapak kompozisyonunu veya kimliği bozabiliyor).
- Hem `image-pipeline.ts` (worker) hem `books/route.ts` (senkron) bu yardımcıyı çağırır — **iki yol aynı referans listesini üretir**.

---

## İç sayfa dalı — 7 blok (`isCover: false`)

Çıktı virgülle birleştirilmiş tek metindir. Bloklar:

| # | İçerik |
|---|--------|
| **[1]** | `PRIORITY` çakışma sırası + isteğe bağlı `STORY SCENE PLAN` (`storyScenePlanAnchor`) + sayfa 1 ise kapaktan farklılık uyarısı |
| **[2]** | `getGlobalArtDirection` + varsa `getStyleSpecificDirectives` |
| **[3]** | `buildShotPlanBlock` + "Environment dominates…" + önceki sahnelerden çeşitlilik ipucu |
| **[4] `[SCENE] … [/SCENE]`** | `characterAction`, `getEnvironmentDescription` (story `environmentDescription` / tema), zaman/hava, derinlik satırı, poz varyasyonu, bakış, sinematik veya grafik stil gaze cümlesi, entegrasyon |
| **[5]** | Referans = kimlik; relighting; kıyafet; `characterPrompt`; `useCoverReference` ise kapak tutarlılığı; çoklu karakter |
| **[6]** | `characterExpressions` varsa ifade bölümü |
| **[7]** | Tek satır `AVOID:` — kompozisyon + teknik (iç sayfada parmak/ekstremite negatifleri **yok**, v1.29.0) |

### İç sayfa: `useCoverReference` ve referans görseller (çağrı yeri)

| Yol | `useCoverReference` | Referans listesi (özet) |
|-----|---------------------|-------------------------|
| **`lib/book-generation/image-pipeline.ts`** (async kitap) ve **`app/api/books/route.ts`** içi sayfa üretimi | `false` | Karakter **master**'ları + sayfadaki **entity** master'ları; yoksa `reference_photo_url`. **Kapak PNG'si bu listeye eklenmez.** |
| **`app/api/ai/regenerate-image/route.ts`** | `false` (iç sayfa) | Create-book ile aynı mantık: karakter master/photo + ilgili entity master; kapak yok. |
| **`app/api/ai/generate-images/route.ts`** | `true` (iç sayfa) | Prompt'ta kapak tutarlılığı direktifi aktif; FormData'ya **karakter referansları + kapak URL** eklenir (`coverImageUrl` varsa). |

Yani "kapak referansı" yalnızca **`generate-images` API** yolunda hem metinde hem çoklu görselde kullanılır; **ana üretim pipeline'ı** bunu kullanmaz.

---

## `SceneInput` (özet)

Önemli alanlar: `pageNumber`, `sceneDescription`, `theme`, `mood`, `characterAction`, `focusPoint`, `clothing`, `characterExpressions`, `shotPlan`, `coverEnvironment` (kapak), `environmentDescription` (iç), `storyScenePlanAnchor`, `timeOfDay`, `weather`.

---

## İlgili dokümanlar

- `docs/analysis/IMAGE_QUALITY_IMPROVEMENT_PLAN.md`  
- `docs/analysis/IMAGE_STEPS_REQUEST_RESPONSE_ANALYSIS.md`  
- `docs/analysis/MASTER_ILLUSTRATION_CONTRACT.md`
