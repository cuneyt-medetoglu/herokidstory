/**
 * GET /api/reader-defaults — Global book reader defaults (public; used by BookViewer).
 */

import { NextResponse } from "next/server"
import { getReaderDefaults } from "@/lib/db/reader-defaults"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const defaults = await getReaderDefaults()
    return NextResponse.json({ success: true, defaults })
  } catch (error) {
    console.error("[Reader defaults GET]", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
