import { NextResponse } from "next/server"
import { getHermesAdminEvent, listHermesAdminDeliveryLogsByEvent, listHermesAdminTasksByEvent } from "@/lib/hermes/admin"

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    const [item, relatedTasks, relatedDeliveryLogs] = await Promise.all([
      getHermesAdminEvent(id),
      listHermesAdminTasksByEvent(id, 20),
      listHermesAdminDeliveryLogsByEvent(id, 20),
    ])

    if (!item) {
      return NextResponse.json({ success: false, error: ["Event not found"] }, { status: 404 })
    }

    return NextResponse.json({ success: true, item, relatedTasks, relatedDeliveryLogs })
  } catch (error) {
    console.error("Hermes admin event detail error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
