-- ============================================================================
-- payments tablosu şema teşhisi (DBeaver: Ctrl+A → çalıştır)
--
-- Amaç: Uygulama kodu şu INSERT sütunlarını kullanıyor:
--   order_id, user_id, payment_provider, amount, payment_currency,
--   provider_session_id, status
--
-- Eski / elle oluşturulmuş tablolarda sık görülen uyumsuzluklar:
--   • "provider" NOT NULL — kod "payment_provider" yazar → provider NULL kalır
--   • "user_id" NOT NULL — kod user_id göndermez veya eski build çalışıyor
-- ============================================================================

-- A) Tüm sütunlar (isim + tip + NULL izni)
SELECT
  ordinal_position AS pos,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'payments'
ORDER BY ordinal_position;

-- B) "provider" veya "payment_provider" hangisi var?
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'payments'
  AND column_name IN ('provider', 'payment_provider', 'user_id')
ORDER BY column_name;

-- C) CHECK / NOT NULL dahil tablo kısıtları
SELECT
  c.conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'payments'
ORDER BY c.contype, c.conname;

-- D) Son kayıtlar (tüm sütunlar — A çıktısına göre hangi alanların NULL kaldığını görürsünüz)
SELECT *
FROM payments
ORDER BY created_at DESC
LIMIT 5;
