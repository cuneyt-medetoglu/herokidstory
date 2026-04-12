/**
 * @file User preferences — type definitions and client-safe defaults.
 *
 * This file has NO server-only (Node.js) imports and is safe to use in
 * both client components and server-side code.
 *
 * DB helpers live in lib/db/user-preferences.ts (server-only).
 *
 * Şu an yalnızca çocuk modu saklanır.
 */

export interface UserPreferences {
  /**
   * Kid Mode — simplifies the UI when a child uses the device alone.
   */
  kidMode: boolean
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  kidMode: false,
}

/**
 * Read stored JSON and return only supported fields (legacy keys ignored).
 */
export function resolvePreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_PREFERENCES }
  }
  const r = raw as Record<string, unknown>
  const kid = r.kidMode
  return {
    kidMode: typeof kid === "boolean" ? kid : DEFAULT_PREFERENCES.kidMode,
  }
}
