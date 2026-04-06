-- ============================================================================
-- Migration 025c — orders: updated_at fonksiyonu + tetikleyici
--
-- Ön koşul: 025b_orders_indexes.sql
--
-- DBeaver — ZORUNLU: Ctrl+A → "Execute SQL script" (Alt+X).
-- Ctrl+Enter ile TEK ifade çalışırsan çoğu zaman sadece FUNCTION biter;
-- DROP TRIGGER + CREATE TRIGGER çalışmaz → trigger sorgusu boş kalır.
--
-- Tetikleyici satırı: EXECUTE PROCEDURE (PostgreSQL 11+).
-- ============================================================================

CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE update_orders_updated_at();
