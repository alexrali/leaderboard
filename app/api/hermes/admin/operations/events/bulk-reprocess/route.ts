import { NextRequest, NextResponse } from "next/server"
import { bulkReprocessHermesEvents } from "@/lib/hermes/admin-operations"
import type { HermesEventStatus } from "@/lib/hermes/types"

export async function POST(request: NextRequest) {
  let body: { ids?: string[]; status?: HermesEventStatus | "ALL"; limit?: number } = {}

  try {
    body = (await request.json().catch(() => ({}))) as { ids?: string[]; status?: HermesEventStatus | "ALL"; limit?: number }
  } catch {
    body = {}
  }

  try {
    const result = await bulkReprocessHermesEvents(body)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("Hermes admin bulk event reprocess error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
