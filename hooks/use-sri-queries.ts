"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getSriAgents,
  getSriAgentMonthly,
  getSriAgentPerformanceIndex,
  getSriClientHealth,
  getSriAgentClientMonthly,
  getSriAgentApiHistory,
  getSriAvailableMonths,
} from "@/lib/sri-queries"
import type { SriAgentMonthly, SriAgentPerformanceIndex } from "@/lib/supabase"

// ─── Available Months ───────────────────────────────────────────────────────

export function useSriAvailableMonths() {
  return useQuery({
    queryKey: ["sri-months"],
    queryFn: getSriAvailableMonths,
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

// ─── Agent Data ─────────────────────────────────────────────────────────────

export function useSriAgents() {
  return useQuery({
    queryKey: ["sri-agents"],
    queryFn: getSriAgents,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSriAgentMonthly(month: string) {
  return useQuery({
    queryKey: ["sri-agent-monthly", month],
    queryFn: () => getSriAgentMonthly(month),
    enabled: !!month,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSriAgentPerformanceIndex(month: string) {
  return useQuery({
    queryKey: ["sri-agent-api", month],
    queryFn: () => getSriAgentPerformanceIndex(month),
    enabled: !!month,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Combined Agent Data (for ranking) ─────────────────────────────────────────

export function useSriAgentRanking(month: string) {
  const monthly = useSriAgentMonthly(month)
  const apiScores = useSriAgentPerformanceIndex(month)
  const agents = useSriAgents()

  return useQuery({
    queryKey: ["sri-agent-ranking", month],
    queryFn: () => {
      if (!monthly.data || !apiScores.data || !agents.data) return []

      return monthly.data.map((m) => {
        const apiScore = apiScores.data.find((s) => s.agent_id === m.agent_id)
        const agent = agents.data.find((a) => a.agent_id === m.agent_id)
        return {
          ...m,
          api_score: apiScore?.api_score ?? 0,
          agent_name: agent?.name ?? m.agent_id,
          peer_group_label: getPeerGroupLabel(m.peer_group),
        }
      })
    },
    enabled: !!monthly.data && !!apiScores.data && !!agents.data,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Client Health ───────────────────────────────────────────────────────────

export function useSriClientHealth(month: string) {
  return useQuery({
    queryKey: ["sri-client-health", month],
    queryFn: () => getSriClientHealth(month),
    enabled: !!month,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Agent-Client Detail ───────────────────────────────────────────────────────

export function useSriAgentClientMonthly(agentId: string, month: string) {
  return useQuery({
    queryKey: ["sri-agent-client", agentId, month],
    queryFn: () => getSriAgentClientMonthly(agentId, month),
    enabled: !!agentId && !!month,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Agent API History (for sparklines) ────────────────────────────────────────

export function useSriAgentApiHistory(agentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["sri-agent-api-history", agentId],
    queryFn: () => getSriAgentApiHistory(agentId, 12),
    enabled: !!agentId && enabled,
    staleTime: 10 * 60 * 1000,
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeerGroupLabel(group: number): string {
  const labels: Record<number, string> = {
    0: "Grupo 1 — Alto",
    1: "Grupo 2 — Medio-Alto",
    2: "Grupo 3 — Medio-Bajo",
    3: "Grupo 4 — Bajo",
  }
  return labels[group] ?? `Grupo ${group}`
}
