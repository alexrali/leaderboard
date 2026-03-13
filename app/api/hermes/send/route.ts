import { NextRequest, NextResponse } from "next/server"
import { sendHermesMessage } from "@/lib/hermes/delivery"
import { renderHermesTemplate } from "@/lib/hermes/renderer"
import { getHermesTemplateById, getHermesTemplateBySlug } from "@/lib/hermes/templates"
import type { HermesResolvedRecipient } from "@/lib/hermes/types"
import { isHermesRecord, isHermesValidEmail } from "@/lib/hermes/utils"

function normalizeRecipients(input: unknown): HermesResolvedRecipient[] {
  if (typeof input === "string") {
    return isHermesValidEmail(input) ? [{ email: input }] : []
  }

  if (!Array.isArray(input)) {
    return []
  }

  return input.flatMap((entry) => {
    if (typeof entry === "string") {
      return isHermesValidEmail(entry) ? [{ email: entry }] : []
    }

    if (!isHermesRecord(entry) || typeof entry.email !== "string" || !isHermesValidEmail(entry.email)) {
      return []
    }

    return [
      {
        email: entry.email,
        name: typeof entry.name === "string" ? entry.name : null,
        userId: typeof entry.userId === "string" ? entry.userId : null,
      },
    ]
  })
}

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: ["Request body must be valid JSON"] }, { status: 400 })
  }

  if (!isHermesRecord(body)) {
    return NextResponse.json({ success: false, error: ["Request body must be a JSON object"] }, { status: 400 })
  }

  const templateId = typeof body.templateId === "string" ? body.templateId : undefined
  const templateSlug = typeof body.templateSlug === "string" ? body.templateSlug : undefined

  if (!templateId && !templateSlug) {
    return NextResponse.json({ success: false, error: ["templateId or templateSlug is required"] }, { status: 400 })
  }

  const recipients = normalizeRecipients(body.to)
  if (recipients.length === 0) {
    return NextResponse.json({ success: false, error: ["At least one valid recipient is required"] }, { status: 400 })
  }

  const template = templateId ? await getHermesTemplateById(templateId) : await getHermesTemplateBySlug(templateSlug!)

  if (!template || !template.is_active) {
    return NextResponse.json({ success: false, error: ["Template not found or inactive"] }, { status: 404 })
  }

  const variables = isHermesRecord(body.variables) ? body.variables : {}
  const eventPayload = isHermesRecord(body.event) && isHermesRecord(body.event.payload) ? body.event.payload : variables
  const eventId = typeof body.eventId === "string" ? body.eventId : isHermesRecord(body.event) && typeof body.event.id === "string" ? body.event.id : null
  const ruleId = typeof body.ruleId === "string" ? body.ruleId : null
  const eventType = isHermesRecord(body.event) && typeof body.event.type === "string" ? body.event.type : "direct.send"

  const rendered = renderHermesTemplate({
    template,
    variables,
    event: {
      id: eventId ?? "direct-send",
      type: eventType,
      payload: eventPayload,
    },
  })

  try {
    const result = await sendHermesMessage({
      template,
      recipients,
      rendered,
      eventId,
      ruleId,
      metadata: isHermesRecord(body.metadata) ? body.metadata : undefined,
    })

    return NextResponse.json({
      success: result.success,
      deliveries: result.deliveries,
      subject: rendered.subject,
    })
  } catch (error) {
    console.error("Hermes send error:", error)
    return NextResponse.json({ success: false, error: [error instanceof Error ? error.message : "Internal server error"] }, { status: 500 })
  }
}
