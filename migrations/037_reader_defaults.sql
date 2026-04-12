-- Global defaults for the book reader UI (single row). Admin-managed; public read via API.

CREATE TABLE IF NOT EXISTS reader_defaults (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  animation_type text NOT NULL DEFAULT 'flip',
  animation_speed text NOT NULL DEFAULT 'normal',
  mobile_layout_mode text NOT NULL DEFAULT 'stacked',
  default_autoplay_mode text NOT NULL DEFAULT 'off',
  default_autoplay_speed smallint NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

INSERT INTO reader_defaults (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE reader_defaults IS
  'Singleton (id=1): global book reader defaults for all users until per-book settings exist.';
