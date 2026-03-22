/**
 * PDF Generation — Puppeteer + HTML/CSS
 *
 * Metin yarım sayfa deseni (#48 Yıldızlı Kıyı): `getTextPageBackgroundSvgInline()` — SVG doğrudan HTML’e
 * (CSS `background-image` + data URI, Chromium PDF’de sık görünmez).
 *
 * **pdfLayout: dashboard (varsayılan)**
 *   1. Ön kapak  — A5 portrait  (148.5mm × 210mm)
 *   2. Spread'ler — A4 landscape (297mm × 210mm)
 *   3. Arka kapak — A5 portrait  (148.5mm × 210mm)
 *
 * **pdfLayout: print** (yalnızca admin `generate-pdf` — spiral cilt / duplex kısa kenar)
 *   A4 yatay sayfalar: her yüzde iki A5 yarım; arka yüzde sol↔sağ ters sıra (short-edge imposizyon).
 *   Detay: `docs/guides/PDF_GENERATION_GUIDE.md` — Spiral Cilt bölümü, `public/dev/print-layout-guide.html`.
 */

import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'

// ============================================================================
// Types
// ============================================================================

export interface PageData {
  pageNumber: number
  text: string
  imageUrl?: string
  imageBuffer?: ArrayBuffer
}

export interface PDFOptions {
  title: string
  coverImageUrl?: string
  coverImageBuffer?: ArrayBuffer
  pages: PageData[]
  theme?: string
  illustrationStyle?: string
  /**
   * dashboard: A5 ön + A4 içerik + A5 arka (kullanıcı / kayıtlı PDF).
   * print: A4 duplex baskı + kesim için imposizyon (admin indir).
   */
  pdfLayout?: 'dashboard' | 'print'
}

interface SpreadData {
  left: {
    type: 'image' | 'text'
    data: PageData | null
  }
  right: {
    type: 'image' | 'text'
    data: PageData | null
  }
}

/** A4 yatay sayfanın bir yarısı — spiral/duplex imposizyonu */
type PrintCell =
  | { kind: 'blank' }
  | { kind: 'cover-front' }
  | { kind: 'cover-back' }
  | { kind: 'text'; page: PageData }
  | { kind: 'image'; page: PageData }

interface PrintSheet {
  front: { left: PrintCell; right: PrintCell }
  back: { left: PrintCell; right: PrintCell }
}

// ============================================================================
// Helper Functions
// ============================================================================

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Metni paragraflara böler: önce satır sonları, sonra tek blokta kalan metni cümle sonlarına göre.
 * Sayfa daha dolu ve örnekteki gibi okunaklı görünür.
 */
function formatText(text: string): string {
  if (!text) return ''

  const blocks = text.split(/\n+/).map((b) => b.trim()).filter(Boolean)

  const paragraphs: string[] = []
  for (const block of blocks) {
    const sentences = splitIntoSentences(block)
    paragraphs.push(...sentences)
  }

  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')
}

/** Türkçe cümle sonları: . ! ? (ve …) sonrası boşluk */
function splitIntoSentences(block: string): string[] {
  const t = block.trim()
  if (!t) return []

  const raw = t.split(/(?<=[.!?…])\s+/).filter((s) => s.trim())
  if (raw.length <= 1) return [t]

  return raw.map((s) => s.trim())
}

// ============================================================================
// Cover Pages
// ============================================================================

function buildFrontCoverInner(options: PDFOptions, logoDataUri: string): string {
  const coverImage = options.coverImageUrl
    ? `<img src="${escapeHtml(options.coverImageUrl)}" alt="" class="cover-image" />`
    : ''

  return `
      ${coverImage}
      <div class="cover-gradient"></div>
      <div class="cover-content">
        <h1 class="cover-title">${escapeHtml(options.title)}</h1>
        ${logoDataUri ? `<div class="cover-branding"><img src="${logoDataUri}" alt="" class="cover-logo-below" /></div>` : ''}
      </div>
  `
}

/**
 * Ön kapak — A5 portrait
 * Full-bleed görsel + gradient + başlık + altında küçük logo
 */
function generateFrontCoverHTML(options: PDFOptions, logoDataUri: string): string {
  return `
    <div class="page front-cover">
      ${buildFrontCoverInner(options, logoDataUri)}
    </div>
  `
}

function buildBackCoverInner(logoDataUri: string, qrDataUri: string): string {
  const logoMain = logoDataUri
    ? `<img src="${logoDataUri}" alt="" class="bc-logo-main" />`
    : ''

  const wordmark =
    '<span class="bc-wordmark">' +
    '<span class="bc-hero">Hero</span><span class="bc-kid">Kid</span><span class="bc-story">Story</span>' +
    '</span>'

  const qrBlock = qrDataUri
    ? `<div class="bc-qr-block"><img src="${qrDataUri}" alt="" class="bc-qr-img" /><span class="bc-qr-label">herokidstory.com</span></div>`
    : ''

  return `
      <span class="bc-corner bc-corner-tl"></span>
      <span class="bc-corner bc-corner-tr"></span>
      <span class="bc-corner bc-corner-bl"></span>
      <span class="bc-corner bc-corner-br"></span>
      <div class="bc-main">
        <div class="bc-brand-stack">
          ${logoMain}
          ${wordmark}
        </div>
        <div class="bc-divider"></div>
        <p class="bc-tagline">Çocuğunuzun kendi hikayesinin kahramanı olduğu, AI ile oluşturulmuş kişisel kitaplar.</p>
        ${qrBlock}
      </div>
      <footer class="bc-footer">
        <p class="bc-created-line">herokidstory.com ile oluşturuldu</p>
      </footer>
  `
}

/**
 * Arka kapak — A5 portrait
 * Üst: logo üzerinde değil, logo üstte + altında HeroKidStory; tagline; alt footer: "ile oluşturuldu" + logo + marka
 */
function generateBackCoverHTML(logoDataUri: string, qrDataUri: string): string {
  return `
    <div class="page back-cover">
      ${buildBackCoverInner(logoDataUri, qrDataUri)}
    </div>
  `
}

// ============================================================================
// Metin sayfası arka plan SVG (#48) — HTML’e gömülür (Puppeteer’da CSS `background-image: url(data:…)` / dosya yolu sık görünmez)
// ============================================================================

let cachedTextPageBgSvg: string | undefined

function getTextPageBackgroundSvgInline(): string {
  if (cachedTextPageBgSvg !== undefined) return cachedTextPageBgSvg
  const svgPath = path.join(process.cwd(), 'public', 'pdf-backgrounds', 'yildizli-kiyi-p48.svg')
  try {
    if (!fs.existsSync(svgPath)) {
      cachedTextPageBgSvg = ''
      return ''
    }
    let raw = fs.readFileSync(svgPath, 'utf-8')
    raw = raw.replace(/<\?xml[^?]*\?>/gi, '').trim()
    cachedTextPageBgSvg = raw
  } catch {
    cachedTextPageBgSvg = ''
  }
  return cachedTextPageBgSvg
}

function textPageBackgroundLayer(): string {
  const svg = getTextPageBackgroundSvgInline()
  if (!svg) return ''
  return `<div class="text-page-bg-layer" aria-hidden="true">${svg}</div>`
}

function buildTextPageHalf(page: PageData): string {
  return `
        <div class="half-page text-page">
          ${textPageBackgroundLayer()}
          <div class="text-content">
            <div class="page-text">${formatText(page.text)}</div>
            <span class="page-number">${page.pageNumber}</span>
          </div>
        </div>
      `
}

// ============================================================================
// Spread Pages
// ============================================================================

function generateSpreadHTML(spread: SpreadData): string {
  let leftHTML = '<div class="half-page"></div>'
  if (spread.left.data) {
    if (spread.left.type === 'image' && spread.left.data.imageUrl) {
      leftHTML = `
        <div class="half-page image-page">
          <img src="${escapeHtml(spread.left.data.imageUrl)}" alt="" class="page-image" />
        </div>
      `
    } else if (spread.left.type === 'text') {
      leftHTML = buildTextPageHalf(spread.left.data)
    }
  }

  let rightHTML = '<div class="half-page"></div>'
  if (spread.right.data) {
    if (spread.right.type === 'image' && spread.right.data.imageUrl) {
      rightHTML = `
        <div class="half-page image-page">
          <img src="${escapeHtml(spread.right.data.imageUrl)}" alt="" class="page-image" />
        </div>
      `
    } else if (spread.right.type === 'text') {
      rightHTML = buildTextPageHalf(spread.right.data)
    }
  }

  return `
    <div class="page spread-page">
      <div class="spread-container">
        ${leftHTML}
        ${rightHTML}
      </div>
    </div>
  `
}

// ============================================================================
// Spread Preparation
// ============================================================================

/**
 * Her hikaye sayfası → bir spread (görsel sol/sağ alternating + karşı metin)
 *
 * Spread 0: [Image | Text]   (çift spread index)
 * Spread 1: [Text  | Image]  (tek  spread index)
 * Spread 2: [Image | Text]
 */
function prepareSpreads(pages: PageData[]): SpreadData[] {
  const spreads: SpreadData[] = []

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    if (!page) continue

    const isEven = i % 2 === 0
    const imageSide = isEven ? 'left' : 'right'
    const textSide  = isEven ? 'right' : 'left'

    const spread: SpreadData = {
      left:  { type: 'text', data: null },
      right: { type: 'text', data: null },
    }

    spread[imageSide] = page.imageUrl
      ? { type: 'image', data: page }
      : { type: 'text',  data: page }

    spread[textSide] = { type: 'text', data: page }

    spreads.push(spread)
  }

  return spreads
}

/**
 * Spiral cilt + kısa kenar duplex: N+1 adet A5 yaprak → ceil((N+1)/2) adet A4.
 * Arka yüz PDF’de [back(sağ yaprak) | back(sol yaprak)]; tek yaprak kalan sayfada [back | boş].
 */
function buildPrintSheets(pages: PageData[]): PrintSheet[] {
  const N = pages.length
  const numLeaves = N + 1
  const numSheets = Math.ceil(numLeaves / 2)
  const sheets: PrintSheet[] = []

  for (let s = 0; s < numSheets; s++) {
    const leftLeaf = 2 * s
    const rightLeaf = 2 * s + 1
    const hasRight = rightLeaf < numLeaves

    const frontLeft = leafFront(leftLeaf, pages)
    const frontRight: PrintCell = hasRight ? leafFront(rightLeaf, pages) : { kind: 'blank' }

    let backLeft: PrintCell
    let backRight: PrintCell
    if (hasRight) {
      // Short-edge flip: sol ön → sağ arka; sağ ön → sol arka
      backLeft = leafBack(rightLeaf, pages)
      backRight = leafBack(leftLeaf, pages)
    } else {
      // Tek yaprak: ön [sol | boş] → çevirince [boş | sol arkaları]
      backLeft = { kind: 'blank' }
      backRight = leafBack(leftLeaf, pages)
    }

    sheets.push({
      front: { left: frontLeft, right: frontRight },
      back: { left: backLeft, right: backRight },
    })
  }

  return sheets
}

function leafFront(leafIndex: number, pages: PageData[]): PrintCell {
  const N = pages.length
  if (leafIndex === 0) return { kind: 'cover-front' }
  if (leafIndex > N) return { kind: 'blank' }
  return { kind: 'text', page: pages[leafIndex - 1]! }
}

function leafBack(leafIndex: number, pages: PageData[]): PrintCell {
  const N = pages.length
  if (leafIndex === 0) {
    if (N === 0) return { kind: 'cover-back' }
    return { kind: 'image', page: pages[0]! }
  }
  if (leafIndex < N) return { kind: 'image', page: pages[leafIndex]! }
  if (leafIndex === N) return { kind: 'cover-back' }
  return { kind: 'blank' }
}

function halfPageFromCell(
  cell: PrintCell,
  options: PDFOptions,
  logoDataUri: string,
  qrDataUri: string
): string {
  switch (cell.kind) {
    case 'blank':
      return '<div class="half-page half-page--blank"></div>'
    case 'cover-front':
      return `
        <div class="half-page cover-spread-half cover-spread-half--front">
          <div class="front-cover front-cover--embedded">
            ${buildFrontCoverInner(options, logoDataUri)}
          </div>
        </div>
      `
    case 'cover-back':
      return `
        <div class="half-page cover-spread-half cover-spread-half--back">
          <div class="back-cover back-cover--embedded">
            ${buildBackCoverInner(logoDataUri, qrDataUri)}
          </div>
        </div>
      `
    case 'text': {
      const p = cell.page
      return `
        <div class="half-page text-page">
          ${textPageBackgroundLayer()}
          <div class="text-content">
            <div class="page-text">${formatText(p.text)}</div>
            <span class="page-number">${p.pageNumber}</span>
          </div>
        </div>
      `
    }
    case 'image': {
      const p = cell.page
      if (p.imageUrl) {
        return `
          <div class="half-page image-page">
            <img src="${escapeHtml(p.imageUrl)}" alt="" class="page-image" />
          </div>
        `
      }
      return `
        <div class="half-page text-page">
          ${textPageBackgroundLayer()}
          <div class="text-content">
            <div class="page-text">${formatText(p.text)}</div>
            <span class="page-number">${p.pageNumber}</span>
          </div>
        </div>
      `
    }
    default:
      return '<div class="half-page half-page--blank"></div>'
  }
}

function printFaceNeedsCoversSpread(left: PrintCell, right: PrintCell): boolean {
  return (
    left.kind === 'cover-front' ||
    left.kind === 'cover-back' ||
    right.kind === 'cover-front' ||
    right.kind === 'cover-back'
  )
}

function generatePrintFaceHTML(
  left: PrintCell,
  right: PrintCell,
  options: PDFOptions,
  logoDataUri: string,
  qrDataUri: string
): string {
  const useCoversSpread = printFaceNeedsCoversSpread(left, right)
  const pageClass = useCoversSpread ? 'page spread-page covers-spread' : 'page spread-page'
  return `
    <div class="${pageClass}">
      <div class="spread-container">
        ${halfPageFromCell(left, options, logoDataUri, qrDataUri)}
        ${halfPageFromCell(right, options, logoDataUri, qrDataUri)}
      </div>
    </div>
  `
}

/** Ana site URL’si — QR kodda kullanılır */
async function buildQrDataUri(): Promise<string> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://herokidstory.com').replace(/\/$/, '')
  try {
    return await QRCode.toDataURL(base, {
      width: 200,
      margin: 1,
      color: { dark: '#2a2a2a', light: '#fef9f3' },
      errorCorrectionLevel: 'M',
    })
  } catch (e) {
    console.warn('[PDF] QR generation failed:', e)
    return ''
  }
}

// ============================================================================
// HTML Assembly
// ============================================================================

interface PdfAssets {
  css: string
  logoDataUri: string
  qrDataUri: string
}

/**
 * `book-styles.css` içindeki `/pdf-backgrounds/*.svg` url'lerini base64 data URI ile değiştirir
 * (Puppeteer setContent ile dosya sistemi yolu çözülmediği için).
 */
function embedPdfBackgroundSvgs(css: string): string {
  const bgDir = path.join(process.cwd(), 'public', 'pdf-backgrounds')
  if (!fs.existsSync(bgDir)) return css

  const files = fs.readdirSync(bgDir).filter((f) => f.endsWith('.svg'))
  for (const filename of files) {
    const svgPath = path.join(bgDir, filename)
    const svgContent = fs.readFileSync(svgPath, 'utf-8')
    const dataUri = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`
    const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    css = css.replace(new RegExp(`url\\(['"]?/pdf-backgrounds/${escaped}['"]?\\)`, 'g'), `url('${dataUri}')`)
  }
  return css
}

async function loadPdfStylesAndLogo(): Promise<PdfAssets> {
  const cssPath = path.join(process.cwd(), 'lib', 'pdf', 'templates', 'book-styles.css')
  let css = fs.readFileSync(cssPath, 'utf-8')
  css = embedPdfBackgroundSvgs(css)

  const logoPath = path.join(process.cwd(), 'public', 'brand', 'logo.png')
  const logoDataUri = fs.existsSync(logoPath)
    ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
    : ''

  const qrDataUri = await buildQrDataUri()

  return { css, logoDataUri, qrDataUri }
}

function wrapHtmlDocument(title: string, css: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&family=Alegreya:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
  ${bodyContent}
</body>
</html>`
}

/** dashboard: A5 kapak + spread + A5 arka kapak */
async function generateDashboardHTML(options: PDFOptions, spreads: SpreadData[]): Promise<string> {
  const { css, logoDataUri, qrDataUri } = await loadPdfStylesAndLogo()
  const spreadsHTML = spreads.map(generateSpreadHTML).join('\n')
  const bodyContent = `${generateFrontCoverHTML(options, logoDataUri)}\n${spreadsHTML}\n${generateBackCoverHTML(logoDataUri, qrDataUri)}`
  return wrapHtmlDocument(options.title, css, bodyContent)
}

/** print: yalnızca A4 landscape — duplex kısa kenar + kesim için imposizyon */
async function generatePrintLayoutHTML(options: PDFOptions): Promise<string> {
  const { css, logoDataUri, qrDataUri } = await loadPdfStylesAndLogo()
  const sheets = buildPrintSheets(options.pages || [])
  const parts: string[] = []
  for (const sheet of sheets) {
    parts.push(
      generatePrintFaceHTML(sheet.front.left, sheet.front.right, options, logoDataUri, qrDataUri)
    )
    parts.push(
      generatePrintFaceHTML(sheet.back.left, sheet.back.right, options, logoDataUri, qrDataUri)
    )
  }
  return wrapHtmlDocument(options.title, css, parts.join('\n'))
}

// ============================================================================
// Main Export
// ============================================================================

export async function generateBookPDF(options: PDFOptions): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // Büyük base64 içerik için timeout artırıldı
    page.setDefaultNavigationTimeout(120_000)

    const layout = options.pdfLayout ?? 'dashboard'
    const html =
      layout === 'print'
        ? await generatePrintLayoutHTML(options)
        : await generateDashboardHTML(options, prepareSpreads(options.pages || []))

    await page.setContent(html, { waitUntil: 'networkidle0' })

    // preferCSSPageSize: true → named @page kuralları (cover/spread) geçerli olur
    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}
