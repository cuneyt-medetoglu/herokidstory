/**
 * Tek sayfa: kitap PDF’indeki spread ile aynı boyut (A4 yatay 297×210 mm)
 * ve aynı orta kesik çizgi (book-styles.css .spread-container::after).
 * Çıktı: public/dev/center-line-only-a4-landscape.pdf
 */
import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer'

const HTML_PATH = path.join(process.cwd(), 'public', 'dev', 'center-line-only-a4-landscape.html')
const OUT_PATH = path.join(process.cwd(), 'public', 'dev', 'center-line-only-a4-landscape.pdf')

async function main() {
  const html = fs.readFileSync(HTML_PATH, 'utf-8')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(120_000)
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    })

    fs.writeFileSync(OUT_PATH, Buffer.from(pdfBuffer))
    console.log('Yazıldı:', OUT_PATH)
  } finally {
    await browser.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
