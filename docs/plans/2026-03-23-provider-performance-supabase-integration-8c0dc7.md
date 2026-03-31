# Provider Performance Dashboard — Supabase Integration Plan

A comprehensive guide to wiring the existing provider-performance dashboard UI to the live Supabase data layer, including validation checkpoints, DAG architecture decisions, and component mapping.

---

## Executive Summary

The provider-performance dashboard exists as a polished UI in `leaderboard/components/provider-performance/` but uses hardcoded mock data. This plan documents how to wire it to the live Supabase tables (`provider_sales_daily`, `provider_performance_summary`, etc.) populated by the Airflow DAG `provider_performance_daily_etl`.

---

## 1. Data Architecture Overview

### 1.1 Source Systems → DAG → Supabase Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SOURCE SYSTEMS                                    │
├─────────────────────────────┬───────────────────────────────────────────────┤
│  KEPLERALMACEN (Warehouse)    │   8 Store Servers (Hamachi VPN)               │
│  • distribucion channel       │   • autoservicio channel                      │
│  • KDII (products)            │   • KEPLER database on each                   │
│  • KDIG (categories)          │   • product codes via resolved XCom           │
└──────────────┬────────────────┴──────────────────┬────────────────────────────┘
               │                                   │
               └──────────────┬────────────────────┘
                              │
               ┌──────────────▼──────────────┐
               │   Airflow DAG (8 tasks)     │
               │   provider_performance_       │
               │   daily_etl                 │
               │                             │
               │   1. sync_providers          │
               │   2. resolve_products ───────┼──┐
               │   3. extract_distribucion    │  │
               │   4. extract_autoservicio ◄──┘  │
               │   5. transform_aggregate      │
               │   6. load_to_supabase        │
               │   7. update_summaries        │
               │   8. prune_old_data          │
               └──────────────┬───────────────┘
                              │
               ┌──────────────▼──────────────┐
               │      SUPABASE TABLES        │
               ├─────────────────────────────┤
               │  providers                  │
               │  provider_products            │
               │  provider_categories          │
               │  provider_sales_daily ◄───────┼── Dashboard primary source
               │  provider_sales_transactions  │
               │  provider_performance_summary │
               └─────────────────────────────┘
```

### 1.2 Key Design Decisions (The "Why")

| Decision | Rationale | Impact on UI |
|----------|-----------|--------------|
| **Unit normalization** (`units_pieces`) | Distribucion sells boxes, autoservicio sells pieces. Normalizing to pieces enables apples-to-apples comparison. | Sidebar "Products sold" milestone uses `units_pieces` not raw `units` |
| **Category enrichment** | Autoservicio store servers don't have category data; we join via `provider_products` lookup in DAG. | Category breakdown in sidebar now populated (HIGIENICOS, PAÑALES, etc.) |
| **Dual-channel aggregation** | Separate extraction tasks → single unified `provider_sales_daily` table with `channel` column. | Channel grid shows both channels side-by-side |
| **Paginated summaries** | Supabase REST API has 1000-row default limit; summary task paginates. | `provider_performance_summary` has correct YTD totals ($8.4M vs $929K) |
| **Date derivation from context** | `_get_target_date()` uses `data_interval_end` not `datetime.now()` | Backfills work correctly (proven: 80/80 runs, 640 tasks) |
| **Zero-padded provider codes** | KEPLER uses "0128", JSON serialization was stripping to "128". Fixed via explicit string handling. | Provider selection works correctly with leading zeros |

---

## 2. Where to Find the Data

### 2.1 Supabase Project
- **URL**: `https://lwgaambqzakqvuvoacem.supabase.co`
- **Service Key**: Stored in Airflow Variable `SUPABASE_SERVICE_KEY`
- **Anon Key**: In `leaderboard/.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2.2 Primary Tables for Dashboard

| Table | Purpose | Key Columns | UI Mapping |
|-------|---------|-------------|------------|
| `provider_sales_daily` | Primary fact table — all daily sales | `date`, `channel`, `revenue`, `units_pieces`, `category_code`, `category_name`, `sku_count`, `orders` | TotalRevenue, SalesChart, ChannelGrid, SalesLog |
| `provider_performance_summary` | Pre-aggregated summaries | `period` (mtd/qtd/ytd), `total_revenue`, `total_units`, `active_stores`, `active_reps`, `best_day_revenue` | MetricCards, Sidebar milestones |
| `providers` | Provider master data | `provider_code`, `provider_name`, `is_active` | Provider selector in header |
| `provider_products` | Product master with conversion | `product_code`, `units_per_box`, `category_code` | Category enrichment source |
| `provider_categories` | Category names | `category_code`, `category_name` | Category display labels |

### 2.3 Row Counts (Post-Backfill)
```sql
-- Current data volume (Kimberly-Clark 0128)
SELECT 
  'provider_sales_daily' as table_name, count(*) as rows,
  count(distinct date) as days,
  min(date) as earliest, max(date) as latest
FROM provider_sales_daily WHERE provider_code = '0128';

-- Result: 9,677 rows, 79 days (Jan 1 - Mar 22, 2026)
```

---

## 3. Where to Validate

### 3.1 DAG Validation Checkpoints

| Checkpoint | Command | Expected Result |
|------------|---------|-----------------|
| DAG deployed | `docker exec cfa-airflow-scheduler ls /opt/airflow/dags/provider_performance_daily_etl.py` | File exists |
| DAG parsed | `docker exec cfa-airflow-scheduler airflow dags list` | `provider_performance_daily_etl` appears |
| Recent run status | `docker exec cfa-airflow-scheduler airflow dags list-runs -d provider_performance_daily_etl` | State = `success` |
| Task logs | Airflow UI or `docker exec cfa-airflow-scheduler airflow tasks logs provider_performance_daily_etl [task_id] [run_id]` | No errors, pagination logs show `fetched X daily rows` |

### 3.2 Supabase Data Validation Queries

```sql
-- 1. Verify unit conversion is working
SELECT 
  channel, unit_type,
  sum(units) as raw_units,
  sum(units_pieces) as pieces,
  round(sum(units_pieces) / nullif(sum(units), 0), 1) as avg_conversion
FROM provider_sales_daily
WHERE provider_code = '0128'
GROUP BY channel, unit_type;
-- Expected: distribucion has avg ~10.7 pieces/box, autoservicio has 1.0

-- 2. Verify category enrichment
SELECT category_code, category_name, count(*) as records
FROM provider_sales_daily
WHERE provider_code = '0128' AND channel = 'autoservicio'
GROUP BY category_code, category_name
ORDER BY records DESC
LIMIT 5;
-- Expected: HIGIENICOS, PAÑALES, SERVILLETAS, etc. (not blank)

-- 3. Verify summary aggregation
SELECT period, total_revenue, total_units, total_orders
FROM provider_performance_summary
WHERE provider_code = '0128';
-- Expected: ytd = ~$8.4M, ~204K pieces, ~54K orders

-- 4. Check for data gaps
SELECT date, channel, count(*) as records
FROM provider_sales_daily
WHERE provider_code = '0128'
GROUP BY date, channel
ORDER BY date;
-- Expected: weekdays have both channels, weekends only autoservicio
```

### 3.3 UI Validation Approach

1. **Static props validation**: Compare hardcoded values in components to SQL query results
2. **React Query integration**: Use `useQuery` with `staleTime: 5 minutes` to avoid excessive API calls
3. **Error boundaries**: Wrap dashboard in error boundary to catch Supabase connection issues
4. **Loading states**: Preserve existing skeleton/animation patterns from mock data version

---

## 4. Component-to-Data Mapping

### 4.1 Current UI (Hardcoded) → Target Data Source

| Component | Current (Mock) | Target (Supabase) | Query Pattern |
|-----------|---------------|-------------------|---------------|
| `TotalRevenue` | `$847,392` static | `SELECT sum(revenue) FROM provider_sales_daily WHERE date >= date_trunc('month', current_date)` | Single value, realtime |
| `MetricCards` — Orders | `44` static | `provider_performance_summary.period = 'mtd'.total_orders` | Summary table, cached |
| `MetricCards` — Conv Rate | `84.1%` static | Calculate: orders / visits (if visits tracked) or remove | May need removal |
| `MetricCards` — Avg Order | `$3.5K` static | `total_revenue / total_orders` | Derived from summary |
| `MetricCards` — Avg Margin | `+5.0¢` static | `provider_performance_summary.avg_margin_pct` | Summary table |
| `SalesChart` | 6 months fake data | `SELECT date, sum(revenue) FROM provider_sales_daily GROUP BY date ORDER BY date` | Time series, 90 days |
| `ChannelGrid` | Static cards | `SELECT channel, sum(revenue), sum(units_pieces), count(distinct store_id/client_code) FROM provider_sales_daily GROUP BY channel` | Aggregate |
| `ProviderSidebar` — Annual Target | `$2.5M` animated | Hardcoded goal or `providers.target_revenue` | Static/config |
| `ProviderSidebar` — Categories | 5 fake categories | `SELECT category_code, category_name, sum(revenue), sum(units_pieces) FROM provider_sales_daily GROUP BY category_code, category_name` | Top 5 by revenue |
| `ProviderSidebar` — Milestones | 6 fake milestones | `provider_performance_summary.best_day_revenue`, `active_stores`, `active_reps`, etc. | Summary table |
| `ProviderSidebar` — Revenue Matrix | 2x4 fake grid | Could show quartile distribution or remove | TBD |
| `SalesLog` | Fake transactions | `SELECT * FROM provider_sales_transactions ORDER BY timestamp DESC LIMIT 50` | Recent transactions |

### 4.2 Required New Hooks

Create in `leaderboard/hooks/use-provider-queries.ts`:

```typescript
// Primary queries needed
export function useProviderDaily(providerCode: string, days: number)
export function useProviderSummary(providerCode: string, period: 'mtd' | 'qtd' | 'ytd')
export function useProviderCategories(providerCode: string, limit: number)
export function useProviderTransactions(providerCode: string, limit: number)
export function useProviderList()
```

---

## 5. Implementation Sequence

### Phase 1: Foundation (Day 1)
1. **Create Supabase client** in `leaderboard/lib/supabase-provider.ts` (reuse existing pattern from SIM-PCR)
2. **Create query hooks** in `leaderboard/hooks/use-provider-queries.ts`
3. **Add environment variables** to `leaderboard/.env.local` (already has Supabase keys)
4. **Test queries** in isolation using Supabase Studio SQL Editor

### Phase 2: Component Wiring (Day 2-3)
1. **TotalRevenue** → wire to `useProviderDaily`
2. **MetricCards** → wire to `useProviderSummary`
3. **SalesChart** → wire to `useProviderDaily` with time series transform
4. **ChannelGrid** → wire to `useProviderDaily` with channel aggregation
5. **ProviderSidebar** → wire categories + milestones
6. **SalesLog** → wire to `useProviderTransactions`

### Phase 3: Polish & Error Handling (Day 4)
1. Add loading states (preserve existing animation patterns)
2. Add error boundaries and retry logic
3. Add date range picker (default: MTD, options: QTD, YTD, Custom)
4. Add provider selector dropdown (if multi-provider view needed)

---

## 6. Critical Implementation Notes

### 6.1 Provider Code Handling
**Important**: Provider codes are **4-digit zero-padded strings** (e.g., `"0128"` for Kimberly-Clark). The DAG explicitly preserves leading zeros. Always treat as strings in JavaScript to avoid `"0128"` becoming `128`.

### 6.2 Date Timezone Handling
- DAG uses `America/Mexico_City` timezone
- Supabase stores dates as `DATE` (timezone-agnostic)
- UI should display in local Mexico City time for consistency

### 6.3 Pagination Requirement
Any query to `provider_sales_daily` must handle >1000 rows. Use Supabase's `range()` or implement cursor-based pagination for the SalesLog component.

### 6.4 Channel Naming
- Database stores: `distribucion`, `autoservicio`
- UI should display: "Almacén Distribución", "Autoservicio / Tiendas"

### 6.5 Category Name Decoding
Some categories may have special characters (e.g., `PA¥ALES` → `PAÑALES`). Apply display normalization in UI layer.

---

## 7. Testing Checklist

| Test | Method | Expected Result |
|------|--------|-----------------|
| Unit conversion accuracy | Compare `units_pieces / units` for distribucion records | Average ~10.4 pieces/box |
| Revenue totals match | Sum daily = summary YTD | Within $0.01 rounding |
| Category display | Check sidebar category names | No empty strings, Spanish labels |
| Date continuity | Query for gaps in daily data | Weekends = autoservicio only, weekdays = both |
| Provider switch | Change provider code in UI | Data refreshes, zeros don't get stripped |
| Real-time update | Trigger new DAG run, refresh UI | New data appears within 5 minutes |
| Mobile responsiveness | Resize viewport | Sidebar collapses, charts responsive |

---

## 8. File Locations (Quick Reference)

### DAG & Data Layer
| File | Path | Purpose |
|------|------|---------|
| DAG | `report generator/dags/provider_performance_daily_etl.py` | Airflow DAG (1183 lines, 8 tasks) |
| Schema migration | `leaderboard/supabase/migrations/20260323211500_add_unit_conversion_columns.sql` | Unit conversion columns |

### UI Layer (Leaderboard)
| File | Path | Purpose |
|------|------|---------|
| Entry point | `leaderboard/components/provider-performance/index.tsx` | Main dashboard page component |
| Header | `leaderboard/components/provider-performance/header.tsx` | Title, provider selector |
| Total Revenue | `leaderboard/components/provider-performance/total-revenue.tsx` | Big number display |
| Metric Cards | `leaderboard/components/provider-performance/metric-cards.tsx` | 7-stat grid |
| Sales Chart | `leaderboard/components/provider-performance/sales-chart.tsx` | Time series chart |
| Channel Grid | `leaderboard/components/provider-performance/channel-grid.tsx` | Channel comparison cards |
| Sidebar | `leaderboard/components/provider-performance/provider-sidebar.tsx` | Categories, milestones, matrix |
| Sales Log | `leaderboard/components/provider-performance/sales-log.tsx` | Transaction feed |
| Category Panel | `leaderboard/components/provider-performance/category-detail-panel.tsx` | Drill-down drawer |

### Integration Point
| File | Path | Purpose |
|------|------|---------|
| Main page | `leaderboard/app/page.tsx` | Active section router, line 31 imports ProviderPerformancePage |

---

## 9. Decision Log (For Future Reference)

| Date | Decision | Context |
|------|----------|---------|
| 2026-03-23 | Unit normalization approach | Chose Option A+C: normalize to pieces AND retain original unit_type for transparency |
| 2026-03-23 | KDII.C13 handling | Use `ABS(C13)` with default `0→1` (negative values are data entry convention, not business logic) |
| 2026-03-23 | Backfill date derivation | Use `data_interval_end - 1 day` instead of `datetime.now()` for reproducible backfills |
| 2026-03-23 | Pagination strategy | Cursor-based via `limit/offset` in `update_summaries` to handle >1000 rows |
| 2026-03-23 | Category enrichment | Fetch `provider_products` from Supabase during `extract_autoservicio` (store servers lack category data) |

---

## 10. Next Steps for Claude Code (Sonnet)

When resuming this task:

1. **Start here**: Read this plan file completely
2. **Validate data**: Run the SQL queries in Section 3.2 to confirm data is current
3. **Check DAG status**: Run the validation commands in Section 3.1
4. **Begin wiring**: Start with `TotalRevenue` component as simplest integration test
5. **Work incrementally**: One component at a time, validate against hardcoded values
6. **Preserve design**: Keep existing animation/loading patterns from mock data version

**Success criteria**: All components display live data from Supabase with no hardcoded values remaining, loading states preserved, and error handling in place.

---

*Plan created: 2026-03-23*  
*DAG status: 80/80 backfill runs completed successfully*  
*Data status: 9,677 rows loaded for provider 0128 (Kimberly-Clark)*
