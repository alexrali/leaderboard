import { createHermesAdminClient } from "@/lib/hermes/server"
import type {
  HermesEventRecord,
  HermesJsonObject,
  HermesRuleRecord,
  HermesScheduledTaskRecord,
  HermesTaskStatus,
} from "@/lib/hermes/types"
import { coerceHermesJsonObject, isHermesRecord } from "@/lib/hermes/utils"

const hermesScheduledTaskSelectFields =
  "id, rule_id, event_id, event_data, scheduled_for, processed_at, status, result, retry_count, max_retries, next_retry_at, created_at, updated_at"

type HermesScheduledTaskRow = {
  id: string
  rule_id: string
  event_id: string | null
  event_data: unknown
  scheduled_for: string
  processed_at: string | null
  status: HermesTaskStatus
  result: unknown
  retry_count: number
  max_retries: number
  next_retry_at: string | null
  created_at: string
  updated_at: string
}

function mapHermesScheduledTaskRow(row: HermesScheduledTaskRow): HermesScheduledTaskRecord {
  return {
    id: row.id,
    rule_id: row.rule_id,
    event_id: row.event_id,
    event_data: coerceHermesJsonObject(row.event_data),
    scheduled_for: row.scheduled_for,
    processed_at: row.processed_at,
    status: row.status,
    result: row.result ? coerceHermesJsonObject(row.result) : null,
    retry_count: row.retry_count,
    max_retries: row.max_retries,
    next_retry_at: row.next_retry_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function getNumericConfigValue(config: HermesJsonObject, keys: string[]): number | null {
  for (const key of keys) {
    const value = config[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }

  return null
}

function getStringConfigValue(config: HermesJsonObject, keys: string[]): string | null {
  for (const key of keys) {
    const value = config[key]
    if (typeof value === "string" && value.trim().length > 0) return value.trim()
  }

  return null
}

function calculateScheduledFor(rule: HermesRuleRecord, now = new Date()): string {
  const scheduledAt = new Date(now)

  switch (rule.schedule_type) {
    case "DELAYED": {
      const delayMinutes = getNumericConfigValue(rule.schedule_config, ["delayMinutes", "delay_minutes"]) ?? 0
      const delayHours = getNumericConfigValue(rule.schedule_config, ["delayHours", "delay_hours"]) ?? 0
      const delayDays = getNumericConfigValue(rule.schedule_config, ["delayDays", "delay_days"]) ?? 0
      const totalMinutes = delayMinutes + delayHours * 60 + delayDays * 24 * 60
      scheduledAt.setMinutes(scheduledAt.getMinutes() + Math.max(0, totalMinutes))
      return scheduledAt.toISOString()
    }
    case "SCHEDULED":
    case "RECURRING":
    case "BATCHED": {
      const explicitDate = getStringConfigValue(rule.schedule_config, [
        "scheduledFor",
        "scheduled_for",
        "executeAt",
        "execute_at",
        "nextRunAt",
        "next_run_at",
      ])

      if (explicitDate) {
        const parsed = new Date(explicitDate)
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toISOString()
        }
      }

      const timeString = getStringConfigValue(rule.schedule_config, ["time", "scheduledTime", "scheduled_time"])
      if (timeString) {
        const match = timeString.match(/^(\d{1,2}):(\d{2})$/)
        if (match) {
          const hours = Number(match[1])
          const minutes = Number(match[2])
          const nextRun = new Date(now)
          nextRun.setHours(hours, minutes, 0, 0)
          if (nextRun.getTime() <= now.getTime()) {
            nextRun.setDate(nextRun.getDate() + 1)
          }
          return nextRun.toISOString()
        }
      }

      return scheduledAt.toISOString()
    }
    case "IMMEDIATE":
    default:
      return scheduledAt.toISOString()
  }
}

export async function createHermesScheduledTask(input: {
  rule: HermesRuleRecord
  event: HermesEventRecord
  extractedData?: Record<string, unknown>
}): Promise<HermesScheduledTaskRecord> {
  const supabase = createHermesAdminClient()
  const eventData: HermesJsonObject = {
    eventId: input.event.id,
    eventType: input.event.type,
    eventSource: input.event.source,
    payload: input.event.payload,
    metadata: input.event.metadata,
    extractedData: input.extractedData ? coerceHermesJsonObject(input.extractedData) : {},
  }

  const { data, error } = await supabase
    .from("hermes_scheduled_tasks")
    .insert({
      rule_id: input.rule.id,
      event_id: input.event.id,
      event_data: eventData,
      scheduled_for: calculateScheduledFor(input.rule),
      status: "PENDING",
    })
    .select(hermesScheduledTaskSelectFields)
    .single()

  if (error) {
    throw error
  }

  return mapHermesScheduledTaskRow(data as HermesScheduledTaskRow)
}

export async function getHermesScheduledTaskById(id: string): Promise<HermesScheduledTaskRecord | null> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_scheduled_tasks")
    .select(hermesScheduledTaskSelectFields)
    .eq("id", id)
    .single()

  if (error || !data) {
    return null
  }

  return mapHermesScheduledTaskRow(data as HermesScheduledTaskRow)
}

export async function updateHermesScheduledTask(id: string, updates: {
  status?: HermesTaskStatus
  processed_at?: string | null
  result?: HermesJsonObject | null
  retry_count?: number
  next_retry_at?: string | null
}): Promise<HermesScheduledTaskRecord> {
  const supabase = createHermesAdminClient()
  const payload: Record<string, unknown> = { ...updates }

  if (updates.result !== undefined) {
    payload.result = updates.result
  }

  const { data, error } = await supabase
    .from("hermes_scheduled_tasks")
    .update(payload)
    .eq("id", id)
    .select(hermesScheduledTaskSelectFields)
    .single()

  if (error) {
    throw error
  }

  return mapHermesScheduledTaskRow(data as HermesScheduledTaskRow)
}

function isTaskDue(task: HermesScheduledTaskRecord, now: Date): boolean {
  if (task.status === "PENDING") {
    return new Date(task.scheduled_for).getTime() <= now.getTime()
  }

  if (task.status === "RETRYING") {
    if (task.next_retry_at) {
      return new Date(task.next_retry_at).getTime() <= now.getTime()
    }

    return new Date(task.scheduled_for).getTime() <= now.getTime()
  }

  return false
}

export async function getDueHermesScheduledTasks(limit = 25): Promise<HermesScheduledTaskRecord[]> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_scheduled_tasks")
    .select(hermesScheduledTaskSelectFields)
    .in("status", ["PENDING", "RETRYING"])
    .order("scheduled_for", { ascending: true })
    .limit(limit * 3)

  if (error || !data) {
    return []
  }

  const now = new Date()

  return data
    .map((row) => mapHermesScheduledTaskRow(row as HermesScheduledTaskRow))
    .filter((task) => isTaskDue(task, now))
    .slice(0, limit)
}

export function getHermesTaskRetryTime(task: HermesScheduledTaskRecord): string {
  const minutes = Math.min(60, 5 * 2 ** task.retry_count)
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

export function getHermesTaskEventPayload(task: HermesScheduledTaskRecord): HermesJsonObject {
  const payload = task.event_data.payload
  return isHermesRecord(payload) ? coerceHermesJsonObject(payload) : {}
}
