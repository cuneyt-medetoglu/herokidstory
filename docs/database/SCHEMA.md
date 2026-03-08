# 📊 KidStoryBook Database Schema

**Last Updated:** 29 Ocak 2026  
**Database:** PostgreSQL (AWS)  
**Version:** 1.0.0

**Migration Durumu:**
- ✅ Migration 001: Characters table enhance - **Uygulandı (10 Ocak 2026)**
- ✅ Migration 002: Books table trigger - **Uygulandı (10 Ocak 2026)**
- ✅ Migration 003: Books table enhance - **Uygulandı (10 Ocak 2026)**
- ⏳ Migration 004: Storage buckets policies - **Sırada**
- ✅ Migration 015: public.users role column (admin/user) - **Debug/Feature Flags (29 Ocak 2026)**

---

## 📋 Tables Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   users     │         │ characters  │         │   books     │
│ (PostgreSQL)│◄───────│             │◄────────│             │
└─────────────┘         └─────────────┘         └─────────────┘
```

**public.users (metadata):** id (PK, FK auth.users), email, name, avatar_url, free_cover_used, **role** ('user' | 'admin'), created_at, updated_at. Sync via trigger on auth.users insert. See Migration 005, 013, 015.

---

## 🎭 Characters Table

**Purpose:** Master character descriptions for multi-book consistency

### Schema

```sql
CREATE TABLE characters (
  -- Primary Key
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  name                  VARCHAR(100) NOT NULL,
  age                   INTEGER NOT NULL CHECK (age >= 1 AND age <= 12),
  gender                VARCHAR(20) NOT NULL CHECK (gender IN ('boy', 'girl', 'other')),
  
  -- Reference Photo
  reference_photo_url   TEXT,
  reference_photo_path  TEXT,
  
  -- Master Description (JSONB)
  description           JSONB NOT NULL,
  analysis_raw          JSONB,
  analysis_confidence   DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Usage Tracking
  is_default            BOOLEAN DEFAULT FALSE,
  used_in_books         TEXT[] DEFAULT '{}',
  total_books           INTEGER DEFAULT 0,
  last_used_at          TIMESTAMP,
  
  -- Version Control
  version               INTEGER DEFAULT 1,
  previous_versions     JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
-- Quick user lookup
CREATE INDEX idx_characters_user_id ON characters(user_id);

-- Find default character
CREATE INDEX idx_characters_default ON characters(user_id, is_default) 
WHERE is_default = TRUE;

-- Recent characters
CREATE INDEX idx_characters_created_at ON characters(created_at DESC);

-- Most used
CREATE INDEX idx_characters_total_books ON characters(total_books DESC);

-- Name search
CREATE INDEX idx_characters_name ON characters(name);
```

### Description JSONB Structure

```typescript
{
  "version": "1.0.0",
  "characterId": "char_xxx",
  "name": "Arya",
  "age": 5,
  "gender": "girl",
  "physicalFeatures": {
    "faceShape": "round",
    "skinTone": "light tan",
    "eyeColor": "dark brown",
    "eyeShape": "almond-shaped",
    "eyebrowStyle": "naturally arched",
    "nose": "small button nose",
    "mouth": "small with full lips",
    "cheeks": "rosy with dimples"
  },
  "hair": {
    "color": "dark brown",
    "style": "straight",
    "length": "shoulder-length",
    "texture": "thick and silky",
    "hasBangs": true,
    "bangsStyle": "side-swept"
  },
  "body": {
    "heightForAge": "average",
    "build": "slim",
    "posture": "confident"
  },
  "uniqueFeatures": [
    "dimples when smiling",
    "freckles on nose"
  ],
  "expression": {
    "typical": "cheerful and curious",
    "personality": "adventurous, kind"
  },
  "clothingStyle": {
    "style": "casual",
    "colors": ["purple", "pink"],
    "commonItems": ["t-shirts", "sneakers"]
  },
  "illustrationNotes": "Always draw with same round face...",
  "confidence": 0.92
}
```

### Row Level Security (RLS)

```sql
-- Users can only access their own characters
CREATE POLICY "Users can view their own characters"
  ON characters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own characters"
  ON characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characters"
  ON characters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own characters"
  ON characters FOR DELETE
  USING (auth.uid() = user_id);
```

### Triggers

**1. Auto-update timestamp:**
```sql
CREATE TRIGGER trigger_update_characters_timestamp
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_characters_updated_at();
```

**2. Ensure single default:**
```sql
CREATE TRIGGER trigger_ensure_single_default
  BEFORE INSERT OR UPDATE ON characters
  FOR EACH ROW WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_character();
```

**3. Update book count:**
```sql
CREATE TRIGGER trigger_update_total_books
  BEFORE INSERT OR UPDATE OF used_in_books ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_total_books_count();
```

### Helper Functions

**Get default character:**
```sql
SELECT * FROM get_default_character('user-id-here');
```

**Get character stats:**
```sql
SELECT * FROM get_character_stats('character-id-here');
-- Returns: total_books, last_used_at, books_this_month
```

---

## 📚 Books Table (Updated)

**Purpose:** Store user's generated books

### New Column

```sql
ALTER TABLE books 
ADD COLUMN character_id UUID REFERENCES characters(id) ON DELETE SET NULL;
```

### New Indexes

```sql
CREATE INDEX idx_books_character_id ON books(character_id);
CREATE INDEX idx_books_user_character ON books(user_id, character_id);
```

### source_example_book_id (Faz 1 — Örnek kitaplar çok dilli kopya)

Kopya örnek kitapların kaynak kitabını işaretler. Migration: `migrations/022_books_source_example_book_id.sql`.

```sql
ALTER TABLE books
ADD COLUMN source_example_book_id UUID REFERENCES books(id) ON DELETE SET NULL;

CREATE INDEX idx_books_source_example_book_id ON books(source_example_book_id)
WHERE source_example_book_id IS NOT NULL;
```

### Trigger

**Auto-update character's used_in_books array:**
```sql
CREATE TRIGGER trigger_update_character_books
  AFTER INSERT OR UPDATE OR DELETE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_character_books_array();
```

This trigger automatically:
- Adds book ID to character's `used_in_books` array on book creation
- Removes book ID when book is deleted
- Updates character's `last_used_at` timestamp

### Helper Function

**Get books by character:**
```sql
SELECT * FROM get_books_by_character('character-id-here');
-- Returns: id, title, cover_image_url, created_at, status
```

---

## 🔄 Data Flow

### Creating a Character

```
1. User uploads photo + form (name, age, gender, hairColor, eyeColor)
2. Description built from form only (no OpenAI Vision since 2026-03-01)
3. INSERT INTO characters (description JSONB, reference_photo_url, …)
4. Set as default if first character
```

### Creating a Book

```
1. User selects character (or creates new)
2. Story generation with character context
3. Image generation with master character description
4. INSERT INTO books (character_id)
5. Trigger updates character.used_in_books
6. Trigger updates character.total_books
```

### Multi-Book Consistency

```
Book 1: Uses Master Character → Consistent within book
Book 2: Uses SAME Master Character → Consistent with Book 1
Book 3: Uses SAME Master Character → Consistent with Books 1 & 2
```

---

## 📈 Performance Considerations

### Efficient Queries

**Get user's characters with stats:**
```sql
SELECT 
  c.*,
  COUNT(b.id) as actual_book_count
FROM characters c
LEFT JOIN books b ON b.character_id = c.id
WHERE c.user_id = 'user-id'
GROUP BY c.id
ORDER BY c.is_default DESC, c.total_books DESC;
```

**Get character with recent books:**
```sql
SELECT 
  c.*,
  ARRAY_AGG(b.title ORDER BY b.created_at DESC) as recent_books
FROM characters c
LEFT JOIN books b ON b.character_id = c.id
WHERE c.id = 'character-id'
GROUP BY c.id;
```

### JSONB Indexing (Future)

If we need to query specific character features:

```sql
CREATE INDEX idx_characters_age ON characters ((description->>'age')::INTEGER);
CREATE INDEX idx_characters_gender ON characters ((description->>'gender'));
```

---

## 🔐 Security

### RLS Policies
- ✅ Users can only access their own characters
- ✅ Users can only access their own books
- ✅ No cross-user data leakage

### Data Validation
- ✅ Age check (1-12 years)
- ✅ Gender enum validation
- ✅ Confidence score range (0-1)
- ✅ Single default character per user

### Soft Delete (Future)
Instead of hard delete, mark as deleted:
```sql
ALTER TABLE characters ADD COLUMN deleted_at TIMESTAMP;
```

---

## 📊 Analytics Queries

### Most popular ages:
```sql
SELECT age, COUNT(*) 
FROM characters 
GROUP BY age 
ORDER BY COUNT(*) DESC;
```

### Average character reuse:
```sql
SELECT AVG(total_books) as avg_reuse
FROM characters
WHERE total_books > 0;
```

### Character creation over time:
```sql
SELECT DATE_TRUNC('day', created_at) as day, COUNT(*)
FROM characters
GROUP BY day
ORDER BY day DESC;
```

---

## 🚀 Migration Guide

### Run Migrations

```bash
# Apply migrations in order
psql -h db.xxx.supabase.co -U postgres -d postgres < supabase/migrations/001_create_characters_table.sql
psql -h db.xxx.supabase.co -U postgres -d postgres < supabase/migrations/002_update_books_table.sql
```

### Rollback (if needed)

```sql
-- Drop characters table and all dependencies
DROP TABLE IF EXISTS characters CASCADE;

-- Remove character_id from books
ALTER TABLE books DROP COLUMN IF EXISTS character_id;
```

---

## 📦 Storage Buckets

### Mevcut Buckets (10 Ocak 2026)

**Initial Setup (Mevcut):**
- `photos` - Private, 10MB
- `books` - Public, 50MB
- `pdfs` - Public, 50MB
- `covers` - Public, 10MB

**Migration 004 ile Eklenecek:**
- ✅ `book-images` - Public, 10MB (zaten var, sadece policies eklenecek)
- ✅ `reference-photos` - Private, 50MB (zaten var, sadece policies eklenecek)

### Storage Policies (Migration 004)

**book-images (Public):**
- ✅ Anyone can view (SELECT)
- ✅ Users can only upload to their own folders (INSERT)
- ✅ Users can only update their own images (UPDATE)
- ✅ Users can only delete their own images (DELETE)

**reference-photos (Private):**
- ✅ Users can only view their own photos (SELECT)
- ✅ Users can only upload their own photos (INSERT)
- ✅ Users can only update their own photos (UPDATE)
- ✅ Users can only delete their own photos (DELETE)

### Helper Functions

**cleanup_orphaned_book_images():**
- Removes orphaned images from storage (images without corresponding books)
- Returns deleted count
- SECURITY DEFINER function

---

## 📝 Notes

- **JSONB vs JSON:** Using JSONB for better indexing and querying
- **Array vs Join Table:** Using TEXT[] for `used_in_books` for simplicity
- **Version Control:** Built-in versioning for character updates
- **Soft Delete:** Future consideration for data retention
- **Storage Buckets:** Some buckets already exist from initial setup, Migration 004 only adds policies

---

**Owner:** @database-manager  
**Related Docs:** 
- `docs/strategies/CHARACTER_CONSISTENCY_STRATEGY.md`
- `docs/guides/SUPABASE_MIGRATION_GUIDE.md`
- `docs/guides/MIGRATION_ORDER_GUIDE.md`
- `lib/db/characters.ts`
- `lib/prompts/image/v1.0.0/character.ts`

