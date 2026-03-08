-- ============================================================================
-- Books: source_example_book_id (Faz 1 — Örnek kitaplar çok dilli kopya)
-- ============================================================================
-- Kopya örnek kitapların hangi kaynak örneğe ait olduğunu tutar.
-- Tek blok olarak çalıştırın (IDE'de "Run" tüm dosyayı seçili çalıştırsın).
-- ============================================================================

BEGIN;

ALTER TABLE books
ADD COLUMN IF NOT EXISTS source_example_book_id UUID REFERENCES books(id) ON DELETE SET NULL;

COMMENT ON COLUMN books.source_example_book_id IS 'Kaynak örnek kitap (kopya ise). NULL = orijinal örnek veya kullanıcı kitabı.';

CREATE INDEX IF NOT EXISTS idx_books_source_example_book_id ON books(source_example_book_id)
WHERE source_example_book_id IS NOT NULL;

COMMIT;
