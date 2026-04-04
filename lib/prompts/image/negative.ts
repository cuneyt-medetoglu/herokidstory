import type { PromptVersion } from '../types'

/**
 * Görsel prompt — anatomi (pozitif) ve mask-edit AVOID.
 *
 * Üretim yolu: kitap/sayfa görselleri negatif prompt listesi kullanmıyor; güvenlik ve kompozisyon
 * pozitif prompt + proz bloklarıyla yönetiliyor. Mask-edit için `getMaskEditAvoid` + edit-image rotası.
 *
 * Tarihsel `getNegativePrompt` / yaş-stil-tema negatif listeleri kaldırıldı (v1.6.0) — kodda
 * çağrı yoktu; gerekirse git geçmişinden geri alınabilir.
 */

export const VERSION: PromptVersion = {
  version: '1.6.1',
  releaseDate: new Date('2026-04-04'),
  status: 'active',
  changelog: [
    'Initial release (tarihsel)',
    'v1.2.0–v1.5.0: Anatomi pozitif direktif; mask-edit getMaskEditAvoid (P1)',
    'v1.6.0: [P3 öncesi] getNegativePrompt, yaş/stil/tema/karakter negatif sabitleri ve kullanılmayan yardımcılar (getContentSafetyFilter, el stratejisi API) kaldırıldı — runtime’da hiç import edilmiyordu. Kalan: getAnatomicalCorrectnessDirectives, getMaskEditAvoid. (4 Nisan 2026)',
    'v1.6.1: Hiç import edilmeyen default export (negativePrompts nesnesi) kaldırıldı. (4 Nisan 2026)',
  ],
  author: '@prompt-manager',
}

/**
 * Pozitif prompt için anatomi direktifi (negatif liste yerine).
 */
export function getAnatomicalCorrectnessDirectives(): string {
  return '[ANATOMY] Each hand has exactly five distinct fingers, clearly separated; well-formed hands, properly proportioned fingers. Arms at sides, 2 arms 2 legs, symmetrical face (2 eyes 1 nose 1 mouth). [/ANATOMY]'
}

/**
 * Mask-edit (edit-image API) için kısa AVOID — iç sayfa felsefesiyle uyumlu (P1).
 */
export function getMaskEditAvoid(): string {
  return 'AVOID: neon saturation, text or watermark, blurry result, character inconsistency, style change.'
}
