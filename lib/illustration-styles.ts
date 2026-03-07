/**
 * Illustration style display labels for UI (Examples, My Library, etc.).
 * Keys match books.illustration_style and step4 form values.
 */

export const ILLUSTRATION_STYLE_LABELS: Record<string, string> = {
  '3d_animation': '3D Animation (Pixar Style)',
  'comic_book': 'Comic Book',
  'geometric': 'Geometric',
  'kawaii': 'Kawaii',
  'watercolor': 'Watercolor',
  'clay_animation': 'Clay Animation',
  'collage': 'Collage',
  'block_world': 'Block World',
  'sticker_art': 'Sticker Art',
  // Aliases (e.g. from API)
  '3d': '3D Animation (Pixar Style)',
  'comic-book': 'Comic Book',
  'clay-animation': 'Clay Animation',
  'block-world': 'Block World',
  'sticker-art': 'Sticker Art',
}

/**
 * Returns a human-readable label for an illustration style id.
 * Unknown ids are returned as-is.
 */
export function getIllustrationStyleLabel(styleId: string | undefined | null): string {
  if (styleId == null || styleId === '') return ''
  const normalized = styleId.toLowerCase().replace(/[-\s]/g, '_')
  return ILLUSTRATION_STYLE_LABELS[normalized] ?? ILLUSTRATION_STYLE_LABELS[styleId] ?? styleId
}
