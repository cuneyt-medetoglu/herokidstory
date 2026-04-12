# HeroKidStory — Yasal Dokümanlar: Genel Bakış

**Son güncelleme:** Nisan 2026  
**Şirket:** Şahıs işletmesi (Cüneyt Medetoğlu)  
**Yasal danışman:** Henüz atanmadı (metinler taslak)

---

## Bu klasörde tek kaynak

| Dosya | Ne için? |
|--------|----------|
| **`LEGAL_OVERVIEW.md` (bu dosya)** | İş modeli, fazlar, sitede ne var, sonra yapılacaklar — **durum özeti burada.** |
| **`LEGAL_VERSIONS.md`** | Belge sürümleri (`draft` → `live`) ve güncelleme prosedürü. |
| **`TASLAK_*.md` + `0*_ANALIZ.md`** | Metin taslakları ve hukuki analiz notları. |

> **Cursor agent (`legal-manager.mdc`):** Satıcı bilgisi, sabit kararlar ve kısa teknik özet orada; **faz ve tamamlanan iş listesi burada tutulur** — iki yerde farklı faz numarası olmaması için agent da bu dosyayı günceller.

---

## İş modeli (satış kapsamı)

| Ürün | Pazar | Ödeme | Not |
|------|--------|--------|-----|
| E-kitap (dijital) | Global | Stripe + İyzico | TKHK / GDPR / COPPA vb. |
| Basılı kitap | Yalnızca TR | İyzico | Mesafeli sözleşmeler (MSS + ön bilgilendirme) |

**MSS + Ön Bilgilendirme Formu** yalnızca `locale === "tr"` ve ilgili checkout akışında.

---

## Fazlar — tek tablo (uygulama + doküman)

Aşağıdaki fazlar **HeroKidStory iç projesi** için kullanılan isimlendirmedir; yasal zorunluluk sırasıyla birebir örtüşmeyebilir.

### Faz 1 — TR tüketici (ödeme öncesi)

| # | Çıktı | Doküman / kod | Durum |
|---|--------|---------------|--------|
| 1.1 | Mesafeli satış sözleşmesi | `TASLAK_MESAFELI_SATIS_SOZLESMESI.md` | Taslak v1.1-draft |
| 1.2 | Ön bilgilendirme | `TASLAK_ON_BILGILENDIRME_FORMU.md` | Taslak v1.1-draft |
| 1.3 | MSS sayfası | `app/[locale]/(public)/mesafeli-satis/page.tsx` | TR-only |
| 1.4 | Checkout onayları | `components/checkout/LegalConsents.tsx`, `CheckoutForm.tsx`, `IyzicoPaymentFlow.tsx` | TR |
| 1.5 | Sipariş onay alanları | `migrations/034_orders_legal_consent.sql` | Uygulandı |
| 1.6 | Footer satıcı bilgisi (TR) | `components/layout/Footer.tsx` | Var |
| 1.7 | i18n (checkout) | `messages/tr.json`, `messages/en.json` (`legalConsents`) | Var |

### Faz 2 — Global yasal yüzey (site metinleri)

| # | Çıktı | Doküman / kod | Durum |
|---|--------|---------------|--------|
| 2.1 | Gizlilik politikası | `TASLAK_GIZLILIK_POLITIKASI.md` + `privacy/page.tsx` → `/privacy` | v1.4.0 |
| 2.2 | Kullanım koşulları | `TASLAK_KULLANIM_KOSULLARI.md` → `/terms` | v1.1-draft |
| 2.3 | Çerez politikası | `TASLAK_CEREZ_POLITIKASI.md` → `/cookies` | v1.0-draft |
| 2.4 | Çerez banner | `components/layout/CookieConsentBanner.tsx` | `/cookies` linki + consent timestamp |

Analiz dosyaları: `03_…`, `04_…`, `05_…`.

### Faz 3 — İade / kalite + kayıt

| # | Çıktı | Doküman / kod | Durum |
|---|--------|---------------|--------|
| 3.1 | İade ve kalite politikası (TR+EN, tek route) | `07_IADE_VE_KALITE_POLITIKASI.md` → `refund-policy/page.tsx` | Sayfa v1.0-draft; `locale === "tr"` → TR metin, aksi → EN |
| 3.2 | Footer linki | `Footer.tsx` + `footer.legalLinks.refundPolicy` | Tüm dillerde `/refund-policy` |
| 3.3 | Kayıt — ToS + Gizlilik ayrı onay | `app/[locale]/(public)/auth/register/page.tsx` | İki checkbox |
| 3.4 | Kayıt sonrası sürüm notu (istemci) | `localStorage`: `tos_version_accepted`, `tos_accepted_at`, `privacy_version_accepted`, `privacy_accepted_at` | Kayıt başarılı + oturum açılınca |

> **Not:** Ayrı `/iade-politikasi` URL’si yok; Türkçe etiket footer’da, içerik aynı route üzerinden.

---

## Şu ana kadar tamamlanan özet (kod + taslak)

- Yasal sayfalar: `/privacy`, `/terms`, `/cookies`, `/refund-policy` (çok dilli route), `/mesafeli-satis` (TR).
- ÖBF: ayrı public URL yok; checkout’ta TR için modal/checkbox ile.
- Checkout TR: MSS + ön bilgilendirme + dijital feragat onayları; ödeme alanları onaysız kilitli.
- Veritabanı: `orders` üzerinde yasal onay zaman damgaları ve `contract_version` (migration 034).

Tüm belge sürümleri: **`LEGAL_VERSIONS.md`**.

---

## Test ve görüntüleme rehberi

**Önkoşul:** `npm run dev` (varsayılan [http://localhost:3000](http://localhost:3000)). Aşağıdaki URL’lerde `BASE` = `http://localhost:3000` kabul edilir; farklı port/host kullanıyorsan değiştir.

### Yasal sayfalar ve HTTP

Aşağıdaki `curl` örnekleri **Git Bash / WSL / macOS / Linux** içindir. Yanıt gövdesini istemiyorsan `-s -o /dev/null -w "%{http_code}\n"` kullan.

| # | Kapsam | Tarayıcıda aç | `curl` ile durum kodu (localhost:3000) |
|---|--------|----------------|----------------------------------------|
| 1 | Gizlilik (TR) | `BASE/tr/privacy` | `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tr/privacy` → `200` |
| 2 | Gizlilik (EN) | `BASE/en/privacy` | `.../en/privacy` → `200` |
| 3 | Kullanım koşulları (TR) | `BASE/tr/terms` | `.../tr/terms` → `200` |
| 4 | Kullanım koşulları (EN) | `BASE/en/terms` | `.../en/terms` → `200` |
| 5 | Çerez politikası (TR) | `BASE/tr/cookies` | `.../tr/cookies` → `200` |
| 6 | Çerez politikası (EN) | `BASE/en/cookies` | `.../en/cookies` → `200` |
| 7 | İade / refund (TR metin) | `BASE/tr/refund-policy` | `.../tr/refund-policy` → `200` (sayfada “İade ve Kalite”) |
| 8 | İade / refund (EN metin) | `BASE/en/refund-policy` | `.../en/refund-policy` → `200` (“Refund & Quality”) |
| 9 | Mesafeli satış (yalnız TR) | `BASE/tr/mesafeli-satis` | `.../tr/mesafeli-satis` → `200` |
| 10 | Mesafeli satış (EN’de kapalı) | `BASE/en/mesafeli-satis` | `.../en/mesafeli-satis` → `404` (`notFound`) |

### Footer ve dil

| # | Ne kontrol edilir | Nasıl |
|---|-------------------|--------|
| 11 | Yasal linkler | Ana sayfa veya uzun bir sayfa; sayfayı aşağı kaydır → footer’da Privacy, Terms, Cookies, Refund / İade linki. |
| 12 | TR’ye özel | `BASE/tr/...` footer’da ayrıca **Mesafeli Satış Sözleşmesi** + satıcı satırı (ad, VKN, e-posta). |
| 13 | EN/global | `BASE/en/...` footer’da Mesafeli Satış linki **olmamalı**; diğer yasal linkler olmalı. |

### Çerez banner (Faz 2.4)

| # | Ne | Nasıl |
|---|-----|--------|
| 14 | Banner | Gizli pencere / çerezleri temizle veya `localStorage` içinden `cookie-consent` anahtarlarını sil; siteyi yenile → banner görünmeli. |
| 15 | “Daha fazla” linki | Bannerdaki politika linki **`/cookies`** (locale önekli: `/tr/cookies`) olmalı. |
| 16 | Onay kaydı | “Kabul” sonrası DevTools → Application → Local Storage: `cookie-consent-timestamp`, `cookie-consent-version` dolu olmalı. |

### Checkout — TR yasal onaylar (Faz 1.4)

| # | Ne | Nasıl |
|---|-----|--------|
| 17 | Bileşen görünürlüğü | Sepete ürün ekle → **`BASE/tr/checkout`**. **LegalConsents** (MSS, ön bilgi, dijital feragat) blokları görünmeli. |
| 18 | Ödeme kilidi | Üç onay işaretlenmeden fatura/ödeme adımı kullanılamaz veya gri ( **`legalConsentsAccepted`** ). |
| 19 | EN checkout | **`BASE/en/checkout`** → aynı TR onay blokları **görünmemeli** (locale `tr` değil). |

### Kayıt — ToS / Gizlilik + localStorage (Faz 3.3–3.4)

| # | Ne | Nasıl |
|---|-----|--------|
| 20 | İki checkbox | **`BASE/tr/auth/register`** (veya `en`): “Kullanım koşulları” ve “Gizlilik” ayrı kutular; ikisi işaretlenmeden gönderim engellenmeli. |
| 21 | Sürüm anahtarları | Başarılı kayıt + oturum açıldıktan sonra Local Storage: `tos_version_accepted`, `tos_accepted_at`, `privacy_version_accepted`, `privacy_accepted_at`. |

### Veritabanı (Faz 1.5)

| # | Ne | Nasıl |
|---|-----|--------|
| 22 | `orders` kolonları | PostgreSQL’de: `\d orders` veya `SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name IN ('preliminary_info_accepted_at','contract_accepted_at','digital_waiver_accepted','contract_version');` — dört alan listelenmeli. |

### Dokümanlar (repo, tarayıcı dışı)

| # | Ne | Nasıl |
|---|-----|--------|
| 23 | Taslak metinler | `docs/legal/TASLAK_*.md` dosyalarını editörde aç; sürüm satırı / CHANGELOG var mı bak. |
| 24 | Sürüm tablosu | `docs/legal/LEGAL_VERSIONS.md` merkezi tablo ile sayfa sürümleri uyumlu mu kontrol et. |

> **Windows / Git Bash:** `curl` yüklü değilse tarayıcıda açmak ve DevTools **Network** sekmesinde isteğin durum koduna bakmak yeterli.

---

## Sonra yapılacaklar (şimdilik dokümante only — sen takvimini belirlersin)

Bunlar **faz 4 değil**, ayrı bir “go-live / uyum” listesi; kod tabanında şu an bloklayıcı iş yok.

| Konu | Ne zaman / not |
|------|----------------|
| Avukat incelemesi | Taslakları onaylat; `LEGAL_VERSIONS.md` içinde `draft` → `review` → `approved` |
| Domain canlı | Production URL sabitlenince footer / metadata gözden geçirilir |
| ETBİS | Canlı e-ticaret öncesi; rehber: `06_ETBIS_KAYDI_ANALIZ.md` — kayıt sonrası ETBİS no footer’a |
| VERBİS / yurt dışı aktarım | Avukat görüşü (KVKK) |

---

## Analiz ve risk notları (özet)

Çocuk verisi, AI içerik, dijital iade istisnası, basılı kişiselleştirme: ayrıntılar ilgili `0*_ANALIZ.md` dosyalarında.

---

## Önemli uyarı

Bu klasördeki metinler **analiz ve taslak** amaçlıdır; hukuki tavsiye değildir. Yayına almadan önce uygun meslek mensubu incelemesi önerilir.
