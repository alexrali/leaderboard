import { NextResponse } from "next/server"
import { getHermesAdminEventTimeline } from "@/lib/hermes/review"

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    const timeline = await getHermesAdminEventTimeline(id)

    if (!timeline) {
      return NextResponse.json({ success: false, error: ["Event not found"] }, { status: 404 })
    }

    return NextResponse.json({ success: true, timeline })
  } catch (error) {
    console.error("Hermes admin event timeline error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
