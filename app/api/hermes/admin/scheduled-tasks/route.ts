import { NextRequest, NextResponse } from "next/server"
import { listHermesAdminScheduledTasks } from "@/lib/hermes/admin"
import type { HermesTaskStatus } from "@/lib/hermes/types"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const limit = Number(url.searchParams.get("limit") ?? 25)
  const status = (url.searchParams.get("status") ?? "ALL") as HermesTaskStatus | "ALL"

  try {
    const items = await listHermesAdminScheduledTasks({ limit, status })
    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error("Hermes admin scheduled tasks error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
