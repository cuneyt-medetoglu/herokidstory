-- ============================================================================
-- Migration 027b — payments: indeksler + updated_at tetikleyicisi
-- Ön koşul: 027_create_payments.sql çalışmış olmalı.
-- DBeaver: Tüm dosyayı veya her CREATE’i ayrı çalıştırın; CREATE TABLE gövdesinden parça seçmeyin.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payments_order_id            ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON payments(provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status              ON payments(status);

CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE PROCEDURE update_payments_updated_at();
