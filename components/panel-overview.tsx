"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PanelKpiCards } from "@/components/panel/kpi-cards"
import { ContributionHeatmap } from "@/components/panel/contribution-heatmap"
import { HeatmapDayDrawer } from "@/components/panel/heatmap-day-drawer"
import { TeamPaceChart } from "@/components/panel/team-pace-chart"
import { usePanelKPIs, useTeamDailyHistory } from "@/hooks/use-leaderboard-queries"

export function PanelOverview() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const { data: kpis, isLoading: kpisLoading } = usePanelKPIs()
  const { data: history = [], isLoading: historyLoading } = useTeamDailyHistory(60)

  return (
    <div className="flex flex-col gap-8">
      {/* KPI Cards */}
      {kpisLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted h-24 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : kpis ? (
        <PanelKpiCards data={kpis} />
      ) : null}

      {/* Contribution Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Actividad del Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="bg-muted h-32 animate-pulse rounded-lg" />
          ) : (
            <ContributionHeatmap
              data={history}
              onDayClick={setSelectedDate}
              selectedDate={selectedDate}
            />
          )}
        </CardContent>
      </Card>

      {/* Hourly Pace Chart */}
      <TeamPaceChart />

      {/* Day Detail Drawer */}
      <HeatmapDayDrawer
        date={selectedDate}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  )
}
