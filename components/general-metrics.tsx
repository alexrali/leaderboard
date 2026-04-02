"use client"

import { useCallback, useMemo, useState, ViewTransition } from "react"
import { TrendingUp, TrendingDown, Minus, Flame, Award, Zap, Clock, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CardSkeleton, TableSkeleton } from "@/components/ui/loading-skeleton"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import type { TeamMember } from "@/lib/leaderboard-data"
import { WorkerDetailDrawer } from "@/components/worker-detail-sheet"

// ─── Trend icon (shared badge for trend columns) ──────────────────────────────

function TrendIcon({ trend, value }: { trend: TeamMember["trend"]; value: number }) {
  if (trend === "up")
    return (
      <span
        className="bg-success/10 text-success inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
        aria-label={`Tendencia positiva: +${value}% con respecto al periodo anterior`}
      >
        <TrendingUp className="size-3" aria-hidden="true" />
        {"+"}
        {value}%
      </span>
    )
  if (trend === "down")
    return (
      <span
        className="bg-destructive/10 text-destructive inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
        aria-label={`Tendencia negativa: -${value}% con respecto al periodo anterior`}
      >
        <TrendingDown className="size-3" aria-hidden="true" />
        {"-"}
        {value}%
      </span>
    )
  return (
    <span
      className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      aria-label={`Tendencia estable: ${value}% con respecto al periodo anterior`}
    >
      <Minus className="size-3" aria-hidden="true" />
      {value}%
    </span>
  )
}

// ─── Rank badge (with staggered entrance animation) ────────────────────────────

function RankBadge({ rank, name, index }: { rank: number; name: string; index: number }) {
  const styles: Record<number, string> = {
    1: "bg-amber-100 text-amber-700 border-amber-200",
    2: "bg-slate-100 text-slate-600 border-slate-200",
    3: "bg-orange-100 text-orange-600 border-orange-200",
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`flex size-8 items-center justify-center rounded-full border text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-500 ${
            styles[rank] ?? "bg-muted text-muted-foreground border-border"
          }`}
          style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
        >
          {rank}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <span>
          {rank === 1 ? "Oro" : rank === 2 ? "Plata" : rank === 3 ? "Bronce" : `#${rank}`}
          {" - "}
          {name}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

// ─── KPI Card with animated counter ────────────────────────────────────────────

function KpiCard({
  label,
  numericValue,
  formatter,
  unit,
  icon: Icon,
  delay = 0,
  children,
}: {
  label: string
  numericValue: number
  formatter: (v: number) => string
  unit?: string
  icon: React.ElementType
  delay?: number
  children?: React.ReactNode
}) {
  const animatedValue = useAnimatedCounter(numericValue, {
    duration: 1500,
    delay,
    decimals: numericValue % 1 !== 0 ? 1 : 0,
  })

  return (
    <Card className="rounded-2xl">
      <CardHeader className="px-5 pt-5 pb-1">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs tracking-wide uppercase">{label}</CardDescription>
          <div className="bg-primary/8 text-primary flex size-7 items-center justify-center rounded-lg">
            <Icon className="size-3.5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pt-1 pb-5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-foreground text-2xl font-semibold tabular-nums">
            {formatter(animatedValue)}
          </span>
          {unit && <span className="text-muted-foreground text-sm">{unit}</span>}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

// ─── Summary KPI cards section ─────────────────────────────────────────────────

function KpiCardsSection({
  totalUE,
  avgEfficiency,
  totalHours,
  topStreak,
  streakName,
}: {
  totalUE: number
  avgEfficiency: number
  totalHours: number
  topStreak: number
  streakName: string
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="UE Total (Equipo)"
        numericValue={totalUE}
        formatter={(v) => v.toLocaleString("es-MX")}
        unit="UE"
        icon={Target}
        delay={0}
      />
      <KpiCard
        label="Eficiencia Promedio"
        numericValue={avgEfficiency}
        formatter={(v) => `${v}%`}
        icon={Zap}
        delay={100}
      >
        <Progress value={avgEfficiency} className="mt-3 h-1.5 rounded-full" />
      </KpiCard>
      <KpiCard
        label="Horas Trabajadas"
        numericValue={totalHours}
        formatter={(v) => v.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
        unit="hrs"
        icon={Clock}
        delay={200}
      >
        <div className="mt-3 flex items-center gap-1.5">
          <Zap className="text-warning size-3.5" />
          <span className="text-muted-foreground text-xs">Acumulado del equipo</span>
        </div>
      </KpiCard>
      <KpiCard
        label="Mejor Racha"
        numericValue={topStreak}
        formatter={(v) => String(v)}
        unit="dias"
        icon={Flame}
        delay={300}
      >
        <div className="mt-3 flex items-center gap-1.5">
          <Flame className="text-primary size-3.5" />
          <span className="text-muted-foreground text-xs">{streakName}</span>
        </div>
      </KpiCard>
    </div>
  )
}

// ─── Ranking table section ─────────────────────────────────────────────────────

function RankingTableSection({
  members,
  onRowClick,
}: {
  members: TeamMember[]
  onRowClick: (member: TeamMember) => void
}) {
  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardContent className="p-0">
        <div className="max-h-[520px] overflow-y-auto scroll-smooth">
          <Table aria-label="Ranking del equipo - metricas de rendimiento por surtidor">
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-muted-foreground w-16 pl-5 text-xs font-medium tracking-wide uppercase" scope="col">
                  Pos.
                </TableHead>
                <TableHead className="text-muted-foreground min-w-0 text-xs font-medium tracking-wide uppercase" scope="col">
                  Surtidor
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase md:table-cell" scope="col">
                  UE
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase xl:table-cell" scope="col">
                  Folios
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase xl:table-cell" scope="col">
                  SKUs
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase xl:table-cell" scope="col">
                  Qty
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase xl:table-cell" scope="col">
                  Peso
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase xl:table-cell" scope="col">
                  Volumen
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-right text-xs font-medium tracking-wide uppercase sm:table-cell" scope="col">
                  Eficiencia
                </TableHead>
                <TableHead className="text-muted-foreground hidden text-center text-xs font-medium tracking-wide uppercase lg:table-cell" scope="col">
                  Racha
                </TableHead>
                <TableHead className="text-muted-foreground pr-5 text-right text-xs font-medium tracking-wide uppercase" scope="col">
                  Tendencia
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member, idx) => (
                <ViewTransition key={member.id} default="none">
                <TableRow
                  className="hover:bg-muted/60 cursor-pointer transition-colors animate-in fade-in slide-in-from-bottom-1 duration-300"
                  style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "both" }}
                  onClick={() => onRowClick(member)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onRowClick(member)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Ver detalle de ${member.name}`}
                >
                  <TableCell className="pl-5">
                    <RankBadge rank={member.rank} name={member.name} index={idx} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="border-muted size-9 border-2 shrink-0" aria-label={`Avatar for ${member.name}`}>
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-foreground text-sm font-semibold truncate">{member.name}</span>
                        <span className="text-muted-foreground text-xs truncate">{member.role}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-right md:table-cell">
                    <span className="text-foreground font-mono text-sm font-semibold">
                      {member.score.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    <span className="text-muted-foreground font-mono text-xs">
                      {(member.foliosCompleted ?? 0).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    <span className="text-muted-foreground font-mono text-xs">
                      {(member.distinctSkus ?? 0).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    <span className="text-muted-foreground font-mono text-xs">
                      {(member.totalQuantity ?? 0).toLocaleString("es-MX", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    <span className="text-muted-foreground font-mono text-xs">
                      {(member.weightKg ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 1 })}{" "}
                      kg
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right xl:table-cell">
                    <span className="text-muted-foreground font-mono text-xs">
                      {(member.volumeM3 ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 3 })}{" "}
                      m³
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-end gap-2.5">
                          <Progress value={member.efficiency} className="h-2 w-16 rounded-full" />
                          <span className="text-muted-foreground font-mono text-xs font-medium">
                            {member.efficiency}%
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>
                          {member.name}: {member.efficiency}% eficiencia
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="hidden text-center lg:table-cell">
                    <Badge variant="outline" className="border-border gap-1 rounded-full">
                      <Flame className="text-primary size-3" />
                      {member.streak}d
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <TrendIcon trend={member.trend} value={member.trendValue} />
                  </TableCell>
                </TableRow>
                </ViewTransition>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface GeneralMetricsProps {
  members: TeamMember[]
  viewMode?: "daily" | "weekly"
  /** When true, shows loading skeletons instead of real content */
  loading?: boolean
}

export function GeneralMetrics({ members, viewMode = "daily", loading }: GeneralMetricsProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const { totalTasks, avgEfficiency, totalHours, topStreak, streakName } = useMemo(() => {
    const totalTasks = members.reduce((acc, m) => acc + m.score, 0)
    const avgEfficiency =
      members.length > 0
        ? Math.round(members.reduce((acc, m) => acc + m.efficiency, 0) / members.length)
        : 0
    const totalHours = parseFloat(members.reduce((acc, m) => acc + m.hoursLogged, 0).toFixed(1))
    const topStreak = members.length > 0 ? Math.max(...members.map((m) => m.streak)) : 0
    const streakName = members.find((m) => m.streak === topStreak)?.name ?? "--"
    return { totalTasks, avgEfficiency, totalHours, topStreak, streakName }
  }, [members])

  // Loading state
  if (loading) {
    return (
      <section className="flex flex-col gap-6" aria-labelledby="general-metrics-heading">
        <div className="flex items-center gap-2.5">
          <div className="size-4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        </div>
        <CardSkeleton cards={4} className="grid grid-cols-2 gap-4 lg:grid-cols-4" />
        <TableSkeleton rows={6} columns={7} />
      </section>
    )
  }

  // Empty state
  if (members.length === 0) {
    return (
      <section className="flex flex-col gap-6" aria-labelledby="general-metrics-heading">
        <div className="flex items-center gap-2.5">
          <Award className="text-primary size-4" />
          <h2 id="general-metrics-heading" className="text-foreground text-base font-semibold">
            Metricas Generales
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Award className="text-muted-foreground/40 mb-3 size-10" />
          <p className="text-muted-foreground text-sm">No hay datos de rendimiento disponibles.</p>
          <p className="text-muted-foreground/60 mt-1 text-xs">
            Los datos apareceran una vez que el ETL procese el periodo actual.
          </p>
        </div>
      </section>
    )
  }

  const handleRowClick = useCallback((member: TeamMember) => {
    setSelectedMember(member)
    setSheetOpen(true)
  }, [])

  return (
    <section className="flex flex-col gap-6" aria-labelledby="general-metrics-heading">
      <div className="flex items-center gap-2.5">
        <Award className="text-primary size-4" />
        <h2 id="general-metrics-heading" className="text-foreground text-base font-semibold">
          Metricas Generales
        </h2>
      </div>

      {/* Summary KPIs */}
      <ErrorBoundary title="Indicadores Clave">
        <KpiCardsSection
          totalUE={totalTasks}
          avgEfficiency={avgEfficiency}
          totalHours={totalHours}
          topStreak={topStreak}
          streakName={streakName}
        />
      </ErrorBoundary>

      {/* Ranking Table */}
      <ErrorBoundary title="Ranking del Equipo">
        <RankingTableSection members={members} onRowClick={handleRowClick} />
      </ErrorBoundary>

      <WorkerDetailDrawer
        member={selectedMember}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        viewMode={viewMode}
      />
    </section>
  )
}
