import { NextRequest, NextResponse } from "next/server"
import { bulkCancelHermesTasks } from "@/lib/hermes/admin-operations"
import type { HermesTaskStatus } from "@/lib/hermes/types"

export async function POST(request: NextRequest) {
  let body: { ids?: string[]; statuses?: HermesTaskStatus[]; limit?: number } = {}

  try {
    body = (await request.json().catch(() => ({}))) as { ids?: string[]; statuses?: HermesTaskStatus[]; limit?: number }
  } catch {
    body = {}
  }

  try {
    const result = await bulkCancelHermesTasks(body)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("Hermes admin bulk task cancel error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
