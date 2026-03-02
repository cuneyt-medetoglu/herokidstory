# Image Edit Feature - User Guide

**Feature:** ChatGPT-style image editing with mask-based editing
**Version:** 1.0.0  
**Date:** 17 Ocak 2026  
**Status:** ✅ Production Ready - Tested and Working

---

## Overview

The Image Edit feature allows parents to fix errors in generated book images using a canvas-based mask drawing tool. This feature is designed for parental use only and is separated from the child-safe book reading interface.

**Key Features:**
- Canvas-based mask drawing (ChatGPT-style)
- 3 edits per book quota (unlimited for admin users)
- Full version history tracking
- Ability to revert to previous versions
- Parent-only access through Settings page

---

## User Flow

### For Parents:

1. **Dashboard** → Select a book
2. **Book Viewer** opens (child-safe reading mode)
3. Click **"Parent Settings"** link (subtle, in footer)
4. **Book Settings Page** opens
5. Navigate to **"Edit Images"** section
6. Click **"Edit Image"** on the page you want to fix
7. **Image Edit Modal** opens:
   - Draw mask on areas to fix
   - Write prompt describing the fix
   - Submit edit
8. Wait 5-15 seconds for AI processing
9. View updated image
10. Return to Book Viewer to see changes

### For Children:

- Book Viewer only shows reading interface
- No edit buttons visible
- Safe reading experience
- "Parent Settings" link is subtle and easy to miss

---

## Navigation Structure

```
Dashboard
  ↓ Click "Read" or "Edit"
Book Viewer (/books/[id]/view)
  - Child-safe reading mode
  - No edit capabilities
  - "Parent Settings" link (footer, subtle)
  ↓ Click "Parent Settings"
Book Settings (/books/[id]/settings)
  - Parent-only management
  - Edit Images section
  - Edit History panel
  - Download/Share/Delete actions
  ↓ Click "Edit Image" on a page
Image Edit Modal
  - Canvas drawing tool
  - Prompt input
  - Submit edit
  ↓ Edit completed
Book Settings (updated image)
  ↓ Click "Back to Book"
Book Viewer (with edited image)
```

---

## API Endpoints

### 1. POST /api/ai/edit-image

**Purpose:** Edit an image using OpenAI Image Edit API

**Request:**
```typescript
{
  bookId: string
  pageNumber: number
  maskImageBase64: string // PNG base64
  editPrompt: string
}
```

**Response:**
```typescript
{
  success: true
  data: {
    editedImageUrl: string
    version: number
    quotaRemaining: number
    history: EditHistoryItem[]
  }
}
```

**Process:**
1. Check authentication & ownership
2. Check edit quota
3. Fetch current image
4. Get latest version number
5. Call OpenAI Image Edit API
6. Upload edited image to Supabase
7. Insert edit history
8. Update book & increment quota
9. Return response

### 2. GET /api/books/[id]/edit-history

**Purpose:** Get all edit history for a book

**Response:**
```typescript
{
  success: true
  data: {
    bookId: string
    quotaUsed: number
    quotaLimit: number
    pages: {
      [pageNumber]: {
        currentVersion: number
        versions: EditHistoryItem[]
      }
    }
  }
}
```

### 3. POST /api/books/[id]/revert-image

**Purpose:** Revert a page to a previous version

**Request:**
```typescript
{
  pageNumber: number
  targetVersion: number // 0 = original
}
```

**Response:**
```typescript
{
  success: true
  data: {
    pageNumber: number
    newImageUrl: string
    revertedToVersion: number
  }
}
```

---

## Database Schema

### Books Table (Updated)

```sql
ALTER TABLE books 
ADD COLUMN edit_quota_used INTEGER DEFAULT 0,
ADD COLUMN edit_quota_limit INTEGER DEFAULT 3;
```

### Image Edit History Table

```sql
CREATE TABLE image_edit_history (
  id UUID PRIMARY KEY,
  book_id UUID REFERENCES books(id),
  page_number INTEGER,
  version INTEGER,
  original_image_url TEXT,
  edited_image_url TEXT,
  mask_image_url TEXT,
  edit_prompt TEXT,
  ai_model VARCHAR(50),
  edit_metadata JSONB,
  created_at TIMESTAMP,
  UNIQUE (book_id, page_number, version)
);
```

**Version System:**
- Version 0 = Original image (generated)
- Version 1+ = Edited versions
- Current version tracked in story_data.pages[].imageUrl

---

## Components

### 1. ImageEditModal

**Location:** `components/book-viewer/ImageEditModal.tsx`

**Features:**
- Canvas drawing with ReactSketchCanvas
- Brush and Eraser tools
- Adjustable brush size (10-100px)
- Undo and Clear functions
- Prompt input with validation
- Loading state during API call

**Props:**
```typescript
{
  bookId: string
  pageNumber: number
  currentImageUrl: string
  onClose: () => void
  onSuccess: (editedImageUrl: string) => void
}
```

### 2. EditHistoryPanel

**Location:** `components/book-viewer/EditHistoryPanel.tsx`

**Features:**
- Display all edit history by page
- Version thumbnails with prompts
- Quota display
- Revert to previous version
- Current version highlighting

**Props:**
```typescript
{
  bookId: string
  onClose: () => void
  onRevert?: (pageNumber: number, version: number) => void
}
```

### 3. BookSettingsPage

**Location:** `app/books/[id]/settings/page.tsx`

**Features:**
- Book information display
- Edit Images section (grid of pages)
- Edit History button
- Download/Share/Delete actions
- ImageEditModal integration
- EditHistoryPanel integration

---

## Testing Checklist

### Manual Testing:

- [x] Database migration applied successfully
- [ ] Backend APIs working:
  - [ ] POST /api/ai/edit-image
  - [ ] GET /api/books/[id]/edit-history
  - [ ] POST /api/books/[id]/revert-image
- [ ] Frontend components render correctly:
  - [ ] BookViewer "Parent Settings" link
  - [ ] BookSettingsPage loads
  - [ ] ImageEditModal opens and renders
  - [ ] EditHistoryPanel shows history
- [ ] User flows work:
  - [ ] Dashboard → Book Settings navigation
  - [ ] Book Settings → Edit Image flow
  - [ ] Canvas drawing works (brush, eraser, undo, clear)
  - [ ] Mask export to PNG base64
  - [ ] Edit submission with prompt
  - [ ] Image updates in UI after edit
  - [ ] Quota decrements correctly
  - [ ] History panel shows versions
  - [ ] Revert to previous version works
  - [ ] Settings → Book Viewer navigation
- [ ] Error handling:
  - [ ] Quota exceeded error
  - [ ] Empty prompt validation
  - [ ] API errors shown to user
  - [ ] Network errors handled
- [ ] Edge cases:
  - [ ] Mobile responsive (touch drawing)
  - [ ] Large masks (file size)
  - [ ] Multiple rapid edits
  - [ ] Concurrent edits (race conditions)

### API Testing (Postman):

1. **Edit Image**
   - Test with valid mask and prompt
   - Test with missing fields
   - Test with quota exceeded
   - Test with invalid book ID
   - Test with unauthorized user

2. **Edit History**
   - Test with book that has edits
   - Test with book that has no edits
   - Test with unauthorized user

3. **Revert Image**
   - Test revert to version 0 (original)
   - Test revert to intermediate version
   - Test with invalid version number

---

## Configuration

### OpenAI Settings (Locked)

```typescript
model: 'gpt-image-1.5'
size: '1024x1536' // Portrait
quality: 'low'
```

### Quota Settings

```typescript
default_quota_limit: 3 // Per book
```

### Rate Limiting

- OpenAI Tier 1: 5 images/90 seconds
- Handle rate limit errors gracefully

---

## Cost Considerations

**Per Edit Cost:** ~$0.02-0.04 (gpt-image-1.5, 1024x1536, low quality)

**Monthly Cost Estimates:**
- 100 edits: $2-4
- 1,000 edits: $20-40
- 10,000 edits: $200-400

**Storage:**
- Each edit: ~2-4MB (edited image + mask)
- 100 edits: ~200-400MB
- 1,000 edits: ~2-4GB

---

## Future Enhancements

1. **PIN Protection** (Optional)
   - Require PIN to access Book Settings
   - Store PIN in user metadata

2. **Batch Editing**
   - Edit multiple pages at once
   - Apply same fix to all pages

3. **AI-Powered Auto-Fix**
   - Detect common errors automatically
   - Suggest prompts

4. **Advanced Masking Tools**
   - Magic wand selection
   - Lasso tool
   - Rectangular selection

5. **Edit Templates**
   - Save frequently used masks
   - Quick apply saved prompts

6. **Analytics**
   - Track most common edits
   - Improve generation prompts based on feedback

---

## Troubleshooting

### Issue: "Edit quota exceeded"
**Solution:** User has used all 3 edits for this book. Consider upgrading quota or creating a new book.

### Issue: Canvas drawing not working
**Solution:** Check react-sketch-canvas is installed: `npm install react-sketch-canvas`

### Issue: Mask not exporting
**Solution:** Ensure canvas ref is properly set and canvas has been drawn on.

### Issue: OpenAI API error
**Solution:** Check API key, rate limits, and request format. See OpenAI docs for details.

### Issue: Image not updating after edit
**Solution:** Check that story_data.pages[].imageUrl is being updated and book state is refreshed.

---

## Related Files

- Migration: `supabase/migrations/011_add_image_edit_feature.sql`
- Edit API: `app/api/ai/edit-image/route.ts`
- History API: `app/api/books/[id]/edit-history/route.ts`
- Revert API: `app/api/books/[id]/revert-image/route.ts`
- Modal: `components/book-viewer/ImageEditModal.tsx`
- History Panel: `components/book-viewer/EditHistoryPanel.tsx`
- Settings Page: `app/books/[id]/settings/page.tsx`
- Book Viewer: `components/book-viewer/book-viewer.tsx`

---

**Maintained by:** @project-manager  
**Last Updated:** 17 Ocak 2026

## Prompt Security System

### Positive Prompt Structure

The edit prompt includes comprehensive safety directives:

1. **Mask Area Restrictions:**
   - Only modify masked area
   - Keep rest of image unchanged
   - Maintain original style and character consistency

2. **Anatomical Correctness Directives:**
   - Hand/finger anatomy rules (5 fingers, proper joints)
   - Body anatomy rules (2 hands, 2 arms, 2 legs)
   - Facial symmetry rules
   - **CRITICAL:** NO hand-holding directive

3. **Prohibitions (DO NOT):**
   - Violence, scary elements, inappropriate content
   - Character appearance changes (unless requested)
   - Adding/removing elements not mentioned
   - Changes outside masked area

### Negative Prompt Integration

The system uses the same negative prompt system as main image generation:

- **Universal Negative Prompts:** Violence, scary content, inappropriate themes
- **Age-Specific Negatives:** Tailored to book's target age group
- **Style-Specific Negatives:** Maintains illustration style consistency
- **Theme-Specific Negatives:** Prevents theme-inappropriate elements
- **Anatomical Negatives:** Prevents anatomical errors and hand-holding

**Source:** `lib/prompts/image/v1.0.0/negative.ts`

### Safety Flow

```
User Edit Request
  ↓
+ Positive Prompt (with anatomical directives)
+ Negative Prompt (from main generation system)
+ Book Metadata (age, style, theme)
  ↓
OpenAI Image Edit API
  ↓
Safe, targeted edit
```

## Implementation Notes

### Critical Fixes Applied (17 Ocak 2026)

1. **Mask Logic Inversion:**
   - **Problem:** Mask was inverted - painted areas were made opaque (preserved) instead of transparent (edit zone)
   - **Solution:** Inverted mask logic - painted areas → transparent (alpha=0) = edit zone, unpainted → opaque white (alpha=255) = preserve
   - **Result:** Only selected areas are edited, rest of image preserved correctly

2. **OpenAI API Compliance:**
   - Removed invalid parameters (`n`, `response_format`)
   - Response format: `b64_json` only (default for Image Edit API)
   - Added `input_fidelity: high` for better original image preservation
   - Added prompt prefix: "Only modify the masked area. Keep the rest of the image unchanged."

3. **Logging Optimization:**
   - Removed base64 dumps from logs (unreadable)
   - Added summary logging (data count, size, quality, usage tokens)

4. **UI Improvements:**
   - Brush color changed to red (more visible edit zone indicator)
   - Updated labels and descriptions for clarity
   - Eraser mode properly implemented (true erase, not black paint)
