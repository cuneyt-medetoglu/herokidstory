# Ödeme entegrasyonu — kısa ilerleme notları

Kişisel hatırlatma / günlük notlar. Ana takip: [PAYMENT_ROADMAP.md](PAYMENT_ROADMAP.md).

**Şema kontrolü:** `scripts/verify_payment_schema.sql` — DBeaver’da açıp Ctrl+A ile çalıştırın; eksik tablo / sütun özetini verir.

---

## 2026-04-05

- **`iyzipay`:** `npm install iyzipay` → **`package.json` + `package-lock.json`** güncellenir; sunucu için bu iki dosyayı **commit edip** deploy’da `npm install` yeterli (`node_modules` commit etme).

- **025 migration — DBeaver “syntax error at or near …” (`currency`, `created_at`, vb.)**
  - **Kök neden:** Çoğu zaman **yanlış çalıştırma**. İstemciye giden metin `CREATE TABLE … (` ile başlamıyor; sadece tablo gövdesinin bir parçası (ör. `-- Zaman damgaları` + `created_at …`) gidiyor. PostgreSQL bunu geçerli bir komut sanmıyor; ilk sütun adında hata veriyor.
  - **Doğru kullanım:** `Ctrl+A` → tüm script’i çalıştır; veya imleci **`CREATE TABLE`** satırına koyup “tek SQL ifadesi” çalıştır (DBeaver `;`’a kadar alır). **Tablo ortasından satır seçip Ctrl+Enter kullanma.**
  - **Repo düzeni:** `025` tablo → **`025b_orders_indexes.sql`** (sadece indeks, `$$` yok) → **`025c_orders_updated_at_trigger.sql`** (fonksiyon + trigger; mutlaka **Alt+X** tüm dosya). Sonra 026…

- **Sütun adları (DB):** `payment_provider`, `order_currency` (orders); `payments` → `payment_currency`; `payment_events` → `payment_provider`. Kod: `lib/payment/types.ts`, `lib/db/orders.ts`.

- **Trigger:** `EXECUTE PROCEDURE` (PG 11+ uyumu).

- **027 — `syntax error at or near "payment_provider"`**  
  Aynı kök neden: çoğunlukla **`CREATE TABLE payments (` satırı çalışmadan** sadece `payment_provider` bölümü gönderiliyor. Tam dosyayı çalıştır.  
  Repo: `027_create_payments.sql` (yalnızca tablo) + **`027b_payments_indexes_triggers.sql`**.

- **025 istatistikte sadece yorumlar görünüyorsa:** Muhtemelen yalnızca dosya başı seçilip çalıştırıldı; **`CREATE TABLE` hiç çalışmamış** olabilir. `orders` var mı diye DB’de kontrol et (`SELECT to_regclass('public.orders');`). Yoksa `025` tamamını tekrar çalıştır.

- **025b “index already exists”:** `IF NOT EXISTS` ile tekrar çalıştırma genelde sorun değil; uyarı/notice görülebilir.

- **Tam migration sırası:** `025` → `025b` (indeks) → `025c` (trigger) → `026` → `027` → **`027c` (yalnızca eski `payments` şeması varsa)** → `027b` → `028` → `028b`.

- **027 çalıştı ama `payment_provider` yok / 027b sütun bulamıyor**  
  Veritabanında **daha önce oluşturulmuş** bir `payments` tablosu vardı; `CREATE TABLE IF NOT EXISTS` hiçbir şey yapmadı. **Çözüm:** `027c_payments_align_legacy.sql` dosyasını **tümüyle** çalıştır, ardından **`027b`**’yi tekrar çalıştır.  
  Alternatif (tablolar **boş**, sadece geliştirme): `payment_events` → `payments` sırasıyla `DROP TABLE ... CASCADE;` sonra `027` → `027b` → `028` → `028b` temiz kurulum.

- **Runtime: `column "payment_provider" of relation "payments" does not exist`**  
  `payments` tablosu eski şemada veya `027` hiç çalışmamış. Çözüm: hedef DB’de **`027_create_payments.sql`** tam dosyayı çalıştır, ardından **`027b_payments_indexes_triggers.sql`**. (Yarım seçim + Ctrl+Enter ile sadece gövde çalıştıysa yine hata alırsın — [üstteki 027 notu](#2026-04-05).)

- **Kitap oluşturma adım 6 — “Öde” sonrası boş sepet**  
  **Faz 1:** Sepete gitmeden önce `addToCart` ile satır eklenmeli; yalnızca `?plan=` query’si yeterli değil. Roadmap özeti: [PAYMENT_ROADMAP.md](PAYMENT_ROADMAP.md) “Sık sorulan” tablosu.

- **Checkout’ta ham çeviri anahtarları**  
  Bileşenlerde `useTranslations("checkout")` ile `t("billingAddress.xxx")` gibi iç içe anahtarlar bazen çözülmez; desen: `useTranslations("checkout.billingAddress")` + kısa anahtar (`nameLabel`). Metin QA’sı Faz 1 devamı; para birimi / ülke gösterimi genişletmesi Faz 3.

---

## Sandbox — uçtan uca test (Faz 1)

1. **Ortam**
   - `.env`: `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL=https://sandbox-api.iyzipay.com`
   - `DATABASE_URL` tanımlı; migration zinciri (025→028b) uygulanmış olmalı.
   - **`NEXT_PUBLIC_APP_URL`:** Callback URL şu şekilde üretiliyor: `{NEXT_PUBLIC_APP_URL}/api/payment/iyzico/callback`. Bu adres **iyzico’nun POST atabileceği** gerçek bir HTTPS origin olmalı.
     - **Yerel `http://localhost:3000`:** iyzico sunucuları genelde localhost’a ulaşamaz → callback çalışmaz. Çözüm: staging URL veya tünel (**ngrok**, Cloudflare Tunnel vb.) ile public URL ver; `.env`’de `NEXT_PUBLIC_APP_URL`’i o URL yap.

2. **Uygulamayı çalıştır**
   - `npm run dev` (veya staging build).

3. **Akış**
   - Sepete ürün ekle → `/checkout` → fatura adresi → **Ödemeye Geç** → iyzico iframe’de sandbox kartı.
   - FAZ1 dokümandaki test kartları: [FAZ1_IYZICO.md](FAZ1_IYZICO.md) bölüm 1.3.

4. **Beklenen sonuç**
   - Başarılı: tarayıcı `/payment/success?orderId=...` (locale prefix’li olabilir, örn. `/tr/payment/success`).
   - Başarısız: `/payment/failure?reason=...`
   - DB: `orders` → `paid`, `payments` → `succeeded`, `payment_events` satırı (token ile idempotency).

5. **Sorun giderme**
   - Initialize 503: iyzico API hata mesajı sunucu log’unda; anahtar / base URL kontrolü.
   - Callback hiç gelmiyor: `NEXT_PUBLIC_APP_URL` ve public erişim (localhost değil).

---

## Sonraki notlar için şablon

```
## YYYY-AA-GG
- Ne yaptık / ne kırıldı / hangi env
```
