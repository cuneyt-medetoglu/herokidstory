import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/auth/api-auth"
import { getUserPreferences, updateUserPreferences, UserPreferences } from "@/lib/db/user-preferences"

export const dynamic = "force-dynamic"

/**
 * GET /api/user/preferences
 * Returns the resolved preferences for the authenticated user.
 */
export async function GET() {
  try {
    const user = await requireUser()
    const preferences = await getUserPreferences(user.id)
    return NextResponse.json({ success: true, preferences })
  } catch (error) {
    console.error("[User Preferences GET]", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PATCH /api/user/preferences
 * Partially updates the authenticated user's preferences.
 * Body: Partial<UserPreferences> — currently only kidMode.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser()

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 })
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Body must be a JSON object" }, { status: 400 })
    }

    const patch: Partial<UserPreferences> = {}
    if (typeof body.kidMode === "boolean") {
      patch.kidMode = body.kidMode
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: false, error: "Provide kidMode (boolean)" }, { status: 400 })
    }

    const preferences = await updateUserPreferences(user.id, patch)
    return NextResponse.json({ success: true, preferences })
  } catch (error) {
    console.error("[User Preferences PATCH]", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
