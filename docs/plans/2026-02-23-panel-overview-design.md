# Panel Overview — Design Document
**Date:** 2026-02-23
**Status:** Approved

## Problem

The "Panel" sidebar item in the Almacén group currently renders the same tabbed dashboard as the Almacén tree children (Resumen Semanal, Métricas Generales, etc.). It has no distinct identity or purpose.

## Goal

Give Panel its own dedicated team-level overview page — a high-level operational snapshot of how the warehouse team is performing, past and present.

---

## Layout

```
┌─────────────────────────────────────────────────────┐
│  [KPI Card]  [KPI Card]  [KPI Card]  [KPI Card]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│         Contribution Heatmap (60 days)              │
│         Mon Tue Wed Thu Fri Sat Sun                 │
│          █   █   █   █   █   ░   ░                 │
│          ...                                        │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│         Hourly Pace Chart (today)                   │
│         Cumulative UE vs target pace line           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Section 1 — KPI Cards

Four cards using the existing card style:

| Card | Metric | Source |
|------|--------|--------|
| UE del Equipo | Today's total team UE | `team_performance_daily` latest date |
| Trabajadores Activos | Workers active today | `team_performance_daily.active_workers` |
| Folios Completados | Today's total folios | `team_performance_daily.total_folios` |
| Racha de Meta | Consecutive days team hit target | computed from `hit_target` on `team_performance_daily` |

- Streak card gets a flame icon + green badge if current streak ≥ last week's streak.
- Hooks: `useTeamSummary()` (existing) + `useLatestDailyDate()` (existing) + `useTeamStreak()` (new).

---

## Section 2 — Contribution Heatmap

**Layout:** 7-column CSS grid (Mon–Sun), weeks flow left→right, last 60 days.

**Color scale** (Tailwind green palette, based on UE vs daily target):

| UE vs Target | Color | Tailwind approx |
|---|---|---|
| No data / 0 | Dark neutral | `bg-muted` |
| 1–50% | Very dark green | `#166534` |
| 50–80% | Dark green | `#15803d` |
| 80–100% | Medium green | `#16a34a` |
| ≥ 100% (hit) | Bright green | `#22c55e` |

**Implementation:** Pure CSS grid, no charting library. Each cell is a `div` with conditional background color.

**Hover:** Simple tooltip (Radix Tooltip) showing date, team UE, active workers, folios.

**Click → Drawer:**
- Opens a right-side `Sheet` (Radix, already in project)
- Header: formatted date + hit-target badge (✅ / ❌)
- 2×3 metric cards: Team UE, Active Workers, Folios, SKUs, Peso (kg), Volumen (m³)
- Mini bar chart (~120px tall): team UE per hour for that day (Recharts BarChart)
- Data: `useTeamDayDetail(date)` — fetches `team_performance_daily` row + `team_performance_hourly` rows for that date (enabled only when date is selected)

**New query needed:** `getTeamDailyHistory(days: number)` pulling from `team_performance_daily` ordered by date.

---

## Section 3 — Hourly Pace Chart

Full-width area chart showing today's team progress vs target pace.

**Two series:**
| Series | Style | Description |
|---|---|---|
| UE Real | Green area fill | Cumulative team UE per hour today |
| Ritmo Meta | Dashed muted line | Straight diagonal: `daily_target / work_hours × elapsed_hours` |

- X-axis: work hours (e.g. 06:00–18:00), only elapsed hours rendered
- Tooltip: hour, cumulative UE, UE added that hour, % of daily target
- Empty state: "Turno aún no iniciado" placeholder if no data yet

**Hook:** `useHourlyProgress()` (existing) — no new query needed.

---

## New Files

| File | Purpose |
|------|---------|
| `components/panel-overview.tsx` | Main Panel page component |
| `components/panel/kpi-cards.tsx` | 4 KPI cards row |
| `components/panel/contribution-heatmap.tsx` | 60-day heatmap grid |
| `components/panel/heatmap-day-drawer.tsx` | Day-detail drawer + mini chart |
| `components/panel/team-pace-chart.tsx` | Hourly pace area chart |

---

## Query Additions (lib/leaderboard-queries.ts)

| Function | Query |
|----------|-------|
| `getTeamDailyHistory(days)` | `team_performance_daily` last N days, ordered by date |
| `getTeamDayDetail(date)` | `team_performance_daily` single row + `team_performance_hourly` for that date |
| `getTeamStreak()` | Count consecutive recent days where `hit_target = true` |

---

## Hook Additions (hooks/use-leaderboard-queries.ts)

| Hook | Wraps |
|------|-------|
| `useTeamDailyHistory(days)` | `getTeamDailyHistory` |
| `useTeamDayDetail(date)` | `getTeamDayDetail`, enabled only when date is non-null |
| `useTeamStreak()` | `getTeamStreak` |

---

## Sidebar Change

`components/app-sidebar.tsx`: the Panel nav item's `onClick` should set `activeSection = 'panel'` in the parent page state — just like the other Almacén items set their respective sections.

`app/page.tsx`: add a `'panel'` case to the `activeSection` switch that renders `<PanelOverview />`.

---

## What is NOT changing

- Almacén tree children (Resumen Semanal, Métricas Generales, Progreso del Día, Recursos) — untouched
- Existing hooks and queries — only additions, no modifications
- Auth, middleware, sidebar structure — untouched
