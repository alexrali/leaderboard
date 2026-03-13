export type HermesJsonPrimitive = string | number | boolean | null
export type HermesJsonValue = HermesJsonPrimitive | HermesJsonObject | HermesJsonValue[]
export type HermesJsonObject = { [key: string]: HermesJsonValue }

export const hermesEventSources = ["webhook", "cron", "api", "queue"] as const
export type HermesEventSource = (typeof hermesEventSources)[number]

export const hermesEventStatuses = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const
export type HermesEventStatus = (typeof hermesEventStatuses)[number]

export const hermesScheduleTypes = [
  "IMMEDIATE",
  "DELAYED",
  "SCHEDULED",
  "RECURRING",
  "BATCHED",
] as const
export type HermesScheduleType = (typeof hermesScheduleTypes)[number]

export const hermesRecipientTypes = [
  "STATIC",
  "DYNAMIC",
  "LOOKUP",
  "GROUP",
  "CONDITIONAL",
] as const
export type HermesRecipientType = (typeof hermesRecipientTypes)[number]

export const hermesDeliveryStatuses = [
  "QUEUED",
  "SENT",
  "DELIVERED",
  "OPENED",
  "CLICKED",
  "BOUNCED",
  "FAILED",
  "UNSUBSCRIBED",
] as const
export type HermesDeliveryStatus = (typeof hermesDeliveryStatuses)[number]

export const hermesTaskStatuses = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "RETRYING",
] as const
export type HermesTaskStatus = (typeof hermesTaskStatuses)[number]

export const hermesWebhookEventTypes = [
  "email.delivered",
  "email.opened",
  "email.clicked",
  "email.bounced",
  "email.complained",
] as const
export type HermesWebhookEventType = (typeof hermesWebhookEventTypes)[number]

export type HermesUnknownRecord = Record<string, unknown>

export interface HermesEventInput {
  type: string
  source: HermesEventSource
  payload: HermesUnknownRecord
  externalId?: string
  metadata?: HermesUnknownRecord
}

export interface HermesNormalizedEventInput {
  type: string
  source: HermesEventSource
  payload: HermesJsonObject
  externalId?: string
  metadata: HermesJsonObject
}

export interface HermesEventRecord {
  id: string
  type: string
  source: HermesEventSource
  external_id: string | null
  payload: HermesJsonObject
  metadata: HermesJsonObject
  status: HermesEventStatus
  processed_at: string | null
  error_message: string | null
  retry_count: number
  created_at: string
  updated_at: string
}

export interface HermesEventValidationResult {
  valid: boolean
  errors: string[]
}

export type HermesRuleOperator =
  | "eq"
  | "neq"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "contains"
  | "regex"
  | "exists"
  | "notExists"

export interface HermesRuleCondition {
  field: string
  operator: HermesRuleOperator
  value?: HermesJsonValue
}

export interface HermesTemplateVariable {
  name: string
  type: "string" | "number" | "boolean" | "date" | "json"
  required?: boolean
  path?: string
  defaultValue?: HermesJsonValue
}

export interface HermesTemplateRecord {
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

export interface HermesRuleRecord {
  id: string
  name: string
  description: string | null
  event_type: string
  event_conditions: HermesRuleCondition[]
  schedule_type: HermesScheduleType
  schedule_config: HermesJsonObject
  timezone: string
  recipient_type: HermesRecipientType
  recipient_config: HermesJsonObject
  template_id: string | null
  priority: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface HermesRuleMatchResult {
  rule: HermesRuleRecord
  matched: boolean
  extractedData: HermesUnknownRecord
  conditionResults: Array<{
    field: string
    operator: HermesRuleOperator
    expectedValue: HermesJsonValue | undefined
    actualValue: unknown
    passed: boolean
  }>
}

export interface HermesRenderedTemplate {
  subject: string
  html: string
  text: string
}

export interface HermesResolvedRecipient {
  email: string
  name?: string | null
  userId?: string | null
}

export interface HermesDeliveryLogRecord {
  event_id: string | null
  rule_id: string | null
  user_id: string | null
  template_id: string | null
  recipient_email: string
  recipient_name: string | null
  subject: string
  resend_id: string | null
  resend_status: string | null
  status: HermesDeliveryStatus
  error_message: string | null
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  metadata: HermesJsonObject
}

export interface HermesScheduledTaskRecord {
  id: string
  rule_id: string
  event_id: string | null
  event_data: HermesJsonObject
  scheduled_for: string
  processed_at: string | null
  status: HermesTaskStatus
  result: HermesJsonObject | null
  retry_count: number
  max_retries: number
  next_retry_at: string | null
  created_at: string
  updated_at: string
}
