import { NextRequest, NextResponse } from "next/server"
import { processDueHermesTasks } from "@/lib/hermes/runtime"

export async function POST(request: NextRequest) {
  let body: { limit?: number } = {}

  try {
    body = (await request.json().catch(() => ({}))) as { limit?: number }
  } catch {
    body = {}
  }

  const limit = typeof body.limit === "number" && Number.isFinite(body.limit) && body.limit > 0
    ? Math.min(Math.floor(body.limit), 100)
    : 25

  try {
    const result = await processDueHermesTasks(limit)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("Hermes admin process-due error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
