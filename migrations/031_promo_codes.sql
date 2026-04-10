-- =============================================================================
-- 031 — Promo / indirim kodu sistemi
-- =============================================================================
-- Tablolar: promo_codes, promo_code_usages
-- orders.promo_code_id sütununa FK eklenir (sütun Faz 0'da oluşturuldu).
-- =============================================================================

-- 1. promo_codes tablosu
CREATE TABLE IF NOT EXISTS promo_codes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Kullanıcının gireceği kod (ör. "HEROKID20") — büyük/küçük harf duyarsız indeks
  code             TEXT NOT NULL UNIQUE,

  -- İndirim türü: 'percent' | 'fixed'
  discount_type    TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),

  -- percent: 0–100 arası yüzde; fixed: para birimi cinsinden sabit tutar
  discount_value   NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),

  -- Para birimi kısıtlaması (NULL = tüm para birimleri, şimdilik TRY)
  currency         TEXT,

  -- Kullanım limitleri (NULL = sınırsız)
  max_uses         INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  used_count       INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),

  -- Kişi başı limit (varsayılan 1 = tek kullanımlık per user)
  max_uses_per_user INTEGER DEFAULT 1 CHECK (max_uses_per_user IS NULL OR max_uses_per_user > 0),

  -- Geçerlilik aralığı (NULL = süresiz)
  valid_from       TIMESTAMPTZ,
  valid_until      TIMESTAMPTZ,

  -- Minimum sipariş tutarı (NULL = kısıtlama yok)
  min_order_amount NUMERIC(10,2),

  -- Hangi ürün tiplerine uygulanır (NULL = tüm ürünler)
  -- Örn: '["ebook"]' veya '["hardcopy","bundle"]'
  applicable_to    JSONB,

  is_active        BOOLEAN NOT NULL DEFAULT TRUE,

  -- Admin notları / kampanya açıklaması
  description      TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Büyük/küçük harf duyarsız hızlı arama indeksi
CREATE INDEX IF NOT EXISTS promo_codes_code_lower_idx ON promo_codes (LOWER(code));

-- 2. promo_code_usages tablosu
CREATE TABLE IF NOT EXISTS promo_code_usages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id    UUID NOT NULL REFERENCES promo_codes(id) ON DELETE RESTRICT,
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  discount_amount  NUMERIC(10,2) NOT NULL CHECK (discount_amount >= 0),
  used_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Aynı siparişte kod iki kez kullanılamaz
  UNIQUE (promo_code_id, order_id)
);

CREATE INDEX IF NOT EXISTS promo_code_usages_code_id_idx  ON promo_code_usages (promo_code_id);
CREATE INDEX IF NOT EXISTS promo_code_usages_user_id_idx  ON promo_code_usages (user_id);
CREATE INDEX IF NOT EXISTS promo_code_usages_order_id_idx ON promo_code_usages (order_id);

-- 3. orders.promo_code_id FK (sütun Faz 0 migration'ında oluşturuldu)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_promo_code_id_fkey'
      AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_promo_code_id_fkey
      FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id);
  END IF;
END
$$;

-- 4. updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS promo_codes_updated_at ON promo_codes;
CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
