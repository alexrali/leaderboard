"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb"
import { AppSidebar } from "@/components/app-sidebar"
import { LeaderboardHeader } from "@/components/leaderboard-header"
import { GeneralMetrics } from "@/components/general-metrics"
import { DayProgressSection } from "@/components/day-progress"
import { ResourcesDetail } from "@/components/resources-detail"
import { SectionTabs } from "@/components/section-tabs"
import { WeeklyOverview } from "@/components/weekly-overview"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import {
  getTodayLeaderboard,
  getWeeklyLeaderboard,
  getTodayHourlyProgress,
  getTodayTeamSummary,
  getLatestDailyDate,
  getWeeklyTeamSummary,
  getWeekDailyTrend,
  type TeamSummary,
  type WeeklyTeamSummary,
  type DailyTrend,
} from "@/lib/leaderboard-queries"
import { resources } from "@/lib/leaderboard-data"
import type { TeamMember, DayProgress } from "@/lib/leaderboard-data"

export default function Page() {
  const [activeSection, setActiveSection] = useState("overview")
  const [members, setMembers] = useState<TeamMember[]>([])
  const [dayProgress, setDayProgress] = useState<DayProgress[]>([])
  const [teamSummary, setTeamSummary] = useState<TeamSummary | null>(null)
  const [weeklySummary, setWeeklySummary] = useState<WeeklyTeamSummary | null>(null)
  const [dailyTrend, setDailyTrend] = useState<DailyTrend[]>([])
  const [dataDate, setDataDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily")

  const { lastRefresh } = useAutoRefresh(5 * 60 * 1000)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [membersData, progressData, summaryData, resolvedDate, weeklySummaryData, trendData] = await Promise.all([
        viewMode === "daily" ? getTodayLeaderboard() : getWeeklyLeaderboard(),
        getTodayHourlyProgress(),
        viewMode === "daily" ? getTodayTeamSummary() : Promise.resolve(null),
        viewMode === "daily" ? getLatestDailyDate() : Promise.resolve(null),
        getWeeklyTeamSummary(),
        getWeekDailyTrend(),
      ])
      setMembers(membersData)
      setDayProgress(progressData)
      setTeamSummary(summaryData)
      setDataDate(resolvedDate)
      setWeeklySummary(weeklySummaryData)
      setDailyTrend(trendData)
    } catch (err) {
      console.error("Error fetching leaderboard data:", err)
      setError("No se pudo cargar la información. Verifica la conexión a Supabase.")
    } finally {
      setLoading(false)
    }
  }, [viewMode, lastRefresh])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const sectionLabel: Record<string, string> = {
    overview: "Resumen Semanal",
    metrics: "Métricas Generales",
    "day-progress": "Progreso del Día",
    resources: "Detalle de Recursos",
    dashboard: "Dashboard",
  }

  return (
    <SidebarProvider>
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">SIM-PCR</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{sectionLabel[activeSection] ?? activeSection}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-border/40 bg-muted/40 p-1">
              <button
                onClick={() => setViewMode("daily")}
                className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                  viewMode === "daily"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setViewMode("weekly")}
                className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                  viewMode === "weekly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semana
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-10">
            <LeaderboardHeader memberCount={members.length} viewMode={viewMode} dataDate={dataDate} />

            <Separator className="opacity-20" />

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-muted-foreground">Cargando datos...</span>
                </div>
              </div>
            )}

            {!loading && !error && (
              <>
                {activeSection === "overview" && (
                  <WeeklyOverview
                    members={members.length > 0 ? members : []}
                    weeklySummary={weeklySummary}
                    dailyTrend={dailyTrend}
                  />
                )}
                {activeSection === "metrics" && <GeneralMetrics members={members} teamSummary={teamSummary} viewMode={viewMode} />}
                {activeSection === "day-progress" && <DayProgressSection data={dayProgress} />}
                {activeSection === "resources" && <ResourcesDetail resources={resources} />}
                {activeSection === "dashboard" && (
                  <SectionTabs
                    metricsContent={<GeneralMetrics members={members} teamSummary={teamSummary} viewMode={viewMode} />}
                    dayProgressContent={<DayProgressSection data={dayProgress} />}
                    resourcesContent={<ResourcesDetail resources={resources} />}
                  />
                )}
              </>
            )}

            <footer className="flex items-center justify-between border-t border-border/20 pt-6 pb-4">
              <span className="text-xs text-muted-foreground">
                Última actualización:{" "}
                {lastRefresh.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-xs text-muted-foreground">
                Actualización automática cada 5 minutos
              </span>
            </footer>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
