# Miembros Section — Design Document

> Última revisión: 2026-02-27

---

## Objetivo

Dar al supervisor de equipo una vista de rendimiento **global por miembro** — no solo el día o la semana — para identificar desequilibrios de carga, detectar quién mejora o estanca, y tomar decisiones de distribución equitativa de trabajo.

---

## Usuario Principal

Supervisor de almacén. Su tarea central: **promover trabajo equitativo** entre los surtidores y **mejorar el rendimiento colectivo** con datos.

---

## Rango de Tiempo

Selector de 3 opciones: `Semana` / `2 Semanas` / `Mes` (1, 2 ó 4 semanas hacia atrás).
Controla todos los datos de la página.

---

## Layout — Opción C: Equity Dashboard + Tabla

### 1. KPI Strip (4 tarjetas)
- Promedio UE/hr del equipo
- Mejor UE/hr (worker top)
- Menor UE/hr (worker bottom)
- **Brecha** (max − min) — el número de equidad clave a reducir semana a semana

### 2. Equity Dashboard (2 gráficas lado a lado)

**Gráfica izquierda — UE Total por Miembro** (`BarChart` horizontal, Recharts)
- Eje Y: nombres de workers; Eje X: UE total del rango
- `ReferenceLine` en el promedio del equipo, etiquetada "Promedio equipo"
- Color: `hsl(var(--primary))` por defecto; workers bajo promedio → `hsl(var(--warning))`
- Tooltip: nombre, UE total, delta vs promedio (ej. "+42 UE sobre promedio")

**Gráfica derecha — Horas vs Eficiencia** (`ComposedChart`, Recharts)
- Eje X: workers; Eje Y izq: horas trabajadas (Bar); Eje Y der: UE/hora (Line + dot)
- Permite distinguir "trabajó más horas" de "es más eficiente"
- Leyendas: `Horas trabajadas` (barra) y `UE/hora` (línea)

### 3. Tabla de Miembros (TanStack Table v8 + shadcn/ui Table)

Columnas:
| Columna | Fuente | Notas |
|---------|--------|-------|
| Miembro | `workers` | Avatar iniciales + nombre |
| UE Total | `performance_weekly.total_ue` | Suma del rango |
| UE/hr | `performance_weekly.avg_ue_per_hour` | Promedio del rango |
| Rutas | `performance_weekly.routes_completed` | Suma del rango |
| Días trabajados | `performance_weekly.days_worked` | Suma del rango |
| Objetivo % | `performance_daily.hit_target` | % días con objetivo cumplido |
| Racha actual | `performance_weekly.current_streak` | De la semana más reciente |
| Tendencia | `performance_weekly` | Sparkline 4 puntos (1 por semana) |
| Rank promedio | `performance_weekly.weekly_rank` | Promedio del rango |

Features TanStack:
- Ordenamiento por cualquier columna (click en header)
- Búsqueda global por nombre (client-side, `getFilteredRowModel`)
- Toggle de visibilidad de columnas ("Columnas" dropdown)
- Click en fila → abre `WorkerDetailDrawer` existente

Fila con amber tint si `hit_target_pct < 50%`.

---

## Data Layer

### Nuevas funciones en `lib/leaderboard-queries.ts`

**`getMembersRangeSummary(range: 'week' | '2weeks' | 'month')`**
- Query a `performance_weekly` para las últimas 1/2/4 semanas
- Segunda query a `performance_daily` para `hit_target_pct`
- Merge en JS, retorna `MemberRangeSummary[]`

**`getMembersWeeklyTrend(weeks: number)`**
- Query a `performance_weekly` para todos los workers, últimas N semanas
- Retorna `{ worker_key, week_number, year, total_ue }[]` — para sparklines

### Nuevos hooks en `hooks/use-leaderboard-queries.ts`

```ts
useMembersRangeSummary(range)   // queryKey: ["membersRange", range]
useMembersWeeklyTrend(weeks)    // queryKey: ["membersWeeklyTrend", weeks]
```

`staleTime: 5 * 60 * 1000` — consistente con el resto de la app.

### Tipo nuevo

```ts
type MemberRangeSummary = {
  worker_key: string
  worker_name: string
  avatar_initials: string | null
  total_ue: number
  total_hours: number
  total_routes: number
  days_worked: number
  avg_ue_per_hour: number
  avg_efficiency_score: number
  avg_weekly_rank: number
  current_streak: number
  hit_target_pct: number
}
```

---

## Archivos Nuevos

```
components/miembros/
  members-page.tsx          ← componente raíz, ensambla todo
  equity-kpi-strip.tsx      ← 4 stat cards
  equity-ue-chart.tsx       ← BarChart horizontal: UE total
  equity-hours-chart.tsx    ← ComposedChart: horas + UE/hr
  member-columns.tsx        ← ColumnDef<MemberRangeSummary>[]
  member-table.tsx          ← useReactTable + shadcn Table
  member-table-toolbar.tsx  ← búsqueda + toggle columnas
  sparkline-cell.tsx        ← LineChart inline para columna tendencia
```

---

## Ediciones a Archivos Existentes

1. `lib/leaderboard-queries.ts` — agregar 2 funciones + tipo `MemberRangeSummary`
2. `hooks/use-leaderboard-queries.ts` — agregar 2 hooks
3. `app/page.tsx` — agregar sección `"members"` al mapa + render block
4. `components/app-sidebar.tsx` — activar `onClick` e `isActive` en item Miembros

---

## Dependencia Nueva

```bash
pnpm add @tanstack/react-table
```

---

## Sin cambios requeridos

- Supabase schema — sin tablas nuevas
- WorkerDetailDrawer — se reutiliza sin modificar
- Recharts — ya instalado v2.15.0
- shadcn/ui table — ya instalado
