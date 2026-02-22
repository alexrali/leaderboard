"use client"

import { Suspense } from "react"
import { parseAsStringLiteral, useQueryState } from "nuqs"
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
import { useAppStore } from "@/lib/store"
import {
  useLeaderboard,
  useHourlyProgress,
  useTeamSummary,
  useLatestDailyDate,
  useWeeklyTeamSummary,
  useWeekDailyTrend,
} from "@/hooks/use-leaderboard-queries"
import { resources } from "@/lib/leaderboard-data"

const VIEW_MODES = ["daily", "weekly"] as const

function PageContent() {
  const [viewMode, setViewMode] = useQueryState(
    "view",
    parseAsStringLiteral(VIEW_MODES).withDefault("daily")
  )

  const activeSection = useAppStore((s) => s.activeSection)
  const setActiveSection = useAppStore((s) => s.setActiveSection)

  const { data: members = [], isLoading, isError } = useLeaderboard(viewMode)
  const { data: dayProgress = [] } = useHourlyProgress()
  const { data: teamSummary = null } = useTeamSummary(viewMode)
  const { data: dataDate = null } = useLatestDailyDate()
  const { data: weeklySummary = null } = useWeeklyTeamSummary()
  const { data: dailyTrend = [] } = useWeekDailyTrend()

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
            <div className="border-border/40 bg-muted/40 flex items-center gap-1 rounded-full border p-1">
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

        <div className="w-full px-4 py-8 md:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-10">
            <LeaderboardHeader
              memberCount={members.length}
              viewMode={viewMode}
              dataDate={dataDate}
            />

            <Separator className="opacity-20" />

            {isError && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border px-5 py-4 text-sm">
                No se pudo cargar la información. Verifica la conexión a Supabase.
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
                  <span className="text-muted-foreground text-sm">Cargando datos...</span>
                </div>
              </div>
            )}

            {!isLoading && !isError && (
              <>
                {activeSection === "overview" && (
                  <WeeklyOverview
                    members={members}
                    weeklySummary={weeklySummary}
                    dailyTrend={dailyTrend}
                  />
                )}
                {activeSection === "metrics" && (
                  <GeneralMetrics members={members} teamSummary={teamSummary} viewMode={viewMode} />
                )}
                {activeSection === "day-progress" && <DayProgressSection data={dayProgress} />}
                {activeSection === "resources" && <ResourcesDetail resources={resources} />}
                {activeSection === "dashboard" && (
                  <SectionTabs
                    metricsContent={
                      <GeneralMetrics
                        members={members}
                        teamSummary={teamSummary}
                        viewMode={viewMode}
                      />
                    }
                    dayProgressContent={<DayProgressSection data={dayProgress} />}
                    resourcesContent={<ResourcesDetail resources={resources} />}
                  />
                )}
              </>
            )}

            <footer className="border-border/20 flex items-center justify-between border-t pb-4 pt-6">
              <span className="text-muted-foreground text-xs">
                Datos actualizados automáticamente cada 5 minutos
              </span>
            </footer>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Page() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  )
}
