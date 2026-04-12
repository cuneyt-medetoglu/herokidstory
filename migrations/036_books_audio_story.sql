-- Faz 7-B: "Bir kere üret" mimarisi için sesli hikaye durum kolonları
-- audio_story_status : idle | generating | ready | failed
-- audio_story_version: her başarılı üretimde artar (1, 2, 3…) — edit → yeniden oluştur senaryosu için
-- audio_story_generated_at: son başarılı üretim zamanı

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS audio_story_status TEXT NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS audio_story_version INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS audio_story_generated_at TIMESTAMPTZ;

-- Mevcut kitapların: video_url varsa 'ready', yoksa 'idle'
UPDATE books
  SET audio_story_status = 'ready',
      audio_story_version = 1,
      audio_story_generated_at = updated_at
  WHERE video_url IS NOT NULL
    AND video_url <> '';
