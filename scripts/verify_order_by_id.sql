-- ============================================================================
-- Tek sipariş + ödeme + olay günlüğü doğrulama
--
-- Kullanım: Aşağıdaki :order_id yerine UUID yapıştırın veya psql'de
--   \set order_id '8ac0360a-3639-4a9f-a7b2-eaab8c9111e5'
-- DBeaver: üç sorguyu sırayla çalıştırın (tek seferde hepsi de olur).
--
-- NOT: payment_events.created_at YOK — migration 028'de sütun adı received_at.
-- ============================================================================

-- 0) (İsteğe bağlı) orders sütunları — "column created_at does not exist" ise önce bunu çalıştırın.
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'orders'
-- ORDER BY ordinal_position;

-- 1a) Sipariş özeti (migration 025 ile uyumlu şema)
SELECT
  id,
  user_id,
  status,
  payment_provider,
  total_amount,
  order_currency,
  paid_at,
  created_at,
  updated_at,
  failure_reason
FROM orders
WHERE id = '8ac0360a-3639-4a9f-a7b2-eaab8c9111e5';

-- 1b) Yukarıda created_at / payment_provider vb. yoksa — tüm sütunlar (şema farkını aşar)
-- SELECT * FROM orders WHERE id = '8ac0360a-3639-4a9f-a7b2-eaab8c9111e5';

-- 2) Satır kalemleri
SELECT *
FROM order_items
WHERE order_id = '8ac0360a-3639-4a9f-a7b2-eaab8c9111e5';

-- 3) Ödeme kaydı
SELECT
  id,
  order_id,
  user_id,
  payment_provider,
  status,
  amount,
  payment_currency,
  provider_payment_id,
  created_at,
  updated_at
FROM payments
WHERE order_id = '8ac0360a-3639-4a9f-a7b2-eaab8c9111e5';

-- 4) Olay günlüğü (zaman: received_at)
SELECT
  id,
  event_type,
  payment_provider,
  order_id,
  provider_event_id,
  processed,
  received_at,
  processed_at
FROM payment_events
WHERE order_id = '8ac0360a-3639-4a9f-a7b2-eaab8c9111e5'
ORDER BY received_at;
