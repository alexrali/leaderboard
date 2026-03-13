import { NextRequest, NextResponse } from "next/server"
import { isAuthorizedHermesServiceRequest } from "@/lib/hermes/auth"
import { processDueHermesTasks } from "@/lib/hermes/runtime"

export async function POST(request: NextRequest) {
  if (!isAuthorizedHermesServiceRequest(request)) {
    return NextResponse.json({ success: false, error: ["Unauthorized"] }, { status: 401 })
  }

  const url = new URL(request.url)
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam ? Number(limitParam) : 25

  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 25

  try {
    const result = await processDueHermesTasks(safeLimit)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("Hermes due-task processing error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
