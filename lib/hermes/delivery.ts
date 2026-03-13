import { createHermesAdminClient } from "@/lib/hermes/server"
import type {
  HermesDeliveryLogRecord,
  HermesRenderedTemplate,
  HermesResolvedRecipient,
  HermesTemplateRecord,
  HermesUnknownRecord,
} from "@/lib/hermes/types"
import { coerceHermesJsonObject, isHermesValidEmail } from "@/lib/hermes/utils"

export interface HermesDeliveryItemResult {
  recipientEmail: string
  resendId: string | null
  success: boolean
  error: string | null
}

export interface HermesSendMessageInput {
  template: HermesTemplateRecord
  recipients: HermesResolvedRecipient[]
  rendered: HermesRenderedTemplate
  eventId?: string | null
  ruleId?: string | null
  metadata?: HermesUnknownRecord
}

export interface HermesSendMessageResult {
  success: boolean
  deliveries: HermesDeliveryItemResult[]
}

function getResendApiKey(): string {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY")
  }

  return apiKey
}

function resolveHermesSender(template: HermesTemplateRecord) {
  const email = template.from_email ?? process.env.HERMES_DEFAULT_FROM_EMAIL ?? null
  const name = template.from_name ?? process.env.HERMES_DEFAULT_FROM_NAME ?? null

  if (!email || !isHermesValidEmail(email)) {
    throw new Error("Missing valid sender email. Set template.from_email or HERMES_DEFAULT_FROM_EMAIL")
  }

  return {
    email,
    name,
  }
}

function formatHermesSender(sender: { email: string; name: string | null }) {
  return sender.name ? `${sender.name} <${sender.email}>` : sender.email
}

function createDeliveryLogRecord(input: {
  eventId: string | null
  ruleId: string | null
  templateId: string | null
  recipient: HermesResolvedRecipient
  subject: string
  resendId: string | null
  success: boolean
  error: string | null
  metadata?: HermesUnknownRecord
}): HermesDeliveryLogRecord {
  const timestamp = new Date().toISOString()

  return {
    event_id: input.eventId,
    rule_id: input.ruleId,
    user_id: input.recipient.userId ?? null,
    template_id: input.templateId,
    recipient_email: input.recipient.email,
    recipient_name: input.recipient.name ?? null,
    subject: input.subject,
    resend_id: input.resendId,
    resend_status: input.success ? "sent" : null,
    status: input.success ? "SENT" : "FAILED",
    error_message: input.error,
    sent_at: input.success ? timestamp : null,
    delivered_at: null,
    opened_at: null,
    clicked_at: null,
    metadata: input.metadata ? coerceHermesJsonObject(input.metadata) : {},
  }
}

async function insertDeliveryLog(log: HermesDeliveryLogRecord): Promise<void> {
  const supabase = createHermesAdminClient()
  const { error } = await supabase.from("hermes_delivery_logs").insert(log)

  if (error) {
    throw error
  }
}

export async function sendHermesMessage(input: HermesSendMessageInput): Promise<HermesSendMessageResult> {
  if (input.recipients.length === 0) {
    throw new Error("At least one recipient is required")
  }

  const resendApiKey = getResendApiKey()
  const sender = resolveHermesSender(input.template)
  const deliveries: HermesDeliveryItemResult[] = []

  for (const recipient of input.recipients) {
    if (!isHermesValidEmail(recipient.email)) {
      const errorMessage = `Invalid recipient email: ${recipient.email}`
      await insertDeliveryLog(
        createDeliveryLogRecord({
          eventId: input.eventId ?? null,
          ruleId: input.ruleId ?? null,
          templateId: input.template.id,
          recipient,
          subject: input.rendered.subject,
          resendId: null,
          success: false,
          error: errorMessage,
          metadata: input.metadata,
        })
      )

      deliveries.push({
        recipientEmail: recipient.email,
        resendId: null,
        success: false,
        error: errorMessage,
      })
      continue
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: formatHermesSender(sender),
          to: [recipient.email],
          subject: input.rendered.subject,
          html: input.rendered.html,
          text: input.rendered.text,
          reply_to: input.template.reply_to ?? undefined,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { id?: string; message?: string; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error ?? "Resend request failed")
      }

      const resendId = payload?.id ?? null

      await insertDeliveryLog(
        createDeliveryLogRecord({
          eventId: input.eventId ?? null,
          ruleId: input.ruleId ?? null,
          templateId: input.template.id,
          recipient,
          subject: input.rendered.subject,
          resendId,
          success: true,
          error: null,
          metadata: input.metadata,
        })
      )

      deliveries.push({
        recipientEmail: recipient.email,
        resendId,
        success: true,
        error: null,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown delivery error"

      await insertDeliveryLog(
        createDeliveryLogRecord({
          eventId: input.eventId ?? null,
          ruleId: input.ruleId ?? null,
          templateId: input.template.id,
          recipient,
          subject: input.rendered.subject,
          resendId: null,
          success: false,
          error: message,
          metadata: input.metadata,
        })
      )

      deliveries.push({
        recipientEmail: recipient.email,
        resendId: null,
        success: false,
        error: message,
      })
    }
  }

  return {
    success: deliveries.every((delivery) => delivery.success),
    deliveries,
  }
}
