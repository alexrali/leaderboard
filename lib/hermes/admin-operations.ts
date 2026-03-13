import { createHermesAdminClient } from "@/lib/hermes/server"
import { updateHermesScheduledTask } from "@/lib/hermes/tasks"
import { processHermesEvent, processHermesScheduledTask } from "@/lib/hermes/runtime"
import type { HermesEventStatus, HermesTaskStatus } from "@/lib/hermes/types"

function normalizeLimit(limit: number | undefined, fallback = 10, max = 100) {
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit <= 0) {
    return fallback
  }

  return Math.min(Math.floor(limit), max)
}

async function getHermesEventIdsByStatus(status: HermesEventStatus | "ALL", limit: number): Promise<string[]> {
  const supabase = createHermesAdminClient()
  let query = supabase
    .from("hermes_events")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (status !== "ALL") {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data.map((row) => row.id as string)
}

async function getHermesTaskIdsByStatuses(statuses: HermesTaskStatus[], limit: number): Promise<string[]> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_scheduled_tasks")
    .select("id")
    .in("status", statuses)
    .order("scheduled_for", { ascending: true })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data.map((row) => row.id as string)
}

export async function bulkReprocessHermesEvents(input: {
  ids?: string[]
  status?: HermesEventStatus | "ALL"
  limit?: number
}) {
  const targetIds = input.ids && input.ids.length > 0
    ? input.ids
    : await getHermesEventIdsByStatus(input.status ?? "FAILED", normalizeLimit(input.limit))

  const results = [] as Array<{ id: string; success: boolean; error?: string; status?: string }>

  for (const id of targetIds) {
    try {
      const result = await processHermesEvent(id)
      results.push({ id, success: true, status: result.status })
    } catch (error) {
      results.push({ id, success: false, error: error instanceof Error ? error.message : "Internal server error" })
    }
  }

  return {
    processedCount: results.length,
    successCount: results.filter((entry) => entry.success).length,
    failureCount: results.filter((entry) => !entry.success).length,
    results,
  }
}

export async function bulkRetryHermesTasks(input: {
  ids?: string[]
  statuses?: HermesTaskStatus[]
  limit?: number
}) {
  const statuses: HermesTaskStatus[] =
    input.statuses && input.statuses.length > 0 ? input.statuses : ["FAILED", "RETRYING", "PENDING"]
  const targetIds = input.ids && input.ids.length > 0
    ? input.ids
    : await getHermesTaskIdsByStatuses(statuses, normalizeLimit(input.limit))

  const results = [] as Array<{ id: string; success: boolean; error?: string; status?: string }>

  for (const id of targetIds) {
    try {
      const result = await processHermesScheduledTask(id)
      results.push({ id, success: true, status: result.status })
    } catch (error) {
      results.push({ id, success: false, error: error instanceof Error ? error.message : "Internal server error" })
    }
  }

  return {
    processedCount: results.length,
    successCount: results.filter((entry) => entry.success).length,
    failureCount: results.filter((entry) => !entry.success).length,
    results,
  }
}

export async function bulkCancelHermesTasks(input: {
  ids?: string[]
  statuses?: HermesTaskStatus[]
  limit?: number
}) {
  const statuses: HermesTaskStatus[] =
    input.statuses && input.statuses.length > 0 ? input.statuses : ["PENDING", "RETRYING", "PROCESSING"]
  const targetIds = input.ids && input.ids.length > 0
    ? input.ids
    : await getHermesTaskIdsByStatuses(statuses, normalizeLimit(input.limit))

  const results = [] as Array<{ id: string; success: boolean; error?: string; status?: string }>

  for (const id of targetIds) {
    try {
      const task = await updateHermesScheduledTask(id, {
        status: "CANCELLED",
        processed_at: null,
        next_retry_at: null,
      })
      results.push({ id, success: true, status: task.status })
    } catch (error) {
      results.push({ id, success: false, error: error instanceof Error ? error.message : "Internal server error" })
    }
  }

  return {
    processedCount: results.length,
    successCount: results.filter((entry) => entry.success).length,
    failureCount: results.filter((entry) => !entry.success).length,
    results,
  }
}
