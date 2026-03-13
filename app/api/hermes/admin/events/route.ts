import { NextRequest, NextResponse } from "next/server"
import { listHermesAdminEvents } from "@/lib/hermes/admin"
import type { HermesEventStatus } from "@/lib/hermes/types"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const limit = Number(url.searchParams.get("limit") ?? 25)
  const status = (url.searchParams.get("status") ?? "ALL") as HermesEventStatus | "ALL"

  try {
    const items = await listHermesAdminEvents({ limit, status })
    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error("Hermes admin events error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
