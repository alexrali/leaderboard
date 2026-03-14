import type { AgentWithApiScore } from "./supabase"

export interface AgentSignal {
  agentId: string
  agentName: string
  peerGroup: number
  level: "ALTO" | "MEDIO" | "POSITIVO"
  type: string
  message: string
  value: number
  revenue: number
}

/**
 * Calculate average CPI for a peer group
 */
export function calculatePeerCpiAverage(
  peerGroup: number,
  agents: AgentWithApiScore[]
): number {
  const peerAgents = agents.filter((a) => a.peer_group === peerGroup)
  if (peerAgents.length === 0) return 0

  const total = peerAgents.reduce((sum, a) => sum + (a.avg_cpi || 0), 0)
  return total / peerAgents.length
}

/**
 * Calculate average cross-sell ratio for a peer group
 */
export function calculatePeerCrossSellAverage(
  peerGroup: number,
  agents: AgentWithApiScore[]
): number {
  const peerAgents = agents.filter((a) => a.peer_group === peerGroup)
  if (peerAgents.length === 0) return 0

  const agentsWithCrossSell = peerAgents.filter((a) => a.cross_sell_rate != null)
  if (agentsWithCrossSell.length === 0) return 0

  const total = agentsWithCrossSell.reduce((sum, a) => sum + (a.cross_sell_rate || 0), 0)
  return total / agentsWithCrossSell.length
}

/**
 * Generate signals from agent data based on business rules
 */
export function generateAgentSignals(agents: AgentWithApiScore[]): AgentSignal[] {
  const signals: AgentSignal[] = []

  for (const agent of agents) {
    const retention = agent.client_retention_rate || 0
    const dormant = agent.pct_dormant || 0
    const concentration = agent.portfolio_concentration_top3 || 0
    const cpi = agent.avg_cpi || 0
    const revenue = agent.total_revenue || 0
    const revenueGrowth = agent.revenue_growth_mom || 0
    const crossSell = agent.cross_sell_rate || 0
    const peerPctRevenue = agent.peer_pct_total_revenue || 0

    // CRITICAL (ALTO) signals
    if (retention < 80) {
      signals.push({
        agentId: agent.agent_id,
        agentName: agent.agent_name,
        peerGroup: agent.peer_group,
        level: "ALTO",
        type: "Retención",
        message: `Retención por debajo de 80% (${retention.toFixed(1)}%)`,
        value: retention,
        revenue,
      })
    }

    if (dormant > 15) {
      signals.push({
        agentId: agent.agent_id,
        agentName: agent.agent_name,
        peerGroup: agent.peer_group,
        level: "ALTO",
        type: "Dormido",
        message: `Cartera dormida por encima de 15% (${dormant.toFixed(1)}%)`,
        value: dormant,
        revenue,
      })
    }

    if (concentration > 60) {
      signals.push({
        agentId: agent.agent_id,
        agentName: agent.agent_name,
        peerGroup: agent.peer_group,
        level: "ALTO",
        type: "Concentración",
        message: `Concentración por encima de 60% (${concentration.toFixed(1)}%)`,
        value: concentration,
        revenue,
      })
    }

    // WARNING (MEDIO) signals
    if (cpi < 70 && retention >= 80) {
      const peerAvg = calculatePeerCpiAverage(agent.peer_group, agents)
      signals.push({
        agentId: agent.agent_id,
        agentName: agent.agent_name,
        peerGroup: agent.peer_group,
        level: "MEDIO",
        type: "CPI",
        message: `CPI por debajo de 70% (${cpi.toFixed(1)}%). Promedio peer: ${peerAvg.toFixed(1)}%`,
        value: cpi,
        revenue,
      })
    }

    if (revenueGrowth < 0 && peerPctRevenue > 50) {
      signals.push({
        agentId: agent.agent_id,
        agentName: agent.agent_name,
        peerGroup: agent.peer_group,
        level: "MEDIO",
        type: "Crecimiento",
        message: `Crecimiento negativo (${revenueGrowth.toFixed(1)}%) con alto peso en cartera (${peerPctRevenue.toFixed(1)}%)`,
        value: revenueGrowth,
        revenue,
      })
    }

    // POSITIVE (POSITIVO) signals
    if (peerPctRevenue >= 60) {
      signals.push({
        agentId: agent.agent_id,
        agentName: agent.agent_name,
        peerGroup: agent.peer_group,
        level: "POSITIVO",
        type: "Líder",
        message: `Líder de grupo con ${peerPctRevenue.toFixed(1)}% de la cartera del peer`,
        value: peerPctRevenue,
        revenue,
      })
    }

    if (crossSell > 90) {
      const peerAvg = calculatePeerCrossSellAverage(agent.peer_group, agents)
      signals.push({
        agentId: agent.agent_id,
        agentName: agent.agent_name,
        peerGroup: agent.peer_group,
        level: "POSITIVO",
        type: "Cross-sell",
        message: `Cross-sell excepcional (${crossSell.toFixed(1)}%). Promedio peer: ${peerAvg.toFixed(1)}%`,
        value: crossSell,
        revenue,
      })
    }
  }

  return signals
}

/**
 * Group signals by agent for summary table
 */
export function groupSignalsByAgent(
  signals: AgentSignal[]
): Map<string, { alto: number; medio: number; positivo: number }> {
  const grouped = new Map<string, { alto: number; medio: number; positivo: number }>()

  for (const signal of signals) {
    const existing = grouped.get(signal.agentId) ?? { alto: 0, medio: 0, positivo: 0 }

    if (signal.level === "ALTO") {
      existing.alto += 1
    } else if (signal.level === "MEDIO") {
      existing.medio += 1
    } else if (signal.level === "POSITIVO") {
      existing.positivo += 1
    }

    grouped.set(signal.agentId, existing)
  }

  return grouped
}
