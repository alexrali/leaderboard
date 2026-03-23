# Provider Performance Dashboard Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Embed the standalone `provider-performance` dashboard into the leaderboard app as a new "Proveedores" section under the Análisis group in the sidebar, using mock data throughout (real data schema comes later).

**Architecture:** Port the 8 dashboard components and 2 animation hooks from `provider-performance` into the leaderboard's `components/provider-performance/` folder, adapting imports and layout to fit inside the leaderboard's scrollable main container. Register the section in `app-sidebar.tsx` (under Análisis) and render it in `app/page.tsx` outside the loading block (no Supabase dependency).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui, Recharts (already in leaderboard), `tw-animate-css` (already in leaderboard) — no new dependencies needed.

---

## Source → Target Mapping

```
provider-performance/hooks/use-animated-counter.ts  →  leaderboard/hooks/use-animated-counter.ts
provider-performance/hooks/use-live-clock.ts         →  leaderboard/hooks/use-live-clock.ts

provider-performance/components/dashboard/header.tsx             →  leaderboard/components/provider-performance/header.tsx
provider-performance/components/dashboard/total-revenue.tsx      →  leaderboard/components/provider-performance/total-revenue.tsx
provider-performance/components/dashboard/metric-cards.tsx       →  leaderboard/components/provider-performance/metric-cards.tsx
provider-performance/components/dashboard/sales-chart.tsx        →  leaderboard/components/provider-performance/sales-chart.tsx
provider-performance/components/dashboard/channel-grid.tsx       →  leaderboard/components/provider-performance/channel-grid.tsx
provider-performance/components/dashboard/sidebar.tsx            →  leaderboard/components/provider-performance/provider-sidebar.tsx   ← RENAMED
provider-performance/components/dashboard/category-detail-panel.tsx  →  leaderboard/components/provider-performance/category-detail-panel.tsx
provider-performance/components/dashboard/sales-log.tsx          →  leaderboard/components/provider-performance/sales-log.tsx

provider-performance/app/page.tsx (adapted)          →  leaderboard/components/provider-performance/index.tsx
```

## Critical Adaptations Required

1. **Rename `Sidebar` export** — source exports `Sidebar` which collides with shadcn's `Sidebar` component. In `provider-sidebar.tsx` change: `export function Sidebar` → `export function ProviderSidebar`, and update the import in `index.tsx`.

2. **Remove `min-h-screen`** — source `page.tsx` has `<div className="min-h-screen bg-stone-50">`. In `index.tsx` remove `min-h-screen` so it fits inside the leaderboard's scroll container. Keep `bg-stone-50`.

3. **Hook imports** — all components import hooks as `@/hooks/use-animated-counter` or `@/hooks/use-live-clock`. These resolve identically in the leaderboard since we copy hooks to the same relative path.

4. **UI component imports** — all `@/components/ui/*` imports work unchanged since both apps share the same shadcn component set.

5. **No CSS variable changes** — both apps use the same shadcn/ui OKLch token system. Leaderboard theme will apply automatically.

6. **No new npm installs** — `recharts` and `tw-animate-css` are already in leaderboard's `package.json`.

---

## Task 1: Port Animation Hooks

**Files:**
- Create: `leaderboard/hooks/use-animated-counter.ts`
- Create: `leaderboard/hooks/use-live-clock.ts`

**Step 1: Copy use-animated-counter.ts**

Read `C:/Users/arami/Current/report generator/provider-performance/hooks/use-animated-counter.ts` and write its exact content to `leaderboard/hooks/use-animated-counter.ts`. No changes needed.

**Step 2: Copy use-live-clock.ts**

Read `C:/Users/arami/Current/report generator/provider-performance/hooks/use-live-clock.ts` and write its exact content to `leaderboard/hooks/use-live-clock.ts`. No changes needed.

**Step 3: Verify files exist**

```bash
ls leaderboard/hooks/use-animated-counter.ts leaderboard/hooks/use-live-clock.ts
```

Expected: both files listed.

**Step 4: Commit**

```bash
cd "C:/Users/arami/Current/report generator/leaderboard"
git add hooks/use-animated-counter.ts hooks/use-live-clock.ts
git commit -m "feat(provider-performance): add animation hooks from standalone dashboard"
```

---

## Task 2: Port Header Component

**Files:**
- Create: `leaderboard/components/provider-performance/header.tsx`

**Step 1: Copy and adapt**

Read `C:/Users/arami/Current/report generator/provider-performance/components/dashboard/header.tsx`.

Write to `leaderboard/components/provider-performance/header.tsx` with one change:
- Change `import { useLiveClock } from "@/hooks/use-live-clock"` → stays the same (resolves correctly in leaderboard)
- All other imports are from `@/components/ui/*` or `lucide-react` — leave unchanged.

**Step 2: Commit**

```bash
git add components/provider-performance/header.tsx
git commit -m "feat(provider-performance): port header component"
```

---

## Task 3: Port Total Revenue & Metric Cards

**Files:**
- Create: `leaderboard/components/provider-performance/total-revenue.tsx`
- Create: `leaderboard/components/provider-performance/metric-cards.tsx`

**Step 1: Copy total-revenue.tsx**

Read `C:/Users/arami/Current/report generator/provider-performance/components/dashboard/total-revenue.tsx`.
Write to `leaderboard/components/provider-performance/total-revenue.tsx`. No import changes needed.

**Step 2: Copy metric-cards.tsx**

Read `C:/Users/arami/Current/report generator/provider-performance/components/dashboard/metric-cards.tsx`.
Write to `leaderboard/components/provider-performance/metric-cards.tsx`. No import changes needed.

**Step 3: Commit**

```bash
git add components/provider-performance/total-revenue.tsx \
        components/provider-performance/metric-cards.tsx
git commit -m "feat(provider-performance): port revenue and metric card components"
```

---

## Task 4: Port Sales Chart & Channel Grid

**Files:**
- Create: `leaderboard/components/provider-performance/sales-chart.tsx`
- Create: `leaderboard/components/provider-performance/channel-grid.tsx`

**Step 1: Copy sales-chart.tsx**

Read `C:/Users/arami/Current/report generator/provider-performance/components/dashboard/sales-chart.tsx`.
Write to `leaderboard/components/provider-performance/sales-chart.tsx`. No import changes needed — `recharts` is available in leaderboard.

**Step 2: Copy channel-grid.tsx**

Read `C:/Users/arami/Current/report generator/provider-performance/components/dashboard/channel-grid.tsx`.
Write to `leaderboard/components/provider-performance/channel-grid.tsx`. No import changes needed.

**Step 3: Commit**

```bash
git add components/provider-performance/sales-chart.tsx \
        components/provider-performance/channel-grid.tsx
git commit -m "feat(provider-performance): port chart and channel grid components"
```

---

## Task 5: Port Category Detail Panel

**Files:**
- Create: `leaderboard/components/provider-performance/category-detail-panel.tsx`

**Step 1: Copy category-detail-panel.tsx**

Read `C:/Users/arami/Current/report generator/provider-performance/components/dashboard/category-detail-panel.tsx`.
Write to `leaderboard/components/provider-performance/category-detail-panel.tsx`. No import changes needed — uses `@/components/ui/sheet`, `@/components/ui/table`, `recharts`, all available in leaderboard.

**Step 2: Commit**

```bash
git add components/provider-performance/category-detail-panel.tsx
git commit -m "feat(provider-performance): port category detail panel"
```

---

## Task 6: Port Sidebar (as ProviderSidebar)

**Files:**
- Create: `leaderboard/components/provider-performance/provider-sidebar.tsx`

**Step 1: Copy and rename**

Read `C:/Users/arami/Current/report generator/provider-performance/components/dashboard/sidebar.tsx`.

Write to `leaderboard/components/provider-performance/provider-sidebar.tsx` with these changes:
1. Change the function export name: `export function Sidebar(` → `export function ProviderSidebar(`
2. Change the import of `CategoryDetailPanel` if it's from a relative path — update to: `import { CategoryDetailPanel } from "@/components/provider-performance/category-detail-panel"`
3. All `@/components/ui/*` imports stay unchanged.
4. Do NOT change the internal logic or JSX — only the export name and local imports.

**Step 2: Commit**

```bash
git add components/provider-performance/provider-sidebar.tsx
git commit -m "feat(provider-performance): port sidebar as ProviderSidebar"
```

---

## Task 7: Port Sales Log

**Files:**
- Create: `leaderboard/components/provider-performance/sales-log.tsx`

**Step 1: Copy sales-log.tsx**

Read `C:/Users/arami/Current/report generator/provider-performance/components/dashboard/sales-log.tsx`.
Write to `leaderboard/components/provider-performance/sales-log.tsx`. No import changes needed.

**Step 2: Commit**

```bash
git add components/provider-performance/sales-log.tsx
git commit -m "feat(provider-performance): port live sales log component"
```

---

## Task 8: Create the Page Wrapper (index.tsx)

**Files:**
- Create: `leaderboard/components/provider-performance/index.tsx`

**Step 1: Write the wrapper**

Based on `provider-performance/app/page.tsx`, create the wrapper that:
- Removes `min-h-screen` (fits inside leaderboard scroll container)
- Uses `ProviderSidebar` instead of `Sidebar`
- Imports from local `@/components/provider-performance/*` paths

```tsx
"use client"

import { DashboardHeader } from "@/components/provider-performance/header"
import { TotalRevenue } from "@/components/provider-performance/total-revenue"
import { MetricCards } from "@/components/provider-performance/metric-cards"
import { SalesChart } from "@/components/provider-performance/sales-chart"
import { ProviderSidebar } from "@/components/provider-performance/provider-sidebar"
import { ChannelGrid } from "@/components/provider-performance/channel-grid"
import { SalesLog } from "@/components/provider-performance/sales-log"

export function ProviderPerformancePage() {
  return (
    <div className="bg-stone-50 rounded-xl overflow-hidden border border-stone-200/80">
      <DashboardHeader />

      {/* Main Dashboard Body - edge to edge */}
      <div>
        {/* Top Section: Main Zone + Sidebar */}
        <div className="flex border-y border-stone-200/80">

          {/* LEFT: Main Content Zone */}
          <div className="flex-1 bg-background min-w-0">
            <div className="px-6 pt-6 pb-5">
              <TotalRevenue />
            </div>
            <div className="px-6 pb-5">
              <MetricCards />
            </div>
            <div className="border-t border-stone-200/60 mx-6" />
            <div className="px-6 py-5">
              <SalesChart />
            </div>
            <div className="border-t border-stone-200/60" />
            <ChannelGrid />
          </div>

          {/* RIGHT: Sidebar Zone */}
          <div className="w-72 xl:w-80 shrink-0 border-l border-stone-200/80 bg-stone-100/70">
            <ProviderSidebar />
          </div>
        </div>

        {/* Bottom: Sales Activity Log */}
        <SalesLog />

        {/* Footer Stats Line */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-stone-200/60">
          <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
            — 2,847 orders · $0 → $847,392 · 24/7
          </p>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/provider-performance/index.tsx
git commit -m "feat(provider-performance): create page wrapper component"
```

---

## Task 9: Register in Sidebar Navigation

**Files:**
- Modify: `leaderboard/components/app-sidebar.tsx`

**Step 1: Add import**

At the top of `app-sidebar.tsx`, add `BarChart2` to the lucide-react import block:

```tsx
import {
  // ... existing imports ...
  BarChart2,   // ← add this
} from "lucide-react"
```

**Step 2: Add nav item in the Análisis group**

After the SRI `</Collapsible>` block (around line 417) and before the Sprints `<SidebarMenuItem>`, add a new direct menu button for Proveedores:

```tsx
<SidebarMenuItem>
  <SidebarMenuButton
    tooltip="Proveedores"
    isActive={activeSection === "provider-performance"}
    onClick={() => handleSectionChange("provider-performance")}
  >
    <BarChart2 />
    <span>Proveedores</span>
  </SidebarMenuButton>
</SidebarMenuItem>
```

Insert it between the closing `</Collapsible>` (end of SRI) and the Sprints `<SidebarMenuItem>`.

**Step 3: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "feat(provider-performance): add Proveedores nav item to Análisis sidebar group"
```

---

## Task 10: Register Section in app/page.tsx

**Files:**
- Modify: `leaderboard/app/page.tsx`

**Step 1: Add import**

After the last `import` statement (around line 31), add:

```tsx
import { ProviderPerformancePage } from "@/components/provider-performance/index"
```

**Step 2: Add label to sectionLabel map**

In the `sectionLabel` record (around line 93), add:

```tsx
"provider-performance": "Desempeño de Proveedores",
```

**Step 3: Add rendering — outside the loading block**

After the settings section render (around line 249):
```tsx
{activeSection === "settings" && <SettingsPage />}
```

Add directly below it:
```tsx
{activeSection === "provider-performance" && <ProviderPerformancePage />}
```

This placement is outside the `!isLoading && !isError` block, so it renders immediately without waiting for Supabase data (provider-performance uses mock data only).

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat(provider-performance): wire ProviderPerformancePage into main router"
```

---

## Task 11: Verify Build

**Step 1: Run type check**

```bash
cd "C:/Users/arami/Current/report generator/leaderboard"
pnpm tsc --noEmit
```

Expected: no errors. If there are type errors, fix them before proceeding.

**Step 2: Run dev server**

```bash
pnpm dev
```

Open the app, navigate to Análisis → Proveedores in the sidebar and verify the dashboard renders correctly.

**Step 3: Check for common issues**

- If `ProviderSidebar` throws a runtime error about `Sidebar` being undefined, ensure the export rename in `provider-sidebar.tsx` is correct.
- If recharts throws SSR errors, ensure all components have `"use client"` directive at the top.
- If `CategoryDetailPanel` fails to import in `provider-sidebar.tsx`, verify the import path is `@/components/provider-performance/category-detail-panel`.

---

## Task 12: Final Commit

If the dev server shows the dashboard correctly with no console errors:

```bash
git add -A
git commit -m "feat(provider-performance): integrate provider performance dashboard into leaderboard

Ports the standalone provider-performance dashboard as a new section
under Análisis > Proveedores. Uses mock data throughout — real schema
and Supabase integration to follow in a separate session.

Components ported:
- DashboardHeader (live clock, stats header)
- TotalRevenue (animated counter hero)
- MetricCards (7 KPI cards with staggered animation)
- SalesChart (Recharts cumulative area chart)
- ChannelGrid (3-column channel breakdown)
- ProviderSidebar (category carousel + milestones + distribution matrix)
- CategoryDetailPanel (slide-out drill-down per category)
- SalesLog (live-updating sales activity table)
- useAnimatedCounter hook (RAF-based easing)
- useLiveClock hook (real-time clock)"
```

---

## Notes for Real Data Session

When real data is connected, the main changes will be:
1. Replace hardcoded data in each component with props or a query hook
2. Add Supabase table(s) — likely `provider_performance_daily` with channel/category dimensions
3. Replace `useAnimatedCounter(hardcodedValue)` with `useAnimatedCounter(dataFromSupabase)`
4. The schema design session will cover the exact table structure

The mock data interfaces (CategoryData, Sale, chartData) in the component files serve as the de-facto schema spec — they define exactly what fields the real data layer must supply.
