# Modern Dependencies Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Install and wire Zustand, TanStack Query, nuqs, and Prettier+Tailwind plugin to replace the brittle manual fetch/state pattern in `page.tsx` and add URL-persistent view mode.

**Architecture:**

- **Zustand** holds UI-only state (`activeSection`). No data — that's TanStack Query's job.
- **TanStack Query** owns all async data: fetches, caches, and auto-refreshes every 5 min, replacing `useAutoRefresh` and the manual `useState/useEffect/useCallback` data pipeline in `page.tsx`.
- **nuqs** syncs `viewMode` (`daily`|`weekly`) to the URL (`?view=daily`) so a page refresh or shared link preserves the selected view.
- **Prettier + prettier-plugin-tailwindcss** enforces consistent formatting and auto-sorts Tailwind classes.

**Tech Stack:** Next.js 16 App Router, React 19, pnpm, TypeScript, Supabase, Tailwind v4

---

## Task 1: Install packages

**Files:**

- Modify: `package.json` (via pnpm — do not edit manually)

**Step 1: Install runtime dependencies**

```bash
cd "C:/Users/arami/Current/report generator/leaderboard"
pnpm add zustand @tanstack/react-query nuqs
```

Expected output: 3 packages added, `pnpm-lock.yaml` updated.

**Step 2: Install dev dependencies**

```bash
pnpm add -D prettier prettier-plugin-tailwindcss
```

Expected output: 2 packages added.

**Step 3: Verify installs**

```bash
pnpm list zustand @tanstack/react-query nuqs prettier prettier-plugin-tailwindcss
```

Expected: all 5 packages listed with version numbers.

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add zustand, tanstack-query, nuqs, prettier"
```

---

## Task 2: Prettier config

**Files:**

- Create: `.prettierrc`
- Modify: `package.json` — add `format` script

**Step 1: Create `.prettierrc`**

```json
{
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**Step 2: Add format script to `package.json`**

In the `"scripts"` block, add:

```json
"format": "prettier --write ."
```

So scripts becomes:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "format": "prettier --write ."
}
```

**Step 3: Run formatter**

```bash
pnpm format
```

Expected: files listed as reformatted. No errors.

**Step 4: Commit**

```bash
git add .prettierrc package.json
git commit -m "chore: add prettier config with tailwind class sorting"
```

---

## Task 3: TanStack Query provider

**Files:**

- Create: `components/providers.tsx`
- Modify: `app/layout.tsx`

**Step 1: Create `components/providers.tsx`**

```tsx
"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 min before background refetch
            refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 min
            retry: 2,
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

**Step 2: Wrap app in `app/layout.tsx`**

Open `app/layout.tsx`. It currently wraps children with `<TooltipProvider>`.

Add the import:

```tsx
import { Providers } from "@/components/providers"
```

Wrap the existing content so `Providers` is the outermost wrapper inside `<body>`:

```tsx
<body className="font-sans antialiased">
  <Providers>
    <TooltipProvider>{children}</TooltipProvider>
  </Providers>
</body>
```

**Step 3: Verify the app still builds**

```bash
pnpm build
```

Expected: build succeeds, no type errors.

**Step 4: Commit**

```bash
git add components/providers.tsx app/layout.tsx
git commit -m "feat: add TanStack Query provider"
```

---

## Task 4: nuqs adapter

**Files:**

- Modify: `app/layout.tsx`

**Step 1: Add NuqsAdapter to `app/layout.tsx`**

nuqs requires its adapter to be in the root layout for App Router.

Add import:

```tsx
import { NuqsAdapter } from "nuqs/adapters/next/app"
```

Wrap inside `Providers` (nuqs must be inside React tree but outside client components):

```tsx
<body className="font-sans antialiased">
  <Providers>
    <NuqsAdapter>
      <TooltipProvider>{children}</TooltipProvider>
    </NuqsAdapter>
  </Providers>
</body>
```

**Step 2: Verify build**

```bash
pnpm build
```

Expected: succeeds.

**Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add nuqs adapter for URL state"
```

---

## Task 5: Zustand store

**Files:**

- Create: `lib/store.ts`

**Step 1: Create `lib/store.ts`**

```ts
import { create } from "zustand"

interface AppState {
  activeSection: string
  setActiveSection: (section: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: "overview",
  setActiveSection: (section) => set({ activeSection: section }),
}))
```

**Step 2: Commit**

```bash
git add lib/store.ts
git commit -m "feat: add zustand store for UI state"
```

---

## Task 6: Query hooks

Replace the raw async functions called ad-hoc in `page.tsx` with TanStack Query hooks. These live in `hooks/`.

**Files:**

- Create: `hooks/use-leaderboard-queries.ts`

**Step 1: Create `hooks/use-leaderboard-queries.ts`**

```ts
"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getTodayLeaderboard,
  getWeeklyLeaderboard,
  getTodayHourlyProgress,
  getTodayTeamSummary,
  getLatestDailyDate,
  getWeeklyTeamSummary,
  getWeekDailyTrend,
} from "@/lib/leaderboard-queries"

export function useLeaderboard(viewMode: "daily" | "weekly") {
  return useQuery({
    queryKey: ["leaderboard", viewMode],
    queryFn: () => (viewMode === "daily" ? getTodayLeaderboard() : getWeeklyLeaderboard()),
  })
}

export function useHourlyProgress() {
  return useQuery({
    queryKey: ["hourlyProgress"],
    queryFn: getTodayHourlyProgress,
  })
}

export function useTeamSummary(viewMode: "daily" | "weekly") {
  return useQuery({
    queryKey: ["teamSummary", viewMode],
    queryFn: () => (viewMode === "daily" ? getTodayTeamSummary() : Promise.resolve(null)),
    enabled: viewMode === "daily",
  })
}

export function useLatestDailyDate() {
  return useQuery({
    queryKey: ["latestDailyDate"],
    queryFn: getLatestDailyDate,
  })
}

export function useWeeklyTeamSummary() {
  return useQuery({
    queryKey: ["weeklyTeamSummary"],
    queryFn: getWeeklyTeamSummary,
  })
}

export function useWeekDailyTrend() {
  return useQuery({
    queryKey: ["weekDailyTrend"],
    queryFn: getWeekDailyTrend,
  })
}
```

**Step 2: Commit**

```bash
git add hooks/use-leaderboard-queries.ts
git commit -m "feat: add TanStack Query hooks for all data fetches"
```

---

## Task 7: Refactor `app/page.tsx`

Replace the manual data pipeline and `useState`/`useCallback`/`useEffect` block with the new hooks and store.

**Files:**

- Modify: `app/page.tsx`
- Delete: `hooks/use-auto-refresh.ts` (fully replaced by `refetchInterval` in QueryClient)

**Step 1: Replace the entire `page.tsx` content**

```tsx
"use client"

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

export default function Page() {
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

            <footer className="border-border/20 flex items-center justify-between border-t pt-6 pb-4">
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
```

**Step 2: Delete the now-unused hook**

```bash
rm hooks/use-auto-refresh.ts
```

**Step 3: Verify build**

```bash
pnpm build
```

Expected: build succeeds with no type errors. If `use-auto-refresh` is imported anywhere else, remove those imports too.

**Step 4: Run dev and smoke test**

```bash
pnpm dev
```

- Open `http://localhost:3000` — data loads normally
- Toggle Hoy / Semana — URL updates to `?view=daily` / `?view=weekly`
- Hard refresh — selected view is preserved from URL
- Wait or check network tab — queries refetch in background every 5 min

**Step 5: Commit**

```bash
git add app/page.tsx
git rm hooks/use-auto-refresh.ts
git commit -m "feat: replace manual fetch pattern with TanStack Query + nuqs + zustand"
```

---

## Task 8: Verify final build and push

**Step 1: Full build**

```bash
pnpm build
```

Expected: ✓ compiled successfully, no errors, no warnings about missing modules.

**Step 2: Lint**

```bash
pnpm lint
```

Expected: no errors.

**Step 3: Format check**

```bash
pnpm format
```

Expected: all files already formatted (no changes since Task 2 ran it).

**Step 4: Push**

```bash
git push origin master
```

---

## Summary of files changed

| File                               | Change                                 |
| ---------------------------------- | -------------------------------------- |
| `package.json`                     | +5 deps, +format script                |
| `pnpm-lock.yaml`                   | updated                                |
| `.prettierrc`                      | new                                    |
| `components/providers.tsx`         | new — QueryClientProvider              |
| `app/layout.tsx`                   | +Providers, +NuqsAdapter               |
| `lib/store.ts`                     | new — Zustand store                    |
| `hooks/use-leaderboard-queries.ts` | new — TanStack Query hooks             |
| `app/page.tsx`                     | refactored — uses new hooks/store/nuqs |
| `hooks/use-auto-refresh.ts`        | deleted — replaced by refetchInterval  |
