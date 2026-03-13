import { createHermesAdminClient } from "@/lib/hermes/server"
import type {
  HermesJsonObject,
  HermesRecipientType,
  HermesRuleCondition,
  HermesRuleOperator,
  HermesRuleRecord,
  HermesScheduleType,
} from "@/lib/hermes/types"
import { coerceHermesJsonObject, isHermesRecord, isHermesValidEmail, normalizeHermesJsonValue } from "@/lib/hermes/utils"

const hermesRuleSelectFields =
  "id, name, description, event_type, event_conditions, schedule_type, schedule_config, timezone, recipient_type, recipient_config, template_id, priority, is_active, created_by, created_at, updated_at"

const hermesRuleOperators: HermesRuleOperator[] = [
  "eq",
  "neq",
  "gt",
  "lt",
  "gte",
  "lte",
  "contains",
  "regex",
  "exists",
  "notExists",
]

const hermesScheduleTypes: HermesScheduleType[] = ["IMMEDIATE", "DELAYED", "SCHEDULED", "RECURRING", "BATCHED"]
const hermesRecipientTypes: HermesRecipientType[] = ["STATIC", "DYNAMIC", "LOOKUP", "GROUP", "CONDITIONAL"]

type HermesRuleRow = {
  id: string
  name: string
  description: string | null
  event_type: string
  event_conditions: unknown
  schedule_type: HermesScheduleType
  schedule_config: unknown
  timezone: string
  recipient_type: HermesRecipientType
  recipient_config: unknown
  template_id: string | null
  priority: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface HermesRuleMutationInput {
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
}

export type HermesRuleInputParseResult =
  | { success: true; data: HermesRuleMutationInput }
  | { success: false; errors: string[] }

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function mapHermesRuleCondition(value: unknown): HermesRuleCondition | null {
  if (!isHermesRecord(value)) return null
  if (typeof value.field !== "string" || value.field.trim().length === 0) return null
  if (typeof value.operator !== "string" || !hermesRuleOperators.includes(value.operator as HermesRuleOperator)) {
    return null
  }

  return {
    field: value.field.trim(),
    operator: value.operator as HermesRuleOperator,
    value: value.value === undefined ? undefined : normalizeHermesJsonValue(value.value),
  }
}

function mapHermesRuleRow(row: HermesRuleRow): HermesRuleRecord {
  return {
    ...row,
    event_conditions: Array.isArray(row.event_conditions)
      ? row.event_conditions
          .map((entry) => mapHermesRuleCondition(entry))
          .filter((entry): entry is HermesRuleCondition => entry !== null)
      : [],
    schedule_config: coerceHermesJsonObject(row.schedule_config),
    recipient_config: coerceHermesJsonObject(row.recipient_config),
  }
}

function validateRecipientConfig(input: {
  recipientType: HermesRecipientType
  config: HermesJsonObject
  errors: string[]
}) {
  const { recipientType, config, errors } = input

  if (recipientType === "STATIC") {
    const emails = Array.isArray(config.emails) ? config.emails : []
    const validEmails = emails.filter((entry): entry is string => typeof entry === "string" && isHermesValidEmail(entry))

    if (validEmails.length === 0) {
      errors.push("STATIC recipient_config must include at least one valid email in `emails`")
    }
  }

  if (recipientType === "DYNAMIC") {
    if (typeof config.emailPath !== "string" || config.emailPath.trim().length === 0) {
      errors.push("DYNAMIC recipient_config must include `emailPath`")
    }
  }

  if (recipientType === "CONDITIONAL") {
    const hasConditions = Array.isArray(config.conditions) && config.conditions.length > 0
    const hasDefault = isHermesRecord(config.default)

    if (!hasConditions && !hasDefault) {
      errors.push("CONDITIONAL recipient_config should include `conditions` or `default`")
    }
  }

  if (recipientType === "LOOKUP" || recipientType === "GROUP") {
    errors.push(`Recipient type ${recipientType} is not implemented in the Hermes runtime yet`)
  }
}

export function parseHermesRuleInput(input: unknown): HermesRuleInputParseResult {
  if (!isHermesRecord(input)) {
    return {
      success: false,
      errors: ["Request body must be a JSON object"],
    }
  }

  const errors: string[] = []
  const name = typeof input.name === "string" ? input.name.trim() : ""
  const description = normalizeNullableString(input.description)
  const eventType = typeof input.event_type === "string" ? input.event_type.trim().toLowerCase() : ""
  const scheduleType = typeof input.schedule_type === "string" ? input.schedule_type.toUpperCase() : "IMMEDIATE"
  const timezone = typeof input.timezone === "string" && input.timezone.trim().length > 0 ? input.timezone.trim() : "UTC"
  const recipientType = typeof input.recipient_type === "string" ? input.recipient_type.toUpperCase() : "STATIC"
  const templateId = normalizeNullableString(input.template_id)
  const priority = typeof input.priority === "number" && Number.isFinite(input.priority)
    ? Math.trunc(input.priority)
    : typeof input.priority === "string" && input.priority.trim().length > 0 && Number.isFinite(Number(input.priority))
      ? Math.trunc(Number(input.priority))
      : 100
  const isActive = typeof input.is_active === "boolean" ? input.is_active : true
  const createdBy = normalizeNullableString(input.created_by)

  if (name.length === 0) {
    errors.push("Rule name is required")
  } else if (name.length > 255) {
    errors.push("Rule name must be at most 255 characters")
  }

  if (eventType.length === 0) {
    errors.push("event_type is required")
  } else if (!/^[a-z0-9.*_-]+(?:\.[a-z0-9.*_-]+)+$/i.test(eventType)) {
    errors.push("event_type must follow the Hermes namespace pattern and may include `*`")
  }

  if (!hermesScheduleTypes.includes(scheduleType as HermesScheduleType)) {
    errors.push(`schedule_type must be one of: ${hermesScheduleTypes.join(", ")}`)
  }

  if (!hermesRecipientTypes.includes(recipientType as HermesRecipientType)) {
    errors.push(`recipient_type must be one of: ${hermesRecipientTypes.join(", ")}`)
  }

  if (!Array.isArray(input.event_conditions)) {
    errors.push("event_conditions must be an array")
  }

  const eventConditions = Array.isArray(input.event_conditions)
    ? input.event_conditions
        .map((entry, index) => {
          const condition = mapHermesRuleCondition(entry)
          if (!condition) {
            errors.push(`event_conditions[${index}] is invalid`)
          }
          return condition
        })
        .filter((entry): entry is HermesRuleCondition => entry !== null)
    : []

  if (!isHermesRecord(input.schedule_config)) {
    errors.push("schedule_config must be a JSON object")
  }

  if (!isHermesRecord(input.recipient_config)) {
    errors.push("recipient_config must be a JSON object")
  }

  const scheduleConfig = isHermesRecord(input.schedule_config) ? coerceHermesJsonObject(input.schedule_config) : {}
  const recipientConfig = isHermesRecord(input.recipient_config) ? coerceHermesJsonObject(input.recipient_config) : {}

  if (typeof templateId === "string" && templateId.length === 0) {
    errors.push("template_id must not be empty")
  }

  validateRecipientConfig({
    recipientType: (recipientType as HermesRecipientType) || "STATIC",
    config: recipientConfig,
    errors,
  })

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    }
  }

  return {
    success: true,
    data: {
      name,
      description,
      event_type: eventType,
      event_conditions: eventConditions,
      schedule_type: scheduleType as HermesScheduleType,
      schedule_config: scheduleConfig,
      timezone,
      recipient_type: recipientType as HermesRecipientType,
      recipient_config: recipientConfig,
      template_id: templateId,
      priority,
      is_active: isActive,
      created_by: createdBy,
    },
  }
}

export async function createHermesRule(input: HermesRuleMutationInput): Promise<HermesRuleRecord> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_rules")
    .insert(input)
    .select(hermesRuleSelectFields)
    .single()

  if (error) {
    throw error
  }

  return mapHermesRuleRow(data as HermesRuleRow)
}

export async function updateHermesRule(id: string, input: HermesRuleMutationInput): Promise<HermesRuleRecord> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_rules")
    .update({
      name: input.name,
      description: input.description,
      event_type: input.event_type,
      event_conditions: input.event_conditions,
      schedule_type: input.schedule_type,
      schedule_config: input.schedule_config,
      timezone: input.timezone,
      recipient_type: input.recipient_type,
      recipient_config: input.recipient_config,
      template_id: input.template_id,
      priority: input.priority,
      is_active: input.is_active,
    })
    .eq("id", id)
    .select(hermesRuleSelectFields)
    .single()

  if (error) {
    throw error
  }

  return mapHermesRuleRow(data as HermesRuleRow)
}
