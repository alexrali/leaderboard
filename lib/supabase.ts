import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Master Data ─────────────────────────────────────────────────────────────

export type Worker = {
  worker_key: string
  worker_name: string
  avatar_initials: string | null
  role: string | null
  is_active: boolean
}

// ─── Fact Tables ──────────────────────────────────────────────────────────────

export type PerformanceHourly = {
  id: number
  worker_key: string
  worker_name: string
  hour_bucket: string
  date: string
  week_number: number
  year: number
  total_ue: number
  routes_completed: number
  items_processed: number
  total_quantity: number
  total_weight_kg: number
  total_volume_m3: number
  transactions: number
  ue_per_hour: number | null
  created_at: string
}

export type PerformanceDaily = {
  id: number
  worker_key: string
  worker_name: string
  date: string
  week_number: number
  year: number
  total_ue: number
  routes_completed: number
  items_processed: number
  total_quantity: number
  total_weight_kg: number
  total_volume_m3: number
  hours_worked: number
  ue_per_hour: number | null
  ue_per_route: number | null
  efficiency_score: number | null
  daily_rank: number | null
  hit_target: boolean
  created_at: string
  updated_at: string
}

export type PerformanceWeekly = {
  id: number
  worker_key: string
  worker_name: string
  week_number: number
  year: number
  week_start_date: string
  week_end_date: string
  total_ue: number
  routes_completed: number
  items_processed: number
  total_quantity: number
  total_weight_kg: number
  total_volume_m3: number
  hours_worked: number
  days_worked: number
  avg_ue_per_day: number | null
  avg_ue_per_hour: number | null
  efficiency_score: number | null
  weekly_rank: number | null
  current_streak: number
  trend: "up" | "down" | "stable" | null
  trend_percentage: number | null
  created_at: string
  updated_at: string
}

// ─── Team Tables ──────────────────────────────────────────────────────────────

export type TeamPerformanceHourly = {
  id: number
  hour_bucket: string
  date: string
  team_total_ue: number
  active_workers: number
  total_routes_completed: number
  total_items_processed: number
  avg_ue_per_worker: number | null
  avg_routes_per_worker: number | null
  created_at: string
}

export type TeamPerformanceDaily = {
  id: number
  date: string
  week_number: number
  year: number
  team_total_ue: number
  active_workers: number
  total_routes_completed: number
  total_items_processed: number
  total_hours_worked: number
  avg_ue_per_worker: number | null
  avg_ue_per_hour: number | null
  team_efficiency_score: number | null
  created_at: string
  updated_at: string
}

// ─── Leaderboard Table ────────────────────────────────────────────────────────

export type LeaderboardEntry = {
  id: number
  leaderboard_type: "daily_ue" | "weekly_ue" | "efficiency" | "volume" | "routes"
  period_type: "day" | "week"
  period_date: string
  worker_key: string
  worker_name: string
  rank: number
  score: number
  metric_value: number | null
  created_at: string
}

// ─── Members Range Summary (computed by getMembersRangeSummary) ───────────────

export type MemberRangeSummary = {
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
  hit_target_pct: number // 0–100
  trend: "up" | "down" | "stable"
  trend_pct: number
}

export type MemberWeeklyTrendPoint = {
  worker_key: string
  worker_name: string
  week_number: number
  year: number
  week_start_date: string
  total_ue: number
}

export type MembersRange = "week" | "2weeks" | "month"

// ─── SRI: Sales Rep Intelligence Types ─────────────────────────────────────

export type SriAgent = {
  agent_id: string
  name: string | null
  peer_group: number | null
  active: boolean
  created_at: string
  updated_at: string
}

export type SriClient = {
  client_id: string
  segment_label: "Alto" | "Medio" | "Bajo" | null
  activity_status: "Active" | "At-risk" | "Dormant" | null
  rfm_score: unknown // JSON stored, type as unknown for now
  created_at: string
  updated_at: string
}

export type SriProduct = {
  clave: string
  description: string
  category: string
  provider: string
  abc_class: "A" | "B" | "C"
  xyz_class: "X" | "Y" | "Z"
  created_at: string
  updated_at: string
}

export type SriCategory = {
  category_id: string
  category_name: string
  created_at: string
}

export type SriAgentMonthly = {
  agent_id: string
  month: string // YYYY-MM format
  total_revenue: number
  total_units: number
  invoice_count: number
  total_cost: number
  total_profit: number
  avg_order_value: number
  revenue_growth_mom: number
  abc_a_revenue_share: number
  active_client_count: number
  new_client_count: number
  client_retention_rate: number
  avg_purchase_frequency: number
  portfolio_concentration_top3: number
  pct_active: number
  pct_at_risk: number
  pct_dormant: number
  avg_cpi: number
  cross_sell_rate: number
  product_intro_rate: number
  avg_reorder_rate: number
  category_breadth: number
  avg_sku_depth_per_category: number
  avg_client_revenue: number
  segment_entropy: number
  peer_group: number
  peer_pct_total_revenue: number
  peer_pct_avg_cpi: number
  peer_pct_client_retention_rate: number
  peer_pct_avg_reorder_rate: number
  created_at: string
  updated_at: string
}

export type SriAgentClientMonthly = {
  agent_id: string
  client_id: string
  month: string
  revenue: number
  units: number
  cost: number
  profit: number
  margin_pct: number
  invoice_count: number
  unique_skus: number
  unique_categories: number
  created_at: string
  updated_at: string
}

export type SriClientHealth = {
  client_id: string
  month: string
  recency_days: number
  frequency: number
  monetary: number
  invoice_count: number
  unique_skus: number
  unique_categories: number
  cats_purchased: number
  cpi: number
  activity_status: "Active" | "At-risk" | "Dormant"
  rfm_segment: "Alto" | "Medio" | "Bajo" | "Perdido"
  reorder_rate: number
  last_purchase_date: string
  created_at: string
  updated_at: string
}

export type SriAgentPerformanceIndex = {
  agent_id: string
  month: string
  api_score: number
  score_revenue: number
  score_portfolio: number
  score_cpi: number
  score_quality: number
  weight_revenue: number
  weight_portfolio: number
  weight_cpi: number
  weight_quality: number
  peer_group: number
  created_at: string
  updated_at: string
}

// ─── SRI: Derived types for UI ──────────────────────────────────────────────────

export type AgentWithApiScore = SriAgentMonthly & {
  agent_name: string // Joined from agents or derived
  api_score: number // Joined from performance_index
  peer_group_label: string // Mapped from peer_group number
}

export type ClientWithHealth = SriClient & {
  recency_days: number
  last_purchase_date: string
  rfm_segment: string
  reorder_rate: number
}

export type SignalType = "alto" | "medio" | "positivo"

export type AgentSignal = {
  agent_id: string
  level: SignalType
  type: string
  message: string
  metric_value: number | null
}

export type AgentRankingRow = AgentWithApiScore & {
  rank: number
  trend: "up" | "down" | "stable"
}

// ─── SRI: Chart Data Types ─────────────────────────────────────────────────────

export type CategoryTrendData = {
  category: string
  revenue: number
  change: number // percentage change vs previous month
}

export type WeeklyTrendData = {
  week: string
  api_score: number
  revenue: number
}

export type ClientHealthDistribution = {
  status: "Active" | "At-risk" | "Dormant"
  count: number
  percentage: number
  color: string
}
