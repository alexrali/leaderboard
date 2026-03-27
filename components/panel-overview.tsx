"use client"

import { useState } from "react"
import { Zap } from "lucide-react"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { CardSkeleton, HeatmapSkeleton } from "@/components/ui/loading-skeleton"
import { PanelKpiCards } from "@/components/panel/kpi-cards"
import { ContributionHeatmap } from "@/components/panel/contribution-heatmap"
import { HeatmapDayDrawer } from "@/components/panel/heatmap-day-drawer"
import { TeamPaceChart } from "@/components/panel/team-pace-chart"
import { usePanelKPIs, useTeamDailyHistory } from "@/hooks/use-leaderboard-queries"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"

function HeroSummary({ teamUE, isLoading }: { teamUE?: number; isLoading: boolean }) {
  const animatedUE = useAnimatedCounter(teamUE ?? 0, { duration: 2500, delay: 100, decimals: 1 })

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-3 w-48 bg-muted animate-pulse rounded" />
        <div className="h-16 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-52 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
        UE del Equipo Hoy
      </p>
      <div className="flex items-baseline gap-3">
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-bold tracking-tighter font-mono leading-none">
          {animatedUE.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
        </h2>
        <Zap className="size-5 text-yellow-500 hidden sm:block" />
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="tabular-nums font-mono">
          Total acumulado del dia
        </span>
        <span className="text-border/60">&middot;</span>
        <span>Actualiza en tiempo real</span>
      </div>
    </div>
  )
}

export function PanelOverview() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const { data: kpis, isLoading: kpisIsLoading } = usePanelKPIs()
  const { data: history = [], isLoading: historyIsLoading } = useTeamDailyHistory(60)

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Summary */}
      <div className="px-1 pt-2 pb-2">
        <HeroSummary teamUE={kpis?.teamTotalUE} isLoading={kpisIsLoading} />
      </div>

      {/* KPI Inline Stats */}
      <ErrorBoundary title="Indicadores">
        {kpisIsLoading ? (
          <CardSkeleton cards={4} />
        ) : kpis ? (
          <PanelKpiCards data={kpis} />
        ) : null}
      </ErrorBoundary>

      {/* Contribution Heatmap -- prominent, without card wrapper */}
      <ErrorBoundary title="Actividad del Equipo">
        {historyIsLoading ? (
          <HeatmapSkeleton weeks={9} />
        ) : (
          <ContributionHeatmap
            data={history}
            onDayClick={setSelectedDate}
            selectedDate={selectedDate}
          />
        )}
      </ErrorBoundary>

      {/* Hourly Pace Chart */}
      <ErrorBoundary title="Ritmo del Dia">
        <TeamPaceChart />
      </ErrorBoundary>

      {/* Day Detail Drawer */}
      <HeatmapDayDrawer
        date={selectedDate}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  )
}
