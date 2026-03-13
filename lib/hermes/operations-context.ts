import { createHermesAdminClient } from "@/lib/hermes/server"
import {
  getHermesAdminSummary,
  listHermesAdminEvents,
  listHermesAdminScheduledTasks,
} from "@/lib/hermes/admin"
import type {
  HermesAdminEventListItem,
  HermesAdminRecentConfigChange,
  HermesAdminScheduledTaskListItem,
  HermesAdminSummary,
} from "@/lib/hermes/admin"

const hermesRecentRuleChangeSelect = "id, name, is_active, created_at, updated_at, created_by"
const hermesRecentTemplateChangeSelect = "id, name, is_active, created_at, updated_at"

export interface HermesOperationsContextData {
  summary: HermesAdminSummary
  failedEvents: HermesAdminEventListItem[]
  retryingTasks: HermesAdminScheduledTaskListItem[]
  recentConfigChanges: HermesAdminRecentConfigChange[]
}

function normalizeLimit(limit: number, fallback = 8, max = 20): number {
  if (!Number.isFinite(limit) || limit <= 0) {
    return fallback
  }

  return Math.min(Math.floor(limit), max)
}

export async function listHermesAdminRecentConfigChanges(limit = 8): Promise<HermesAdminRecentConfigChange[]> {
  const supabase = createHermesAdminClient()
  const normalizedLimit = normalizeLimit(limit)

  const [templatesResult, rulesResult] = await Promise.all([
    supabase
      .from("hermes_templates")
      .select(hermesRecentTemplateChangeSelect)
      .order("updated_at", { ascending: false })
      .limit(normalizedLimit),
    supabase
      .from("hermes_rules")
      .select(hermesRecentRuleChangeSelect)
      .order("updated_at", { ascending: false })
      .limit(normalizedLimit),
  ])

  const templates = (templatesResult.data ?? []).map((row) => ({
    id: row.id as string,
    kind: "TEMPLATE" as const,
    name: row.name as string,
    is_active: Boolean(row.is_active),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    created_by: null,
  }))

  const rules = (rulesResult.data ?? []).map((row) => ({
    id: row.id as string,
    kind: "RULE" as const,
    name: row.name as string,
    is_active: Boolean(row.is_active),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    created_by: (row.created_by as string | null) ?? null,
  }))

  return [...templates, ...rules]
    .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())
    .slice(0, normalizedLimit)
}

export async function getHermesOperationsContextData(): Promise<HermesOperationsContextData> {
  const [summary, failedEvents, retryingTasks, recentConfigChanges] = await Promise.all([
    getHermesAdminSummary(),
    listHermesAdminEvents({ limit: 8, status: "FAILED" }),
    listHermesAdminScheduledTasks({ limit: 8, status: "RETRYING" }),
    listHermesAdminRecentConfigChanges(8),
  ])

  return {
    summary,
    failedEvents,
    retryingTasks,
    recentConfigChanges,
  }
}
