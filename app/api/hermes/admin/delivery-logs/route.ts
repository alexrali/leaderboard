import { NextRequest, NextResponse } from "next/server"
import { listHermesAdminDeliveryLogs } from "@/lib/hermes/admin"
import type { HermesDeliveryStatus } from "@/lib/hermes/types"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const limit = Number(url.searchParams.get("limit") ?? 25)
  const status = (url.searchParams.get("status") ?? "ALL") as HermesDeliveryStatus | "ALL"

  try {
    const items = await listHermesAdminDeliveryLogs({ limit, status })
    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error("Hermes admin delivery logs error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
