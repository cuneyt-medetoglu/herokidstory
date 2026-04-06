-- ============================================================================
-- Migration 025 — orders TABLOSU (yalnızca CREATE TABLE)
--
-- ÖNEMLİ — DBeaver / SQL istemcileri
--   Bu dosyayı PARÇA seçerek çalıştırmayın. Örneğin sadece "created_at" satırlarını
--   seçip Ctrl+Enter verirseniz PostgreSQL şunu görür: tablo tanımı YOK, doğrudan
--   sütun satırları → "syntax error at or near created_at" (veya currency).
--
-- Doğru kullanım:
--   • Tüm dosyayı seç (Ctrl+A) → "Execute SQL Script" / tümünü çalıştır, VEYA
--   • İmleci CREATE TABLE satırının içine koy → "Execute SQL statement" (tek
--     ifade; noktalı virgüle kadar tüm CREATE TABLE çalışır).
--
-- Sıra: 025b_orders_indexes.sql → 025c_orders_updated_at_trigger.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,

  -- Durum
  status              VARCHAR(30) NOT NULL DEFAULT 'pending'
                      CHECK (status IN (
                        'pending',
                        'processing',
                        'paid',
                        'failed',
                        'cancelled',
                        'refunded',
                        'partially_refunded'
                      )),

  -- Sağlayıcı
  payment_provider    VARCHAR(20) NOT NULL
                      CHECK (payment_provider IN ('iyzico', 'stripe')),

  -- Para birimi ve tutarlar
  order_currency      VARCHAR(10) NOT NULL,
  subtotal            DECIMAL(10,2) NOT NULL,
  discount_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount        DECIMAL(10,2) NOT NULL,

  -- İndirim (ileride genişletilebilir)
  promo_code          VARCHAR(50),
  promo_code_id       UUID,

  -- Adresler (JSONB)
  billing_address     JSONB,
  shipping_address    JSONB,

  -- Notlar / hata
  notes               TEXT,
  failure_reason      TEXT,

  -- Zaman damgaları
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at             TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  refunded_at         TIMESTAMPTZ
);
