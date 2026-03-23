import { createHermesAdminClient } from "@/lib/hermes/server"
import type {
  HermesEventRecord,
  HermesResolvedRecipient,
  HermesRuleCondition,
  HermesRuleMatchResult,
  HermesRuleOperator,
  HermesRuleRecord,
} from "@/lib/hermes/types"
import {
  coerceHermesJsonObject,
  getHermesNestedValue,
  isHermesRecord,
  isHermesValidEmail,
} from "@/lib/hermes/utils"

type HermesRuleRow = {
  id: string
  name: string
  description: string | null
  event_type: string
  event_conditions: unknown
  schedule_type: HermesRuleRecord["schedule_type"]
  schedule_config: unknown
  timezone: string
  recipient_type: HermesRuleRecord["recipient_type"]
  recipient_config: unknown
  template_id: string | null
  priority: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

function mapHermesRuleCondition(value: unknown): HermesRuleCondition | null {
  if (!isHermesRecord(value)) return null
  if (typeof value.field !== "string" || value.field.trim().length === 0) return null

  const operator = value.operator
  const validOperators: HermesRuleOperator[] = [
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

  if (typeof operator !== "string" || !validOperators.includes(operator as HermesRuleOperator)) {
    return null
  }

  return {
    field: value.field,
    operator: operator as HermesRuleOperator,
    value: value.value as HermesRuleCondition["value"],
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

const hermesRuleSelectFields =
  "id, name, description, event_type, event_conditions, schedule_type, schedule_config, timezone, recipient_type, recipient_config, template_id, priority, is_active, created_by, created_at, updated_at"

export async function getActiveHermesRules(): Promise<HermesRuleRecord[]> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_rules")
    .select(hermesRuleSelectFields)
    .eq("is_active", true)
    .order("priority", { ascending: true })

  if (error || !data) return []

  return data.map((row) => mapHermesRuleRow(row as HermesRuleRow))
}

export async function getHermesRuleById(id: string): Promise<HermesRuleRecord | null> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_rules")
    .select(hermesRuleSelectFields)
    .eq("id", id)
    .single()

  if (error || !data) return null

  return mapHermesRuleRow(data as HermesRuleRow)
}

export function matchHermesEventType(pattern: string, eventType: string): boolean {
  if (pattern === eventType) return true

  const regexPattern = pattern.replace(/\./g, "\\.").replace(/\*/g, "[^.]+")
  return new RegExp(`^${regexPattern}$`).test(eventType)
}

function toComparableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function evaluateHermesCondition(condition: HermesRuleCondition, payload: Record<string, unknown>) {
  const actualValue = getHermesNestedValue(payload, condition.field)
  const expectedValue = condition.value

  let passed = false

  switch (condition.operator) {
    case "eq":
      passed = actualValue === expectedValue
      break
    case "neq":
      passed = actualValue !== expectedValue
      break
    case "gt": {
      const actual = toComparableNumber(actualValue)
      const expected = toComparableNumber(expectedValue)
      passed = actual !== null && expected !== null && actual > expected
      break
    }
    case "lt": {
      const actual = toComparableNumber(actualValue)
      const expected = toComparableNumber(expectedValue)
      passed = actual !== null && expected !== null && actual < expected
      break
    }
    case "gte": {
      const actual = toComparableNumber(actualValue)
      const expected = toComparableNumber(expectedValue)
      passed = actual !== null && expected !== null && actual >= expected
      break
    }
    case "lte": {
      const actual = toComparableNumber(actualValue)
      const expected = toComparableNumber(expectedValue)
      passed = actual !== null && expected !== null && actual <= expected
      break
    }
    case "contains":
      if (typeof actualValue === "string" && typeof expectedValue === "string") {
        passed = actualValue.includes(expectedValue)
      } else if (Array.isArray(actualValue)) {
        passed = actualValue.includes(expectedValue)
      }
      break
    case "regex":
      if (typeof actualValue === "string" && typeof expectedValue === "string") {
        try {
          passed = new RegExp(expectedValue).test(actualValue)
        } catch {
          passed = false
        }
      }
      break
    case "exists":
      passed = actualValue !== undefined && actualValue !== null
      break
    case "notExists":
      passed = actualValue === undefined || actualValue === null
      break
  }

  return {
    field: condition.field,
    operator: condition.operator,
    expectedValue,
    actualValue,
    passed,
  }
}

function extractHermesRuleData(rule: HermesRuleRecord, event: HermesEventRecord): Record<string, unknown> {
  const extracted: Record<string, unknown> = {
    ...event.payload,
    eventId: event.id,
    eventType: event.type,
    eventSource: event.source,
    eventTimestamp: event.created_at,
  }

  if (rule.recipient_type === "DYNAMIC") {
    const emailPath = typeof rule.recipient_config.emailPath === "string" ? rule.recipient_config.emailPath : undefined
    const namePath = typeof rule.recipient_config.namePath === "string" ? rule.recipient_config.namePath : undefined

    if (emailPath) {
      extracted.recipientEmail = getHermesNestedValue(event.payload, emailPath)
    }

    if (namePath) {
      extracted.recipientName = getHermesNestedValue(event.payload, namePath)
    }
  }

  return extracted
}

export async function analyzeHermesRulesForEvent(event: HermesEventRecord): Promise<HermesRuleMatchResult[]> {
  const rules = await getActiveHermesRules()

  return rules
    .filter((rule) => matchHermesEventType(rule.event_type, event.type))
    .map((rule) => {
      const conditionResults = rule.event_conditions.map((condition) =>
        evaluateHermesCondition(condition, event.payload)
      )

      const matched = conditionResults.every((result) => result.passed)

      return {
        rule,
        matched,
        extractedData: matched ? extractHermesRuleData(rule, event) : {},
        conditionResults,
      }
    })
    .sort((a, b) => a.rule.priority - b.rule.priority)
}

export async function findMatchingHermesRules(event: HermesEventRecord): Promise<HermesRuleMatchResult[]> {
  return (await analyzeHermesRulesForEvent(event)).filter((result) => result.matched)
}

function resolveStaticRecipients(config: Record<string, unknown>): HermesResolvedRecipient[] {
  const rawEmails = Array.isArray(config.emails) ? config.emails : []

  return rawEmails
    .filter((entry): entry is string => typeof entry === "string" && isHermesValidEmail(entry))
    .map((email) => ({ email }))
}

function resolveDynamicRecipients(config: Record<string, unknown>, event: HermesEventRecord): HermesResolvedRecipient[] {
  const emailPath = typeof config.emailPath === "string" ? config.emailPath : undefined
  const namePath = typeof config.namePath === "string" ? config.namePath : undefined

  if (!emailPath) return []

  const email = getHermesNestedValue(event.payload, emailPath)
  if (typeof email !== "string" || !isHermesValidEmail(email)) return []

  const nameValue = namePath ? getHermesNestedValue(event.payload, namePath) : undefined

  return [
    {
      email,
      name: typeof nameValue === "string" ? nameValue : null,
    },
  ]
}

function resolveConditionalRecipients(config: Record<string, unknown>, event: HermesEventRecord): HermesResolvedRecipient[] {
  const rawConditions = Array.isArray(config.conditions) ? config.conditions : []

  for (const rawCondition of rawConditions) {
    if (!isHermesRecord(rawCondition)) continue

    const when = Array.isArray(rawCondition.when)
      ? rawCondition.when
          .map((entry) => mapHermesRuleCondition(entry))
          .filter((entry): entry is HermesRuleCondition => entry !== null)
      : []

    const matches = when.every((condition) => evaluateHermesCondition(condition, event.payload).passed)
    if (!matches) continue

    if (!isHermesRecord(rawCondition.then)) return []

    if (Array.isArray(rawCondition.then.emails)) {
      return resolveStaticRecipients(rawCondition.then)
    }

    return resolveDynamicRecipients(rawCondition.then, event)
  }

  if (isHermesRecord(config.default)) {
    if (Array.isArray(config.default.emails)) {
      return resolveStaticRecipients(config.default)
    }

    return resolveDynamicRecipients(config.default, event)
  }

  return []
}

export function resolveHermesRecipients(rule: HermesRuleRecord, event: HermesEventRecord): HermesResolvedRecipient[] {
  switch (rule.recipient_type) {
    case "STATIC":
      return resolveStaticRecipients(rule.recipient_config)
    case "DYNAMIC":
      return resolveDynamicRecipients(rule.recipient_config, event)
    case "CONDITIONAL":
      return resolveConditionalRecipients(rule.recipient_config, event)
    case "LOOKUP":
    case "GROUP":
      throw new Error(`Recipient type ${rule.recipient_type} is not implemented yet`)
  }
}

export function resolveHermesRecipientsWithDebug(rule: HermesRuleRecord, event: HermesEventRecord) {
  try {
    return {
      recipients: resolveHermesRecipients(rule, event),
      error: null,
    }
  } catch (error) {
    return {
      recipients: [] as HermesResolvedRecipient[],
      error: error instanceof Error ? error.message : "Unknown recipient resolution error",
    }
  }
}
