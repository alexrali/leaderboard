# Panel Overview — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Panel sidebar item's generic tab-dashboard with a dedicated team-level overview page featuring KPI cards, a 60-day contribution heatmap with day-detail drawer, and a today's hourly pace chart.

**Architecture:** New `components/panel-overview.tsx` assembled from sub-components in `components/panel/`. Three new query functions added to `lib/leaderboard-queries.ts` and wrapped in hooks in `hooks/use-leaderboard-queries.ts`. The sidebar Panel item is rewired from `"dashboard"` → `"panel"`, and `app/page.tsx` gains a new branch for `activeSection === "panel"`.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS v4, Recharts (already installed), Radix UI Sheet (already installed via shadcn), Zustand store, React Query (@tanstack/react-query), Supabase client from `lib/supabase.ts`.

**No test framework detected** — verify each task with `pnpm tsc --noEmit` after writing, and visually in `pnpm dev`.

---

## Key File Map (read before starting)

| File | Purpose |
|------|---------|
| `lib/leaderboard-queries.ts` | All Supabase query functions — add new ones here |
| `hooks/use-leaderboard-queries.ts` | React Query hooks — add new ones here |
| `lib/store.ts` | Zustand store — `SectionKey` type lives here |
| `app/page.tsx` | Main router — add `panel` case here |
| `components/app-sidebar.tsx` | Sidebar nav — Panel item onClick is here (line 100) |
| `components/day-progress.tsx` | Reference: how Recharts AreaChart is used |

---

## Database columns used (team_performance_daily)

```
date, team_total_ue, active_workers, total_routes_completed,
team_efficiency_score
```

## Database columns used (team_performance_hourly)

```
date, hour_bucket, team_total_ue, active_workers
```

## Database columns used (performance_daily, for streak + drawer weight/volume)

```
date, hit_target, total_weight_kg, total_volume_m3
```

## Database columns used (worker_daily_sku_summary view)

```
date, folios_completed, distinct_skus
```

---

## Task 1: Add query functions to lib/leaderboard-queries.ts

**File:** Modify `lib/leaderboard-queries.ts` — append to end of file.

### Step 1: Add the three exported types

Append to `lib/leaderboard-queries.ts`:

```typescript
// ─── Panel: KPI types ────────────────────────────────────────────────────────

export type PanelKPIs = {
  teamTotalUE: number
  activeWorkers: number
  totalFolios: number
  teamStreak: number // consecutive days where majority of workers hit target
}

export type TeamDayCell = {
  date: string
  teamUE: number
  activeWorkers: number
  totalRoutes: number
  efficiencyScore: number | null
}

export type TeamDayDetail = {
  date: string
  teamUE: number
  activeWorkers: number
  totalRoutes: number
  totalFolios: number
  totalSkus: number
  totalWeightKg: number
  totalVolumeM3: number
  hourly: Array<{ hour: string; teamUE: number; activeWorkers: number }>
}
```

### Step 2: Add getPanelKPIs function

```typescript
export async function getPanelKPIs(): Promise<PanelKPIs> {
  const date = await getLatestDailyDate()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sinceStr = thirtyDaysAgo.toISOString().split("T")[0]

  const [teamRow, skuRow, streakRows] = await Promise.all([
    supabase
      .from("team_performance_daily")
      .select("team_total_ue, active_workers")
      .eq("date", date)
      .single(),

    supabase
      .from("worker_daily_sku_summary")
      .select("folios_completed")
      .eq("date", date),

    supabase
      .from("performance_daily")
      .select("date, hit_target")
      .gte("date", sinceStr)
      .order("date", { ascending: false }),
  ])

  // Compute team streak: consecutive days where majority of workers hit target
  let streak = 0
  if (streakRows.data && streakRows.data.length > 0) {
    // Group by date
    const byDate = new Map<string, { hits: number; total: number }>()
    for (const row of streakRows.data) {
      const entry = byDate.get(row.date) ?? { hits: 0, total: 0 }
      entry.total += 1
      if (row.hit_target) entry.hits += 1
      byDate.set(row.date, entry)
    }
    // Walk dates from most recent backwards
    const sortedDates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a))
    for (const d of sortedDates) {
      const { hits, total } = byDate.get(d)!
      if (total > 0 && hits / total >= 0.5) {
        streak += 1
      } else {
        break
      }
    }
  }

  const totalFolios = (skuRow.data ?? []).reduce(
    (s, r) => s + Number(r.folios_completed ?? 0),
    0
  )

  return {
    teamTotalUE: parseFloat(teamRow.data?.team_total_ue ?? 0),
    activeWorkers: Number(teamRow.data?.active_workers ?? 0),
    totalFolios,
    teamStreak: streak,
  }
}
```

### Step 3: Add getTeamDailyHistory function

```typescript
export async function getTeamDailyHistory(days = 60): Promise<TeamDayCell[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("team_performance_daily")
    .select("date, team_total_ue, active_workers, total_routes_completed, team_efficiency_score")
    .gte("date", sinceStr)
    .order("date", { ascending: true })

  if (error || !data) return []

  return data.map((row: any) => ({
    date: row.date,
    teamUE: parseFloat(row.team_total_ue ?? 0),
    activeWorkers: Number(row.active_workers ?? 0),
    totalRoutes: Number(row.total_routes_completed ?? 0),
    efficiencyScore: row.team_efficiency_score != null ? Number(row.team_efficiency_score) : null,
  }))
}
```

### Step 4: Add getTeamDayDetail function

```typescript
export async function getTeamDayDetail(date: string): Promise<TeamDayDetail | null> {
  const [dailyRow, skuRows, workerRows, hourlyRows] = await Promise.all([
    supabase
      .from("team_performance_daily")
      .select("team_total_ue, active_workers, total_routes_completed")
      .eq("date", date)
      .single(),

    supabase
      .from("worker_daily_sku_summary")
      .select("folios_completed, distinct_skus")
      .eq("date", date),

    supabase
      .from("performance_daily")
      .select("total_weight_kg, total_volume_m3")
      .eq("date", date),

    supabase
      .from("team_performance_hourly")
      .select("hour_bucket, team_total_ue, active_workers")
      .eq("date", date)
      .order("hour_bucket", { ascending: true }),
  ])

  if (!dailyRow.data) return null

  const totalFolios = (skuRows.data ?? []).reduce(
    (s, r) => s + Number(r.folios_completed ?? 0),
    0
  )
  const totalSkus = (skuRows.data ?? []).reduce(
    (s, r) => s + Number(r.distinct_skus ?? 0),
    0
  )
  const totalWeightKg = (workerRows.data ?? []).reduce(
    (s, r) => s + parseFloat(r.total_weight_kg ?? 0),
    0
  )
  const totalVolumeM3 = (workerRows.data ?? []).reduce(
    (s, r) => s + parseFloat(r.total_volume_m3 ?? 0),
    0
  )

  const hourly = (hourlyRows.data ?? []).map((row: any) => ({
    hour: new Date(row.hour_bucket).toLocaleTimeString("es-MX", {
      hour: "numeric",
      hour12: true,
    }),
    teamUE: parseFloat(row.team_total_ue ?? 0),
    activeWorkers: Number(row.active_workers ?? 0),
  }))

  return {
    date,
    teamUE: parseFloat(dailyRow.data.team_total_ue ?? 0),
    activeWorkers: Number(dailyRow.data.active_workers ?? 0),
    totalRoutes: Number(dailyRow.data.total_routes_completed ?? 0),
    totalFolios,
    totalSkus,
    totalWeightKg,
    totalVolumeM3,
    hourly,
  }
}
```

### Step 5: Verify TypeScript

Run: `pnpm tsc --noEmit`
Expected: no errors

### Step 6: Commit

```bash
git add lib/leaderboard-queries.ts
git commit -m "feat(panel): add getPanelKPIs, getTeamDailyHistory, getTeamDayDetail queries"
```

---

## Task 2: Add React Query hooks to hooks/use-leaderboard-queries.ts

**File:** Modify `hooks/use-leaderboard-queries.ts`

### Step 1: Add imports at top of file

Add to the existing import from `@/lib/leaderboard-queries`:

```typescript
import {
  getTodayLeaderboard,
  getWeeklyLeaderboard,
  getTodayHourlyProgress,
  getTodayTeamSummary,
  getLatestDailyDate,
  getWeeklyTeamSummary,
  getWeekDailyTrend,
  getPanelKPIs,          // add
  getTeamDailyHistory,   // add
  getTeamDayDetail,      // add
} from "@/lib/leaderboard-queries"
```

### Step 2: Append three hooks to end of file

```typescript
export function usePanelKPIs() {
  return useQuery({
    queryKey: ["panelKPIs"],
    queryFn: getPanelKPIs,
  })
}

export function useTeamDailyHistory(days = 60) {
  return useQuery({
    queryKey: ["teamDailyHistory", days],
    queryFn: () => getTeamDailyHistory(days),
  })
}

export function useTeamDayDetail(date: string | null) {
  return useQuery({
    queryKey: ["teamDayDetail", date],
    queryFn: () => getTeamDayDetail(date!),
    enabled: !!date,
  })
}
```

### Step 3: Verify TypeScript

Run: `pnpm tsc --noEmit`
Expected: no errors

### Step 4: Commit

```bash
git add hooks/use-leaderboard-queries.ts
git commit -m "feat(panel): add usePanelKPIs, useTeamDailyHistory, useTeamDayDetail hooks"
```

---

## Task 3: Create KPI Cards component

**File:** Create `components/panel/kpi-cards.tsx`

Note: create the `components/panel/` directory first.

```typescript
"use client"

import { Flame, Users, FileText, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { PanelKPIs } from "@/lib/leaderboard-queries"

interface PanelKpiCardsProps {
  data: PanelKPIs
}

export function PanelKpiCards({ data }: PanelKpiCardsProps) {
  const cards = [
    {
      label: "UE del Equipo",
      value: data.teamTotalUE.toLocaleString("es-MX", { maximumFractionDigits: 1 }),
      icon: <Zap className="size-4 text-yellow-500" />,
      sub: "hoy",
    },
    {
      label: "Trabajadores Activos",
      value: String(data.activeWorkers),
      icon: <Users className="size-4 text-blue-500" />,
      sub: "hoy",
    },
    {
      label: "Folios Completados",
      value: String(data.totalFolios),
      icon: <FileText className="size-4 text-purple-500" />,
      sub: "hoy",
    },
    {
      label: "Racha de Meta",
      value: `${data.teamStreak}d`,
      icon: <Flame className={`size-4 ${data.teamStreak >= 3 ? "text-orange-500" : "text-muted-foreground"}`} />,
      sub: "días consecutivos",
      highlight: data.teamStreak >= 3,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className={card.highlight ? "border-orange-500/30 bg-orange-500/5" : ""}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-muted-foreground text-xs font-medium">{card.label}</p>
              {card.icon}
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{card.value}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### Step 1: Verify TypeScript

Run: `pnpm tsc --noEmit`
Expected: no errors

### Step 2: Commit

```bash
git add components/panel/kpi-cards.tsx
git commit -m "feat(panel): add PanelKpiCards component"
```

---

## Task 4: Create Contribution Heatmap component

**File:** Create `components/panel/contribution-heatmap.tsx`

The heatmap is a pure CSS grid — no Recharts needed.
Color is based on `efficiencyScore` (0–100). If null, falls back to relative UE %.

```typescript
"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { TeamDayCell } from "@/lib/leaderboard-queries"

interface ContributionHeatmapProps {
  data: TeamDayCell[]
  onDayClick: (date: string) => void
  selectedDate: string | null
}

function getCellColor(cell: TeamDayCell, maxUE: number): string {
  if (cell.teamUE === 0) return "bg-muted"

  const score = cell.efficiencyScore
  if (score !== null) {
    if (score >= 85) return "bg-[#22c55e]"
    if (score >= 70) return "bg-[#16a34a]"
    if (score >= 50) return "bg-[#15803d]"
    return "bg-[#166534]"
  }

  // Fallback: relative to max UE in dataset
  const pct = maxUE > 0 ? cell.teamUE / maxUE : 0
  if (pct >= 0.75) return "bg-[#22c55e]"
  if (pct >= 0.5) return "bg-[#16a34a]"
  if (pct >= 0.25) return "bg-[#15803d]"
  return "bg-[#166534]"
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })
}

// Build a 7-column grid with empty cells for alignment
function buildGrid(data: TeamDayCell[], days: number): Array<TeamDayCell | null> {
  // Fill a map for quick lookup
  const map = new Map(data.map((d) => [d.date, d]))

  // Start from `days` ago, aligned to Monday
  const end = new Date()
  end.setHours(12, 0, 0, 0)
  const start = new Date(end)
  start.setDate(start.getDate() - days + 1)

  // Align start to the previous Monday
  const dayOfWeek = start.getDay() // 0=Sun
  const offsetToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  start.setDate(start.getDate() - offsetToMonday)

  const cells: Array<TeamDayCell | null> = []
  const cursor = new Date(start)

  while (cursor <= end) {
    const key = cursor.toISOString().split("T")[0]
    cells.push(map.get(key) ?? null)
    cursor.setDate(cursor.getDate() + 1)
  }

  return cells
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

export function ContributionHeatmap({ data, onDayClick, selectedDate }: ContributionHeatmapProps) {
  const maxUE = data.length > 0 ? Math.max(...data.map((d) => d.teamUE)) : 0
  const cells = buildGrid(data, 60)

  // Month labels: find first cell of each month
  const monthLabels: Array<{ col: number; label: string }> = []
  let lastMonth = -1
  cells.forEach((cell, i) => {
    if (!cell) return
    const d = new Date(cell.date + "T12:00:00")
    if (d.getMonth() !== lastMonth) {
      lastMonth = d.getMonth()
      monthLabels.push({
        col: Math.floor(i / 7) + 1,
        label: d.toLocaleDateString("es-MX", { month: "short" }),
      })
    }
  })

  const totalCols = Math.ceil(cells.length / 7)

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Actividad del Equipo — últimos 60 días</h3>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-0">
          {/* Month labels row */}
          <div
            className="mb-1 grid text-[10px] text-muted-foreground"
            style={{ gridTemplateColumns: `24px repeat(${totalCols}, 14px)`, gap: "2px" }}
          >
            <div />
            {Array.from({ length: totalCols }, (_, col) => {
              const label = monthLabels.find((m) => m.col === col + 1)
              return <div key={col}>{label?.label ?? ""}</div>
            })}
          </div>

          {/* Day rows */}
          {DAY_LABELS.map((dayLabel, row) => (
            <div
              key={dayLabel}
              className="grid items-center"
              style={{ gridTemplateColumns: `24px repeat(${totalCols}, 14px)`, gap: "2px", marginBottom: "2px" }}
            >
              <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
              {Array.from({ length: totalCols }, (_, col) => {
                const cell = cells[col * 7 + row]
                if (!cell) {
                  return <div key={col} className="size-[14px] rounded-sm" />
                }
                const isSelected = cell.date === selectedDate
                return (
                  <Tooltip key={col}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onDayClick(cell.date)}
                        className={`size-[14px] rounded-sm transition-all hover:ring-2 hover:ring-white/30 ${getCellColor(cell, maxUE)} ${isSelected ? "ring-2 ring-white/60" : ""}`}
                        aria-label={`${formatDate(cell.date)}: ${cell.teamUE.toLocaleString("es-MX", { maximumFractionDigits: 1 })} UE`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold">{formatDate(cell.date)}</p>
                      <p className="text-muted-foreground">
                        {cell.teamUE.toLocaleString("es-MX", { maximumFractionDigits: 1 })} UE ·{" "}
                        {cell.activeWorkers} trabajadores
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-[10px] text-muted-foreground">Menos</span>
        <div className="size-[10px] rounded-sm bg-muted" />
        <div className="size-[10px] rounded-sm bg-[#166534]" />
        <div className="size-[10px] rounded-sm bg-[#15803d]" />
        <div className="size-[10px] rounded-sm bg-[#16a34a]" />
        <div className="size-[10px] rounded-sm bg-[#22c55e]" />
        <span className="text-[10px] text-muted-foreground">Más</span>
      </div>
    </div>
  )
}
```

### Step 1: Verify TypeScript

Run: `pnpm tsc --noEmit`
Expected: no errors

### Step 2: Commit

```bash
git add components/panel/contribution-heatmap.tsx
git commit -m "feat(panel): add ContributionHeatmap component"
```

---

## Task 5: Create Day Detail Drawer component

**File:** Create `components/panel/heatmap-day-drawer.tsx`

Uses Radix Sheet (shadcn). Reuses Recharts BarChart.

```typescript
"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"
import { useTeamDayDetail } from "@/hooks/use-leaderboard-queries"

interface HeatmapDayDrawerProps {
  date: string | null
  onClose: () => void
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function HeatmapDayDrawer({ date, onClose }: HeatmapDayDrawerProps) {
  const { data, isLoading } = useTeamDayDetail(date)

  const metrics = data
    ? [
        { label: "UE del Equipo", value: data.teamUE.toLocaleString("es-MX", { maximumFractionDigits: 1 }) },
        { label: "Trabajadores", value: String(data.activeWorkers) },
        { label: "Folios", value: String(data.totalFolios) },
        { label: "SKUs", value: String(data.totalSkus) },
        { label: "Peso (kg)", value: data.totalWeightKg.toLocaleString("es-MX", { maximumFractionDigits: 1 }) },
        { label: "Volumen (m³)", value: data.totalVolumeM3.toLocaleString("es-MX", { maximumFractionDigits: 2 }) },
      ]
    : []

  return (
    <Sheet open={!!date} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-[380px] sm:w-[460px] overflow-y-auto">
        {date && (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <SheetTitle className="text-base capitalize leading-snug">
                  {formatFullDate(date)}
                </SheetTitle>
                {data && (
                  <Badge variant={data.totalFolios > 0 ? "default" : "secondary"} className="shrink-0 mt-0.5">
                    {data.totalFolios > 0 ? "✅ Con actividad" : "Sin datos"}
                  </Badge>
                )}
              </div>
            </SheetHeader>

            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
              </div>
            )}

            {!isLoading && data && (
              <div className="space-y-6">
                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-3">
                  {metrics.map((m) => (
                    <Card key={m.label}>
                      <CardContent className="p-4">
                        <p className="text-muted-foreground text-xs">{m.label}</p>
                        <p className="mt-1 text-xl font-bold">{m.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Mini hourly bar chart */}
                {data.hourly.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">UE por hora</p>
                    <div className="h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.hourly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                          <XAxis
                            dataKey="hour"
                            tick={{ fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <RechartsTooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null
                              return (
                                <div className="border-border bg-card rounded-lg border px-3 py-2 text-xs shadow-lg">
                                  <p className="font-semibold">{label}</p>
                                  <p className="text-muted-foreground">
                                    {Number(payload[0].value).toLocaleString("es-MX", { maximumFractionDigits: 1 })} UE
                                  </p>
                                </div>
                              )
                            }}
                          />
                          <Bar dataKey="teamUE" fill="#16a34a" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isLoading && !data && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Sin datos para este día.
              </p>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

### Step 1: Verify TypeScript

Run: `pnpm tsc --noEmit`
Expected: no errors

### Step 2: Commit

```bash
git add components/panel/heatmap-day-drawer.tsx
git commit -m "feat(panel): add HeatmapDayDrawer component"
```

---

## Task 6: Create Team Pace Chart component

**File:** Create `components/panel/team-pace-chart.tsx`

Uses `useHourlyProgress()` (already exists). Computes cumulative UE in the component.

```typescript
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"
import { useHourlyProgress } from "@/hooks/use-leaderboard-queries"
import type { DayProgress } from "@/lib/leaderboard-data"

function buildCumulative(data: DayProgress[]) {
  let running = 0
  return data.map((row) => {
    running += row.teamUE ?? 0
    return {
      hour: row.hour,
      cumulativeUE: parseFloat(running.toFixed(1)),
      hourUE: parseFloat((row.teamUE ?? 0).toFixed(1)),
    }
  })
}

export function TeamPaceChart() {
  const { data = [], isLoading } = useHourlyProgress()

  const chartData = buildCumulative(data)
  const latestUE = chartData.at(-1)?.cumulativeUE ?? 0

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Ritmo del Día</CardTitle>
        </CardHeader>
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground text-sm">Turno aún no iniciado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Ritmo del Día — UE Acumulada</CardTitle>
          <span className="text-muted-foreground text-xs">
            Total actual:{" "}
            <span className="text-foreground font-bold">
              {latestUE.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
            </span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="panelUEGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const cumUE = payload.find((p) => p.dataKey === "cumulativeUE")
                  const hourUE = payload.find((p) => p.dataKey === "hourUE")
                  return (
                    <div className="border-border bg-card rounded-xl border px-4 py-3 shadow-lg">
                      <p className="text-card-foreground mb-1.5 text-xs font-semibold">{label}</p>
                      <p className="text-muted-foreground text-xs">
                        Acumulado:{" "}
                        <span className="text-card-foreground font-mono font-bold">
                          {Number(cumUE?.value ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 1 })}
                        </span>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Esta hora:{" "}
                        <span className="text-card-foreground font-mono font-bold">
                          +{Number(hourUE?.value ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 1 })}
                        </span>
                      </p>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulativeUE"
                stroke="#16a34a"
                strokeWidth={2}
                fill="url(#panelUEGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#22c55e" }}
              />
              {/* Hidden area for hourUE so tooltip can read it */}
              <Area
                type="monotone"
                dataKey="hourUE"
                stroke="transparent"
                fill="transparent"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Step 1: Verify TypeScript

Run: `pnpm tsc --noEmit`
Expected: no errors

### Step 2: Commit

```bash
git add components/panel/team-pace-chart.tsx
git commit -m "feat(panel): add TeamPaceChart component"
```

---

## Task 7: Create Panel Overview assembly component

**File:** Create `components/panel-overview.tsx`

```typescript
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
```

### Step 1: Verify TypeScript

Run: `pnpm tsc --noEmit`
Expected: no errors

### Step 2: Commit

```bash
git add components/panel-overview.tsx components/panel/
git commit -m "feat(panel): add PanelOverview assembly component"
```

---

## Task 8: Wire sidebar, page.tsx, and store

### Step 1: Update SectionKey type in lib/store.ts

Find this line (line 19):

```typescript
export type SectionKey = "overview" | "metrics" | "day-progress" | "resources" | "dashboard"
```

Replace with:

```typescript
export type SectionKey = "overview" | "metrics" | "day-progress" | "resources" | "dashboard" | "panel"
```

### Step 2: Update sidebar Panel item in components/app-sidebar.tsx

Find (lines 97–105):

```tsx
<SidebarMenuButton
  tooltip="Panel"
  isActive={activeSection === "dashboard"}
  onClick={() => onSectionChange?.("dashboard")}
>
  <LayoutDashboard />
  <span>Panel</span>
</SidebarMenuButton>
```

Replace with:

```tsx
<SidebarMenuButton
  tooltip="Panel"
  isActive={activeSection === "panel"}
  onClick={() => onSectionChange?.("panel")}
>
  <LayoutDashboard />
  <span>Panel</span>
</SidebarMenuButton>
```

### Step 3: Add Panel import and section label in app/page.tsx

Add import at top with other component imports:

```typescript
import { PanelOverview } from "@/components/panel-overview"
```

Add to `sectionLabel` record (after `"dashboard"`):

```typescript
panel: "Panel",
```

Add new branch in the render section, after the `dashboard` branch (around line 166):

```tsx
{activeSection === "panel" && <PanelOverview />}
```

### Step 4: Verify TypeScript

Run: `pnpm tsc --noEmit`
Expected: no errors

### Step 5: Visual check

Run: `pnpm dev`

1. Open http://localhost:3000
2. Click "Panel" in the sidebar → should show new Panel overview (not the tab dashboard)
3. Click "Almacén > Resumen Semanal" → should still work as before
4. Click a heatmap cell → drawer should open with day metrics
5. Close drawer → selectedDate resets

### Step 6: Commit

```bash
git add lib/store.ts components/app-sidebar.tsx app/page.tsx
git commit -m "feat(panel): wire Panel nav to new PanelOverview, update SectionKey type"
```

---

## Done

All 8 tasks complete. Panel now shows:
- KPI cards (UE, workers, folios, streak)
- 60-day contribution heatmap with click-to-drawer day detail
- Today's cumulative UE area chart

No existing components or queries were modified — only additions and the two targeted sidebar/page wires.
