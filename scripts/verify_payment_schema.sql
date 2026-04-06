-- ============================================================================
-- Ödeme / sipariş şeması doğrulama (DBeaver: Ctrl+A → çalıştır)
--
-- Beklenen: migrations 025 → 025c, 026, 027 → 027c (gerekirse), 027b, 028, 028b
-- ============================================================================

-- 1) Ödeme akışı için zorunlu tablolar var mı?
WITH expected(tbl) AS (
  VALUES
    ('orders'),
    ('order_items'),
    ('payments'),
    ('payment_events')
)
SELECT
  e.tbl                                   AS tablo,
  CASE
    WHEN to_regclass('public.' || e.tbl) IS NOT NULL THEN 'VAR'
    ELSE 'EKSIK — migration çalıştır'
  END                                     AS durum
FROM expected e
ORDER BY e.tbl;

-- 2) Kritik sütunlar (uygulama + migration 027/025 ile uyum)
--    Sonuç boş satır = o sütun yok.

SELECT * FROM (
  SELECT 'orders' AS tablo, 'payment_provider' AS sutun
  UNION ALL SELECT 'orders', 'order_currency'
  UNION ALL SELECT 'orders', 'total_amount'
  UNION ALL SELECT 'order_items', 'order_id'
  UNION ALL SELECT 'order_items', 'book_id'
  UNION ALL SELECT 'order_items', 'item_type'
  UNION ALL SELECT 'payments', 'payment_provider'
  UNION ALL SELECT 'payments', 'provider_payment_id'
  UNION ALL SELECT 'payments', 'payment_currency'
  UNION ALL SELECT 'payments', 'amount'
  UNION ALL SELECT 'payment_events', 'payment_provider'
  UNION ALL SELECT 'payment_events', 'raw_payload'
) req
WHERE NOT EXISTS (
  SELECT 1
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = req.tablo
    AND c.column_name = req.sutun
)
ORDER BY tablo, sutun;

-- 3) Satır sayıları (tam sayı; tablo yoksa satır üretmez)
SELECT relname AS tablo, n_live_tup::bigint AS yaklasik_satir
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN ('orders', 'order_items', 'payments', 'payment_events')
ORDER BY relname;

-- pg_stat_user_tables istatistik gecikmeli olabilir; tam sayı için tablolar varken:
-- SELECT COUNT(*) FROM orders;
-- SELECT COUNT(*) FROM order_items;
-- SELECT COUNT(*) FROM payments;
-- SELECT COUNT(*) FROM payment_events;
