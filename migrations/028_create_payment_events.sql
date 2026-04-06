-- ============================================================================
-- Migration 028 — payment_events TABLOSU (yalnızca CREATE TABLE)
--
-- DBeaver: Parça seçerek çalıştırmayın; CREATE TABLE baştan `);` sonuna kadar tek sefer.
-- Sonra: 028b_payment_events_indexes.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_events (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID        REFERENCES orders(id) ON DELETE SET NULL,
  payment_id        UUID        REFERENCES payments(id) ON DELETE SET NULL,
  payment_provider  VARCHAR(20) NOT NULL CHECK (payment_provider IN ('iyzico', 'stripe')),
  provider_event_id TEXT,
  event_type        TEXT        NOT NULL,
  raw_payload       JSONB       NOT NULL,
  processed         BOOLEAN     NOT NULL DEFAULT FALSE,
  processed_at      TIMESTAMPTZ,
  error_message     TEXT,
  received_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
