/**
 * Global reader_defaults row — server-only.
 */

import { pool } from "./pool"
import { ReaderDefaults, resolveReaderDefaults, DEFAULT_READER_DEFAULTS } from "@/lib/types/reader-defaults"

const ROW_ID = 1

function rowToDefaults(row: {
  animation_type: string
  animation_speed: string
  mobile_layout_mode: string
  default_autoplay_mode: string
  default_autoplay_speed: number
}): ReaderDefaults {
  return resolveReaderDefaults({
    animationType: row.animation_type,
    animationSpeed: row.animation_speed,
    mobileLayoutMode: row.mobile_layout_mode,
    defaultAutoplayMode: row.default_autoplay_mode,
    defaultAutoplaySpeed: row.default_autoplay_speed,
  })
}

export async function getReaderDefaults(): Promise<ReaderDefaults> {
  const result = await pool.query<{
    animation_type: string
    animation_speed: string
    mobile_layout_mode: string
    default_autoplay_mode: string
    default_autoplay_speed: number
  }>(
    `SELECT animation_type, animation_speed, mobile_layout_mode,
            default_autoplay_mode, default_autoplay_speed
     FROM reader_defaults WHERE id = $1`,
    [ROW_ID]
  )
  const row = result.rows[0]
  if (!row) return { ...DEFAULT_READER_DEFAULTS }
  return rowToDefaults(row)
}

export interface UpdateReaderDefaultsInput {
  animation_type?: string
  animation_speed?: string
  mobile_layout_mode?: string
  default_autoplay_mode?: string
  default_autoplay_speed?: number
}

export async function updateReaderDefaults(input: UpdateReaderDefaultsInput): Promise<ReaderDefaults> {
  const updates: string[] = []
  const values: unknown[] = []
  let i = 1
  if (input.animation_type !== undefined) {
    updates.push(`animation_type = $${i++}`)
    values.push(input.animation_type)
  }
  if (input.animation_speed !== undefined) {
    updates.push(`animation_speed = $${i++}`)
    values.push(input.animation_speed)
  }
  if (input.mobile_layout_mode !== undefined) {
    updates.push(`mobile_layout_mode = $${i++}`)
    values.push(input.mobile_layout_mode)
  }
  if (input.default_autoplay_mode !== undefined) {
    updates.push(`default_autoplay_mode = $${i++}`)
    values.push(input.default_autoplay_mode)
  }
  if (input.default_autoplay_speed !== undefined) {
    updates.push(`default_autoplay_speed = $${i++}`)
    values.push(input.default_autoplay_speed)
  }
  if (updates.length === 0) return getReaderDefaults()
  updates.push("updated_at = NOW()")
  values.push(ROW_ID)
  await pool.query(
    `UPDATE reader_defaults SET ${updates.join(", ")} WHERE id = $${i}`,
    values
  )
  return getReaderDefaults()
}
