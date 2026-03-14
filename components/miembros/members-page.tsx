"use client"

import { useState, useCallback } from "react"
import type { MembersRange, MemberRangeSummary } from "@/lib/supabase"
import { useMembersRangeSummary, useMembersWeeklyTrend } from "@/hooks/use-leaderboard-queries"
import { EquityKpiStrip } from "./equity-kpi-strip"
import { EquityUeChart } from "./equity-ue-chart"
import { EquityHoursChart } from "./equity-hours-chart"
import { MemberTable } from "./member-table"
import { WorkerDetailDrawer } from "@/components/worker-detail-sheet"
import type { TeamMember } from "@/lib/leaderboard-data"

const RANGE_OPTIONS: { value: MembersRange; label: string; weeks: number }[] = [
  { value: "week", label: "Semana", weeks: 1 },
  { value: "2weeks", label: "2 Semanas", weeks: 2 },
  { value: "month", label: "Mes", weeks: 4 },
]

function toTeamMember(m: MemberRangeSummary): TeamMember {
  return {
    id: m.worker_key,
    name: m.worker_name,
    role: "Surtidor",
    avatar:
      m.avatar_initials ??
      m.worker_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    rank: Math.round(m.avg_weekly_rank),
    score: m.total_ue,
    streak: m.current_streak,
    tasksCompleted: m.total_routes,
    tasksTotal: m.total_routes,
    hoursLogged: m.total_hours,
    efficiency: m.avg_efficiency_score,
    trend: m.trend,
    trendValue: m.trend_pct,
  }
}

export function MembersPage() {
  const [range, setRange] = useState<MembersRange>("week")
  const [drawerMember, setDrawerMember] = useState<TeamMember | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const selectedOption = RANGE_OPTIONS.find((o) => o.value === range)!
  const { data: members = [], isLoading, isError } = useMembersRangeSummary(range)
  const { data: trendData = [] } = useMembersWeeklyTrend(selectedOption.weeks)

  const handleRowClick = useCallback((member: MemberRangeSummary) => {
    setDrawerMember(toTeamMember(member))
    setDrawerOpen(true)
  }, [])

  return (
    <div className="flex flex-col gap-8">
      {/* Header with range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Miembros del equipo</h2>
          <p className="text-muted-foreground text-sm">
            Rendimiento global por surtidor
          </p>
        </div>
        <div className="border-border/40 bg-muted/40 flex items-center gap-1 rounded-full border p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${
                range === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : isError ? (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border px-5 py-4 text-sm">
          No se pudo cargar la información de miembros. Verifica la conexión a Supabase.
        </div>
      ) : members.length === 0 ? (
        <div className="text-muted-foreground py-20 text-center text-sm">
          Sin datos para el período seleccionado.
        </div>
      ) : (
        <>
          <EquityKpiStrip members={members} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <EquityUeChart members={members} />
            <EquityHoursChart members={members} />
          </div>
          <MemberTable
            data={members}
            trendData={trendData}
            onRowClick={handleRowClick}
          />
        </>
      )}

      <WorkerDetailDrawer
        member={drawerMember}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        viewMode="weekly"
      />
    </div>
  )
}
