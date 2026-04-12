/**
 * Global book reader defaults (admin-managed). Client-safe types.
 */

export interface ReaderDefaults {
  animationType: "flip" | "slide" | "fade" | "curl" | "zoom" | "none"
  animationSpeed: "slow" | "normal" | "fast"
  mobileLayoutMode: "stacked" | "flip"
  defaultAutoplayMode: "off" | "tts" | "timed"
  defaultAutoplaySpeed: 5 | 10 | 15 | 20
}

export const DEFAULT_READER_DEFAULTS: ReaderDefaults = {
  animationType: "flip",
  animationSpeed: "normal",
  mobileLayoutMode: "stacked",
  defaultAutoplayMode: "off",
  defaultAutoplaySpeed: 10,
}

export function resolveReaderDefaults(raw: unknown): ReaderDefaults {
  const defaults = { ...DEFAULT_READER_DEFAULTS }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults
  const r = raw as Record<string, unknown>

  const validAnimationTypes = ["flip", "slide", "fade", "curl", "zoom", "none"] as const
  const validAnimationSpeeds = ["slow", "normal", "fast"] as const
  const validMobileLayouts = ["stacked", "flip"] as const
  const validAutoplayModes = ["off", "tts", "timed"] as const
  const validAutoplaySpeeds = [5, 10, 15, 20] as const

  return {
    animationType: validAnimationTypes.includes(r.animationType as never)
      ? (r.animationType as ReaderDefaults["animationType"])
      : defaults.animationType,
    animationSpeed: validAnimationSpeeds.includes(r.animationSpeed as never)
      ? (r.animationSpeed as ReaderDefaults["animationSpeed"])
      : defaults.animationSpeed,
    mobileLayoutMode: validMobileLayouts.includes(r.mobileLayoutMode as never)
      ? (r.mobileLayoutMode as ReaderDefaults["mobileLayoutMode"])
      : defaults.mobileLayoutMode,
    defaultAutoplayMode: validAutoplayModes.includes(r.defaultAutoplayMode as never)
      ? (r.defaultAutoplayMode as ReaderDefaults["defaultAutoplayMode"])
      : defaults.defaultAutoplayMode,
    defaultAutoplaySpeed: validAutoplaySpeeds.includes(r.defaultAutoplaySpeed as never)
      ? (r.defaultAutoplaySpeed as ReaderDefaults["defaultAutoplaySpeed"])
      : defaults.defaultAutoplaySpeed,
  }
}
