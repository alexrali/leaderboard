import { NextRequest, NextResponse } from "next/server"
import { isAuthorizedHermesServiceRequest } from "@/lib/hermes/auth"
import {
  coerceHermesEventInput,
  createHermesEvent,
  isHermesDuplicateEventError,
  validateHermesEventInput,
} from "@/lib/hermes/events"
import { processHermesEvent } from "@/lib/hermes/runtime"
import type { HermesEventInput } from "@/lib/hermes/types"

export async function POST(request: NextRequest) {
  if (!isAuthorizedHermesServiceRequest(request)) {
    return NextResponse.json(
      {
        success: false,
        error: ["Unauthorized"],
      },
      { status: 401 }
    )
  }

  let body: unknown

  try {
    body = coerceHermesEventInput(await request.json())
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: ["Request body must be valid JSON"],
      },
      { status: 400 }
    )
  }

  const validation = validateHermesEventInput(body)

  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: validation.errors,
      },
      { status: 400 }
    )
  }

  try {
    const event = await createHermesEvent(body as HermesEventInput)
    const processing = await processHermesEvent(event)

    return NextResponse.json(
      {
        success: true,
        eventId: event.id,
        status: processing.status,
        matchedRules: processing.matchedRules,
        immediateDispatches: processing.immediateDispatches,
        scheduledTasks: processing.scheduledTasks,
        errors: processing.errors,
      },
      { status: 202 }
    )
  } catch (error) {
    if (isHermesDuplicateEventError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: ["Duplicate event for source/externalId"],
          status: "duplicate",
        },
        { status: 409 }
      )
    }

    console.error("Hermes event ingestion error:", error)

    return NextResponse.json(
      {
        success: false,
        error: ["Internal server error"],
      },
      { status: 500 }
    )
  }
}
