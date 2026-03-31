# Provider Performance — Live Data Wiring Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire all 7 provider-performance dashboard components from hardcoded mock data to live Supabase tables, using Option A (state lifted to `ProviderPerformancePage`) with full `CategoryDetailPanel` wiring.

**Architecture:** `ProviderPerformancePage` (index.tsx) fetches data via 5 React Query hooks and passes typed props to every component. `CategoryDetailPanel` is the exception — it self-fetches its complex nested data lazily when opened. Each component gains a typed props interface; hardcoded `const` data arrays are replaced with derived values.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase JS Client (`@/lib/supabase/client`), `@tanstack/react-query` v5.

---

## Critical constants (encode in every task)

- `PROVIDER_CODE = '0128'` — only active provider (Kimberly-Clark), hardcoded for now
- `transaction_time` — NOT `sale_date` (plan v1 error); transactions table uses `transaction_time: timestamptz`
- Category encoding: `PA¥ALES` in DB → normalize via `.replace(/¥/g, 'Ñ').replace(/ï/g, 'í').trim()`
- Channel display: `'distribucion'` → `'Almacén / Distribución'` | `'autoservicio'` → `'Autoservicio / Tiendas'`

---

## Task 1: TypeScript Types

**Files:**
- Create: `leaderboard/lib/provider-types.ts`

**Step 1: Create the file with exact content**

```typescript
// lib/provider-types.ts

export interface ProviderSummary {
  period: 'mtd' | 'qtd' | 'ytd'
  total_revenue: number
  total_revenue_net: number
  total_orders: number
  total_units: number
  avg_order_value: number
  avg_margin_pct: number
  ytd_growth_pct: number
  target_amount: number
  target_hit_pct: number
  best_day_revenue: number
  best_day_date: string
  active_reps: number
  active_stores: number
  active_categories: number
  active_products: number
  tracking_since: string
  updated_at: string
}

export interface ProviderDailyPoint {
  date: string       // 'YYYY-MM-DD' (week start)
  weekLabel: string  // 'Jan 6', 'Jan 13', etc.
  revenue: number    // cumulative running total
}

export interface ProviderChannel {
  channel: string
  displayName: string  // 'Almacén / Distribución' | 'Autoservicio / Tiendas'
  revenue: number
  units: number
  orders: number
  locations: number
}

export interface ProviderCategory {
  category_code: string
  category_name: string  // normalized (¥ → Ñ, trimmed)
  revenue: number
  units: number
  orders: number
  share: number  // 0–1, fraction of top-5 total revenue
}

export interface ProviderTransaction {
  id: number
  transaction_time: string  // ISO timestamp UTC
  folio: string
  clave: string
  descripcion: string  // trimmed + normalized
  channel: string
  sales_rep: string
  store_id: string
  client_code: string
  units: number
  units_pieces: number
  unit_type: string
  revenue: number
  cost: number
  profit: number
  margin_pct: number
}

export interface CategoryDetail {
  category_code: string
  category_name: string
  revenue: number
  units: number
  orders: number
  topProducts: Array<{
    clave: string
    name: string
    revenue: number
    units: number
  }>
  monthlyData: Array<{
    month: string   // 'Jan', 'Feb', etc.
    revenue: number
    orders: number
  }>
  channelSplit: Array<{
    channel: string    // display name
    percentage: number // 0–100
    revenue: number
  }>
  topReps: Array<{
    name: string
    sales: number
    deals: number
  }>
}
```

**Step 2: Commit**
```bash
cd "C:/Users/arami/Current/report generator/leaderboard"
git add lib/provider-types.ts
git commit -m "feat(provider-live): add TypeScript types for Supabase data layer"
```

---

## Task 2: Query Functions

**Files:**
- Create: `leaderboard/lib/provider-queries.ts`

**Step 1: Create the file with exact content**

```typescript
// lib/provider-queries.ts
"use client"

import { createClient } from '@/lib/supabase/client'
import type {
  ProviderSummary,
  ProviderDailyPoint,
  ProviderChannel,
  ProviderCategory,
  ProviderTransaction,
  CategoryDetail,
} from '@/lib/provider-types'

const PROVIDER_CODE = '0128'

function normalizeName(s: string): string {
  return (s ?? '').trim().replace(/¥/g, 'Ñ').replace(/ï/g, 'í')
}

export async function getProviderSummary(
  period: 'mtd' | 'qtd' | 'ytd' = 'mtd'
): Promise<ProviderSummary | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('provider_performance_summary')
    .select('*')
    .eq('provider_code', PROVIDER_CODE)
    .eq('period', period)
    .single()
  if (error) throw new Error(error.message)
  return data as ProviderSummary
}

export async function getProviderDailySeries(days = 90): Promise<ProviderDailyPoint[]> {
  const supabase = createClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('provider_sales_daily')
    .select('date, revenue')
    .eq('provider_code', PROVIDER_CODE)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: true })
  if (error) throw new Error(error.message)

  // Aggregate to weekly buckets (Sunday-start)
  const weekly: Record<string, { date: string; revenue: number }> = {}
  for (const row of (data ?? [])) {
    const d = new Date(row.date + 'T12:00:00')
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().split('T')[0]
    if (!weekly[key]) weekly[key] = { date: key, revenue: 0 }
    weekly[key].revenue += Number(row.revenue)
  }

  // Sort and build cumulative running total
  const weeks = Object.values(weekly).sort((a, b) => a.date.localeCompare(b.date))
  let cumulative = 0
  return weeks.map(w => {
    cumulative += w.revenue
    const d = new Date(w.date + 'T12:00:00')
    const weekLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { date: w.date, weekLabel, revenue: Math.round(cumulative) }
  })
}

export async function getProviderChannels(): Promise<ProviderChannel[]> {
  const supabase = createClient()
  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)

  const { data, error } = await supabase
    .from('provider_sales_daily')
    .select('channel, revenue, units_pieces, orders, store_id, client_code')
    .eq('provider_code', PROVIDER_CODE)
    .gte('date', firstOfMonth.toISOString().split('T')[0])
  if (error) throw new Error(error.message)

  const byChannel: Record<string, ProviderChannel> = {}
  const locationSets: Record<string, Set<string>> = {}

  for (const row of (data ?? [])) {
    const ch = row.channel
    if (!byChannel[ch]) {
      byChannel[ch] = {
        channel: ch,
        displayName: ch === 'distribucion' ? 'Almacén / Distribución' : 'Autoservicio / Tiendas',
        revenue: 0, units: 0, orders: 0, locations: 0,
      }
      locationSets[ch] = new Set()
    }
    byChannel[ch].revenue += Number(row.revenue)
    byChannel[ch].units += Number(row.units_pieces ?? 0)
    byChannel[ch].orders += Number(row.orders)
    const loc = row.store_id || row.client_code || ''
    if (loc) locationSets[ch].add(loc)
  }

  for (const ch of Object.keys(byChannel)) {
    byChannel[ch].locations = locationSets[ch]?.size ?? 0
  }

  return Object.values(byChannel).sort((a, b) => b.revenue - a.revenue)
}

export async function getProviderCategories(limit = 5): Promise<ProviderCategory[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('provider_sales_daily')
    .select('category_code, category_name, revenue, units_pieces, orders')
    .eq('provider_code', PROVIDER_CODE)
    .not('category_code', 'is', null)
    .neq('category_code', '')
  if (error) throw new Error(error.message)

  const byCat: Record<string, ProviderCategory> = {}
  for (const row of (data ?? [])) {
    const code = row.category_code
    if (!byCat[code]) {
      byCat[code] = {
        category_code: code,
        category_name: normalizeName(row.category_name ?? ''),
        revenue: 0, units: 0, orders: 0, share: 0,
      }
    }
    byCat[code].revenue += Number(row.revenue)
    byCat[code].units += Number(row.units_pieces ?? 0)
    byCat[code].orders += Number(row.orders)
  }

  const sorted = Object.values(byCat).sort((a, b) => b.revenue - a.revenue)
  const top = sorted.slice(0, limit)
  const topTotal = top.reduce((s, c) => s + c.revenue, 0)
  return top.map(c => ({ ...c, share: topTotal > 0 ? c.revenue / topTotal : 0 }))
}

export async function getProviderTransactions(limit = 50): Promise<ProviderTransaction[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('provider_sales_transactions')
    .select('*')
    .eq('provider_code', PROVIDER_CODE)
    .order('transaction_time', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []).map(row => ({
    ...row,
    descripcion: normalizeName(row.descripcion ?? ''),
  })) as ProviderTransaction[]
}

export async function getCategoryDetail(categoryCode: string): Promise<CategoryDetail | null> {
  const supabase = createClient()

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  // Fetch daily rows for this category (last 6 months)
  const { data: dailyRows, error: dailyErr } = await supabase
    .from('provider_sales_daily')
    .select('date, channel, revenue, units_pieces, orders, sales_rep')
    .eq('provider_code', PROVIDER_CODE)
    .eq('category_code', categoryCode)
    .gte('date', sixMonthsAgo.toISOString().split('T')[0])
  if (dailyErr) throw new Error(dailyErr.message)
  const rows = dailyRows ?? []

  // Totals
  const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue), 0)
  const totalUnits = rows.reduce((s, r) => s + Number(r.units_pieces ?? 0), 0)
  const totalOrders = rows.reduce((s, r) => s + Number(r.orders), 0)

  // Monthly aggregation (group by month, last 6 buckets)
  const byMonth: Record<string, { key: string; label: string; revenue: number; orders: number }> = {}
  for (const r of rows) {
    const d = new Date(r.date + 'T12:00:00')
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    if (!byMonth[key]) byMonth[key] = { key, label, revenue: 0, orders: 0 }
    byMonth[key].revenue += Number(r.revenue)
    byMonth[key].orders += Number(r.orders)
  }
  const monthlyData = Object.values(byMonth)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-6)
    .map(m => ({ month: m.label, revenue: Math.round(m.revenue), orders: m.orders }))

  // Channel split
  const byChannel: Record<string, number> = {}
  for (const r of rows) {
    byChannel[r.channel] = (byChannel[r.channel] ?? 0) + Number(r.revenue)
  }
  const channelSplit = Object.entries(byChannel).map(([ch, rev]) => ({
    channel: ch === 'distribucion' ? 'Distribución' : 'Autoservicio',
    percentage: totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0,
    revenue: Math.round(rev),
  }))

  // Top reps (distribucion channel only)
  const byRep: Record<string, { sales: number; deals: number }> = {}
  for (const r of rows) {
    if (r.channel !== 'distribucion' || !r.sales_rep?.trim()) continue
    if (!byRep[r.sales_rep]) byRep[r.sales_rep] = { sales: 0, deals: 0 }
    byRep[r.sales_rep].sales += Number(r.revenue)
    byRep[r.sales_rep].deals += Number(r.orders)
  }
  const topReps = Object.entries(byRep)
    .map(([name, v]) => ({ name, sales: Math.round(v.sales), deals: v.deals }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 3)

  // Top products: get SKU codes for this category, then aggregate transactions
  const { data: productCodes } = await supabase
    .from('provider_products')
    .select('product_code')
    .eq('category_code', categoryCode)
  const codes = (productCodes ?? []).map((p: { product_code: string }) => p.product_code)

  let topProducts: CategoryDetail['topProducts'] = []
  if (codes.length > 0) {
    const { data: txRows } = await supabase
      .from('provider_sales_transactions')
      .select('clave, descripcion, revenue, units_pieces')
      .eq('provider_code', PROVIDER_CODE)
      .in('clave', codes)
    const byProduct: Record<string, { name: string; revenue: number; units: number }> = {}
    for (const t of (txRows ?? [])) {
      if (!byProduct[t.clave]) {
        byProduct[t.clave] = { name: normalizeName(t.descripcion ?? t.clave), revenue: 0, units: 0 }
      }
      byProduct[t.clave].revenue += Number(t.revenue)
      byProduct[t.clave].units += Number(t.units_pieces ?? 0)
    }
    topProducts = Object.entries(byProduct)
      .map(([clave, v]) => ({ clave, name: v.name, revenue: Math.round(v.revenue), units: Math.round(v.units) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4)
  }

  // Get canonical category name
  const { data: catRow } = await supabase
    .from('provider_categories')
    .select('category_name')
    .eq('category_code', categoryCode)
    .maybeSingle()

  return {
    category_code: categoryCode,
    category_name: normalizeName(catRow?.category_name ?? categoryCode),
    revenue: Math.round(totalRevenue),
    units: Math.round(totalUnits),
    orders: totalOrders,
    topProducts,
    monthlyData,
    channelSplit,
    topReps,
  }
}
```

**Step 2: Commit**
```bash
git add lib/provider-queries.ts
git commit -m "feat(provider-live): add Supabase query functions for all 6 data shapes"
```

---

## Task 3: React Query Hooks

**Files:**
- Create: `leaderboard/hooks/use-provider-queries.ts`

**Step 1: Create the file with exact content**

```typescript
// hooks/use-provider-queries.ts
"use client"

import { useQuery } from '@tanstack/react-query'
import {
  getProviderSummary,
  getProviderDailySeries,
  getProviderChannels,
  getProviderCategories,
  getProviderTransactions,
  getCategoryDetail,
} from '@/lib/provider-queries'

const STALE_5M = 5 * 60 * 1000

export function useProviderSummary(period: 'mtd' | 'qtd' | 'ytd' = 'mtd') {
  return useQuery({
    queryKey: ['provider-summary', period],
    queryFn: () => getProviderSummary(period),
    staleTime: STALE_5M,
  })
}

export function useProviderDailySeries(days = 90) {
  return useQuery({
    queryKey: ['provider-daily-series', days],
    queryFn: () => getProviderDailySeries(days),
    staleTime: STALE_5M,
  })
}

export function useProviderChannels() {
  return useQuery({
    queryKey: ['provider-channels'],
    queryFn: getProviderChannels,
    staleTime: STALE_5M,
  })
}

export function useProviderCategories(limit = 5) {
  return useQuery({
    queryKey: ['provider-categories', limit],
    queryFn: () => getProviderCategories(limit),
    staleTime: STALE_5M,
  })
}

export function useProviderTransactions(limit = 50) {
  return useQuery({
    queryKey: ['provider-transactions', limit],
    queryFn: () => getProviderTransactions(limit),
    staleTime: STALE_5M,
  })
}

export function useCategoryDetail(categoryCode: string | null) {
  return useQuery({
    queryKey: ['provider-category-detail', categoryCode],
    queryFn: () => getCategoryDetail(categoryCode!),
    enabled: !!categoryCode,
    staleTime: STALE_5M,
  })
}
```

**Step 2: Commit**
```bash
git add hooks/use-provider-queries.ts
git commit -m "feat(provider-live): add React Query hooks for provider data"
```

---

## Task 4: Wire TotalRevenue

**Files:**
- Modify: `leaderboard/components/provider-performance/total-revenue.tsx`

**Step 1: Read the file** to understand exact line numbers and hook usage.

**Step 2: Add import and props interface** at top of file:
```typescript
import type { ProviderSummary } from '@/lib/provider-types'

interface TotalRevenueProps {
  summary?: ProviderSummary | null
}
```

**Step 3: Update function signature:**
```typescript
export function TotalRevenue({ summary }: TotalRevenueProps) {
```

**Step 4: Replace hardcoded counter values:**
```typescript
// OLD
const revenueDisplay = useAnimatedCounter(847392, 2500, 300)
const ordersDisplay = useAnimatedCounter(2847, 2000, 500)

// NEW
const revenueDisplay = useAnimatedCounter(summary?.total_revenue ?? 0, 2500, 300)
const ordersDisplay = useAnimatedCounter(summary?.total_orders ?? 0, 2000, 500)
```

**Step 5: Replace the hardcoded "+12.4%" growth badge.** Find the element showing "+12.4%" and replace its content with:
```tsx
{summary?.ytd_growth_pct != null
  ? `${summary.ytd_growth_pct > 0 ? '+' : ''}${summary.ytd_growth_pct.toFixed(1)}% YTD`
  : '—'}
```

**Step 6: Commit**
```bash
git add components/provider-performance/total-revenue.tsx
git commit -m "feat(provider-live): wire TotalRevenue to live summary data"
```

---

## Task 5: Wire MetricCards

**Files:**
- Modify: `leaderboard/components/provider-performance/metric-cards.tsx`

**Step 1: Read the file** to find the exact `stats` and `volatilityCards` array definitions and the `AnimatedStat` component.

**Step 2: Add import and props interface:**
```typescript
import type { ProviderSummary } from '@/lib/provider-types'

interface MetricCardsProps {
  summary?: ProviderSummary | null
}
```

**Step 3: Update function signature:**
```typescript
export function MetricCards({ summary }: MetricCardsProps) {
```

**Step 4: Replace the hardcoded `stats` array.** The array drives the 4 animated counter cards. Replace with dynamic values derived from `summary`:
```typescript
const stats = [
  { label: "Órdenes", value: summary?.total_orders ?? 0, suffix: "", sublabel: "en el mes", delay: 600 },
  { label: "Categorías", value: summary?.active_categories ?? 0, suffix: "", sublabel: "activas", delay: 700 },
  { label: "Ticket Prom.", value: summary?.avg_order_value ?? 0, prefix: "$", suffix: "", sublabel: "por orden", decimals: 0, delay: 800 },
  { label: "Margen Prom.", value: summary?.avg_margin_pct ?? 0, suffix: "%", sublabel: "bruto", decimals: 1, delay: 900 },
]
```

**Step 5: Replace the hardcoded `volatilityCards` array.** Replace with:
```typescript
const volatilityCards = [
  {
    label: "Crec. YTD",
    value: summary?.ytd_growth_pct != null ? `${summary.ytd_growth_pct > 0 ? '+' : ''}${summary.ytd_growth_pct.toFixed(1)}%` : '—',
    sublabel: "vs año anterior",
  },
  {
    label: "Meta Alcanzada",
    value: summary?.target_hit_pct != null ? `${summary.target_hit_pct.toFixed(1)}%` : '—',
    sublabel: "del objetivo",
  },
  {
    label: "Mejor Día",
    value: summary?.best_day_revenue != null
      ? `$${(summary.best_day_revenue / 1000).toFixed(0)}K`
      : '—',
    sublabel: summary?.best_day_date ?? '',
  },
]
```

**Step 6: Commit**
```bash
git add components/provider-performance/metric-cards.tsx
git commit -m "feat(provider-live): wire MetricCards to live summary data"
```

---

## Task 6: Wire SalesChart

**Files:**
- Modify: `leaderboard/components/provider-performance/sales-chart.tsx`

**Step 1: Read the file** to find: the hardcoded `chartData` array, the Recharts `<XAxis>`, `<YAxis>`, `<ReferenceLine>`, and `<Area>` components.

**Step 2: Add import and props interface:**
```typescript
import type { ProviderDailyPoint } from '@/lib/provider-types'

interface SalesChartProps {
  data?: ProviderDailyPoint[]
}
```

**Step 3: Update function signature:**
```typescript
export function SalesChart({ data }: SalesChartProps) {
```

**Step 4: Replace hardcoded chart data and make axis dynamic:**
```typescript
// Replace the hardcoded chartData const with:
const chartData = data ?? []

// Dynamic Y-axis
const maxRevenue = chartData.length > 0 ? Math.max(...chartData.map(d => d.revenue)) : 900000
const yDomain = [-maxRevenue * 0.05, maxRevenue * 1.15]
const yTicks = [0,
  Math.round(maxRevenue * 0.25 / 100000) * 100000,
  Math.round(maxRevenue * 0.5 / 100000) * 100000,
  Math.round(maxRevenue * 0.75 / 100000) * 100000,
  Math.round(maxRevenue / 100000) * 100000,
]

// Current (latest) value for reference line
const currentRevenue = chartData[chartData.length - 1]?.revenue ?? 0
```

**Step 5: Update JSX references:**
- `<XAxis dataKey="date">` → `<XAxis dataKey="weekLabel">`
- `<YAxis domain={[-100000, 900000]}>` → `<YAxis domain={yDomain} ticks={yTicks}>`
- `<ReferenceLine y={847392} ...>` → `<ReferenceLine y={currentRevenue} ...>`
- Any hardcoded `$847,392` label in the reference line → dynamically format `currentRevenue`

**Step 6: Commit**
```bash
git add components/provider-performance/sales-chart.tsx
git commit -m "feat(provider-live): wire SalesChart to live daily time series"
```

---

## Task 7: Wire ChannelGrid

**Files:**
- Modify: `leaderboard/components/provider-performance/channel-grid.tsx`

**Step 1: Read the file** to find the hardcoded `channels` array and the `ChannelColumn` component interface.

**Step 2: Add import and props interface at the top of the file:**
```typescript
import type { ProviderChannel } from '@/lib/provider-types'

interface ChannelGridProps {
  channels?: ProviderChannel[]
}
```

**Step 3: Update function signature:**
```typescript
export function ChannelGrid({ channels: channelData }: ChannelGridProps) {
```

**Step 4: Replace hardcoded `const channels = [...]` with a derived array from props.** The `ChannelColumn` component internally expects specific fields — adapt the mapping:

```typescript
const channels = (channelData ?? []).map((ch, i) => ({
  icon: i === 0 ? '▲' : '●',
  label: ch.displayName.toUpperCase(),
  amount: ch.revenue,           // used by useAnimatedCounter
  deployed: `${ch.units.toLocaleString()} pzas · ${ch.orders.toLocaleString()} órdenes · ${ch.locations} ${ch.channel === 'distribucion' ? 'clientes' : 'tiendas'}`,
  color: i === 0 ? 'text-emerald-600' : 'text-amber-600',
}))
```

**Step 5: In `ChannelColumn`, verify `useAnimatedCounter` is called with `channel.amount`.** The field name may already be correct if the component uses `channel.amount`. If not, update the reference.

**Step 6: Commit**
```bash
git add components/provider-performance/channel-grid.tsx
git commit -m "feat(provider-live): wire ChannelGrid to live MTD channel data"
```

---

## Task 8: Wire ProviderSidebar

**Files:**
- Modify: `leaderboard/components/provider-performance/provider-sidebar.tsx`

**Step 1: Read the file** to find: the hardcoded `categories: CategoryData[]` array, `milestones` array, `revenueMatrix`, the `useAnimatedCounter` for annual target, and the state for `selectedCategory` / `activeSlide`.

**Step 2: Add imports and props interface:**
```typescript
import type { ProviderCategory, ProviderSummary } from '@/lib/provider-types'

interface ProviderSidebarProps {
  categories?: ProviderCategory[]
  summary?: ProviderSummary | null
}
```

**Step 3: Update function signature:**
```typescript
export function ProviderSidebar({ categories = [], summary }: ProviderSidebarProps) {
```

**Step 4: Update the annual target animated counter.**
Find `useAnimatedCounter(2500000, ...)` and replace with:
```typescript
const targetDisplay = useAnimatedCounter(summary?.target_amount ?? 0, 2500, 200)
```

**Step 5: Replace the hardcoded `milestones` array:**
```typescript
const milestones = [
  { label: "Mejor día", value: summary ? `$${Math.round(summary.best_day_revenue / 1000)}K` : '—' },
  { label: "Meta mensual", value: summary ? `$${Math.round((summary.target_amount ?? 0) / 12 / 1000)}K` : '—' },
  { label: "Piezas vendidas", value: summary ? summary.total_units.toLocaleString() : '—' },
  { label: "Top categoría", value: categories[0]?.category_name ?? '—', highlight: true },
  { label: "Agentes activos", value: summary ? summary.active_reps.toString() : '—' },
  { label: "Seguimiento desde", value: summary?.tracking_since
    ? new Date(summary.tracking_since + 'T12:00:00').toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })
    : '—' },
]
```

**Step 6: Replace the hardcoded `categories: CategoryData[]` array.** The carousel currently iterates over `categories` for display. Replace the hardcoded `const categories: CategoryData[] = [...]` with a derived display array built from the `categories` prop:
```typescript
// The sidebar slides show: category name, revenue, share percentage
// Build a display-friendly shape from ProviderCategory props
const categorySlides = categories.map(c => ({
  name: c.category_name,
  share: c.share,
  revenue: `$${Math.round(c.revenue / 1000).toLocaleString()}K`,
  revenueNum: c.revenue,
  growth: '',     // no growth data at category level yet
  growthNum: 0,
  orders: c.orders,
  avgTicket: `$${c.orders > 0 ? Math.round(c.revenue / c.orders).toLocaleString() : 0}`,
  // CategoryDetailPanel gets its own data — pass only the code
  category_code: c.category_code,
}))
```

**Step 7: Update the category click handler.** Instead of `setSelectedCategory(fullCategoryObject)`, change to:
```typescript
const [selectedCategoryCode, setSelectedCategoryCode] = useState<string | null>(null)
// onClick: setSelectedCategoryCode(categorySlides[i].category_code)
```

**Step 8: Update the `CategoryDetailPanel` usage** in the JSX to pass `categoryCode` instead of `category`:
```tsx
<CategoryDetailPanel
  categoryCode={selectedCategoryCode}
  open={selectedCategoryCode !== null}
  onOpenChange={(open) => { if (!open) setSelectedCategoryCode(null) }}
/>
```

**Step 9: Remove `revenueMatrix`** const and its JSX block entirely (it was fake probability data with no DB equivalent).

**Step 10: Commit**
```bash
git add components/provider-performance/provider-sidebar.tsx
git commit -m "feat(provider-live): wire ProviderSidebar to live categories and summary"
```

---

## Task 9: Wire CategoryDetailPanel (self-fetching)

**Files:**
- Modify: `leaderboard/components/provider-performance/category-detail-panel.tsx`

This component completely changes its interface: instead of receiving a full `CategoryData` object, it receives a `categoryCode` string and self-fetches using `useCategoryDetail`.

**Step 1: Read the file** to understand the full JSX structure and what fields from `CategoryData` are used in the template.

**Step 2: Replace imports and interface.** Remove the old `CategoryData` import/interface. Add:
```typescript
import { useCategoryDetail } from '@/hooks/use-provider-queries'
import type { CategoryDetail } from '@/lib/provider-types'
import { useAnimatedCounter } from '@/hooks/use-animated-counter'

interface CategoryDetailPanelProps {
  categoryCode: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Step 3: Update function signature:**
```typescript
export function CategoryDetailPanel({ categoryCode, open, onOpenChange }: CategoryDetailPanelProps) {
  const { data: detail, isLoading } = useCategoryDetail(categoryCode)

  const revenueCounter = useAnimatedCounter(detail?.revenue ?? 0, 1500, 100)
  const ordersCounter = useAnimatedCounter(detail?.orders ?? 0, 1500, 200)
  const unitsCounter = useAnimatedCounter(detail?.units ?? 0, 1500, 300)
```

**Step 4: Handle loading state inside the Sheet:**
```tsx
{isLoading && (
  <div className="flex items-center justify-center py-20">
    <div className="size-6 animate-spin rounded-full border-2 border-stone-400 border-t-transparent" />
  </div>
)}
```

**Step 5: Map `CategoryDetail` fields to the existing JSX.** Go through the JSX and replace each `category.*` reference with `detail.*`:

| Old field | New field | Notes |
|-----------|-----------|-------|
| `category.revenueNum` | `detail.revenue` | Raw number for counter |
| `category.revenue` | `$${revenueCounter.toLocaleString()}` | Formatted display |
| `category.growthNum` | Remove growth badge or show `'—'` | No growth at category level yet |
| `category.orders` | `ordersCounter` | From animated counter |
| `category.avgTicket` | `detail.orders > 0 ? '$' + Math.round(detail.revenue / detail.orders).toLocaleString() : '—'` | Computed |
| `category.share` | Remove or compute from props if needed | Not in `CategoryDetail` |
| `category.topProducts` | `detail.topProducts` | `.name`, `.revenue`, `.units` |
| `category.monthlyData` | `detail.monthlyData` | `.month`, `.revenue`, `.orders` |
| `category.channelSplit` | `detail.channelSplit` | `.channel`, `.percentage`, `.revenue` |
| `category.topReps` | `detail.topReps` | `.name`, `.sales`, `.deals` |

For `topProducts`: the new field is `.name` (was `.name`), `.revenue` is a number (was a formatted string). Format in JSX: `$${p.revenue.toLocaleString()}`.

For `topReps`: `.sales` is a number (was a formatted string). Format in JSX: `$${r.sales.toLocaleString()}`.

For `channelSplit`: `.revenue` is a number. Format as `$${c.revenue.toLocaleString()}`.

**Step 6: Wrap the whole content in `{!isLoading && detail && (...)}` guard.**

**Step 7: Commit**
```bash
git add components/provider-performance/category-detail-panel.tsx
git commit -m "feat(provider-live): wire CategoryDetailPanel with self-fetching useCategoryDetail"
```

---

## Task 10: Wire SalesLog

**Files:**
- Modify: `leaderboard/components/provider-performance/sales-log.tsx`

The SalesLog keeps its live simulation (6-second interval) but seeds from real transactions.

**Step 1: Read the file** to find the `Sale` interface, `initialSales`, `newSalesPool`, the `useState`, and `useEffect` with `setInterval`.

**Step 2: Add import and props interface:**
```typescript
import type { ProviderTransaction } from '@/lib/provider-types'

interface SalesLogProps {
  initialTransactions?: ProviderTransaction[]
}
```

**Step 3: Create a conversion helper inside the component** (above the component function) to map `ProviderTransaction` → the internal `Sale` shape:

```typescript
function txToSale(tx: ProviderTransaction): Sale {
  const d = new Date(tx.transaction_time)
  const time = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  return {
    time,
    orderId: tx.folio,
    amount: tx.revenue,       // real pesos, display directly
    channel: tx.channel === 'distribucion' ? 'B2B' : 'STORE',
    product: tx.descripcion.length > 28 ? tx.descripcion.slice(0, 28) + '…' : tx.descripcion,
    qty: Math.round(tx.units_pieces),
    margin: (tx.margin_pct ?? 0) / 100,
    rep: tx.sales_rep?.trim() || tx.store_id || '—',
    profit: Math.round(tx.profit),
  }
}
```

**Step 4: Update the function signature:**
```typescript
export function SalesLog({ initialTransactions = [] }: SalesLogProps) {
```

**Step 5: Replace the `useState` initialization.** Find the line that sets initial state with `initialSales` and replace with:
```typescript
const [sales, setSales] = useState<Sale[]>(() =>
  initialTransactions.length > 0
    ? initialTransactions.slice(0, 5).map(txToSale)
    : initialSales  // keep original mock as fallback
)
```

**Step 6: Update `newSalesPool`.** Replace the hardcoded `newSalesPool` with one built from real transactions (if available), falling back to mock:
```typescript
const livePool = initialTransactions.length > 0
  ? initialTransactions.slice(5, 25).map(txToSale)
  : newSalesPool
```

In the `setInterval` callback, replace `newSalesPool[...]` with `livePool[...]`.

**Step 7: Update the amount display in JSX.** The mock displayed `amount` as a micro-unit value (4128895 → "$41.29"). Real amounts are already in pesos ($17.82). Find where `sale.amount` is formatted in the JSX and replace with direct formatting:
```tsx
{/* OLD: ${(sale.amount / 100000).toFixed(2)} or similar */}
{/* NEW: */}
${sale.amount.toFixed(2)}
```

**Step 8: Commit**
```bash
git add components/provider-performance/sales-log.tsx
git commit -m "feat(provider-live): wire SalesLog to real transactions, keep live simulation"
```

---

## Task 11: Orchestrate in index.tsx

**Files:**
- Modify: `leaderboard/components/provider-performance/index.tsx`

**Step 1: Read the current file** to see the full import list and JSX.

**Step 2: Replace the import block.** Add query hook imports, remove nothing:
```typescript
"use client"

import { DashboardHeader } from "@/components/provider-performance/header"
import { TotalRevenue } from "@/components/provider-performance/total-revenue"
import { MetricCards } from "@/components/provider-performance/metric-cards"
import { SalesChart } from "@/components/provider-performance/sales-chart"
import { ProviderSidebar } from "@/components/provider-performance/provider-sidebar"
import { ChannelGrid } from "@/components/provider-performance/channel-grid"
import { SalesLog } from "@/components/provider-performance/sales-log"
import {
  useProviderSummary,
  useProviderDailySeries,
  useProviderChannels,
  useProviderCategories,
  useProviderTransactions,
} from "@/hooks/use-provider-queries"
```

**Step 3: Replace the entire `ProviderPerformancePage` function body:**

```typescript
export function ProviderPerformancePage() {
  const { data: summaryMtd, isLoading: l1 } = useProviderSummary('mtd')
  const { data: dailySeries, isLoading: l2 } = useProviderDailySeries(90)
  const { data: channels, isLoading: l3 } = useProviderChannels()
  const { data: categories, isLoading: l4 } = useProviderCategories(5)
  const { data: transactions, isLoading: l5 } = useProviderTransactions(50)

  const isLoading = l1 || l2 || l3 || l4 || l5

  if (isLoading) {
    return (
      <div className="bg-stone-50 overflow-hidden -mx-4 -my-8 md:-mx-6 lg:-mx-8 lg:-my-10 flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-stone-400 border-t-transparent" />
          <span className="text-muted-foreground text-sm font-mono">cargando datos de proveedor…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-stone-50 overflow-hidden -mx-4 -my-8 md:-mx-6 lg:-mx-8 lg:-my-10">
      <DashboardHeader />

      <div>
        <div className="flex flex-col lg:flex-row border-y border-stone-200/80">
          <div className="flex-1 bg-background min-w-0">
            <div className="px-6 pt-6 pb-5">
              <TotalRevenue summary={summaryMtd} />
            </div>
            <div className="px-6 pb-5">
              <MetricCards summary={summaryMtd} />
            </div>
            <div className="border-t border-stone-200/60 mx-6" />
            <div className="px-6 py-5">
              <SalesChart data={dailySeries} />
            </div>
            <div className="border-t border-stone-200/60" />
            <ChannelGrid channels={channels} />
          </div>
          <div className="w-full lg:w-72 xl:w-80 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-stone-200/80 bg-stone-100/70">
            <ProviderSidebar categories={categories} summary={summaryMtd} />
          </div>
        </div>

        <SalesLog initialTransactions={transactions} />

        <div className="flex items-center justify-end px-6 py-4 border-t border-stone-200/60">
          <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
            {summaryMtd
              ? `— ${summaryMtd.total_orders.toLocaleString()} órdenes · $0 → $${Math.round(summaryMtd.total_revenue).toLocaleString()} · MTD`
              : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Commit**
```bash
git add components/provider-performance/index.tsx
git commit -m "feat(provider-live): orchestrate all live data hooks in ProviderPerformancePage"
```

---

## Task 12: Verify Build + Push

**Step 1: Run type check**
```bash
cd "C:/Users/arami/Current/report generator/leaderboard"
pnpm tsc --noEmit 2>&1
```

Expected: same 3 pre-existing errors in `settings-page.tsx` only. Zero errors from new provider files.

If there are new errors, fix them before proceeding:
- Common issue: `data` from `useQuery` is `T | undefined` — ensure all component props accept `T | undefined`
- Common issue: `revenueNum` referenced in CategoryDetailPanel but no longer exists — use `detail?.revenue`
- Common issue: Recharts `domain` prop type — cast `yDomain` as `[number, number]`

**Step 2: Commit any type fixes**
```bash
git add -A
git commit -m "fix(provider-live): resolve TypeScript errors in wired components"
```

**Step 3: Push**
```bash
git push origin master
```

Expected: Vercel deployment triggered. Check https://leaderboard-kappa-ebon.vercel.app → Análisis → Proveedores.

---

## Validation Checklist (after deploy)

| Component | Expected live value | How to verify |
|-----------|-------------------|---------------|
| TotalRevenue | ~$2.2M (MTD) | Compare to `provider_performance_summary WHERE period='mtd'` |
| MetricCards Orders | 13,912 | Same summary row |
| MetricCards Avg Order | ~$159 | `avg_order_value` from summary |
| SalesChart | Cumulative curve Jan–Mar | Should reach ~$8.4M |
| ChannelGrid | Distribución + Autoservicio, no "B2B" column | Visual check |
| ProviderSidebar | HIGIENICOS, PAÑALES (not PA¥ALES), etc. | Check category names |
| CategoryDetailPanel | Opens on click, shows real products | Click Electronics/HIGIENICOS |
| SalesLog | Folio numbers like "1955376", real product names | Visual check |
