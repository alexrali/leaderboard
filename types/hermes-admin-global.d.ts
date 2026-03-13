import type { HermesJsonObject, HermesRuleCondition, HermesTemplateVariable } from "@/lib/hermes/types"

declare global {
  interface HermesAdminTemplateDetail {
    id: string
    name: string
    slug: string
    description: string | null
    subject: string
    html_content: string
    text_content: string | null
    variables: HermesTemplateVariable[]
    default_values: HermesJsonObject
    from_email: string | null
    from_name: string | null
    reply_to: string | null
    is_active: boolean
    created_at: string
    updated_at: string
  }

  interface HermesAdminRuleDetail {
    id: string
    name: string
    description: string | null
    event_type: string
    event_conditions: HermesRuleCondition[]
    schedule_type: string
    schedule_config: HermesJsonObject
    timezone: string
    recipient_type: string
    recipient_config: HermesJsonObject
    template_id: string | null
    priority: number
    is_active: boolean
    created_by: string | null
    created_at: string
    updated_at: string
  }
}

export {}
