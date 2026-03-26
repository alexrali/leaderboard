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

export interface ProviderCategoryVelocity {
  category_code: string
  category_name: string
  current_month_revenue: number
  prior_month_revenue: number
  velocity_pct: number | null
}

export interface ProviderYoYPoint {
  week_num: number
  weekLabel: string
  revenue_current: number
  revenue_prior: number
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
