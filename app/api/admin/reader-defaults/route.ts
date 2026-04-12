/**
 * GET/PATCH /api/admin/reader-defaults — Global reader defaults (admin only).
 */

import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/auth/api-auth"
import { getUserRole } from "@/lib/db/users"
import { getReaderDefaults, updateReaderDefaults } from "@/lib/db/reader-defaults"
import type { ReaderDefaults } from "@/lib/types/reader-defaults"

export const dynamic = "force-dynamic"

const VALID_ANIMATION_TYPES: ReaderDefaults["animationType"][] = ["flip", "slide", "fade", "curl", "zoom", "none"]
const VALID_ANIMATION_SPEEDS: ReaderDefaults["animationSpeed"][] = ["slow", "normal", "fast"]
const VALID_MOBILE_LAYOUTS: ReaderDefaults["mobileLayoutMode"][] = ["stacked", "flip"]
const VALID_AUTOPLAY_MODES: ReaderDefaults["defaultAutoplayMode"][] = ["off", "tts", "timed"]
const VALID_AUTOPLAY_SPEEDS: ReaderDefaults["defaultAutoplaySpeed"][] = [5, 10, 15, 20]

export async function GET() {
  try {
    const user = await requireUser()
    const role = await getUserRole(user.id)
    if (role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }
    const defaults = await getReaderDefaults()
    return NextResponse.json({ success: true, defaults })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    console.error("[Admin reader defaults GET]", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser()
    const role = await getUserRole(user.id)
    if (role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 })
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 })
    }

    const patch: Parameters<typeof updateReaderDefaults>[0] = {}

    if (VALID_ANIMATION_TYPES.includes(body.animationType as never)) {
      patch.animation_type = body.animationType as string
    }
    if (VALID_ANIMATION_SPEEDS.includes(body.animationSpeed as never)) {
      patch.animation_speed = body.animationSpeed as string
    }
    if (VALID_MOBILE_LAYOUTS.includes(body.mobileLayoutMode as never)) {
      patch.mobile_layout_mode = body.mobileLayoutMode as string
    }
    if (VALID_AUTOPLAY_MODES.includes(body.defaultAutoplayMode as never)) {
      patch.default_autoplay_mode = body.defaultAutoplayMode as string
    }
    if (VALID_AUTOPLAY_SPEEDS.includes(body.defaultAutoplaySpeed as never)) {
      patch.default_autoplay_speed = body.defaultAutoplaySpeed as number
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields" }, { status: 400 })
    }

    const defaults = await updateReaderDefaults(patch)
    return NextResponse.json({ success: true, defaults })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    console.error("[Admin reader defaults PATCH]", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
