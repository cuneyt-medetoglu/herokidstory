-- ============================================================================
-- Migration 028b — payment_events indeksleri (028’ten sonra çalıştırın)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON payment_events(order_id)
  WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_events_payment_provider ON payment_events(payment_provider);
CREATE INDEX IF NOT EXISTS idx_payment_events_processed ON payment_events(processed)
  WHERE processed = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_idempotency
  ON payment_events(payment_provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;
