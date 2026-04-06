-- ============================================================================
-- Migration 026: order_items tablosu
-- Sipariş içindeki satır kalemleri.
-- item_type: 'ebook' | 'hardcopy' | 'bundle'
-- Fiyatlar sipariş anındaki değerdir (sonradan değişse bile korunur).
--
-- DBeaver: CREATE TABLE gövdesini parça seçerek çalıştırmayın (Ctrl+A önerilir).
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id             UUID        NOT NULL REFERENCES books(id) ON DELETE RESTRICT,

  -- Ürün tipi
  item_type           VARCHAR(20) NOT NULL
                      CHECK (item_type IN ('ebook', 'hardcopy', 'bundle')),

  -- Sipariş anındaki fiyat (snapshot)
  unit_price          DECIMAL(10,2) NOT NULL,
  quantity            INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_price         DECIMAL(10,2) NOT NULL,

  -- Fulfillment (hardcopy kargo takibi)
  fulfillment_status  VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (fulfillment_status IN (
                        'pending',
                        'processing',
                        'printed',
                        'shipped',
                        'delivered',
                        'cancelled'
                      )),
  tracking_number     TEXT,
  tracking_url        TEXT,

  -- Metadata (ileride genişletilebilir — ör. e-book download token)
  metadata            JSONB,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_book_id  ON order_items(book_id);
