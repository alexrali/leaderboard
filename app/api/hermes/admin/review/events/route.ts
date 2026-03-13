import { NextRequest, NextResponse } from "next/server"
import { coerceHermesEventInput, createHermesEvent, isHermesDuplicateEventError, validateHermesEventInput } from "@/lib/hermes/events"
import { getHermesAdminEventTimeline, previewHermesEvent } from "@/lib/hermes/review"
import { processHermesEvent } from "@/lib/hermes/runtime"
import type { HermesEventInput } from "@/lib/hermes/types"

export async function POST(request: NextRequest) {
  let rawBody: unknown

  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: ["Request body must be valid JSON"] }, { status: 400 })
  }

  const mode =
    rawBody && typeof rawBody === "object" && "mode" in rawBody && rawBody.mode === "process"
      ? "process"
      : "preview"

  const body = coerceHermesEventInput(rawBody)
  const validation = validateHermesEventInput(body)

  if (!validation.valid) {
    return NextResponse.json({ success: false, error: validation.errors }, { status: 400 })
  }

  try {
    if (mode === "preview") {
      const timeline = await previewHermesEvent(body as HermesEventInput)
      return NextResponse.json({ success: true, mode, timeline })
    }

    const event = await createHermesEvent(body as HermesEventInput)
    const processing = await processHermesEvent(event)
    const timeline = await getHermesAdminEventTimeline(event.id)

    return NextResponse.json({
      success: true,
      mode,
      eventId: event.id,
      status: processing.status,
      timeline,
      processing,
    })
  } catch (error) {
    if (isHermesDuplicateEventError(error)) {
      return NextResponse.json({ success: false, error: ["Duplicate event for source/externalId"] }, { status: 409 })
    }

    console.error("Hermes admin review event error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
