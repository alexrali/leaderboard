# Provider Performance Dashboard — Production Analysis & Fix Plan

> **For Claude Sonnet:** Implement this plan task-by-task. Each task is self-contained with exact file paths, line references, and code snippets. Validate after each task.

**Date:** 2026-03-24  
**Supabase Project:** `lwgaambqzakqvuvoacem`  
**Provider Code:** `0128` (Kimberly-Clark) — only active provider  
**Leaderboard Root:** `c:\Users\arami\Current\report generator\leaderboard`  
**DAG Root:** `c:\Users\arami\Current\report generator\dags`

---

## Executive Summary

The live data wiring (Tasks 1–12 from the previous plan `2026-03-23-provider-performance-live-data.md`) has been **fully implemented and deployed**. All 7 dashboard components now accept typed props from 5 React Query hooks that fetch from Supabase. However, deep validation of the production data and query layer reveals **6 critical bugs** and **4 architectural improvements** needed before the dashboard is production-grade.

### Data Validation Results (MCP-verified 2026-03-24)

| Table | Rows | Status |
|-------|------|--------|
| `providers` | 1,318+ (1 active: 0128) | ✅ |
| `provider_categories` | 1,318 | ✅ |
| `provider_products` | 404 | ✅ |
| `provider_sales_daily` | 52,788 | ✅ |
| `provider_sales_transactions` | 5,157 (rolling 7d) | ✅ |
| `provider_performance_summary` | 3 rows (mtd/qtd/ytd) | ⚠️ ytd_growth wrong |

| Year | Channel | Days | Rows | Revenue | Pieces | Orders |
|------|---------|------|------|---------|--------|--------|
| 2025 | autoservicio | 364 | 20,811 | $13.6M | 323K | 217K |
| 2025 | distribucion | 305 | 22,189 | $22.2M | 507K | 22.8K |
| 2026 | autoservicio | 80 | 4,741 | $3.2M | 73K | 49.5K |
| 2026 | distribucion | 66 | 5,047 | $5.4M | 134K | 5.2K |

**Monthly Revenue Trend (verified):**
| Month | 2025 | 2026 |
|-------|------|------|
| Jan | $3.53M | $3.45M |
| Feb | $2.71M | $2.77M |
| Mar | $2.88M | $2.34M (MTD thru 23rd) |

---

## PART A: CRITICAL BUG FIXES

### Bug 1: Supabase 1000-Row Default Limit (CRITICAL — All queries silently truncated)

**Root Cause:** The Supabase JS client (`@supabase/ssr` → `createBrowserClient`) returns a maximum of 1000 rows per query by default. No query in `provider-queries.ts` overrides this limit.

**Impact by query:**
| Query Function | Actual Rows | Returned | Data Loss |
|---------------|-------------|----------|-----------|
| `getProviderCategories()` | 52,788 | 1,000 | **98% lost** — category totals wildly wrong |
| `getCategoryDetail()` | 21,800 (6mo) | 1,000 | **95% lost** — detail panel shows fraction of data |
| `getProviderDailySeries()` | 10,779 (90d) | 1,000 | **91% lost** — chart shows incomplete curve |
| `getProviderChannels()` | 2,583 (MTD) | 1,000 | **61% lost** — channel grid shows partial MTD |
| `getProviderTransactions()` | 5,157 | 50 (intentional limit) | ✅ OK |

**Fix Strategy:** Move heavy aggregation to Supabase RPC (server-side SQL) instead of fetching raw rows and aggregating client-side. This solves both the 1000-row limit AND the performance problem of processing 50K+ rows in the browser.

**File:** `leaderboard/lib/provider-queries.ts`

#### Fix 1a: Create Supabase RPC functions for server-side aggregation

Create a new migration file `leaderboard/supabase/migrations/20260324120000_add_provider_rpc_functions.sql`:

```sql
-- RPC: Get category aggregates for a provider (replaces client-side aggregation of 52K rows)
CREATE OR REPLACE FUNCTION get_provider_categories(
  p_provider_code text,
  p_year int DEFAULT extract(year from current_date)::int,
  p_limit int DEFAULT 5
)
RETURNS TABLE(
  category_code varchar,
  category_name varchar,
  revenue numeric,
  units_pieces numeric,
  orders bigint,
  share numeric
) LANGUAGE sql STABLE AS $$
  WITH raw AS (
    SELECT 
      d.category_code,
      d.category_name,
      sum(d.revenue) as revenue,
      sum(d.units_pieces) as units_pieces,
      sum(d.orders) as orders
    FROM provider_sales_daily d
    WHERE d.provider_code = p_provider_code
      AND extract(year from d.date) = p_year
      AND d.category_code IS NOT NULL
      AND d.category_code != ''
    GROUP BY d.category_code, d.category_name
    ORDER BY revenue DESC
    LIMIT p_limit
  ),
  totals AS (SELECT sum(revenue) as total FROM raw)
  SELECT 
    r.category_code,
    r.category_name,
    r.revenue,
    r.units_pieces,
    r.orders,
    CASE WHEN t.total > 0 THEN r.revenue / t.total ELSE 0 END as share
  FROM raw r, totals t;
$$;

-- RPC: Get channel aggregates for MTD
CREATE OR REPLACE FUNCTION get_provider_channels(
  p_provider_code text,
  p_since date DEFAULT date_trunc('month', current_date)::date
)
RETURNS TABLE(
  channel varchar,
  revenue numeric,
  units_pieces numeric,
  orders bigint,
  locations bigint
) LANGUAGE sql STABLE AS $$
  SELECT 
    d.channel,
    sum(d.revenue) as revenue,
    sum(d.units_pieces) as units_pieces,
    sum(d.orders) as orders,
    CASE 
      WHEN d.channel = 'distribucion' THEN count(distinct d.client_code) filter (where d.client_code != '')
      ELSE count(distinct d.store_id) filter (where d.store_id != '')
    END as locations
  FROM provider_sales_daily d
  WHERE d.provider_code = p_provider_code
    AND d.date >= p_since
  GROUP BY d.channel
  ORDER BY revenue DESC;
$$;

-- RPC: Get weekly cumulative series for chart
CREATE OR REPLACE FUNCTION get_provider_weekly_series(
  p_provider_code text,
  p_since date DEFAULT (current_date - 90)
)
RETURNS TABLE(
  week_start date,
  revenue numeric
) LANGUAGE sql STABLE AS $$
  SELECT 
    date_trunc('week', d.date)::date as week_start,
    sum(d.revenue) as revenue
  FROM provider_sales_daily d
  WHERE d.provider_code = p_provider_code
    AND d.date >= p_since
  GROUP BY week_start
  ORDER BY week_start;
$$;

-- RPC: Get category detail (replaces 21K-row client fetch)
CREATE OR REPLACE FUNCTION get_provider_category_detail(
  p_provider_code text,
  p_category_code text,
  p_months int DEFAULT 6
)
RETURNS json LANGUAGE plpgsql STABLE AS $$
DECLARE
  result json;
  since_date date := (current_date - (p_months || ' months')::interval)::date;
BEGIN
  WITH daily AS (
    SELECT date, channel, revenue, units_pieces, orders, sales_rep
    FROM provider_sales_daily
    WHERE provider_code = p_provider_code
      AND category_code = p_category_code
      AND date >= since_date
  ),
  totals AS (
    SELECT 
      sum(revenue) as total_revenue,
      sum(units_pieces) as total_units,
      sum(orders) as total_orders
    FROM daily
  ),
  monthly AS (
    SELECT 
      to_char(date, 'Mon') as month,
      to_char(date, 'YYYY-MM') as sort_key,
      sum(revenue)::numeric as revenue,
      sum(orders)::int as orders
    FROM daily
    GROUP BY to_char(date, 'Mon'), to_char(date, 'YYYY-MM')
    ORDER BY sort_key
  ),
  channel_split AS (
    SELECT 
      CASE WHEN channel = 'distribucion' THEN 'Distribución' ELSE 'Autoservicio' END as channel,
      sum(revenue) as revenue
    FROM daily
    GROUP BY channel
  ),
  top_reps AS (
    SELECT 
      sales_rep as name,
      sum(revenue)::numeric as sales,
      sum(orders)::int as deals
    FROM daily
    WHERE channel = 'distribucion' AND sales_rep IS NOT NULL AND trim(sales_rep) != ''
    GROUP BY sales_rep
    ORDER BY sales DESC
    LIMIT 3
  ),
  top_products AS (
    SELECT 
      t.clave,
      coalesce(trim(replace(replace(t.descripcion, '¥', 'Ñ'), 'ï', 'í')), t.clave) as name,
      sum(t.revenue)::numeric as revenue,
      sum(t.units_pieces)::numeric as units
    FROM provider_sales_transactions t
    WHERE t.provider_code = p_provider_code
      AND t.clave IN (
        SELECT pp.clave FROM provider_products pp WHERE pp.category_code = p_category_code
      )
    GROUP BY t.clave, t.descripcion
    ORDER BY revenue DESC
    LIMIT 4
  ),
  cat_name AS (
    SELECT category_name FROM provider_categories
    WHERE category_code = p_category_code
    LIMIT 1
  )
  SELECT json_build_object(
    'category_code', p_category_code,
    'category_name', coalesce(
      trim(replace(replace((SELECT category_name FROM cat_name), '¥', 'Ñ'), 'ï', 'í')),
      p_category_code
    ),
    'revenue', (SELECT round(total_revenue) FROM totals),
    'units', (SELECT round(total_units) FROM totals),
    'orders', (SELECT total_orders FROM totals),
    'monthlyData', coalesce((SELECT json_agg(json_build_object(
      'month', month, 'revenue', round(revenue), 'orders', orders
    ) ORDER BY sort_key) FROM monthly), '[]'::json),
    'channelSplit', coalesce((SELECT json_agg(json_build_object(
      'channel', channel,
      'revenue', round(revenue),
      'percentage', CASE WHEN (SELECT total_revenue FROM totals) > 0
        THEN round((revenue / (SELECT total_revenue FROM totals)) * 100)
        ELSE 0 END
    )) FROM channel_split), '[]'::json),
    'topReps', coalesce((SELECT json_agg(json_build_object(
      'name', name, 'sales', round(sales), 'deals', deals
    )) FROM top_reps), '[]'::json),
    'topProducts', coalesce((SELECT json_agg(json_build_object(
      'clave', clave, 'name', name, 'revenue', round(revenue), 'units', round(units)
    )) FROM top_products), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;
```

**Apply this migration via Supabase MCP** (`apply_migration`), then update the query functions.

#### Fix 1b: Rewrite query functions to use RPCs

**File:** `leaderboard/lib/provider-queries.ts` — Replace ALL heavy-fetch functions:

```typescript
// getProviderCategories — was fetching 52K rows, now uses RPC
export async function getProviderCategories(limit = 5): Promise<ProviderCategory[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_provider_categories', {
    p_provider_code: PROVIDER_CODE,
    p_year: new Date().getFullYear(),
    p_limit: limit,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: any) => ({
    ...row,
    category_name: normalizeName(row.category_name ?? ''),
    share: Number(row.share),
  }))
}

// getProviderChannels — was fetching 2.5K rows, now uses RPC
export async function getProviderChannels(): Promise<ProviderChannel[]> {
  const supabase = createClient()
  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)
  const { data, error } = await supabase.rpc('get_provider_channels', {
    p_provider_code: PROVIDER_CODE,
    p_since: firstOfMonth.toISOString().split('T')[0],
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: any) => ({
    channel: row.channel,
    displayName: row.channel === 'distribucion' ? 'Almacén / Distribución' : 'Autoservicio / Tiendas',
    revenue: Number(row.revenue),
    units: Number(row.units_pieces),
    orders: Number(row.orders),
    locations: Number(row.locations),
  }))
}

// getProviderDailySeries — was fetching 10K rows, now uses RPC
export async function getProviderDailySeries(days = 90): Promise<ProviderDailyPoint[]> {
  const supabase = createClient()
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data, error } = await supabase.rpc('get_provider_weekly_series', {
    p_provider_code: PROVIDER_CODE,
    p_since: since.toISOString().split('T')[0],
  })
  if (error) throw new Error(error.message)
  
  let cumulative = 0
  return (data ?? []).map((w: any) => {
    cumulative += Number(w.revenue)
    const d = new Date(w.week_start + 'T12:00:00')
    const weekLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { date: w.week_start, weekLabel, revenue: Math.round(cumulative) }
  })
}

// getCategoryDetail — was fetching 21K rows, now uses RPC
export async function getCategoryDetail(categoryCode: string): Promise<CategoryDetail | null> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_provider_category_detail', {
    p_provider_code: PROVIDER_CODE,
    p_category_code: categoryCode,
  })
  if (error) throw new Error(error.message)
  return data as CategoryDetail
}
```

---

### Bug 2: ytd_growth_pct = 4917.91% (Should be +2.6%)

**Root Cause:** The DAG's `update_summaries` task (line 1018–1043 in `provider_performance_daily_etl.py`) fetches prior-year data for YTD growth comparison. However:
1. The summary was last computed on 2026-03-24 after the 2025 backfill.
2. The query fetches `date >= '2025-01-01'` with `limit: 10000` but 2025 has 43,000 rows → only 10,000 returned → prior year revenue is massively underestimated.
3. Correct comparison: $8.56M (2026 YTD thru Mar 23) vs $8.34M (2025 same period) = **+2.6% growth**.

**Fix (DAG):** File `dags/provider_performance_daily_etl.py`, line 1030 — change limit and add pagination or use a filtered query:

```python
# Line 1023-1033: Replace the prior year fetch with paginated version
# OR better: add a date upper bound and increase limit
resp_prev = requests.get(
    f"{supabase_url}/rest/v1/provider_sales_daily",
    headers=headers,
    params={
        "select": "revenue",
        "provider_code": f"eq.{pcode}",
        "date": f"gte.{prev_year_start}",
        "date": f"lte.{prev_year_end}",   # <-- ADD upper bound
        "limit": "50000",                    # <-- INCREASE from 10000
    },
    timeout=60,
)
```

**Note:** The PostgREST API doesn't support two params with the same key easily. Better approach: use `and=(date.gte.{start},date.lte.{end})` or paginate as done for current year. Recommended fix:

```python
# Replace lines 1023-1043 with paginated prior year fetch:
prev_data = []
prev_offset = 0
while True:
    resp_prev = requests.get(
        f"{supabase_url}/rest/v1/provider_sales_daily",
        headers={**headers, "Range-Unit": "items"},
        params={
            "select": "revenue",
            "provider_code": f"eq.{pcode}",
            "and": f"(date.gte.{prev_year_start},date.lte.{prev_year_end})",
            "limit": str(page_size),
            "offset": str(prev_offset),
        },
        timeout=60,
    )
    if resp_prev.status_code != 200:
        break
    page = resp_prev.json()
    if not page:
        break
    prev_data.extend(page)
    if len(page) < page_size:
        break
    prev_offset += page_size

if prev_data:
    prev_rev = sum(float(r.get("revenue", 0)) for r in prev_data)
    if prev_rev > 0:
        ytd_growth = ((total_revenue - prev_rev) / prev_rev) * 100
```

**Immediate fix:** Re-trigger the DAG for today's date to recompute summaries with the now-complete 2025 data.

```bash
docker exec cfa-airflow-scheduler airflow dags trigger provider_performance_daily_etl
```

---

### Bug 3: `product_code` Column Doesn't Exist in `provider_products`

**Root Cause:** `getCategoryDetail()` at line 217 calls `.select('product_code')` on the `provider_products` table. But the table schema has column `clave` (PK), not `product_code`. This causes the top products section in `CategoryDetailPanel` to always be empty.

**File:** `leaderboard/lib/provider-queries.ts`, line 217  
**Fix:** Change `.select('product_code')` to `.select('clave')`

```typescript
// Line 215-219: Fix column name
const { data: productCodes } = await supabase
  .from('provider_products')
  .select('clave')  // was 'product_code' — column doesn't exist
  .eq('category_code', categoryCode)
const codes = (productCodes ?? []).map((p: { clave: string }) => p.clave)
```

**Note:** If implementing Bug 1 fix (RPC approach), this bug is fixed automatically since the RPC function uses the correct column name.

---

### Bug 4: `target_amount = 0` and `target_hit_pct = 0`

**Root Cause:** No target has been set. The DAG doesn't compute targets — they must be set manually or via a business logic layer.

**Impact:** 
- Sidebar shows "$0.0M" for "Objetivo Anual"
- MetricCards shows "Meta Alcanzada: 0.0%"
- Header shows hardcoded "$2.5M" (stale mock value)

**Fix Options:**
1. **(Recommended) Set a default target based on prior year:** 2025 full year was ~$35.8M. A reasonable 2026 target could be $38M (+6%).
2. **Manual via SQL:** `UPDATE provider_performance_summary SET target_amount = 38000000, target_hit_pct = round((total_revenue / 38000000) * 100, 2) WHERE provider_code = '0128' AND period = 'ytd';`
3. **DAG enhancement:** Add target computation in `update_summaries` based on prior year total * growth factor.

**Immediate SQL fix (apply via Supabase MCP):**

```sql
UPDATE provider_performance_summary 
SET target_amount = 38000000,
    target_hit_pct = round((total_revenue / 38000000) * 100, 2)
WHERE provider_code = '0128' AND period = 'ytd';

UPDATE provider_performance_summary 
SET target_amount = 38000000 / 12,
    target_hit_pct = round((total_revenue / (38000000 / 12)) * 100, 2)
WHERE provider_code = '0128' AND period = 'mtd';

UPDATE provider_performance_summary 
SET target_amount = 38000000 / 4,
    target_hit_pct = round((total_revenue / (38000000 / 4)) * 100, 2)
WHERE provider_code = '0128' AND period = 'qtd';
```

---

### Bug 5: Header Has Hardcoded Values

**File:** `leaderboard/components/provider-performance/header.tsx`, lines 19–27 and 51–63

**Current hardcoded values:**
- Line 20: `"Q1 2026"` — should be dynamic quarter
- Line 22: `"5 categories"` — should come from summary
- Line 23: `"12 active reps"` — should come from summary  
- Line 54: `"$47.2K"` (Best Day) — should come from summary
- Line 58: `"$2.5M"` (Target) — should come from summary

**Fix:** Pass `summary` prop to `DashboardHeader`:

```typescript
// header.tsx
import type { ProviderSummary } from '@/lib/provider-types'

interface DashboardHeaderProps {
  summary?: ProviderSummary | null
}

export function DashboardHeader({ summary }: DashboardHeaderProps) {
  const time = useLiveClock()
  
  // Dynamic quarter label
  const now = new Date()
  const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`
  
  return (
    <header ...>
      ...
      {/* Line 19-26: Replace hardcoded context */}
      <div className="hidden md:flex items-center gap-1.5 ...">
        <span>{quarter}</span>
        <span className="text-border">·</span>
        <span>distribución + autoservicio</span>
        <span className="text-border">·</span>
        <span>{summary?.active_categories ?? '—'} categorías</span>
        <span className="text-border">·</span>
        <span>{summary?.active_reps ?? '—'} agentes activos</span>
      </div>
      ...
      {/* Lines 51-63: Replace hardcoded stats */}
      <div className="text-right">
        <p ...>Mejor Día</p>
        <p ...>${summary?.best_day_revenue 
          ? `$${(summary.best_day_revenue / 1000).toFixed(1)}K` 
          : '—'}</p>
      </div>
      <div className="text-right">
        <p ...>Meta</p>
        <p ...>${summary?.target_amount
          ? `$${(summary.target_amount / 1000000).toFixed(1)}M`
          : '—'}</p>
      </div>
      ...
    </header>
  )
}
```

**Also update `index.tsx`** to pass `summary` prop:
```tsx
<DashboardHeader summary={summaryMtd} />
```

---

### Bug 6: SalesLog Channel Label Mapping

**File:** `leaderboard/components/provider-performance/sales-log.tsx`, lines 57-68

**Issue:** Channel indicator maps `B2B` → `▼ DOWN` (red) and `STORE` → `● FLAT` (amber). These labels are remnants from the mock data and don't map well to real channels:
- `distribucion` → mapped to `B2B` → shows ▼ DOWN in red (misleading)
- `autoservicio` → mapped to `STORE` → shows ● FLAT in amber

**Fix:** Replace the mock channel system with real channel identifiers:

```typescript
function getChannelIndicator(channel: string) {
  switch (channel) {
    case "B2B":
      return { symbol: "▲", label: "DIST", color: "text-emerald-600" }
    case "STORE":
      return { symbol: "●", label: "AUTO", color: "text-amber-600" }
    default:
      return { symbol: "—", label: channel, color: "text-muted-foreground" }
  }
}
```

---

## PART B: ARCHITECTURE & PERFORMANCE IMPROVEMENTS

### Improvement 1: Year-over-Year Revenue Comparison Chart

**Rationale:** With 2025 and 2026 data both available, the most powerful analytical addition is a YoY comparison. The current chart shows only the cumulative curve for the current period. Adding a prior-year overlay provides immediate context.

**New RPC function (add to the migration):**

```sql
CREATE OR REPLACE FUNCTION get_provider_yoy_series(
  p_provider_code text
)
RETURNS TABLE(
  week_num int,
  revenue_current numeric,
  revenue_prior numeric
) LANGUAGE sql STABLE AS $$
  WITH current_year AS (
    SELECT 
      extract(week from date)::int as week_num,
      sum(revenue) as revenue
    FROM provider_sales_daily
    WHERE provider_code = p_provider_code
      AND extract(year from date) = extract(year from current_date)
    GROUP BY 1
  ),
  prior_year AS (
    SELECT 
      extract(week from date)::int as week_num,
      sum(revenue) as revenue
    FROM provider_sales_daily
    WHERE provider_code = p_provider_code
      AND extract(year from date) = extract(year from current_date) - 1
    GROUP BY 1
  )
  SELECT 
    coalesce(c.week_num, p.week_num) as week_num,
    coalesce(c.revenue, 0) as revenue_current,
    coalesce(p.revenue, 0) as revenue_prior
  FROM current_year c
  FULL OUTER JOIN prior_year p ON c.week_num = p.week_num
  ORDER BY week_num;
$$;
```

**New TypeScript type** (add to `provider-types.ts`):
```typescript
export interface ProviderYoYPoint {
  week_num: number
  weekLabel: string
  revenue_current: number
  revenue_prior: number
}
```

**New hook** (add to `use-provider-queries.ts`):
```typescript
export function useProviderYoYSeries() {
  return useQuery({
    queryKey: ['provider-yoy-series'],
    queryFn: () => getProviderYoYSeries(),
    staleTime: STALE_5M,
  })
}
```

**UI Enhancement for `sales-chart.tsx`:** Add a toggle or second Area line for prior year:
- Dashed line (lighter opacity) for 2025
- Solid line for 2026
- Legend showing "2026" / "2025"
- Tooltip showing both values and delta

---

### Improvement 2: Period Selector (MTD / QTD / YTD)

**Rationale:** The summary table already has 3 periods. Currently only MTD is used. Adding a toggle gives users immediate access to quarterly and yearly views.

**Implementation:**

1. **Add state to `index.tsx`:**
```typescript
const [period, setPeriod] = useState<'mtd' | 'qtd' | 'ytd'>('mtd')
const { data: summary, isLoading: l1 } = useProviderSummary(period)
```

2. **Create a `PeriodToggle` component** (inline in header or new file):
```tsx
function PeriodToggle({ value, onChange }: { value: string; onChange: (v: 'mtd'|'qtd'|'ytd') => void }) {
  const options = [
    { value: 'mtd', label: 'Mes' },
    { value: 'qtd', label: 'Trimestre' },
    { value: 'ytd', label: 'Año' },
  ]
  return (
    <div className="flex bg-stone-100 rounded p-0.5 gap-0.5">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value as any)}
          className={cn(
            "px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded transition-all",
            value === o.value 
              ? "bg-foreground text-background shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
```

3. **Wire into header or TotalRevenue area.**

---

### Improvement 3: Error Handling & Empty States

**Current behavior:** If any of the 5 queries fails, the dashboard shows an infinite spinner. No error state is rendered.

**Fix in `index.tsx`:**

```typescript
const hasError = [e1, e2, e3, e4, e5].some(Boolean)

if (hasError) {
  return (
    <div className="bg-stone-50 overflow-hidden ... flex items-center justify-center" style={{ minHeight: '60vh' }}>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-4xl">⚠</span>
        <p className="text-sm text-muted-foreground font-mono">
          Error cargando datos del proveedor.
        </p>
        <p className="text-xs text-muted-foreground">Intenta de nuevo en unos minutos.</p>
      </div>
    </div>
  )
}
```

Also add empty states per component (e.g., if `channels` is empty, show "Sin datos para este período").

---

### Improvement 4: Scope `getProviderCategories` to Current Year

**Current:** Aggregates ALL-TIME data (2025+2026 = 52K rows across 16 months).  
**Better:** Scope to current year by default, matching the YTD summary context.

This is already handled in the RPC approach (Bug 1 fix) with `p_year` parameter.

---

## PART C: CREATIVE ANALYTICS ADDITIONS

### Analysis 1: Category Velocity Heatmap

**Concept:** Show which categories are accelerating or decelerating month-over-month. Use the sidebar's category section to display a small sparkline or color-coded indicator showing 3-month revenue trend.

**RPC function:**
```sql
CREATE OR REPLACE FUNCTION get_provider_category_velocity(
  p_provider_code text,
  p_months int DEFAULT 3
)
RETURNS TABLE(
  category_code varchar,
  category_name varchar,
  current_month_revenue numeric,
  prior_month_revenue numeric,
  velocity_pct numeric
) LANGUAGE sql STABLE AS $$
  WITH monthly AS (
    SELECT 
      category_code,
      category_name,
      date_trunc('month', date) as month,
      sum(revenue) as revenue
    FROM provider_sales_daily
    WHERE provider_code = p_provider_code
      AND date >= (current_date - (p_months || ' months')::interval)::date
      AND category_code IS NOT NULL AND category_code != ''
    GROUP BY 1, 2, 3
  )
  SELECT 
    m1.category_code,
    m1.category_name,
    m1.revenue as current_month_revenue,
    m2.revenue as prior_month_revenue,
    CASE WHEN m2.revenue > 0 
      THEN round(((m1.revenue - m2.revenue) / m2.revenue) * 100, 1)
      ELSE NULL 
    END as velocity_pct
  FROM monthly m1
  LEFT JOIN monthly m2 ON m1.category_code = m2.category_code 
    AND m2.month = m1.month - interval '1 month'
  WHERE m1.month = date_trunc('month', current_date)
  ORDER BY m1.revenue DESC;
$$;
```

**UI:** In the sidebar's Category Focus section, add a small colored badge next to each category name:
- 🟢 Green for velocity > +10%
- 🟡 Yellow for -10% to +10%
- 🔴 Red for velocity < -10%

---

### Analysis 2: Channel Mix Trend (Distribución vs Autoservicio Over Time)

**Concept:** Show how the channel split is evolving. If autoservicio is growing faster than distribución, that's a strategic insight.

**RPC function:**
```sql
CREATE OR REPLACE FUNCTION get_provider_channel_mix_trend(
  p_provider_code text,
  p_months int DEFAULT 6
)
RETURNS TABLE(
  month text,
  sort_key text,
  distribucion_pct numeric,
  autoservicio_pct numeric,
  distribucion_revenue numeric,
  autoservicio_revenue numeric
) LANGUAGE sql STABLE AS $$
  WITH monthly AS (
    SELECT 
      to_char(date, 'Mon') as month,
      to_char(date, 'YYYY-MM') as sort_key,
      sum(CASE WHEN channel = 'distribucion' THEN revenue ELSE 0 END) as dist_rev,
      sum(CASE WHEN channel = 'autoservicio' THEN revenue ELSE 0 END) as auto_rev,
      sum(revenue) as total_rev
    FROM provider_sales_daily
    WHERE provider_code = p_provider_code
      AND date >= (current_date - (p_months || ' months')::interval)::date
    GROUP BY 1, 2
  )
  SELECT 
    month, sort_key,
    CASE WHEN total_rev > 0 THEN round(dist_rev / total_rev * 100, 1) ELSE 0 END,
    CASE WHEN total_rev > 0 THEN round(auto_rev / total_rev * 100, 1) ELSE 0 END,
    round(dist_rev),
    round(auto_rev)
  FROM monthly
  ORDER BY sort_key;
$$;
```

**UI:** Could be shown as a stacked area chart in the SalesChart section, toggled via a small tab ("Revenue" / "Channel Mix").

---

### Analysis 3: Day-of-Week Revenue Pattern

**Concept:** Distribución operates Mon–Sat while autoservicio runs 7 days. Show a radar/bar chart of average daily revenue by day of week. This reveals optimal days and could inform inventory planning.

---

### Analysis 4: Top SKU Movement

**Concept:** Which individual products are driving the most revenue change vs. prior month? Surface the top 5 "rising" and "falling" SKUs. This is available from `provider_sales_daily` by comparing current month to prior month at the SKU granularity (via category_code + date).

---

## PART D: IMPLEMENTATION SEQUENCE

### Recommended task order:

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 1 | Apply RPC migration (Bug 1 fix) | 🔴 Critical | 15 min |
| 2 | Rewrite `provider-queries.ts` to use RPCs | 🔴 Critical | 20 min |
| 3 | Fix `product_code` → `clave` (Bug 3 — skip if using RPC) | 🔴 Critical | 2 min |
| 4 | Fix header hardcoded values (Bug 5) | 🟡 High | 10 min |
| 5 | Fix SalesLog channel labels (Bug 6) | 🟡 High | 5 min |
| 6 | Set target_amount via SQL (Bug 4) | 🟡 High | 5 min |
| 7 | Re-trigger DAG to fix ytd_growth (Bug 2) | 🟡 High | 5 min |
| 8 | Fix DAG pagination for prior year (Bug 2 root cause) | 🟡 High | 15 min |
| 9 | Add error handling in index.tsx | 🟢 Medium | 10 min |
| 10 | Add Period Selector (MTD/QTD/YTD) | 🟢 Medium | 20 min |
| 11 | Add YoY comparison chart | 🔵 Enhancement | 30 min |
| 12 | Add category velocity indicators | 🔵 Enhancement | 20 min |
| 13 | Add channel mix trend | 🔵 Enhancement | 25 min |

**Total estimated effort:** ~3 hours for critical+high, ~4.5 hours for all.

---

## PART E: FILES REFERENCE

### Files to Modify (existing):
- `leaderboard/lib/provider-queries.ts` — Rewrite all 5 query functions to use RPCs
- `leaderboard/lib/provider-types.ts` — Add YoY type, possibly add velocity type
- `leaderboard/hooks/use-provider-queries.ts` — Add YoY hook, period selector support
- `leaderboard/components/provider-performance/header.tsx` — Wire summary prop, remove hardcoded values
- `leaderboard/components/provider-performance/index.tsx` — Pass summary to header, add period state, add error handling
- `leaderboard/components/provider-performance/sales-log.tsx` — Fix channel indicator labels
- `leaderboard/components/provider-performance/sales-chart.tsx` — (Optional) Add YoY overlay
- `dags/provider_performance_daily_etl.py` — Fix prior year pagination in update_summaries

### Files to Create:
- `leaderboard/supabase/migrations/20260324120000_add_provider_rpc_functions.sql` — All RPC functions

### Supabase Actions (via MCP):
- Apply RPC migration
- Set target_amount values
- Verify ytd_growth after DAG re-trigger

---

## PART F: VALIDATION CHECKLIST

After all fixes are applied and deployed:

| Check | Expected | How to Verify |
|-------|----------|---------------|
| TotalRevenue | ~$2.3M MTD | Match `provider_performance_summary WHERE period='mtd'` |
| YTD Growth | ~+2.6% | Not 4917%! |
| Categories | HIGIENICOS #1 at ~$17.9M | Not truncated partial data |
| Chart curve | Smooth 13-week cumulative reaching ~$8.5M | Not truncated at 1000 rows |
| Channel Grid | Distribución ~$5.4M, Autoservicio ~$3.2M (MTD) | Full MTD, not partial |
| Header | Dynamic quarter, real best day, real target | No more hardcoded "$47.2K" |
| CategoryDetail | Shows top products with real names | Not empty due to `product_code` bug |
| SalesLog | DIST/AUTO labels, not DOWN/FLAT | Correct channel indicators |
| Period toggle | Switching MTD→YTD shows ~$8.5M | All 3 periods work |
| Target sidebar | "$38.0M" (or whatever is set) | Not "$0.0M" |
