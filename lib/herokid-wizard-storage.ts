/**
 * Create wizard: localStorage = kalıcı taslak (API / step6 / foto vb.),
 * sessionStorage aynası = yalnızca aynı sekmede geri gidince formları doldurmak için.
 * "Yeni kitap" (?new=1) ile clearWizardDraft() çağrılır; dashboard'dan gelince eski kitap cache'i görünmez.
 */

const LS_KEY = "herokidstory_wizard"
const SESSION_FORM_MIRROR_KEY = "herokidstory_wizard_form_mirror"

export function readWizardLocal(): Record<string, unknown> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

/** localStorage + aynı sekme form aynasını günceller (geri dönüşte hydration için). */
export function persistWizardData(wizardData: Record<string, unknown>): void {
  if (typeof window === "undefined") return
  try {
    const str = JSON.stringify(wizardData)
    localStorage.setItem(LS_KEY, str)
    sessionStorage.setItem(SESSION_FORM_MIRROR_KEY, str)
  } catch (e) {
    console.error("[herokid-wizard] persistWizardData failed", e)
  }
}

/** Sadece geri gidince formları doldurmak: önceki oturumdaki localStorage'ı göstermez. */
export function readWizardFormMirror(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(SESSION_FORM_MIRROR_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

export function clearWizardDraft(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(LS_KEY)
    localStorage.removeItem("herokidstory_character_id")
    sessionStorage.removeItem(SESSION_FORM_MIRROR_KEY)
  } catch (e) {
    console.error("[herokid-wizard] clearWizardDraft failed", e)
  }
}
