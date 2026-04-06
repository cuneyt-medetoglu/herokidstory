-- ============================================================================
-- Migration 030 — payments: eski / kullanılmayan sütunları sil
--
-- Hibrit tabloda hem eski (provider, currency, …) hem 027 sütunları
-- (payment_provider, payment_currency, …) vardı; kod yalnızca yenileri yazar.
-- Yinelenen ve kullanılmayan sütunları kaldırır — tabloda yoksa IF EXISTS ile atlanır.
--
-- Sıra: 029 sonrası.
-- ============================================================================

ALTER TABLE payments DROP COLUMN IF EXISTS provider;
ALTER TABLE payments DROP COLUMN IF EXISTS currency;
ALTER TABLE payments DROP COLUMN IF EXISTS payment_method;
ALTER TABLE payments DROP COLUMN IF EXISTS provider_transaction_id;
ALTER TABLE payments DROP COLUMN IF EXISTS metadata;
