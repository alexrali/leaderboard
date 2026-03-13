import { findMatchingHermesRules, resolveHermesRecipients } from "@/lib/hermes/rules"
import { renderHermesTemplate } from "@/lib/hermes/renderer"
import { getHermesTemplateById } from "@/lib/hermes/templates"
import type { HermesEventRecord } from "@/lib/hermes/types"

export async function getHermesEventMatches(event: HermesEventRecord) {
  const matches = await findMatchingHermesRules(event)

  const enriched = await Promise.all(
    matches.map(async (match) => {
      const template = match.rule.template_id ? await getHermesTemplateById(match.rule.template_id) : null
      let recipients = [] as ReturnType<typeof resolveHermesRecipients>
      let preview = null as ReturnType<typeof renderHermesTemplate> | null

      try {
        recipients = resolveHermesRecipients(match.rule, event)
      } catch {
        recipients = []
      }

      if (template) {
        preview = renderHermesTemplate({
          template,
          variables: match.extractedData,
          event: {
            id: event.id,
            type: event.type,
            payload: event.payload,
          },
        })
      }

      return {
        ruleId: match.rule.id,
        templateId: match.rule.template_id,
        recipientCount: recipients.length,
        recipients,
        subjectPreview: preview?.subject ?? null,
      }
    })
  )

  return enriched
}
