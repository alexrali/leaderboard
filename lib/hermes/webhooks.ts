import { createHermesAdminClient } from "@/lib/hermes/server"
import type { HermesDeliveryStatus, HermesWebhookEventType } from "@/lib/hermes/types"
import { coerceHermesJsonObject, getHermesNestedValue, isHermesRecord } from "@/lib/hermes/utils"

function getHermesWebhookResendId(data: Record<string, unknown>): string | null {
  const candidates = [
    getHermesNestedValue(data, "data.email_id"),
    getHermesNestedValue(data, "email_id"),
    getHermesNestedValue(data, "data.resend_id"),
    getHermesNestedValue(data, "resend_id"),
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate
    }
  }

  return null
}

function mapWebhookTypeToDeliveryStatus(type: HermesWebhookEventType): HermesDeliveryStatus {
  switch (type) {
    case "email.delivered":
      return "DELIVERED"
    case "email.opened":
      return "OPENED"
    case "email.clicked":
      return "CLICKED"
    case "email.bounced":
      return "BOUNCED"
    case "email.complained":
      return "UNSUBSCRIBED"
  }
}

export async function processHermesWebhookEvent(input: {
  type: HermesWebhookEventType
  data: Record<string, unknown>
}) {
  const supabase = createHermesAdminClient()
  const resendId = getHermesWebhookResendId(input.data)

  if (!resendId) {
    throw new Error("Webhook payload does not include a resend email identifier")
  }

  const { data: webhookRow, error: webhookInsertError } = await supabase
    .from("hermes_webhook_events")
    .insert({
      resend_id: resendId,
      event_type: input.type,
      data: coerceHermesJsonObject(input.data),
      processed: false,
    })
    .select("id")
    .single()

  if (webhookInsertError) {
    throw webhookInsertError
  }

  const timestamp = new Date().toISOString()
  const deliveryStatus = mapWebhookTypeToDeliveryStatus(input.type)
  const updatePayload: Record<string, unknown> = {
    status: deliveryStatus,
    resend_status: input.type,
  }

  if (input.type === "email.delivered") {
    updatePayload.delivered_at = timestamp
  }
  if (input.type === "email.opened") {
    updatePayload.opened_at = timestamp
  }
  if (input.type === "email.clicked") {
    updatePayload.clicked_at = timestamp
  }
  if (input.type === "email.bounced") {
    updatePayload.error_message = typeof getHermesNestedValue(input.data, "data.reason") === "string"
      ? getHermesNestedValue(input.data, "data.reason")
      : "Email bounced"
  }
  if (input.type === "email.complained") {
    updatePayload.error_message = "Recipient complained or unsubscribed"
  }

  const { data: updatedLogs, error: deliveryError } = await supabase
    .from("hermes_delivery_logs")
    .update(updatePayload)
    .eq("resend_id", resendId)
    .select("id")

  if (deliveryError) {
    throw deliveryError
  }

  const { error: webhookUpdateError } = await supabase
    .from("hermes_webhook_events")
    .update({
      processed: true,
      processed_at: timestamp,
    })
    .eq("id", webhookRow.id)

  if (webhookUpdateError) {
    throw webhookUpdateError
  }

  return {
    resendId,
    webhookId: webhookRow.id as string,
    updatedCount: updatedLogs?.length ?? 0,
  }
}

export function parseHermesWebhookInput(body: unknown): { type: HermesWebhookEventType; data: Record<string, unknown> } {
  if (!isHermesRecord(body)) {
    throw new Error("Webhook payload must be a JSON object")
  }

  const eventType =
    (typeof body.type === "string" ? body.type : null) ??
    (typeof body.event === "string" ? body.event : null) ??
    (typeof body.event_type === "string" ? body.event_type : null)

  const validTypes: HermesWebhookEventType[] = [
    "email.delivered",
    "email.opened",
    "email.clicked",
    "email.bounced",
    "email.complained",
  ]

  if (!eventType || !validTypes.includes(eventType as HermesWebhookEventType)) {
    throw new Error("Unsupported webhook event type")
  }

  const data = isHermesRecord(body.data)
    ? body.data
    : body

  return {
    type: eventType as HermesWebhookEventType,
    data,
  }
}
