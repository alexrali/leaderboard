import { NextResponse } from "next/server"
import { processHermesScheduledTask } from "@/lib/hermes/runtime"

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    const result = await processHermesScheduledTask(id)
    return NextResponse.json({ success: true, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    const status = message.includes("not found") ? 404 : 500
    console.error("Hermes admin task retry error:", error)
    return NextResponse.json({ success: false, error: [message] }, { status })
  }
}
