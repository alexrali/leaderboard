import { getHermesEventById, normalizeHermesEventInput } from "@/lib/hermes/events"
import { renderHermesTemplate } from "@/lib/hermes/renderer"
import { analyzeHermesRulesForEvent, resolveHermesRecipientsWithDebug } from "@/lib/hermes/rules"
import { getHermesTemplateById } from "@/lib/hermes/templates"
import type { HermesEventInput, HermesEventRecord, HermesResolvedRecipient, HermesRuleMatchResult } from "@/lib/hermes/types"
import { listHermesAdminDeliveryLogsByEvent, listHermesAdminTasksByEvent } from "@/lib/hermes/admin"

export interface HermesEventReviewMatch {
  ruleId: string
  ruleName: string
  matched: boolean
  templateId: string | null
  scheduleType: string
  recipientType: string
  recipientCount: number
  recipients: HermesResolvedRecipient[]
  recipientResolutionError: string | null
  subjectPreview: string | null
  renderError: string | null
  extractedData: HermesRuleMatchResult["extractedData"]
  conditionResults: HermesRuleMatchResult["conditionResults"]
}

export interface HermesEventTimelineData {
  event: HermesEventRecord
  matchedRules: HermesEventReviewMatch[]
  tasks: Awaited<ReturnType<typeof listHermesAdminTasksByEvent>>
  deliveries: Awaited<ReturnType<typeof listHermesAdminDeliveryLogsByEvent>>
}

async function buildHermesEventReviewMatches(event: HermesEventRecord): Promise<HermesEventReviewMatch[]> {
  const analysis = await analyzeHermesRulesForEvent(event)

  return Promise.all(
    analysis.map(async (entry) => {
      const template = entry.rule.template_id ? await getHermesTemplateById(entry.rule.template_id) : null
      const recipientResolution = entry.matched
        ? resolveHermesRecipientsWithDebug(entry.rule, event)
        : {
            recipients: [] as HermesResolvedRecipient[],
            error: "Recipient resolution skipped because rule conditions did not match",
          }

      let subjectPreview: string | null = null
      let renderError: string | null = null

      if (!entry.rule.template_id) {
        renderError = "Rule does not have a template configured"
      } else if (!template) {
        renderError = "Template not found"
      } else if (entry.matched) {
        try {
          const rendered = renderHermesTemplate({
            template,
            variables: entry.extractedData,
            event: {
              id: event.id,
              type: event.type,
              payload: event.payload,
            },
          })
          subjectPreview = rendered.subject
        } catch (error) {
          renderError = error instanceof Error ? error.message : "Unknown render error"
        }
      }

      return {
        ruleId: entry.rule.id,
        ruleName: entry.rule.name,
        matched: entry.matched,
        templateId: entry.rule.template_id,
        scheduleType: entry.rule.schedule_type,
        recipientType: entry.rule.recipient_type,
        recipientCount: recipientResolution.recipients.length,
        recipients: recipientResolution.recipients,
        recipientResolutionError: recipientResolution.error,
        subjectPreview,
        renderError,
        extractedData: entry.extractedData,
        conditionResults: entry.conditionResults,
      }
    })
  )
}

export async function previewHermesEvent(input: HermesEventInput): Promise<HermesEventTimelineData> {
  const normalized = normalizeHermesEventInput(input)
  const now = new Date().toISOString()
  const event: HermesEventRecord = {
    id: `preview-${Date.now()}`,
    type: normalized.type,
    source: normalized.source,
    external_id: normalized.externalId ?? null,
    payload: normalized.payload,
    metadata: normalized.metadata,
    status: "PENDING",
    processed_at: null,
    error_message: null,
    retry_count: 0,
    created_at: now,
    updated_at: now,
  }

  const matchedRules = await buildHermesEventReviewMatches(event)

  return {
    event,
    matchedRules,
    tasks: [],
    deliveries: [],
  }
}

export async function getHermesAdminEventTimeline(eventId: string): Promise<HermesEventTimelineData | null> {
  const event = await getHermesEventById(eventId)

  if (!event) {
    return null
  }

  const [matchedRules, tasks, deliveries] = await Promise.all([
    buildHermesEventReviewMatches(event),
    listHermesAdminTasksByEvent(eventId, 100),
    listHermesAdminDeliveryLogsByEvent(eventId, 100),
  ])

  return {
    event,
    matchedRules,
    tasks,
    deliveries,
  }
}
