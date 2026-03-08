/**
 * Copy example books from one language to another (Faz 3 — Örnek kitaplar çok dilli kopya).
 *
 * Kaynak dildeki örnek kitapları hedef dile çevirip yeni kitap kaydı oluşturur.
 * Görseller (cover_image_url, images_data, generation_metadata) aynen kopyalanır;
 * title ve story_data.pages[].text AI ile hedef dile çevrilir.
 *
 * Kullanım:
 *   npx tsx scripts/copy-examples-to-locale.ts <sourceLang> <targetLang>
 * Örnek:
 *   npx tsx scripts/copy-examples-to-locale.ts tr en
 *   npx tsx scripts/copy-examples-to-locale.ts en tr
 *
 * Gereksinimler: .env içinde DATABASE_URL ve OPENAI_API_KEY
 * @see docs/analysis/EXAMPLES_MULTILINGUAL_COPY_IMPLEMENTATION_PLAN.md
 */

import { config } from 'dotenv'

config()

const sourceLang = process.argv[2]
const targetLang = process.argv[3]

const ALLOWED_LOCALES = ['en', 'tr'] as const

function main() {
  if (!sourceLang || !targetLang) {
    console.error('Kullanım: npx tsx scripts/copy-examples-to-locale.ts <sourceLang> <targetLang>')
    console.error('Örnek: npx tsx scripts/copy-examples-to-locale.ts tr en')
    process.exit(1)
  }

  if (!ALLOWED_LOCALES.includes(sourceLang as any) || !ALLOWED_LOCALES.includes(targetLang as any)) {
    console.error(`Desteklenen diller: ${ALLOWED_LOCALES.join(', ')}`)
    process.exit(1)
  }

  if (sourceLang === targetLang) {
    console.error('Kaynak ve hedef dil farklı olmalı.')
    process.exit(1)
  }

  runCopy().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}

async function runCopy() {
  const { pool } = await import('../lib/db/pool')
  const { createBook, updateBook } = await import('../lib/db/books')
  const OpenAI = (await import('openai')).default

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  const openai = new OpenAI({ apiKey })

  console.log(`\n📚 Copy examples: ${sourceLang} → ${targetLang}\n`)

  const sourceBooksResult = await pool.query(
    `SELECT id, user_id, title, theme, illustration_style, language, age_group, story_data, total_pages,
            custom_requests, images_data, cover_image_url, generation_metadata
     FROM books
     WHERE is_example = true AND status = 'completed' AND language = $1
     ORDER BY created_at ASC`,
    [sourceLang]
  )

  const sourceBooks = sourceBooksResult.rows
  if (sourceBooks.length === 0) {
    console.log(`Kaynak dilde (${sourceLang}) örnek kitap yok. Çıkılıyor.`)
    return
  }

  console.log(`Bulunan kaynak kitap sayısı: ${sourceBooks.length}`)

  const existingCopyResult = await pool.query(
    `SELECT source_example_book_id FROM books
     WHERE is_example = true AND language = $1 AND source_example_book_id IS NOT NULL`,
    [targetLang]
  )
  const existingSourceIds = new Set(
    existingCopyResult.rows.map((r: { source_example_book_id: string }) => r.source_example_book_id)
  )

  let copied = 0
  let skipped = 0

  for (const book of sourceBooks) {
    if (existingSourceIds.has(book.id)) {
      console.log(`⏭️  Atlandı (zaten kopya var): ${book.title}`)
      skipped++
      continue
    }

    try {
      const pages = book.story_data?.pages
      const pageTexts = Array.isArray(pages)
        ? pages.map((p: { text?: string }) => p?.text ?? '')
        : []

      const { title: translatedTitle, pageTexts: translatedTexts } = await translateBook(
        openai,
        book.title,
        pageTexts,
        sourceLang,
        targetLang
      )

      const newStoryData = { ...book.story_data }
      if (Array.isArray(newStoryData.pages) && translatedTexts.length === newStoryData.pages.length) {
        newStoryData.title = translatedTitle
        newStoryData.pages = newStoryData.pages.map((p: Record<string, unknown>, i: number) => ({
          ...p,
          text: translatedTexts[i] ?? p.text,
        }))
      }

      const { data: newBook, error } = await createBook(book.user_id, {
        title: translatedTitle,
        theme: book.theme,
        illustration_style: book.illustration_style,
        language: targetLang,
        age_group: book.age_group || undefined,
        story_data: newStoryData,
        total_pages: book.total_pages,
        custom_requests: book.custom_requests || undefined,
        images_data: book.images_data || [],
        generation_metadata: book.generation_metadata || {},
        status: 'completed',
        is_example: true,
        source_example_book_id: book.id,
      })

      if (error || !newBook) {
        console.error(`❌ Oluşturulamadı: ${book.title}`, error)
        continue
      }

      if (book.cover_image_url) {
        await updateBook(newBook.id, { cover_image_url: book.cover_image_url })
      }

      console.log(`✅ Kopyalandı: "${book.title}" → "${translatedTitle}" (${newBook.id})`)
      copied++
      existingSourceIds.add(book.id)
    } catch (err) {
      console.error(`❌ Hata (${book.title}):`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`\n📊 Özet: ${copied} kopyalandı, ${skipped} atlandı.\n`)
}

async function translateBook(
  openai: InstanceType<typeof import('openai').default>,
  title: string,
  pageTexts: string[],
  sourceLang: string,
  targetLang: string
): Promise<{ title: string; pageTexts: string[] }> {
  const sourceLabel = sourceLang === 'en' ? 'English' : sourceLang === 'tr' ? 'Turkish' : sourceLang
  const targetLabel = targetLang === 'en' ? 'English' : targetLang === 'tr' ? 'Turkish' : targetLang

  const userContent = `Translate this children's book from ${sourceLabel} to ${targetLabel}. Keep the same tone and length.

Title: ${title}

Page texts (one per line, use exactly the same number of lines in your response):
${pageTexts.join('\n')}

Respond with a single JSON object only, no markdown:
{"title": "<translated title>", "pageTexts": ["<page 1 text>", "<page 2 text>", ...]}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a translator for children\'s books. Output only valid JSON with keys "title" and "pageTexts" (array of strings).',
      },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty translation response')
  }

  const parsed = JSON.parse(content) as { title?: string; pageTexts?: string[] }
  const translatedTitle = typeof parsed.title === 'string' ? parsed.title : title
  const translatedTexts = Array.isArray(parsed.pageTexts)
    ? parsed.pageTexts
    : pageTexts

  return { title: translatedTitle, pageTexts: translatedTexts }
}

main()
