# Almacen Pages Redesign — Match Provider Dashboard Quality

## Goal
Bring the 4 working Almacen pages (Panel, Resumen Semanal, Metricas Generales, Progreso del Dia) to the same polish and quality level as the Provider Performance dashboard.

## Quality Bar (from provider dashboard)
- Animated counters with ease-out-quart easing
- Consistent KPI card design with trend indicators (WoW/YoY deltas)
- Interactive charts with toggle modes (period, comparison)
- Drill-down capability via Sheet drawers on click
- Loading skeletons (not spinners)
- Clean data hierarchy: hero summary → KPIs → charts → detail table
- Responsive two-zone layout (main + sidebar)
- Auto-refresh with configurable interval

## Scope
- Only the 4 working pages + their sub-components
- Sidebar stays as-is (dead items are intentional placeholders)
- No new pages, no new routes, no sidebar changes

---

## Task 1: Shared Foundations — Animated Counter + Loading Skeletons + Error Boundary

Create reusable utilities that all 4 pages will use, matching provider dashboard patterns.

**Deliverables:**
- Verify `use-animated-counter.ts` hook works for all numeric types (UE, folios, SKUs, weight, volume) — it currently only exists for the provider dashboard
- Create a `components/ui/loading-skeleton.tsx` with skeleton variants matching the provider dashboard's loading pattern (card skeleton, chart skeleton, table skeleton)
- Create a `components/ui/error-boundary.tsx` wrapper for individual page sections
- These should be shared across all Almacen pages

**Files to reference:**
- `hooks/use-animated-counter.ts` — existing animated counter hook
- `components/provider-performance/` — loading patterns used there

---

## Task 2: Panel Overview Enhancement

Upgrade `panel-overview.tsx` and its sub-components to provider dashboard quality.

**Deliverables:**
- Add animated counters to KPI cards (team UE, active workers, folios, streak) using `use-animated-counter`
- Add loading skeletons to KPI cards, heatmap, and pace chart (replace any spinners)
- Wrap each section in error boundary
- Add a hero-level summary at the top (total UE animated, like provider's TotalRevenue component)
- Improve the contribution heatmap with hover tooltips showing day details
- Style the day-detail drawer (HeatmapDayDrawer) with consistent spacing and typography matching provider dashboard

**Files to modify:**
- `components/panel-overview.tsx`
- `components/panel/kpi-cards.tsx`
- `components/panel/contribution-heatmap.tsx`
- `components/panel/heatmap-day-drawer.tsx`
- `components/panel/team-pace-chart.tsx`

**Quality bar reference:** Compare to `provider-performance/hero-section.tsx` + `metric-cards.tsx`

---

## Task 3: Resumen Semanal (Weekly Overview) Enhancement

Upgrade `weekly-overview.tsx` to provider dashboard quality.

**Deliverables:**
- Add animated counters to all 5 KPI cards (UE Total, Folios, SKUs, Weight, Volume)
- Add WoW delta badges with green/red coloring (positive/negative) matching provider's trend indicators
- Improve the daily UE bar chart: add hover tooltips, smooth animations, gradient fills like provider's SalesChart
- Enhance Top 3 podium cards with animated entry transitions
- Add drill-down: clicking a worker in the classification table opens a Sheet drawer with their weekly detail
- Add loading skeletons for all sections
- Wrap in error boundary

**Files to modify:**
- `components/weekly-overview.tsx`

**Quality bar reference:** Compare to `provider-performance/hero-section.tsx` + `sales-chart.tsx` + `category-detail-panel.tsx`

---

## Task 4: Metricas Generales (General Metrics) Enhancement

Upgrade `general-metrics.tsx` and its worker detail drawer to provider dashboard quality.

**Deliverables:**
- Add animated counters to the 4 summary KPI cards (Total UE, Avg Efficiency, Hours, Best Streak)
- Add loading skeletons to the ranking table (replace any spinners)
- Enhance the ranking table: animated rank badges, hover highlight on rows, smooth scroll
- Improve WorkerDetailDrawer: add animated counters for worker stats, trend chart (last 7 days), top categories breakdown
- Add error boundary per section
- Style consistency with provider dashboard typography and spacing

**Files to modify:**
- `components/general-metrics.tsx`

**Quality bar reference:** Compare to `provider-performance/metric-cards.tsx` + `category-detail-panel.tsx`

---

## Task 5: Progreso del Dia (Day Progress) Enhancement

Upgrade `day-progress.tsx` to provider dashboard quality.

**Deliverables:**
- Add animated counters to the 4 summary cards (Rutas Hoy, UE Total, Rutas/Hora Prom, Hora Pico)
- Enhance the area chart: gradient fills, smooth animations, hover tooltips, shift overlay (morning/afternoon color bands)
- Improve the breakdown table: alternating row colors, animated progress bars for hourly completion
- Add hourly milestones/velocity indicators (like provider's MoM velocity grid — color-coded cells showing fast/slow hours)
- Add loading skeletons for chart and table
- Add error boundary

**Files to modify:**
- `components/day-progress.tsx`

**Quality bar reference:** Compare to `provider-performance/sales-chart.tsx` + `provider-sidebar.tsx` (velocity grid pattern)
