"use client"

import { Suspense, useEffect, useState } from "react"
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
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { LeaderboardHeader } from "@/components/leaderboard-header"
import { GeneralMetrics } from "@/components/general-metrics"
import { DayProgressSection } from "@/components/day-progress"
import { ResourcesDetail } from "@/components/resources-detail"
import { SectionTabs } from "@/components/section-tabs"
import { PanelOverview } from "@/components/panel-overview"
import { WeeklyOverview } from "@/components/weekly-overview"
import { SettingsPage } from "@/components/settings-page"
import { Spotlight } from "@/components/spotlight"
import { WorkerDetailDrawer } from "@/components/worker-detail-sheet"
import { useAppStore } from "@/lib/store"
import {
  useLeaderboard,
  useHourlyProgress,
  useLatestDailyDate,
  useWeeklyTeamSummary,
  useWeekDailyTrend,
} from "@/hooks/use-leaderboard-queries"
import { resources } from "@/lib/leaderboard-data"
import type { TeamMember } from "@/lib/leaderboard-data"

const VIEW_MODES = ["daily", "weekly"] as const

const EXCLUDED_SECTIONS = ["settings", "account", "notifications"]

function PageContent() {
  const [viewMode, setViewMode] = useQueryState(
    "view",
    parseAsStringLiteral(VIEW_MODES).withDefault("daily")
  )
  const [spotlightOpen, setSpotlightOpen] = useState(false)
  const [workerSheetMember, setWorkerSheetMember] = useState<TeamMember | null>(null)
  const [workerSheetOpen, setWorkerSheetOpen] = useState(false)

  const activeSection = useAppStore((s) => s.activeSection)
  const setActiveSection = useAppStore((s) => s.setActiveSection)
  const defaultSection = useAppStore((s) => s.settings.dashboardPrefs.defaultSection)

  useEffect(() => {
    if (defaultSection && defaultSection !== "overview") {
      setActiveSection(defaultSection)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: members = [], isLoading, isError } = useLeaderboard(viewMode)
  const { data: dayProgress = [] } = useHourlyProgress()
  const { data: dataDate = null } = useLatestDailyDate()
  const { data: weeklySummary = null } = useWeeklyTeamSummary()
  const { data: dailyTrend = [] } = useWeekDailyTrend()

  const sectionLabel: Record<string, string> = {
    overview: "Resumen Semanal",
    metrics: "Métricas Generales",
    "day-progress": "Progreso del Día",
    resources: "Detalle de Recursos",
    dashboard: "Dashboard",
    panel: "Panel",
    settings: "Configuración",
    account: "Mi Cuenta",
    notifications: "Notificaciones",
  }

  return (
    <SidebarProvider>
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <SidebarInset className="overflow-hidden">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSpotlightOpen(true)}
              className="gap-2 text-muted-foreground"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Buscar</span>
              <kbd className="bg-muted border-border hidden items-center gap-1 rounded border px-1.5 font-mono text-[10px] sm:inline-flex">
                ⌘K
              </kbd>
            </Button>
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

        <div className="w-full flex-1 min-h-0 overflow-auto px-4 py-8 md:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-10">
            {!EXCLUDED_SECTIONS.includes(activeSection) && (
              <>
                <LeaderboardHeader
                  memberCount={members.length}
                  viewMode={viewMode}
                  dataDate={dataDate}
                />
                <Separator className="opacity-20" />
              </>
            )}

            {isError && !EXCLUDED_SECTIONS.includes(activeSection) && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border px-5 py-4 text-sm">
                No se pudo cargar la información. Verifica la conexión a Supabase.
              </div>
            )}

            {isLoading && !EXCLUDED_SECTIONS.includes(activeSection) && (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
                  <span className="text-muted-foreground text-sm">Cargando datos...</span>
                </div>
              </div>
            )}

            {!isLoading && !isError && !EXCLUDED_SECTIONS.includes(activeSection) && (
              <>
                {activeSection === "overview" && (
                  <WeeklyOverview
                    members={members}
                    weeklySummary={weeklySummary}
                    dailyTrend={dailyTrend}
                  />
                )}
                {activeSection === "metrics" && (
                  <GeneralMetrics members={members} viewMode={viewMode} />
                )}
                {activeSection === "day-progress" && <DayProgressSection data={dayProgress} />}
                {activeSection === "resources" && <ResourcesDetail resources={resources} />}
                {activeSection === "dashboard" && (
                  <SectionTabs
                    metricsContent={
                      <GeneralMetrics
                        members={members}
                        viewMode={viewMode}
                      />
                    }
                    dayProgressContent={<DayProgressSection data={dayProgress} />}
                    resourcesContent={<ResourcesDetail resources={resources} />}
                  />
                )}
                {activeSection === "panel" && <PanelOverview />}
                {activeSection === "account" && (
                  <div className="text-muted-foreground py-20 text-center text-sm">
                    Perfil de cuenta — próximamente
                  </div>
                )}
                {activeSection === "notifications" && (
                  <div className="text-muted-foreground py-20 text-center text-sm">
                    Notificaciones — próximamente
                  </div>
                )}
              </>
            )}

            {activeSection === "settings" && <SettingsPage />}

            {!EXCLUDED_SECTIONS.includes(activeSection) && (
              <footer className="border-border/20 flex items-center justify-between border-t pb-4 pt-6">
                <span className="text-muted-foreground text-xs">
                  Datos actualizados automáticamente cada 5 minutos
                </span>
              </footer>
            )}
          </div>
        </div>
      </SidebarInset>
      <Spotlight
        open={spotlightOpen}
        onOpenChange={setSpotlightOpen}
        members={members}
        onSetViewMode={setViewMode}
        onSelectWorker={(member) => {
          setWorkerSheetMember(member)
          setWorkerSheetOpen(true)
        }}
      />
      <WorkerDetailDrawer
        member={workerSheetMember}
        open={workerSheetOpen}
        onOpenChange={setWorkerSheetOpen}
        viewMode={viewMode}
      />
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
