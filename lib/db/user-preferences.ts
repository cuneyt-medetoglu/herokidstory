/**
 * @file User preferences — server-only database helpers.
 *
 * Types and defaults are in lib/types/user-preferences.ts (client-safe).
 * This file uses pg (Node.js) and must only be imported in server code.
 *
 * preferences JSONB shape: { kidMode: boolean }
 */

import { pool } from "./pool"
import { UserPreferences, resolvePreferences } from "@/lib/types/user-preferences"

export type { UserPreferences } from "@/lib/types/user-preferences"
export { DEFAULT_PREFERENCES, resolvePreferences } from "@/lib/types/user-preferences"

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const result = await pool.query<{ preferences: unknown }>(
    "SELECT preferences FROM users WHERE id = $1",
    [userId]
  )
  const row = result.rows[0]
  return resolvePreferences(row?.preferences ?? null)
}

export async function updateUserPreferences(
  userId: string,
  patch: Partial<UserPreferences>
): Promise<UserPreferences> {
  const current = await getUserPreferences(userId)
  const merged: UserPreferences = {
    kidMode: patch.kidMode !== undefined ? patch.kidMode : current.kidMode,
  }
  const result = await pool.query<{ preferences: unknown }>(
    `UPDATE users
     SET preferences = $1::jsonb,
         updated_at   = NOW()
     WHERE id = $2
     RETURNING preferences`,
    [JSON.stringify(merged), userId]
  )
  return resolvePreferences(result.rows[0]?.preferences ?? null)
}
