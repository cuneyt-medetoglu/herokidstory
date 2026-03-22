# PDF Çıktı İyileştirme Planı

**Son güncelleme:** 22 Mart 2026 · **Faz:** 5.7

---

## Özet

| Alan | Durum |
|------|--------|
| Ön kapak A5 | Kurumsal wordmark + altında logo; full-bleed + başlık |
| İçerik | A4 spread, metin ortalı / cümle paragrafları |
| Arka kapak | Logo + wordmark, tagline, **QR** (`NEXT_PUBLIC_APP_URL` veya herokidstory.com), footer “ile oluşturuldu” |
| PDF önbellek | **Admin:** `POST /api/admin/books/[id]/clear-pdf` + kitap detayında buton |
| **İleride** | İçerik/kapak değişince otomatik cache invalidation |

---

## Referanslar

- **Kod:** `lib/pdf/generator.ts` (QR: `qrcode`), `lib/pdf/templates/book-styles.css`
- **API:** `generate-pdf`, `admin/.../clear-pdf`, `lib/pdf/image-compress.ts`
- **Önizleme:** `public/dev/pdf-preview-test.html` → `/dev/pdf-preview-test.html`
- **Agent:** `.cursor/rules/pdf-generation-manager.mdc`

---

## İlerleme (özet)

| Konu | Durum |
|------|--------|
| Layout A5 kapak + A4 spread + arka kapak | ✅ |
| Admin `pdfLayout: 'print'` (spiral/duplex imposizyon) | ✅ `generator.ts` `buildPrintSheets` |
| Admin PDF cache temizleme | ✅ |
| Arka kapak QR | ✅ |
| `PDF_GENERATION_GUIDE.md` | ⏳ |
| Otomatik cache (story/images değişince) | 📋 sonra |

---

## Gelecek fikirler (backlog)

| # | Konu |
|---|------|
| **Cache** | `story_data` / `images_data` / `cover_image_url` güncellenince `pdf_url` & `pdf_path` temizle veya hash ile “yeniden üret gerekli” bayrağı |
| **Arka kapak** | Aynı çocuk/kullanıcıya ait **diğer kitapların kapak küçük görseli** (örn. 2 adet) + derin link veya QR ile oluşturma/mağaza — **veri + UI ayrı iş** |
| **Diğer** | Baskı bleed; uygulama içi PDF önizleme (5.7.2); şablon seçenekleri (5.7.3); hukuk satırı, sosyal link |

---

## Teknik not

- Mixed `@page` + `preferCSSPageSize: true`
- 50 MB limit — `image-compress.ts`
- QR URL: `NEXT_PUBLIC_APP_URL` yoksa `https://herokidstory.com`
