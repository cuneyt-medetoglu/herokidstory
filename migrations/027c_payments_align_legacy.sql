-- ============================================================================
-- Migration 027c — Eski `payments` tablosunu 027 şemasına hizala
--
-- Ne zaman?
--   `027_create_payments.sql` çalıştırdığınızda "relation payments already exists,
--   skipping" görüyorsanız ama `payment_provider` / `provider_payment_id` yoksa
--   (DBeaver’da 027b kırmızı çizgi veya runtime hata).
--
-- Bu dosya: Eksik SÜTUNLARI ALTER ile ekler; ardından 027b’yi tekrar çalıştırın.
--
-- Önemli veri varsa önce yedek alın. Aşağıdaki UPDATE’ler NULL alanları doldurur;
-- gerçek tutarları sizin düzeltmeniz gerekebilir.
--
-- CHECK eklenemezse: Eski `status` değerleri listede yoktur; satırları güncelleyin
-- veya tabloyu (geliştirme, boş) DROP edip 027’den temiz kurun.
-- ============================================================================

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_provider      VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_payment_id   TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_session_id   TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status                VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount                DECIMAL(10,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_currency      VARCHAR(10);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_response     JSONB;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS three_d_secure_url    TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at            TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ;

-- Mevcut satırlar için minimum doldurma (NOT NULL öncesi)
UPDATE payments SET payment_provider = 'iyzico' WHERE payment_provider IS NULL;
UPDATE payments SET status = 'initiated' WHERE status IS NULL;
UPDATE payments SET payment_currency = 'TRY' WHERE payment_currency IS NULL;
UPDATE payments SET amount = 0 WHERE amount IS NULL;
UPDATE payments SET created_at = NOW() WHERE created_at IS NULL;
UPDATE payments SET updated_at = NOW() WHERE updated_at IS NULL;

ALTER TABLE payments ALTER COLUMN payment_provider SET NOT NULL;
ALTER TABLE payments ALTER COLUMN status SET NOT NULL;
ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'initiated';
ALTER TABLE payments ALTER COLUMN amount SET NOT NULL;
ALTER TABLE payments ALTER COLUMN payment_currency SET NOT NULL;
ALTER TABLE payments ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE payments ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE payments ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE payments ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_provider_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_provider_check
  CHECK (payment_provider IN ('iyzico', 'stripe'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN (
    'initiated',
    'pending',
    'succeeded',
    'failed',
    'cancelled',
    'refunded'
  ));
