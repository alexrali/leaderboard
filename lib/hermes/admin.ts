import { createHermesAdminClient } from "@/lib/hermes/server"
import type {
  HermesDeliveryStatus,
  HermesEventStatus,
  HermesJsonObject,
  HermesRuleCondition,
  HermesTaskStatus,
  HermesTemplateVariable,
} from "@/lib/hermes/types"
import { coerceHermesJsonObject } from "@/lib/hermes/utils"

export interface HermesAdminSummary {
  totalTemplates: number
  activeTemplates: number
  totalRules: number
  activeRules: number
  pendingEvents: number
  failedEvents: number
  pendingTasks: number
  retryingTasks: number
  sentToday: number
  failedToday: number
}

export interface HermesAdminTemplateListItem {
  id: string
  name: string
  slug: string
  description: string | null
  subject: string
  from_email: string | null
  from_name: string | null
  reply_to: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HermesAdminRuleListItem {
  id: string
  name: string
  description: string | null
  event_type: string
  schedule_type: string
  recipient_type: string
  template_id: string | null
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HermesAdminEventListItem {
  id: string
  type: string
  source: string
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

export interface HermesAdminScheduledTaskListItem {
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

export interface HermesAdminDeliveryLogListItem {
  id: string
  event_id: string | null
  rule_id: string | null
  template_id: string | null
  recipient_email: string
  recipient_name: string | null
  subject: string | null
  resend_id: string | null
  resend_status: string | null
  status: HermesDeliveryStatus
  error_message: string | null
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  created_at: string
}

export interface HermesAdminDeliveryLogDetail extends HermesAdminDeliveryLogListItem {
  user_id: string | null
  metadata: HermesJsonObject
}

export interface HermesAdminRecentConfigChange {
  id: string
  kind: "TEMPLATE" | "RULE"
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

const hermesTemplateListSelect =
  "id, name, slug, description, subject, from_email, from_name, reply_to, is_active, created_at, updated_at"
const hermesTemplateDetailSelect =
  "id, name, slug, description, subject, html_content, text_content, variables, default_values, from_email, from_name, reply_to, is_active, created_at, updated_at"
const hermesRuleListSelect =
  "id, name, description, event_type, schedule_type, recipient_type, template_id, priority, is_active, created_at, updated_at"
const hermesRuleDetailSelect =
  "id, name, description, event_type, event_conditions, schedule_type, schedule_config, timezone, recipient_type, recipient_config, template_id, priority, is_active, created_by, created_at, updated_at"
const hermesEventSelect =
  "id, type, source, external_id, payload, metadata, status, processed_at, error_message, retry_count, created_at, updated_at"
const hermesScheduledTaskSelect =
  "id, rule_id, event_id, event_data, scheduled_for, processed_at, status, result, retry_count, max_retries, next_retry_at, created_at, updated_at"
const hermesDeliveryLogListSelect =
  "id, event_id, rule_id, template_id, recipient_email, recipient_name, subject, resend_id, resend_status, status, error_message, sent_at, delivered_at, opened_at, clicked_at, created_at"
const hermesDeliveryLogDetailSelect =
  "id, event_id, rule_id, user_id, template_id, recipient_email, recipient_name, subject, resend_id, resend_status, status, error_message, sent_at, delivered_at, opened_at, clicked_at, metadata, created_at"
const hermesRecentRuleChangeSelect = "id, name, is_active, created_at, updated_at, created_by"
const hermesRecentTemplateChangeSelect = "id, name, is_active, created_at, updated_at"

function normalizeLimit(limit: number | undefined, fallback = 25, max = 100): number {
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit <= 0) {
    return fallback
  }

  return Math.min(Math.floor(limit), max)
}

async function countAllRows(table: string): Promise<number> {
  const supabase = createHermesAdminClient()
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true })

  if (error) {
    throw error
  }

  return count ?? 0
}

async function countRowsByBoolean(table: string, field: string, value: boolean): Promise<number> {
  const supabase = createHermesAdminClient()
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(field, value)

  if (error) {
    throw error
  }

  return count ?? 0
}

async function countRowsByStatus(table: string, status: string): Promise<number> {
  const supabase = createHermesAdminClient()
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("status", status)

  if (error) {
    throw error
  }

  return count ?? 0
}

async function countDeliveryRowsToday(input: { failedOnly: boolean; startOfDay: string }): Promise<number> {
  const supabase = createHermesAdminClient()
  let query = supabase
    .from("hermes_delivery_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", input.startOfDay)

  query = input.failedOnly ? query.eq("status", "FAILED") : query.neq("status", "FAILED")

  const { count, error } = await query

  if (error) {
    throw error
  }

  return count ?? 0
}

function getStartOfDayIso(): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString()
}

function coerceHermesTemplateVariables(value: unknown): HermesTemplateVariable[] {
  return Array.isArray(value) ? (value as HermesTemplateVariable[]) : []
}

function coerceHermesRuleConditions(value: unknown): HermesRuleCondition[] {
  return Array.isArray(value) ? (value as HermesRuleCondition[]) : []
}

function mapHermesAdminTemplateDetail(
  row: HermesAdminTemplateListItem & {
    html_content: string
    text_content: string | null
    variables: unknown
    default_values: unknown
  }
): HermesAdminTemplateDetail {
  return {
    ...row,
    variables: coerceHermesTemplateVariables(row.variables),
    default_values: coerceHermesJsonObject(row.default_values),
  }
}

function mapHermesAdminRuleDetail(
  row: HermesAdminRuleListItem & {
    event_conditions: unknown
    schedule_config: unknown
    timezone: string
    recipient_config: unknown
    created_by: string | null
  }
): HermesAdminRuleDetail {
  return {
    ...row,
    event_conditions: coerceHermesRuleConditions(row.event_conditions),
    schedule_config: coerceHermesJsonObject(row.schedule_config),
    recipient_config: coerceHermesJsonObject(row.recipient_config),
  }
}

function mapHermesAdminEventRow(
  row: Omit<HermesAdminEventListItem, "payload" | "metadata"> & { payload: unknown; metadata: unknown }
): HermesAdminEventListItem {
  return {
    ...row,
    payload: coerceHermesJsonObject(row.payload),
    metadata: coerceHermesJsonObject(row.metadata),
  }
}

function mapHermesAdminScheduledTaskRow(
  row: Omit<HermesAdminScheduledTaskListItem, "event_data" | "result"> & { event_data: unknown; result: unknown }
): HermesAdminScheduledTaskListItem {
  return {
    ...row,
    event_data: coerceHermesJsonObject(row.event_data),
    result: row.result ? coerceHermesJsonObject(row.result) : null,
  }
}

function mapHermesAdminDeliveryLogDetail(
  row: HermesAdminDeliveryLogListItem & { user_id: string | null; metadata: unknown }
): HermesAdminDeliveryLogDetail {
  return {
    ...row,
    metadata: coerceHermesJsonObject(row.metadata),
  }
}

export async function getHermesAdminSummary(): Promise<HermesAdminSummary> {
  const startOfDay = getStartOfDayIso()

  const [
    totalTemplates,
    activeTemplates,
    totalRules,
    activeRules,
    pendingEvents,
    failedEvents,
    pendingTasks,
    retryingTasks,
    sentToday,
    failedToday,
  ] = await Promise.all([
    countAllRows("hermes_templates"),
    countRowsByBoolean("hermes_templates", "is_active", true),
    countAllRows("hermes_rules"),
    countRowsByBoolean("hermes_rules", "is_active", true),
    countRowsByStatus("hermes_events", "PENDING"),
    countRowsByStatus("hermes_events", "FAILED"),
    countRowsByStatus("hermes_scheduled_tasks", "PENDING"),
    countRowsByStatus("hermes_scheduled_tasks", "RETRYING"),
    countDeliveryRowsToday({ failedOnly: false, startOfDay }),
    countDeliveryRowsToday({ failedOnly: true, startOfDay }),
  ])

  return {
    totalTemplates,
    activeTemplates,
    totalRules,
    activeRules,
    pendingEvents,
    failedEvents,
    pendingTasks,
    retryingTasks,
    sentToday,
    failedToday,
  }
}

export async function listHermesAdminTemplates(limit?: number): Promise<HermesAdminTemplateListItem[]> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_templates")
    .select(hermesTemplateListSelect)
    .order("updated_at", { ascending: false })
    .limit(normalizeLimit(limit, 50))

  if (error || !data) {
    return []
  }

  return data as HermesAdminTemplateListItem[]
}

export async function getHermesAdminTemplate(id: string): Promise<HermesAdminTemplateDetail | null> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_templates")
    .select(hermesTemplateDetailSelect)
    .eq("id", id)
    .single()

  if (error || !data) {
    return null
  }

  return mapHermesAdminTemplateDetail(
    data as HermesAdminTemplateListItem & {
      html_content: string
      text_content: string | null
      variables: unknown
      default_values: unknown
    }
  )
}

export async function listHermesAdminRules(limit?: number): Promise<HermesAdminRuleListItem[]> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_rules")
    .select(hermesRuleListSelect)
    .order("priority", { ascending: true })
    .limit(normalizeLimit(limit, 50))

  if (error || !data) {
    return []
  }

  return data as HermesAdminRuleListItem[]
}

export async function getHermesAdminRule(id: string): Promise<HermesAdminRuleDetail | null> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_rules")
    .select(hermesRuleDetailSelect)
    .eq("id", id)
    .single()

  if (error || !data) {
    return null
  }

  return mapHermesAdminRuleDetail(
    data as HermesAdminRuleListItem & {
      event_conditions: unknown
      schedule_config: unknown
      timezone: string
      recipient_config: unknown
      created_by: string | null
    }
  )
}

export async function listHermesAdminEvents(input: {
  limit?: number
  status?: HermesEventStatus | "ALL"
} = {}): Promise<HermesAdminEventListItem[]> {
  const supabase = createHermesAdminClient()
  let query = supabase
    .from("hermes_events")
    .select(hermesEventSelect)
    .order("created_at", { ascending: false })
    .limit(normalizeLimit(input.limit, 25))

  if (input.status && input.status !== "ALL") {
    query = query.eq("status", input.status)
  }

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data.map((row) =>
    mapHermesAdminEventRow(
      row as Omit<HermesAdminEventListItem, "payload" | "metadata"> & { payload: unknown; metadata: unknown }
    )
  )
}

export async function getHermesAdminEvent(id: string): Promise<HermesAdminEventListItem | null> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_events")
    .select(hermesEventSelect)
    .eq("id", id)
    .single()

  if (error || !data) {
    return null
  }

  return mapHermesAdminEventRow(
    data as Omit<HermesAdminEventListItem, "payload" | "metadata"> & { payload: unknown; metadata: unknown }
  )
}

export async function listHermesAdminScheduledTasks(input: {
  limit?: number
  status?: HermesTaskStatus | "ALL"
} = {}): Promise<HermesAdminScheduledTaskListItem[]> {
  const supabase = createHermesAdminClient()
  let query = supabase
    .from("hermes_scheduled_tasks")
    .select(hermesScheduledTaskSelect)
    .order("scheduled_for", { ascending: false })
    .limit(normalizeLimit(input.limit, 25))

  if (input.status && input.status !== "ALL") {
    query = query.eq("status", input.status)
  }

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data.map((row) =>
    mapHermesAdminScheduledTaskRow(
      row as Omit<HermesAdminScheduledTaskListItem, "event_data" | "result"> & {
        event_data: unknown
        result: unknown
      }
    )
  )
}

export async function getHermesAdminScheduledTask(id: string): Promise<HermesAdminScheduledTaskListItem | null> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_scheduled_tasks")
    .select(hermesScheduledTaskSelect)
    .eq("id", id)
    .single()

  if (error || !data) {
    return null
  }

  return mapHermesAdminScheduledTaskRow(
    data as Omit<HermesAdminScheduledTaskListItem, "event_data" | "result"> & {
      event_data: unknown
      result: unknown
    }
  )
}

export async function listHermesAdminDeliveryLogs(input: {
  limit?: number
  status?: HermesDeliveryStatus | "ALL"
} = {}): Promise<HermesAdminDeliveryLogListItem[]> {
  const supabase = createHermesAdminClient()
  let query = supabase
    .from("hermes_delivery_logs")
    .select(hermesDeliveryLogListSelect)
    .order("created_at", { ascending: false })
    .limit(normalizeLimit(input.limit, 25))

  if (input.status && input.status !== "ALL") {
    query = query.eq("status", input.status)
  }

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data as HermesAdminDeliveryLogListItem[]
}

export async function getHermesAdminDeliveryLog(id: string): Promise<HermesAdminDeliveryLogDetail | null> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_delivery_logs")
    .select(hermesDeliveryLogDetailSelect)
    .eq("id", id)
    .single()

  if (error || !data) {
    return null
  }

  return mapHermesAdminDeliveryLogDetail(
    data as HermesAdminDeliveryLogListItem & { user_id: string | null; metadata: unknown }
  )
}

export async function listHermesAdminRulesByTemplate(
  templateId: string,
  limit?: number
): Promise<HermesAdminRuleListItem[]> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_rules")
    .select(hermesRuleListSelect)
    .eq("template_id", templateId)
    .order("priority", { ascending: true })
    .limit(normalizeLimit(limit, 20))

  if (error || !data) {
    return []
  }

  return data as HermesAdminRuleListItem[]
}

export async function listHermesAdminTasksByRule(
  ruleId: string,
  limit?: number
): Promise<HermesAdminScheduledTaskListItem[]> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_scheduled_tasks")
    .select(hermesScheduledTaskSelect)
    .eq("rule_id", ruleId)
    .order("scheduled_for", { ascending: false })
    .limit(normalizeLimit(limit, 20))

  if (error || !data) {
    return []
  }

  return data.map((row) =>
    mapHermesAdminScheduledTaskRow(
      row as Omit<HermesAdminScheduledTaskListItem, "event_data" | "result"> & {
        event_data: unknown
        result: unknown
      }
    )
  )
}

export async function listHermesAdminTasksByEvent(
  eventId: string,
  limit?: number
): Promise<HermesAdminScheduledTaskListItem[]> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_scheduled_tasks")
    .select(hermesScheduledTaskSelect)
    .eq("event_id", eventId)
    .order("scheduled_for", { ascending: false })
    .limit(normalizeLimit(limit, 20))

  if (error || !data) {
    return []
  }

  return data.map((row) =>
    mapHermesAdminScheduledTaskRow(
      row as Omit<HermesAdminScheduledTaskListItem, "event_data" | "result"> & {
        event_data: unknown
        result: unknown
      }
    )
  )
}

export async function listHermesAdminDeliveryLogsByRule(
  ruleId: string,
  limit?: number
): Promise<HermesAdminDeliveryLogListItem[]> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_delivery_logs")
    .select(hermesDeliveryLogListSelect)
    .eq("rule_id", ruleId)
    .order("created_at", { ascending: false })
    .limit(normalizeLimit(limit, 20))

  if (error || !data) {
    return []
  }

  return data as HermesAdminDeliveryLogListItem[]
}

export async function listHermesAdminDeliveryLogsByEvent(
  eventId: string,
  limit?: number
): Promise<HermesAdminDeliveryLogListItem[]> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_delivery_logs")
    .select(hermesDeliveryLogListSelect)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(normalizeLimit(limit, 20))

  if (error || !data) {
    return []
  }

  return data as HermesAdminDeliveryLogListItem[]
}
