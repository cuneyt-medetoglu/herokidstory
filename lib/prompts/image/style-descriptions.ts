/**
 * Illustration Style Descriptions
 *
 * Provides detailed style descriptions for image generation prompts
 * Based on POC styleDescriptions structure
 * v1.19.0 [Sıra 16]: 3d_animation/3d: vibrant saturated → rich appealing (controlled saturation) for consistency with getCinematicPack/GLOBAL_ART_DIRECTION.
 * v1.20.0 [D3]: comic_book / geometric / sticker_art / block_world / collage — grafik düz profil: getGlobalArtDirection + getCinematicPack sinematik dil ile çakışmasın; usesCinematicImageLayers + getStyleQualityPhrase.
 */

const STYLE_DESCRIPTIONS: Record<string, string> = {
  // 3D Animation (Pixar Style) - Pixar-style 3D animation like Toy Story, Finding Nemo, Inside Out
  '3d_animation': '3D Animation (Pixar Style) - Pixar-style 3D animation (like Toy Story, Finding Nemo, Inside Out), cartoonish and stylized (NOT photorealistic), rich appealing colors (controlled saturation), rounded shapes, exaggerated features, soft shadows, realistic textures, children\'s animated movie aesthetic, Pixar animation quality',
  '3d': '3D Animation (Pixar Style) - Pixar-style 3D animation (like Toy Story, Finding Nemo, Inside Out), cartoonish and stylized (NOT photorealistic), rich appealing colors (controlled saturation), rounded shapes, exaggerated features, soft shadows, realistic textures, children\'s animated movie aesthetic, Pixar animation quality',
  
  // Geometric - Flat design, minimalist, angular shapes, vector art style
  'geometric': 'Geometric - Flat design style, minimalist geometric shapes (circles, squares, triangles, polygons), angular sharp edges, flat colors with NO gradients, NO shadows, NO depth, vector art aesthetic, clean lines, modern stylized, grid-based alignment, geometric abstraction, low-poly style elements, illustration',
  
  // Watercolor - Transparent watercolor technique with warm inviting atmosphere
  'watercolor': 'Watercolor - Transparent watercolor technique, visible soft brushstrokes, colors blend and bleed at edges, paper texture visible through paint, luminous glowing finish, wet-on-wet color mixing, soft flowing edges, warm inviting atmosphere, hand-painted illustration feel',
  
  // Block World - Pixelated/blocky aesthetic, Minecraft-like
  'block_world': 'Block World - Pixelated/blocky aesthetic, visible blocks/cubes, Minecraft-like construction, characters and environment built from geometric blocks, sharp edges, limited color palette, isometric or orthographic perspective, illustration style',
  'block-world': 'Block World - Pixelated/blocky aesthetic, visible blocks/cubes, Minecraft-like construction, characters and environment built from geometric blocks, sharp edges, limited color palette, isometric or orthographic perspective, illustration style',
  
  // Collage - Cut-out pieces with visible edges and layers
  'collage': 'Collage - Cut-out pieces with visible rough edges, distinct layers with varied textures, torn edges showing paper texture, mixed media feel, visible shadows between layers, vibrant colors, handcrafted appearance, illustration',
  
  // Clay Animation - Clay-like appearance with hand-molded look
  'clay_animation': 'Clay Animation - Clay-like appearance, visible fingerprints and tool marks, soft organic texture, matte finish, slightly lumpy surfaces, hand-molded look, soft rounded shadows, claymation handcrafted look, illustration',
  'clay-animation': 'Clay Animation - Clay-like appearance, visible fingerprints and tool marks, soft organic texture, matte finish, slightly lumpy surfaces, hand-molded look, soft rounded shadows, claymation handcrafted look, illustration',
  
  // Kawaii - Exaggerated cuteness with oversized head and sparkling eyes
  'kawaii': 'Kawaii - Oversized head (1:2 or 1:3 head-to-body ratio), large sparkling eyes with star highlights, tiny dot-like nose, small mouth, soft rounded cheeks, pastel color palette (baby pink, sky blue, mint green, lavender), blush marks on cheeks, decorative hearts/stars/sparkles, exaggerated cuteness, illustration',
  
  // Comic Book - Bold outlines, flat colors, dramatic shadows
  'comic_book': 'Comic Book - Bold thick black outlines around all elements, flat color fills with no gradients, dramatic angular shadows with sharp edges, high contrast between light and dark, halftone dot texture for shadows, simplified graphic style, dynamic poses, comic book style illustration',
  'comic-book': 'Comic Book - Bold thick black outlines around all elements, flat color fills with no gradients, dramatic angular shadows with sharp edges, high contrast between light and dark, halftone dot texture for shadows, simplified graphic style, dynamic poses, comic book style illustration',
  
  // Sticker Art - Clean lines, glossy graphic look
  'sticker_art': 'Sticker Art - Clean bold uniform lines, bright highly saturated colors, glossy graphic look with specular highlights, white border effect (like real sticker), simple cell shading, flat fills with minimal gradients, polished graphic appearance, sticker-like illustration',
  'sticker-art': 'Sticker Art - Clean bold uniform lines, bright highly saturated colors, glossy graphic look with specular highlights, white border effect (like real sticker), simple cell shading, flat fills with minimal gradients, polished graphic appearance, sticker-like illustration',
}

/**
 * Get style description for a given style key
 */
export function getStyleDescription(styleKey: string): string {
  // Normalize style key (handle variations like '3d_animation', '3d', etc.)
  const normalizedKey = styleKey.toLowerCase().replace(/[-\s]/g, '_')
  
  // Try exact match first
  if (STYLE_DESCRIPTIONS[normalizedKey]) {
    return STYLE_DESCRIPTIONS[normalizedKey]
  }
  
  // Try with underscore variations
  const underscoreKey = styleKey.replace(/[-\s]/g, '_').toLowerCase()
  if (STYLE_DESCRIPTIONS[underscoreKey]) {
    return STYLE_DESCRIPTIONS[underscoreKey]
  }
  
  // Fallback to original style key
  return styleKey
}

/** D3: Flat/graphic styles — sinematik volumetric/filmic katmanları istemez; stil DNA’sı ile uyumlu grafik yönergeleri kullanılır. */
const GRAPHIC_FLAT_STYLE_KEYS = new Set([
  'comic_book',
  'geometric',
  'sticker_art',
  'block_world',
  'collage',
])

function normalizeIllustrationStyleKey(styleKey: string): string {
  return styleKey.toLowerCase().replace(/[-\s]/g, '_')
}

/** @returns false for comic_book, geometric, sticker_art, block_world, collage — görsel promptta filmic pack yerine grafik tutarlılık paketi. */
export function usesCinematicImageLayers(illustrationStyle: string): boolean {
  return !GRAPHIC_FLAT_STYLE_KEYS.has(normalizeIllustrationStyleKey(illustrationStyle))
}

/** buildStyleDirectives ilk satırı — grafik stillerde "cinematic quality" yerine uyumlu ifade. */
export function getStyleQualityPhrase(illustrationStyle: string): string {
  return usesCinematicImageLayers(illustrationStyle)
    ? 'cinematic quality'
    : 'bold graphic illustration quality, print-ready'
}

/**
 * GLOBAL_ART_DIRECTION – kitap geneli tek blok (A7, PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md).
 * Playground'da işe yaran "kısa tekrar + uzun sahne" yapısı; "stylized, NOT live-action photo" ile canlı çekim freni.
 */
const GLOBAL_ART_DIRECTION_CORE = [
  'Deep focus with crisp environment detail, layered depth (foreground/midground/background).',
  'Soft cinematic lighting, gentle bloom, subtle filmic vignette, rich but controlled color grading.',
  'No text, no watermark, no UI.',
  'Avoid: close-up portrait, headshot, centered composition, chibi big-head proportions, flat lighting, neon oversaturation.',
  'Preserve identity/outfit from the provided reference images; do not redesign the character.',
].join(' ')

/** D3: Grafik/düz stiller — film still / volumetric dil yok; "flat lighting" kaçınımı kaldırıldı (çizgi roman için çelişkiydi). */
const GLOBAL_ART_DIRECTION_GRAPHIC_CORE = [
  'Clear graphic readability; silhouettes and shapes read clearly at book size.',
  'Foreground and background use planes and stylized detail consistent with the chosen style (not photorealistic haze or cinematic fog unless the scene text asks for atmosphere).',
  'No text, no watermark, no UI.',
  'Avoid: photorealistic skin, documentary photography look, muddy gradients when the style calls for flat fills and clean edges.',
  'Preserve identity/outfit from the provided reference images; do not redesign the character.',
].join(' ')

function styleLabelForArtDirection(illustrationStyle: string): string {
  const desc = getStyleDescription(illustrationStyle)
  const short = desc.split(' - ')[0]?.trim()
  return short && short.length > 0 ? short : illustrationStyle
}

export function getGlobalArtDirection(illustrationStyle: string): string {
  const normalized = normalizeIllustrationStyleKey(illustrationStyle)
  const is3D = normalized === '3d_animation' || normalized === '3d'

  if (GRAPHIC_FLAT_STYLE_KEYS.has(normalized)) {
    const label = styleLabelForArtDirection(illustrationStyle)
    const styleLead = `Graphic storybook illustration in ${label} — stylized illustrated page, NOT live-action film still or photorealistic photo.`
    return `${styleLead} ${GLOBAL_ART_DIRECTION_GRAPHIC_CORE}`
  }

  const styleLead = is3D
    ? 'Cinematic 3D animated storybook illustration, like a high-quality animated film still (stylized, NOT live-action photo).'
    : `Cinematic storybook illustration in ${illustrationStyle} style, like a high-quality illustrated film still (stylized, NOT live-action photo).`
  return `${styleLead} ${GLOBAL_ART_DIRECTION_CORE}`
}

function getGraphicStyleConsistencyPack(): string {
  return [
    'lighting and color that stay true to the chosen graphic style (no photorealistic volumetric haze unless the scene text asks for it)',
    'clear separation of foreground and background using style-appropriate planes (flat fills, simple gradients, halftone, or blocks — not cinematic fog)',
    'consistent line weight, palette, and shading rules as defined by the style',
    'readable composition; avoid filmic bloom and heavy lens effects unless they fit the style',
  ].join(', ')
}

/**
 * CINEMATIC_PACK — sinematik stiller için filmic kalite; D3: grafik düz stillerde `getGraphicStyleConsistencyPack`.
 * @param illustrationStyle İstenirse stile göre dal; verilmezse legacy tam sinematik paket (entity vb. geriye uyum).
 */
export function getCinematicPack(illustrationStyle?: string): string {
  if (
    illustrationStyle !== undefined &&
    illustrationStyle !== '' &&
    !usesCinematicImageLayers(illustrationStyle)
  ) {
    return getGraphicStyleConsistencyPack()
  }
  return [
    'cinematic key light with soft fill and rim light',
    'volumetric sun rays where appropriate',
    'atmospheric perspective',
    'warm cinematic color grading',
    'rich contrast',
    'gentle bloom',
    'controlled saturation',
    'high-detail set dressing',
    'layered depth (foreground, midground, background)',
    'natural scale cues',
  ].join(', ')
}

