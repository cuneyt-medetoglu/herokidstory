/**
 * Merkezi prompt yapılandırması — yalnızca kodda gerçekten okunan alanlar.
 *
 * Story/görsel model ve token limitleri: `lib/ai/openai-models.ts`, `lib/ai/story-generation-config.ts`
 * ve ilgili API route'ları. Eski sürüm (activeVersions, A/B, feature flag placeholder'ları) hiçbir
 * import tarafından kullanılmıyordu; kaldırıldı (2026-04-04).
 */

export const PROMPT_CONFIG = {
  /** [A9] Layout-safe master: karakter frame yüksekliğinin %min–%max’i (`master.ts`). */
  masterLayout: {
    characterScaleMin: 25,
    characterScaleMax: 30,
  },
} as const

export type PromptConfig = typeof PROMPT_CONFIG
