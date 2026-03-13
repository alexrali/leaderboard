import { NextRequest, NextResponse } from "next/server"
import { isAuthorizedHermesServiceRequest } from "@/lib/hermes/auth"
import { parseHermesWebhookInput, processHermesWebhookEvent } from "@/lib/hermes/webhooks"

export async function POST(request: NextRequest) {
  if (!isAuthorizedHermesServiceRequest(request, { allowWithoutSecret: true, envKey: "HERMES_WEBHOOK_SECRET" })) {
    return NextResponse.json({ success: false, error: ["Unauthorized"] }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: ["Request body must be valid JSON"] }, { status: 400 })
  }

  try {
    const webhook = parseHermesWebhookInput(body)
    const result = await processHermesWebhookEvent(webhook)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("Hermes webhook processing error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 400 })
  }
}
