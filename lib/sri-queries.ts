import { supabase } from "./supabase"
import type {
  SriAgent,
  SriClient,
  SriAgentMonthly,
  SriClientHealth,
  SriAgentPerformanceIndex,
  SriAgentClientMonthly,
} from "./supabase"

// ─── Agent Dimension ───────────────────────────────────────────────────────

export async function getSriAgents(): Promise<SriAgent[]> {
  const { data, error } = await supabase
    .from("sri_agents")
    .select("*")
    .eq("active", true)
    .order("agent_id")

  if (error) throw error
  return data ?? []
}

// ─── Agent Monthly with API Score ────────────────────────────────────────────

export async function getSriAgentMonthly(
  month: string
): Promise<SriAgentMonthly[]> {
  const { data, error } = await supabase
    .from("sri_agent_monthly")
    .select("*")
    .eq("month", month)
    .order("total_revenue", { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getSriAgentPerformanceIndex(
  month: string
): Promise<SriAgentPerformanceIndex[]> {
  const { data, error } = await supabase
    .from("sri_agent_performance_index")
    .select("*")
    .eq("month", month)

  if (error) throw error
  return data ?? []
}

// ─── Historical API Scores (for sparklines) ───────────────────────────────────

export async function getSriAgentApiHistory(
  agentId: string,
  months: number = 12
): Promise<{ month: string; api_score: number }[]> {
  const { data, error } = await supabase
    .from("sri_agent_performance_index")
    .select("month, api_score")
    .eq("agent_id", agentId)
    .order("month", { ascending: true })
    .limit(months)

  if (error) throw error
  return data ?? []
}

// ─── Client Health ─────────────────────────────────────────────────────────

export async function getSriClientHealth(
  month: string
): Promise<SriClientHealth[]> {
  const { data, error } = await supabase
    .from("sri_client_health")
    .select("*")
    .eq("month", month)
    .order("monetary", { ascending: false })

  if (error) throw error
  return data ?? []
}

// ─── Agent-Client Monthly ───────────────────────────────────────────────────

export async function getSriAgentClientMonthly(
  agentId: string,
  month: string
): Promise<SriAgentClientMonthly[]> {
  const { data, error } = await supabase
    .from("sri_agent_client_monthly")
    .select("*")
    .eq("agent_id", agentId)
    .eq("month", month)
    .order("revenue", { ascending: false })

  if (error) throw error
  return data ?? []
}

// ─── Available Months ───────────────────────────────────────────────────────

export async function getSriAvailableMonths(): Promise<string[]> {
  const { data, error } = await supabase
    .from("sri_agent_monthly")
    .select("month")
    .order("month", { ascending: false })

  if (error) throw error
  const months = data?.map((d) => d.month) ?? []
  const uniqueMonths = Array.from(new Set(months))
  return uniqueMonths
}
