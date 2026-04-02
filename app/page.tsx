"use client"

import { Suspense, useEffect, useState, startTransition, ViewTransition } from "react"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { GeneralMetrics } from "@/components/general-metrics"
import { DayProgressSection } from "@/components/day-progress"
import { ResourcesDetail } from "@/components/resources-detail"
import { SectionTabs } from "@/components/section-tabs"
import { PanelOverview } from "@/components/panel-overview"
import { WeeklyOverview } from "@/components/weekly-overview"
import { SettingsPage } from "@/components/settings-page"
import { MembersPage } from "@/components/miembros/members-page"
import { Spotlight } from "@/components/spotlight"
import { WorkerDetailDrawer } from "@/components/worker-detail-sheet"
import { AgentesPage } from "@/components/sri/pages/agentes-page"
import { ClientesPage } from "@/components/sri/pages/clientes-page"
import { PortafolioPage } from "@/components/sri/pages/portafolio-page"
import { MetasPage } from "@/components/sri/pages/metas-page"
import { AlertasPage } from "@/components/sri/pages/alertas-page"
import { ProviderPerformancePage } from "@/components/provider-performance/index"
import { DecisionIntelligencePage } from "@/components/decision-intelligence/index"
import { useAppStore } from "@/lib/store"
import { useSettingsSync } from "@/hooks/use-settings-sync"
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

const EXCLUDED_SECTIONS = ["settings", "account", "notifications", "provider-performance", "decision-intelligence"]

function getISOWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

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

  useSettingsSync()

  const { data: members = [], isLoading, isError } = useLeaderboard(viewMode)
  const { data: dayProgress = [] } = useHourlyProgress()
  const { data: dataDate = null } = useLatestDailyDate()
  const { data: weeklySummary = null } = useWeeklyTeamSummary()
  const { data: dailyTrend = [] } = useWeekDailyTrend()

  const now = new Date()
  const week = getISOWeek(now)
  const today = now.toISOString().split("T")[0]
  const isStale = dataDate ? dataDate < today : false
  const displayDate = dataDate
    ? new Date(dataDate + "T12:00:00").toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : now.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })

  const sectionLabel: Record<string, string> = {
    overview: "Resumen Semanal",
    metrics: "Métricas Generales",
    "day-progress": "Progreso del Día",
    resources: "Detalle de Recursos",
    dashboard: "Dashboard",
    panel: "Panel",
    members: "Miembros",
    settings: "Configuración",
    account: "Mi Cuenta",
    notifications: "Notificaciones",
    "sri-agentes": "Agentes",
    "sri-clientes": "Clientes",
    "sri-portafolio": "Portafolio",
    "sri-metas": "Metas",
    "sri-alertas": "Alertas",
    "provider-performance": "Desempeño de Proveedores",
    "decision-intelligence": "Inteligencia Decisional",
  }

  return (
    <SidebarProvider>
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <SidebarInset className="overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 shadow-[0_1px_0_0_rgba(0,0,0,0.08)]">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">{sectionLabel[activeSection] ?? activeSection}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex-1 flex justify-center">
            {!EXCLUDED_SECTIONS.includes(activeSection) && !isLoading && !isError && (
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                {viewMode === "daily" && (
                  <>
                    <span>{displayDate}</span>
                    <span className="text-[#ebebeb]">·</span>
                  </>
                )}
                <span>Sem {week}{viewMode === "weekly" ? `, ${now.getFullYear()}` : ""}</span>
                <span className="text-[#ebebeb]">·</span>
                <span>{members.length} surtidores</span>
                {isStale && (
                  <span className="bg-warning/15 text-warning-foreground rounded-full px-2 py-0.5 font-medium">
                    último dato disponible
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSpotlightOpen(true)}
              className="gap-2 text-muted-foreground"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Buscar</span>
              <kbd className="bg-[#fafafa] shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] hidden items-center gap-1 rounded px-1.5 font-mono text-[10px] sm:inline-flex">
                ⌘K
              </kbd>
            </Button>
            <div className="flex items-center gap-1 rounded-full bg-[#fafafa] p-1 shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px]">
              <button
                onClick={() => startTransition(() => setViewMode("daily"))}
                className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${
                  viewMode === "daily"
                    ? "bg-[#171717] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => startTransition(() => setViewMode("weekly"))}
                className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${
                  viewMode === "weekly"
                    ? "bg-[#171717] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semana
              </button>
            </div>
          </div>
        </header>

        <main id="main-content" className="w-full flex-1 min-h-0 overflow-auto px-4 py-8 md:px-6 lg:px-8 lg:py-10" tabIndex={-1}>
          <div className="flex flex-col gap-10">
            {isError && !EXCLUDED_SECTIONS.includes(activeSection) && (
              <ViewTransition enter="vt-fade-in" exit="vt-fade-out" default="none">
                <div className="rounded-xl shadow-[rgba(239,68,68,0.3)_0px_0px_0px_1px] bg-red-50 text-destructive px-5 py-4 text-sm">
                  No se pudo cargar la información. Verifica la conexión a Supabase.
                </div>
              </ViewTransition>
            )}

            {isLoading && !EXCLUDED_SECTIONS.includes(activeSection) && (
              <ViewTransition exit="vt-fade-out" default="none">
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
                    <span className="text-muted-foreground text-sm">Cargando datos...</span>
                  </div>
                </div>
              </ViewTransition>
            )}

            {!isLoading && !isError && !EXCLUDED_SECTIONS.includes(activeSection) && (
              <ViewTransition key={activeSection} enter="vt-fade-in" exit="vt-fade-out" default="none">
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
                {activeSection === "members" && <MembersPage />}
                {activeSection === "sri-agentes" && <AgentesPage />}
                {activeSection === "sri-clientes" && <ClientesPage />}
                {activeSection === "sri-portafolio" && <PortafolioPage />}
                {activeSection === "sri-metas" && <MetasPage />}
                {activeSection === "sri-alertas" && <AlertasPage />}
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
              </ViewTransition>
            )}

            {activeSection === "settings" && (
              <ViewTransition enter="vt-fade-in" exit="vt-fade-out" default="none">
                <SettingsPage />
              </ViewTransition>
            )}
            {activeSection === "provider-performance" && (
              <ViewTransition enter="vt-fade-in" exit="vt-fade-out" default="none">
                <ProviderPerformancePage />
              </ViewTransition>
            )}
            {activeSection === "decision-intelligence" && (
              <ViewTransition enter="vt-fade-in" exit="vt-fade-out" default="none">
                <DecisionIntelligencePage />
              </ViewTransition>
            )}

            {!EXCLUDED_SECTIONS.includes(activeSection) && (
              <footer className="flex items-center justify-between pb-4 pt-6 shadow-[0_-1px_0_0_rgba(0,0,0,0.08)]">
                <span className="text-muted-foreground text-xs">
                  Datos actualizados automáticamente cada 5 minutos
                </span>
              </footer>
            )}
          </div>
        </main>
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
