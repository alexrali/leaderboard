import { NextResponse } from "next/server"
import { getHermesAdminDeliveryLog } from "@/lib/hermes/admin"

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    const item = await getHermesAdminDeliveryLog(id)

    if (!item) {
      return NextResponse.json({ success: false, error: ["Delivery log not found"] }, { status: 404 })
    }

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error("Hermes admin delivery detail error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
