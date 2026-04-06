-- ============================================================================
-- Migration 025b — orders: sadece indeksler (4 adet, $$ yok)
--
-- Ön koşul: 025_create_orders.sql
-- Sonra: 025c_orders_updated_at_trigger.sql
--
-- DBeaver: Tercihen Ctrl+A → "Execute SQL script" (Alt+X). İstersen imleci
-- her CREATE INDEX satırına koyup Ctrl+Enter ile dört kez de çalıştırabilirsin.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_user_id            ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status              ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider    ON orders(payment_provider);
CREATE INDEX IF NOT EXISTS idx_orders_created_at          ON orders(created_at DESC);
