/**
 * Master character illustration prompts – layout-safe (A9)
 * PROMPT_LENGTH_AND_REPETITION_ANALYSIS.md §9.4, A9_LAYOUT_SAFE_MASTER_PLAN.md
 *
 * Configurable scale (characterScaleMin/Max) so that if the character is too small
 * in tests, you can increase the range (e.g. 30–35) in lib/prompts/config.ts.
 */

import { PROMPT_CONFIG } from '../config'

const LAYOUT_AVOID = 'Avoid: waist-up framing, medium shot, close-up, character too large, portrait crop.'

/**
 * Returns layout-safe master directives: character small in frame (configurable %),
 * wide shot, lots of empty space, plus Avoid line.
 * Uses PROMPT_CONFIG.masterLayout.characterScaleMin/Max (default 25–30).
 */
export function getLayoutSafeMasterDirectives(): string {
  const { characterScaleMin, characterScaleMax } = PROMPT_CONFIG.masterLayout
  return [
    `Character small in frame (${characterScaleMin}-${characterScaleMax}% of frame height), wide shot, full body visible, lots of empty space around character.`,
    LAYOUT_AVOID,
  ].join(' ')
}
