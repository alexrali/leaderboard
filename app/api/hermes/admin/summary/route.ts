import { NextResponse } from "next/server"
import { getHermesAdminSummary } from "@/lib/hermes/admin"

export async function GET() {
  try {
    const summary = await getHermesAdminSummary()
    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error("Hermes admin summary error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
