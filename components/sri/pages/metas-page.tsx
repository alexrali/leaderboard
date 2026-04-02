"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { useSriAgentRanking } from "@/hooks/use-sri-queries"
import { useAppStore } from "@/lib/store"
import { PageFadeIn, staggerContainer, staggerItem } from "@/components/sri/animations"
import { StatusBadge, getStatusLevel } from "@/components/sri/status-badge"
import { formatPercent } from "@/lib/format"

// Goal thresholds
const GOAL_THRESHOLD_REVENUE = 1.05 // 5% growth
const GOAL_THRESHOLD_ACTIVATION = 0.85 // 85% active
const GOAL_THRESHOLD_RETENTION = 0.80 // 80% retention
const GOAL_THRESHOLD_CPI = 0.72 // 72% CPI

// Types for goal calculations
type AgentGoals = {
  agent_id: string
  agent_name: string
  revenue_achievement: number // percentage of goal
  activation_achievement: number // percentage of goal
  retention_achievement: number // percentage of goal
  cpi_achievement: number // percentage of goal
  overall_achievement: number // average of 4 metrics
  status: "completed" | "in-progress" | "at-risk"
}

type StatusSummary = {
  completed: number // count of agents with overall >= 100%
  inProgress: number // count with 80-99%
  atRisk: number // count with < 80%
  avgRevenueAchievement: number // team average
}

// Calculate agent goals from monthly data
function calculateAgentGoals(
  agent: {
    agent_id: string
    agent_name: string
    revenue_growth_mom: number
    pct_active: number
    client_retention_rate: number
    avg_cpi: number
  }
): AgentGoals {
  // Revenue achievement: actual growth / goal (5%)
  const revenueAchievement = agent.revenue_growth_mom / GOAL_THRESHOLD_REVENUE

  // Activation achievement: actual active % / goal (85%)
  const activationAchievement = agent.pct_active / GOAL_THRESHOLD_ACTIVATION

  // Retention achievement: actual retention / goal (80%)
  const retentionAchievement = agent.client_retention_rate / GOAL_THRESHOLD_RETENTION

  // CPI achievement: actual CPI / goal (0.72)
  const cpiAchievement = agent.avg_cpi / GOAL_THRESHOLD_CPI

  // Overall: average of 4 achievements
  const overallAchievement =
    (revenueAchievement + activationAchievement + retentionAchievement + cpiAchievement) / 4

  // Status based on overall achievement
  const status: AgentGoals["status"] =
    overallAchievement >= 1.0
      ? "completed"
      : overallAchievement >= 0.8
        ? "in-progress"
        : "at-risk"

  return {
    agent_id: agent.agent_id,
    agent_name: agent.agent_name,
    revenue_achievement: revenueAchievement,
    activation_achievement: activationAchievement,
    retention_achievement: retentionAchievement,
    cpi_achievement: cpiAchievement,
    overall_achievement: overallAchievement,
    status,
  }
}

// Status Summary Card Component
interface StatusSummaryCardProps {
  label: string
  value: number | string
  percentage?: number
  variant: "success" | "warning" | "critical" | "neutral"
}

function StatusSummaryCard({ label, value, percentage, variant }: StatusSummaryCardProps) {
  const variantStyles = {
    success: "bg-status-success/5",
    warning: "bg-status-warning/5",
    critical: "bg-status-critical/5",
    neutral: "bg-[#fafafa]",
  }

  const textStyles = {
    success: "text-status-success",
    warning: "text-status-warning",
    critical: "text-status-critical",
    neutral: "text-[#4d4d4d]",
  }

  return (
    <div
      className={`shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] rounded-lg p-4 transition-all hover:shadow-sm ${variantStyles[variant]}`}
    >
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <p className={`text-2xl font-semibold ${textStyles[variant]}`}>{value}</p>
      {percentage !== undefined && (
        <p className={`text-xs font-medium ${textStyles[variant]}`}>
          {formatPercent(percentage / 100)}
        </p>
      )}
    </div>
  )
}

// Goal Bar Component
interface GoalBarProps {
  label: string
  achievement: number // percentage as decimal (0.0 - 1.0+)
  showValue?: boolean
}

function GoalBar({ label, achievement, showValue = true }: GoalBarProps) {
  const percentage = Math.min(achievement * 100, 100)
  const displayPercentage = Math.round(achievement * 100)

  const level = getStatusLevel(achievement, { green: 1.0, yellow: 0.8 })

  const levelColors = {
    success: "bg-status-success",
    warning: "bg-status-warning",
    critical: "bg-status-critical",
    neutral: "bg-neutral-400",
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">{label}</span>
        {showValue && (
          <span
            className={`text-xs font-medium ${
              level === "success"
                ? "text-status-success"
                : level === "warning"
                  ? "text-status-warning"
                  : "text-status-critical"
            }`}
          >
            {displayPercentage}%
          </span>
        )}
      </div>
      <div className="bg-[#ebebeb] h-1.5 w-full rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full ${levelColors[level]}`}
        />
      </div>
    </div>
  )
}

// Agent Goal Row Component
interface AgentGoalRowProps {
  goals: AgentGoals
}

function AgentGoalRow({ goals }: AgentGoalRowProps) {
  const statusIcon = {
    completed: "✓",
    "in-progress": "→",
    "at-risk": "!",
  }

  const statusLevel = {
    completed: "success",
    "in-progress": "warning",
    "at-risk": "critical",
  } as const

  return (
    <motion.div
      variants={staggerItem}
      className="shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] rounded-lg bg-white/50 p-4 transition-colors"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{goals.agent_name}</p>
          <p className="text-muted-foreground text-xs">{goals.agent_id}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            Global: {formatPercent(goals.overall_achievement)}
          </span>
          <StatusBadge level={statusLevel[goals.status]}>
            {statusIcon[goals.status]}
          </StatusBadge>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <GoalBar
          label="Revenue"
          achievement={goals.revenue_achievement}
          showValue={false}
        />
        <GoalBar
          label="Clientes"
          achievement={goals.activation_achievement}
          showValue={false}
        />
        <GoalBar
          label="Retención"
          achievement={goals.retention_achievement}
          showValue={false}
        />
        <GoalBar
          label="CPI"
          achievement={goals.cpi_achievement}
          showValue={false}
        />
      </div>
    </motion.div>
  )
}

// Main Metas Page Component
export function MetasPage() {
  const sriMonth = useAppStore((s) => s.sriMonth)
  const { data: agents = [], isLoading } = useSriAgentRanking(sriMonth)

  // Calculate goals for all agents
  const agentGoals = useMemo(() => {
    return agents.map((agent) =>
      calculateAgentGoals({
        agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        revenue_growth_mom: agent.revenue_growth_mom,
        pct_active: agent.pct_active,
        client_retention_rate: agent.client_retention_rate,
        avg_cpi: agent.avg_cpi,
      })
    )
  }, [agents])

  // Calculate status summary
  const statusSummary = useMemo<StatusSummary>(() => {
    if (agentGoals.length === 0) {
      return {
        completed: 0,
        inProgress: 0,
        atRisk: 0,
        avgRevenueAchievement: 0,
      }
    }

    const completed = agentGoals.filter((g) => g.overall_achievement >= 1.0).length
    const inProgress = agentGoals.filter(
      (g) => g.overall_achievement >= 0.8 && g.overall_achievement < 1.0
    ).length
    const atRisk = agentGoals.filter((g) => g.overall_achievement < 0.8).length

    const totalRevenueAchievement = agentGoals.reduce(
      (sum, g) => sum + g.revenue_achievement,
      0
    )
    const avgRevenueAchievement = totalRevenueAchievement / agentGoals.length

    return {
      completed,
      inProgress,
      atRisk,
      avgRevenueAchievement,
    }
  }, [agentGoals])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#171717] border-t-transparent" />
          <span className="text-muted-foreground text-sm">Cargando metas...</span>
        </div>
      </div>
    )
  }

  if (agentGoals.length === 0) {
    return (
      <PageFadeIn>
        <div className="text-muted-foreground py-20 text-center text-sm">
          No hay datos de metas disponibles para {sriMonth}
        </div>
      </PageFadeIn>
    )
  }

  return (
    <PageFadeIn>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Progreso vs Metas</h1>
          <p className="text-muted-foreground text-sm">
            Seguimiento del cumplimiento de objetivos por agente y métrica
          </p>
        </div>

        {/* Status Summary Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={staggerItem}>
            <StatusSummaryCard
              label="Completado"
              value={statusSummary.completed}
              variant="success"
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatusSummaryCard
              label="En Progreso"
              value={statusSummary.inProgress}
              variant="warning"
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatusSummaryCard
              label="En Riesgo"
              value={statusSummary.atRisk}
              variant="critical"
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatusSummaryCard
              label="Revenue Equipo"
              value={formatPercent(statusSummary.avgRevenueAchievement)}
              percentage={statusSummary.avgRevenueAchievement * 100}
              variant={
                statusSummary.avgRevenueAchievement >= 1.0
                  ? "success"
                  : statusSummary.avgRevenueAchievement >= 0.8
                    ? "warning"
                    : "critical"
              }
            />
          </motion.div>
        </motion.div>

        {/* Agent Goals */}
        <div>
          <h2 className="text-foreground mb-4 text-lg font-semibold">
            Metas por Agente
          </h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4"
          >
            {agentGoals.map((goals) => (
              <AgentGoalRow key={goals.agent_id} goals={goals} />
            ))}
          </motion.div>
        </div>
      </div>
    </PageFadeIn>
  )
}
