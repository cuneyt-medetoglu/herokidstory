-- Add video columns to books table for pre-generated MP4 videos
ALTER TABLE books ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS video_path TEXT;
