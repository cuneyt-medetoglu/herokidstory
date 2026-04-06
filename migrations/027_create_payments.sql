-- ============================================================================
-- Migration 027 — payments TABLOSU (yalnızca CREATE TABLE)
--
-- DBeaver: PARÇA seçip çalıştırmayın. Sadece "-- Sağlayıcı" / payment_provider
-- satırlarını seçerseniz CREATE TABLE başlamaz →
--   "syntax error at or near payment_provider" (Position ~17).
--
-- Doğru: Ctrl+A → tüm dosya VEYA imleci CREATE TABLE satırına koy → tek ifade.
--
-- Sonra: 027b_payments_indexes_triggers.sql çalıştırın.
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID        NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  payment_provider      VARCHAR(20) NOT NULL CHECK (payment_provider IN ('iyzico', 'stripe')),
  provider_payment_id   TEXT,
  provider_session_id   TEXT,
  status                VARCHAR(20) NOT NULL DEFAULT 'initiated'
                        CHECK (status IN (
                          'initiated',
                          'pending',
                          'succeeded',
                          'failed',
                          'cancelled',
                          'refunded'
                        )),
  amount                DECIMAL(10,2) NOT NULL,
  payment_currency      VARCHAR(10) NOT NULL,
  provider_response     JSONB,
  three_d_secure_url    TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
