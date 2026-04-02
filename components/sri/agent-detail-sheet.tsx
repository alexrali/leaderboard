"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ApiScoreStacked } from "./api-score-bar"
import { StatusBadge, getStatusLevel, type StatusLevel } from "./status-badge"
import { formatCurrency, formatPercent, formatNumber } from "@/lib/format"
import { TrendLineChart } from "./charts/line-chart"
import { Sparkline } from "./charts/sparkline"
import { HorizontalBarChart } from "./charts/horizontal-bar-chart"
import { slideInRight, ScaleIn } from "./animations"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  Target,
} from "lucide-react"
import type {
  AgentWithApiScore,
  SriAgentClientMonthly,
  WeeklyTrendData,
  SriAgentPerformanceIndex,
} from "@/lib/supabase"

// Combined type for agent with all necessary fields
type AgentWithScores = AgentWithApiScore &
  Pick<
    SriAgentPerformanceIndex,
    | "score_revenue"
    | "score_portfolio"
    | "score_cpi"
    | "score_quality"
    | "weight_revenue"
    | "weight_portfolio"
    | "weight_cpi"
    | "weight_quality"
  >

interface AgentDetailSheetProps {
  agent: AgentWithScores
  open: boolean
  onOpenChange: (open: boolean) => void
  agentClients?: SriAgentClientMonthly[]
  apiHistory?: WeeklyTrendData[]
}

// Metric Card Component
interface MetricCardProps {
  label: string
  value: string
  trend?: {
    value: number
    direction: "up" | "down" | "stable"
  }
  unit?: string
}

function MetricCard({ label, value, trend, unit }: MetricCardProps) {
  return (
    <div className="bg-[#fafafa] rounded-lg p-3">
      <p className="text-xs text-[#4d4d4d] mb-1">{label}</p>
      <div className="flex items-baseline justify-between">
        <p className="text-lg font-semibold tabular-nums">{value}</p>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trend.direction === "up"
                ? "text-status-success"
                : trend.direction === "down"
                  ? "text-status-critical"
                  : "text-[#666666]"
            }`}
          >
            {trend.direction === "up" && <TrendingUp className="w-3 h-3" />}
            {trend.direction === "down" && <TrendingDown className="w-3 h-3" />}
            {trend.direction === "stable" && <Minus className="w-3 h-3" />}
            <span className="tabular-nums">
              {trend.direction === "stable"
                ? "-"
                : `${Math.abs(trend.value).toFixed(1)}%`}
            </span>
          </div>
        )}
      </div>
      {unit && <p className="text-xs text-[#666666] mt-0.5">{unit}</p>}
    </div>
  )
}

// Goal Bar Component
interface GoalBarProps {
  label: string
  current: number
  target: number
  format: (value: number) => string
}

function GoalBar({ label, current, target, format }: GoalBarProps) {
  const percentage = Math.min((current / target) * 100, 100)
  const level = getStatusLevel(percentage, { green: 100, yellow: 80 })

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[#4d4d4d]">{label}</span>
        <span className="text-[#171717] font-medium tabular-nums">
          {format(current)} / {format(target)}
        </span>
      </div>
      <div className="h-2 bg-[#ebebeb] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className={`h-full rounded-full ${
            level === "success"
              ? "bg-status-success"
              : level === "warning"
                ? "bg-status-warning"
                : "bg-status-critical"
          }`}
        />
      </div>
      <p className="text-xs text-[#666666] text-right tabular-nums">
        {formatPercent(percentage / 100, 0)} de meta
      </p>
    </div>
  )
}

// Alert Card Component
interface AlertCardProps {
  type: "critical" | "warning" | "info"
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

function AlertCard({
  type,
  title,
  description,
  actionLabel,
  onAction,
}: AlertCardProps) {
  const styles: Record<
    string,
    { bg: string; border: string; icon: typeof AlertCircle; iconColor: string }
  > = {
    critical: {
      bg: "bg-status-critical/5",
      border: "border-status-critical/20",
      icon: AlertCircle,
      iconColor: "text-status-critical",
    },
    warning: {
      bg: "bg-status-warning/5",
      border: "border-status-warning/20",
      icon: AlertCircle,
      iconColor: "text-status-warning",
    },
    info: {
      bg: "bg-[#ebebeb]",
      border: "border-[#ebebeb]",
      icon: CheckCircle2,
      iconColor: "text-status-success",
    },
  }

  const style = styles[type]
  const Icon = style.icon

  return (
    <div
      className={`shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] rounded-lg p-3 ${style.bg} ${style.border} transition-smooth hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 ${style.iconColor} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[#171717] mb-1">
            {title}
          </h4>
          <p className="text-xs text-[#4d4d4d] mb-2">{description}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onAction}
            className="text-xs h-7"
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Action Modal Component
interface ActionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "plan" | "share" | "monitor"
  agentName: string
}

function ActionModal({ open, onOpenChange, type, agentName }: ActionModalProps) {
  const content: Record<
    string,
    { title: string; description: string; action: string }
  > = {
    plan: {
      title: "Plan de Acción",
      description:
        "Genera un plan personalizado para mejorar el rendimiento del agente.",
      action: "Generar Plan",
    },
    share: {
      title: "Compartir Reporte",
      description:
        "Envía un resumen del desempeño por correo electrónico al agente.",
      action: "Enviar Reporte",
    },
    monitor: {
      title: "Monitoreo Continuo",
      description:
        "Activa alertas automáticas cuando el agente supere los umbrales críticos.",
      action: "Activar Monitoreo",
    },
  }

  const { title, description, action } = content[type]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-[#4d4d4d]">
            Esta acción se aplicará a <strong>{agentName}</strong> y generará
            las recomendaciones correspondientes basadas en los datos actuales.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onOpenChange(false)}>{action}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Mock data for charts (would be replaced by real queries)
const mockWeeklyTrendData: WeeklyTrendData[] = [
  { week: "1", api_score: 62, revenue: 125000 },
  { week: "2", api_score: 64, revenue: 132000 },
  { week: "3", api_score: 63, revenue: 128000 },
  { week: "4", api_score: 67, revenue: 145000 },
]

const mockTopCategories = [
  {
    name: "Lácteos",
    revenue: 45000,
    units: 1200,
    trend: [12000, 13500, 14000, 15500],
    growth: 12.5,
  },
  {
    name: "Bebidas",
    revenue: 38000,
    units: 980,
    trend: [9000, 9500, 9200, 10300],
    growth: 8.3,
  },
  {
    name: "Snacks",
    revenue: 32000,
    units: 850,
    trend: [7500, 7800, 8100, 8600],
    growth: 15.2,
  },
  {
    name: "Limpieza",
    revenue: 28000,
    units: 620,
    trend: [6500, 6800, 7000, 7700],
    growth: 6.7,
  },
  {
    name: "Panadería",
    revenue: 22000,
    units: 540,
    trend: [5000, 5300, 5500, 6200],
    growth: 9.1,
  },
]

// Main Agent Detail Sheet Component
export function AgentDetailSheet({
  agent,
  open,
  onOpenChange,
  agentClients = [],
  apiHistory = mockWeeklyTrendData,
}: AgentDetailSheetProps) {
  const [actionModal, setActionModal] = useState<{
    open: boolean
    type: "plan" | "share" | "monitor"
  }>({ open: false, type: "plan" })

  // Generate alerts dynamically based on agent thresholds
  const alerts = [
    agent.client_retention_rate < 80
      ? {
          type: "critical" as const,
          title: "Retención Baja",
          description: `La retención de clientes está al ${formatPercent(agent.client_retention_rate / 100)}, por debajo del umbral del 80%.`,
          actionLabel: "Ver Plan de Recuperación",
        }
      : null,
    agent.pct_dormant > 15
      ? {
          type: "warning" as const,
          title: "Clientes Dormantes",
          description: `El ${formatPercent(agent.pct_dormant / 100)} de clientes está inactivo. Requiere reactivación.`,
          actionLabel: "Ver Clientes",
        }
      : null,
    agent.portfolio_concentration_top3 > 60
      ? {
          type: "warning" as const,
          title: "Alta Concentración",
          description: `El ${formatPercent(agent.portfolio_concentration_top3 / 100)} de ingresos viene de 3 clientes. Riesgo elevado.`,
          actionLabel: "Ver Portfolio",
        }
      : null,
    agent.api_score >= 65
      ? {
          type: "info" as const,
          title: "Desempeño Sólido",
          description: `El API de ${agent.api_score.toFixed(1)} supera el objetivo. Buen trabajo.`,
          actionLabel: "Ver Desglose",
        }
      : null,
  ].filter(Boolean)

  const apiLevel = getStatusLevel(agent.api_score, { green: 65, yellow: 45 })

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto"
          showCloseButton
        >
          <motion.div
            variants={slideInRight}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle>{agent.agent_name}</SheetTitle>
                  <SheetDescription>
                    {agent.peer_group_label} • Activo
                  </SheetDescription>
                </div>
                <StatusBadge level={apiLevel}>
                  API {agent.api_score.toFixed(1)}
                </StatusBadge>
              </div>
            </SheetHeader>

            <Tabs defaultValue="resumen" className="mt-6">
              <TabsList className="w-full">
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
                <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
                <TabsTrigger value="categorias">Categorías</TabsTrigger>
                <TabsTrigger value="alertas">Alertas</TabsTrigger>
              </TabsList>

              {/* Resumen Tab */}
              <TabsContent value="resumen" className="space-y-4 mt-4">
                <ScaleIn>
                  <div className="bg-[#fafafa] rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-[#171717] mb-3">
                      Índice de Performance
                    </h3>
                    <ApiScoreStacked
                      scores={{
                        revenue: agent.score_revenue || 0,
                        portfolio: agent.score_portfolio || 0,
                        cpi: agent.score_cpi || 0,
                        quality: agent.score_quality || 0,
                      }}
                      weights={{
                        revenue: agent.weight_revenue || 0.25,
                        portfolio: agent.weight_portfolio || 0.25,
                        cpi: agent.weight_cpi || 0.25,
                        quality: agent.weight_quality || 0.25,
                      }}
                    />
                  </div>
                </ScaleIn>

                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Ingresos Totales"
                    value={formatCurrency(agent.total_revenue)}
                    unit={agent.month}
                  />
                  <MetricCard
                    label="Valor Promedio"
                    value={formatCurrency(agent.avg_order_value)}
                    trend={{
                      value: agent.revenue_growth_mom * 100,
                      direction:
                        agent.revenue_growth_mom > 0
                          ? "up"
                          : agent.revenue_growth_mom < 0
                            ? "down"
                            : "stable",
                    }}
                  />
                  <MetricCard
                    label="Clientes Activos"
                    value={agent.active_client_count.toString()}
                    unit={`Retención ${formatPercent(agent.client_retention_rate / 100)}`}
                  />
                  <MetricCard
                    label="Pedidos"
                    value={agent.invoice_count.toString()}
                    unit={`Frecuencia ${agent.avg_purchase_frequency.toFixed(1)}/mes`}
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-[#171717]">
                    Metas del Mes
                  </h3>
                  <GoalBar
                    label="Ingresos"
                    current={agent.total_revenue}
                    target={agent.total_revenue * 1.2}
                    format={formatCurrency}
                  />
                  <GoalBar
                    label="Activos"
                    current={agent.active_client_count}
                    target={agent.active_client_count * 1.15}
                    format={(v) => v.toString()}
                  />
                  <GoalBar
                    label="Retención"
                    current={agent.client_retention_rate}
                    target={85}
                    format={(v) => formatPercent(v / 100, 0)}
                  />
                  <GoalBar
                    label="Cartera Diversa"
                    current={100 - agent.portfolio_concentration_top3}
                    target={60}
                    format={(v) => formatPercent(v / 100, 0)}
                  />
                </div>
              </TabsContent>

              {/* Tendencias Tab */}
              <TabsContent value="tendencias" className="space-y-4 mt-4">
                <ScaleIn>
                  <div className="bg-[#fafafa] rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-[#171717] mb-3">
                      Evolución del API
                    </h3>
                    <TrendLineChart
                      data={apiHistory.map((d) => ({
                        week: d.week,
                        value: d.api_score,
                      }))}
                      color="var(--primary)"
                      height={200}
                    />
                  </div>
                </ScaleIn>

                <div className="bg-[#fafafa] rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-[#171717] mb-3">
                    Trayectoria de Ingresos
                  </h3>
                  <TrendLineChart
                    data={apiHistory.map((d) => ({
                      week: d.week,
                      value: d.revenue / 1000, // Convert to thousands
                    }))}
                    color="var(--status-success)"
                    unit="k"
                    height={200}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <MetricCard
                    label="Crecimiento"
                    value={formatPercent(agent.revenue_growth_mom)}
                    unit="vs mes anterior"
                  />
                  <MetricCard
                    label="Volatilidad"
                    value="Baja"
                    trend={{ value: -5, direction: "down" }}
                  />
                  <MetricCard
                    label="Proyección"
                    value={formatCurrency(agent.total_revenue * 1.1)}
                    unit="próximo mes"
                  />
                </div>
              </TabsContent>

              {/* Categorías Tab */}
              <TabsContent value="categorias" className="space-y-4 mt-4">
                <div className="bg-[#fafafa] rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-[#171717] mb-3">
                    Top 5 Categorías
                  </h3>
                  <div className="space-y-2">
                    {mockTopCategories.map((cat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-[#ebebeb] last:border-0"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#171717]">
                            {cat.name}
                          </p>
                          <p className="text-xs text-[#4d4d4d]">
                            {formatNumber(cat.units)} unidades
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold tabular-nums">
                              {formatCurrency(cat.revenue)}
                            </p>
                            <p
                              className={`text-xs font-medium tabular-nums ${
                                cat.growth > 0
                                  ? "text-status-success"
                                  : "text-status-critical"
                              }`}
                            >
                              {cat.growth > 0 ? "+" : ""}
                              {formatPercent(cat.growth / 100)}
                            </p>
                          </div>
                          <Sparkline
                            data={cat.trend.map((v) => ({ value: v }))}
                            width={60}
                            height={24}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#fafafa] rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-[#171717] mb-3">
                    Comparación con Grupo
                  </h3>
                  <HorizontalBarChart
                    data={[
                      {
                        name: "Tú",
                        value: agent.total_revenue / 1000,
                        color: "var(--primary)",
                      },
                      {
                        name: "Promedio",
                        value:
                          (agent.total_revenue / agent.peer_pct_total_revenue) *
                          0.5,
                        color: "var(--neutral-400)",
                      },
                      {
                        name: "Líder",
                        value:
                          (agent.total_revenue / agent.peer_pct_total_revenue) *
                          0.8,
                        color: "var(--status-success)",
                      },
                    ]}
                    unit="k"
                  />
                </div>
              </TabsContent>

              {/* Alertas Tab */}
              <TabsContent value="alertas" className="space-y-3 mt-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-status-success mx-auto mb-3" />
                    <p className="text-sm text-[#4d4d4d]">
                      No hay alertas activas. Buen trabajo.
                    </p>
                  </div>
                ) : (
                  alerts.map((alert, idx) => (
                    <AlertCard
                      key={idx}
                      type={alert!.type}
                      title={alert!.title}
                      description={alert!.description}
                      actionLabel={alert!.actionLabel}
                      onAction={() =>
                        setActionModal({
                          open: true,
                          type: alert!.title.includes("Plan")
                            ? "plan"
                            : alert!.title.includes("Clientes") ||
                                alert!.title.includes("Portfolio")
                              ? "share"
                              : "monitor",
                        })
                      }
                    />
                  ))
                )}

                <div className="pt-4 border-t border-[#ebebeb]">
                  <h3 className="text-sm font-semibold text-[#171717] mb-3">
                    Acciones Rápidas
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 flex flex-col gap-1"
                      onClick={() =>
                        setActionModal({ open: true, type: "plan" })
                      }
                    >
                      <Target className="w-4 h-4" />
                      <span className="text-xs">Plan</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 flex flex-col gap-1"
                      onClick={() =>
                        setActionModal({ open: true, type: "share" })
                      }
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs">Share</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 flex flex-col gap-1"
                      onClick={() =>
                        setActionModal({ open: true, type: "monitor" })
                      }
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs">Monitor</span>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </SheetContent>
      </Sheet>

      <ActionModal
        open={actionModal.open}
        onOpenChange={(open) =>
          setActionModal({ ...actionModal, open })
        }
        type={actionModal.type}
        agentName={agent.agent_name}
      />
    </>
  )
}
