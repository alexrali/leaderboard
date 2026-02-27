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
