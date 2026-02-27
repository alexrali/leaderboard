import { supabase } from "./supabase"
import type { TeamMember, DayProgress } from "./leaderboard-data"
import type { MemberRangeSummary, MemberWeeklyTrendPoint, MembersRange } from "./supabase"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getISOWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// ─── Helpers: resolve latest available date ───────────────────────────────────

export async function getLatestDailyDate(): Promise<string> {
  const today = new Date().toISOString().split("T")[0]
  const { data } = await supabase
    .from("performance_daily")
    .select("date")
    .eq("date", today)
    .limit(1)
  if (data && data.length > 0) return today

  const { data: latest } = await supabase
    .from("performance_daily")
    .select("date")
    .order("date", { ascending: false })
    .limit(1)
  return latest?.[0]?.date ?? today
}

async function getLatestHourlyDate(): Promise<string> {
  const today = new Date().toISOString().split("T")[0]
  const { data } = await supabase
    .from("team_performance_hourly")
    .select("date")
    .eq("date", today)
    .limit(1)
  if (data && data.length > 0) return today

  const { data: latest } = await supabase
    .from("team_performance_hourly")
    .select("date")
    .order("date", { ascending: false })
    .limit(1)
  return latest?.[0]?.date ?? today
}

// ─── Today's Leaderboard (from performance_daily) ────────────────────────────

export async function getTodayLeaderboard(): Promise<TeamMember[]> {
  const date = await getLatestDailyDate()

  const [dailyResult, skuResult] = await Promise.all([
    supabase
      .from("performance_daily")
      .select(
        `
        worker_key,
        worker_name,
        total_ue,
        routes_completed,
        hours_worked,
        efficiency_score,
        daily_rank,
        hit_target,
        trend,
        trend_percentage,
        current_streak,
        total_quantity,
        total_weight_kg,
        total_volume_m3,
        workers (role, avatar_initials)
      `
      )
      .eq("date", date)
      .order("daily_rank", { ascending: true })
      .limit(50),

    supabase
      .from("worker_daily_sku_summary")
      .select("worker_key, folios_completed, distinct_skus")
      .eq("date", date),
  ])

  if (dailyResult.error) throw dailyResult.error
  if (!dailyResult.data || dailyResult.data.length === 0) return []

  const skuMap = new Map<string, { foliosCompleted: number; distinctSkus: number }>()
  if (skuResult.data) {
    for (const row of skuResult.data) {
      skuMap.set(row.worker_key, {
        foliosCompleted: Number(row.folios_completed ?? 0),
        distinctSkus: Number(row.distinct_skus ?? 0),
      })
    }
  }

  return dailyResult.data.map((row: any) => ({
    id: row.worker_key,
    name: row.worker_name,
    role: row.workers?.role ?? "Surtidor",
    avatar: row.workers?.avatar_initials ?? getInitials(row.worker_name),
    rank: Number(row.daily_rank ?? 0),
    score: parseFloat(row.total_ue ?? 0),
    streak: Number(row.current_streak ?? 0),
    tasksCompleted: Number(row.routes_completed ?? 0),
    tasksTotal: Number(row.routes_completed ?? 0),
    hoursLogged: parseFloat(row.hours_worked ?? 0),
    efficiency: Math.round(parseFloat(row.efficiency_score ?? 0)),
    trend: (row.trend as TeamMember["trend"]) ?? "stable",
    trendValue: Math.abs(parseFloat(row.trend_percentage ?? 0)),
    totalQuantity: parseFloat(row.total_quantity ?? 0),
    weightKg: parseFloat(row.total_weight_kg ?? 0),
    volumeM3: parseFloat(row.total_volume_m3 ?? 0),
    foliosCompleted: skuMap.get(row.worker_key)?.foliosCompleted ?? 0,
    distinctSkus: skuMap.get(row.worker_key)?.distinctSkus ?? 0,
  }))
}

// ─── Weekly Leaderboard (from performance_weekly) ────────────────────────────

export async function getWeeklyLeaderboard(): Promise<TeamMember[]> {
  const now = new Date()
  const currentWeek = getISOWeek(now)
  const currentYear = now.getFullYear()

  const [weeklyResult, skuResult] = await Promise.all([
    supabase
      .from("performance_weekly")
      .select(
        `
        worker_key,
        worker_name,
        total_ue,
        routes_completed,
        hours_worked,
        efficiency_score,
        weekly_rank,
        current_streak,
        trend,
        trend_percentage,
        total_quantity,
        total_weight_kg,
        total_volume_m3,
        workers (role, avatar_initials)
      `
      )
      .eq("year", currentYear)
      .eq("week_number", currentWeek)
      .order("weekly_rank", { ascending: true }),

    supabase
      .from("worker_weekly_sku_summary")
      .select("worker_key, folios_completed, distinct_skus")
      .eq("year", currentYear)
      .eq("week_number", currentWeek),
  ])

  if (weeklyResult.error) throw weeklyResult.error
  if (!weeklyResult.data || weeklyResult.data.length === 0) return []

  const skuMap = new Map<string, { foliosCompleted: number; distinctSkus: number }>()
  if (skuResult.data) {
    for (const row of skuResult.data) {
      skuMap.set(row.worker_key, {
        foliosCompleted: Number(row.folios_completed ?? 0),
        distinctSkus: Number(row.distinct_skus ?? 0),
      })
    }
  }

  return weeklyResult.data.map((row: any) => ({
    id: row.worker_key,
    name: row.worker_name,
    role: row.workers?.role ?? "Surtidor",
    avatar: row.workers?.avatar_initials ?? getInitials(row.worker_name),
    rank: Number(row.weekly_rank ?? 0),
    score: parseFloat(row.total_ue ?? 0),
    streak: Number(row.current_streak ?? 0),
    tasksCompleted: Number(row.routes_completed ?? 0),
    tasksTotal: Number(row.routes_completed ?? 0),
    hoursLogged: parseFloat(row.hours_worked ?? 0),
    efficiency: Math.round(parseFloat(row.efficiency_score ?? 0)),
    trend: (row.trend as TeamMember["trend"]) ?? "stable",
    trendValue: Math.abs(parseFloat(row.trend_percentage ?? 0)),
    totalQuantity: parseFloat(row.total_quantity ?? 0),
    weightKg: parseFloat(row.total_weight_kg ?? 0),
    volumeM3: parseFloat(row.total_volume_m3 ?? 0),
    foliosCompleted: skuMap.get(row.worker_key)?.foliosCompleted ?? 0,
    distinctSkus: skuMap.get(row.worker_key)?.distinctSkus ?? 0,
  }))
}

// ─── Weekly Team Summary (current + previous week) ───────────────────────────

export type WeeklyTeamSummary = {
  currentWeek: number
  currentYear: number
  teamTotalUE: number
  activeWorkers: number
  totalRoutes: number
  totalFolios: number
  totalSkus: number
  totalWeightKg: number
  totalVolumeM3: number
  avgUEPerWorker: number
  avgEfficiency: number
  prevTeamTotalUE: number
  prevAvgUEPerWorker: number
  prevAvgEfficiency: number
  prevActiveWorkers: number
}

export async function getWeeklyTeamSummary(): Promise<WeeklyTeamSummary | null> {
  const now = new Date()
  const currentWeek = getISOWeek(now)
  const currentYear = now.getFullYear()
  const prevWeek = currentWeek > 1 ? currentWeek - 1 : 52
  const prevYear = currentWeek > 1 ? currentYear : currentYear - 1

  const [teamResult, skuResult, prevResult, workerResult, prevWorkerResult] = await Promise.all([
    supabase
      .from("team_performance_weekly")
      .select("team_total_ue, active_workers, total_routes_completed, avg_ue_per_worker")
      .eq("year", currentYear)
      .eq("week_number", currentWeek)
      .single(),

    supabase
      .from("worker_weekly_sku_summary")
      .select("folios_completed, distinct_skus")
      .eq("year", currentYear)
      .eq("week_number", currentWeek),

    supabase
      .from("team_performance_weekly")
      .select("team_total_ue, avg_ue_per_worker, active_workers")
      .eq("year", prevYear)
      .eq("week_number", prevWeek)
      .single(),

    supabase
      .from("performance_weekly")
      .select("efficiency_score, total_weight_kg, total_volume_m3")
      .eq("year", currentYear)
      .eq("week_number", currentWeek),

    supabase
      .from("performance_weekly")
      .select("efficiency_score")
      .eq("year", prevYear)
      .eq("week_number", prevWeek),
  ])

  if (!teamResult.data) return null

  const skus = skuResult.data ?? []
  const totalFolios = skus.reduce((s, r) => s + Number(r.folios_completed ?? 0), 0)
  const totalSkus = skus.reduce((s, r) => s + Number(r.distinct_skus ?? 0), 0)

  const workers = workerResult.data ?? []
  const efficiencies = workers.map((r) => Number(r.efficiency_score ?? 0))
  const avgEfficiency =
    efficiencies.length > 0
      ? Math.round(efficiencies.reduce((s, v) => s + v, 0) / efficiencies.length)
      : 0
  // Use performance_weekly as single source for weight/volume (same table as member rows)
  const totalWeightKg = workers.reduce((s, r) => s + parseFloat(r.total_weight_kg ?? 0), 0)
  const totalVolumeM3 = workers.reduce((s, r) => s + parseFloat(r.total_volume_m3 ?? 0), 0)

  const prevEfficiencies = (prevWorkerResult.data ?? []).map((r) => Number(r.efficiency_score ?? 0))
  const prevAvgEfficiency =
    prevEfficiencies.length > 0
      ? Math.round(prevEfficiencies.reduce((s, v) => s + v, 0) / prevEfficiencies.length)
      : 0

  return {
    currentWeek,
    currentYear,
    teamTotalUE: parseFloat(teamResult.data.team_total_ue ?? 0),
    activeWorkers: Number(teamResult.data.active_workers ?? 0),
    totalRoutes: Number(teamResult.data.total_routes_completed ?? 0),
    totalFolios,
    totalSkus,
    totalWeightKg,
    totalVolumeM3,
    avgUEPerWorker: parseFloat(teamResult.data.avg_ue_per_worker ?? 0),
    avgEfficiency,
    prevTeamTotalUE: parseFloat(prevResult.data?.team_total_ue ?? 0),
    prevAvgUEPerWorker: parseFloat(prevResult.data?.avg_ue_per_worker ?? 0),
    prevAvgEfficiency,
    prevActiveWorkers: Number(prevResult.data?.active_workers ?? 0),
  }
}

// ─── Daily UE trend for current week (for bar chart) ─────────────────────────

export type DailyTrend = {
  date: string
  label: string
  teamUE: number
  activeWorkers: number
}

export async function getWeekDailyTrend(): Promise<DailyTrend[]> {
  const now = new Date()
  const currentWeek = getISOWeek(now)
  const currentYear = now.getFullYear()

  const { data, error } = await supabase
    .from("team_performance_daily")
    .select("date, team_total_ue, active_workers")
    .eq("year", currentYear)
    .eq("week_number", currentWeek)
    .order("date", { ascending: true })

  if (error || !data) return []

  const dayLabels: Record<number, string> = {
    1: "Lun",
    2: "Mar",
    3: "Mié",
    4: "Jue",
    5: "Vie",
    6: "Sáb",
    0: "Dom",
  }

  return data.map((row: any) => {
    const d = new Date(row.date + "T12:00:00")
    return {
      date: row.date,
      label: dayLabels[d.getDay()] ?? row.date,
      teamUE: parseFloat(row.team_total_ue ?? 0),
      activeWorkers: Number(row.active_workers ?? 0),
    }
  })
}

// ─── Worker Folio-SKU Detail (for detail sheet) ─────────────────────────────

export type FolioDetail = {
  date: string
  hourBucket: string
  folio: string
  itemCode: string
  quantity: number
  totalWeight: number
  totalVolume: number
  ue: number
}

export async function getWorkerFolioDetail(
  workerKey: string,
  mode: "daily" | "weekly"
): Promise<FolioDetail[]> {
  const PAGE_SIZE = 1000
  const allRows: any[] = []
  let offset = 0

  // Resolve filters once before pagination loop
  let dateFilter: string | null = null
  let weekFilter: { year: number; week: number } | null = null

  if (mode === "daily") {
    dateFilter = await getLatestDailyDate()
  } else {
    const now = new Date()
    weekFilter = { year: now.getFullYear(), week: getISOWeek(now) }
  }

  // Paginate to fetch ALL rows (Supabase default limit is 1000)
  while (true) {
    let query = supabase
      .from("performance_folio_sku")
      .select("date, hour_bucket, folio, item_code, quantity, total_weight, total_volume, ue")
      .eq("worker_key", workerKey)
      .order("hour_bucket", { ascending: true })
      .order("folio", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (dateFilter) {
      query = query.eq("date", dateFilter)
    } else if (weekFilter) {
      query = query.eq("year", weekFilter.year).eq("week_number", weekFilter.week)
    }

    const { data, error } = await query
    if (error) throw error
    if (!data || data.length === 0) break

    allRows.push(...data)
    if (data.length < PAGE_SIZE) break // last page
    offset += PAGE_SIZE
  }

  return allRows.map((row: any) => ({
    date: row.date,
    hourBucket: row.hour_bucket,
    folio: row.folio,
    itemCode: row.item_code,
    quantity: parseFloat(row.quantity ?? 0),
    totalWeight: parseFloat(row.total_weight ?? 0),
    totalVolume: parseFloat(row.total_volume ?? 0),
    ue: parseFloat(row.ue ?? 0),
  }))
}

// ─── Hourly Team Progress (from team_performance_hourly) ─────────────────────

export async function getTodayHourlyProgress(): Promise<DayProgress[]> {
  const date = await getLatestHourlyDate()

  const { data, error } = await supabase
    .from("team_performance_hourly")
    .select("hour_bucket, total_routes_completed, active_workers, team_total_ue")
    .eq("date", date)
    .order("hour_bucket", { ascending: true })

  if (error) throw error
  if (!data || data.length === 0) return []

  return data.map((row: any) => ({
    hour: new Date(row.hour_bucket).toLocaleTimeString("es-MX", {
      hour: "numeric",
      hour12: true,
    }),
    completed: Number(row.total_routes_completed ?? 0),
    target: 0, // no configured target in DB — never use synthetic values
    teamUE: parseFloat(row.team_total_ue ?? 0),
    activeWorkers: Number(row.active_workers ?? 0),
  }))
}

// ─── Team Summary for today ───────────────────────────────────────────────────

export type TeamSummary = {
  teamTotalUE: number
  activeWorkers: number
  totalRoutes: number
  avgUEPerWorker: number
}

export async function getTodayTeamSummary(): Promise<TeamSummary | null> {
  const date = await getLatestDailyDate()

  const { data, error } = await supabase
    .from("team_performance_daily")
    .select("team_total_ue, active_workers, total_routes_completed, avg_ue_per_worker")
    .eq("date", date)
    .single()

  if (error || !data) return null

  return {
    teamTotalUE: parseFloat(data.team_total_ue ?? 0),
    activeWorkers: Number(data.active_workers ?? 0),
    totalRoutes: Number(data.total_routes_completed ?? 0),
    avgUEPerWorker: parseFloat(data.avg_ue_per_worker ?? 0),
  }
}

// ─── Panel: KPI types ────────────────────────────────────────────────────────

export type PanelKPIs = {
  teamTotalUE: number
  activeWorkers: number
  totalFolios: number
  teamStreak: number // consecutive days where majority of workers hit target (capped at last 30 days)
}

export type TeamDayCell = {
  date: string
  teamUE: number
  activeWorkers: number
  totalRoutes: number
  efficiencyScore: number | null
}

export type TeamDayDetail = {
  date: string
  teamUE: number
  activeWorkers: number
  totalRoutes: number
  totalFolios: number
  totalSkus: number
  totalWeightKg: number
  totalVolumeM3: number
  hourly: Array<{ hour: string; teamUE: number; activeWorkers: number }>
}

export async function getPanelKPIs(): Promise<PanelKPIs> {
  const date = await getLatestDailyDate()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sinceStr = thirtyDaysAgo.toISOString().split("T")[0]

  const [teamRow, skuRow, streakRows] = await Promise.all([
    supabase
      .from("team_performance_daily")
      .select("team_total_ue, active_workers")
      .eq("date", date)
      .single(),

    supabase
      .from("worker_daily_sku_summary")
      .select("folios_completed")
      .eq("date", date),

    supabase
      .from("performance_daily")
      .select("date, hit_target")
      .gte("date", sinceStr)
      .order("date", { ascending: false }),
  ])

  // Compute team streak: consecutive days where majority of workers hit target
  let streak = 0
  if (streakRows.data && streakRows.data.length > 0) {
    const byDate = new Map<string, { hits: number; total: number }>()
    for (const row of streakRows.data) {
      const entry = byDate.get(row.date) ?? { hits: 0, total: 0 }
      entry.total += 1
      if (row.hit_target) entry.hits += 1
      byDate.set(row.date, entry)
    }
    const sortedDates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a))
    for (const d of sortedDates) {
      const { hits, total } = byDate.get(d)!
      if (total > 0 && hits / total >= 0.5) {
        streak += 1
      } else {
        break
      }
    }
  }

  const totalFolios = (skuRow.data ?? []).reduce(
    (s, r) => s + Number(r.folios_completed ?? 0),
    0
  )

  return {
    teamTotalUE: parseFloat(teamRow.data?.team_total_ue ?? 0),
    activeWorkers: Number(teamRow.data?.active_workers ?? 0),
    totalFolios,
    teamStreak: streak,
  }
}

export async function getTeamDailyHistory(days = 60): Promise<TeamDayCell[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("team_performance_daily")
    .select("date, team_total_ue, active_workers, total_routes_completed, team_efficiency_score")
    .gte("date", sinceStr)
    .order("date", { ascending: true })

  if (error || !data) return []

  return data.map((row: any) => ({
    date: row.date,
    teamUE: parseFloat(row.team_total_ue ?? 0),
    activeWorkers: Number(row.active_workers ?? 0),
    totalRoutes: Number(row.total_routes_completed ?? 0),
    efficiencyScore: row.team_efficiency_score != null ? Number(row.team_efficiency_score) : null,
  }))
}

export async function getTeamDayDetail(date: string): Promise<TeamDayDetail | null> {
  const [dailyRow, skuRows, workerRows, hourlyRows] = await Promise.all([
    supabase
      .from("team_performance_daily")
      .select("team_total_ue, active_workers, total_routes_completed")
      .eq("date", date)
      .single(),

    supabase
      .from("worker_daily_sku_summary")
      .select("folios_completed, distinct_skus")
      .eq("date", date),

    supabase
      .from("performance_daily")
      .select("total_weight_kg, total_volume_m3")
      .eq("date", date),

    supabase
      .from("team_performance_hourly")
      .select("hour_bucket, team_total_ue, active_workers")
      .eq("date", date)
      .order("hour_bucket", { ascending: true }),
  ])

  if (!dailyRow.data) return null

  const totalFolios = (skuRows.data ?? []).reduce(
    (s, r) => s + Number(r.folios_completed ?? 0),
    0
  )
  const totalSkus = (skuRows.data ?? []).reduce(
    (s, r) => s + Number(r.distinct_skus ?? 0),
    0
  )
  const totalWeightKg = (workerRows.data ?? []).reduce(
    (s, r) => s + parseFloat(r.total_weight_kg ?? 0),
    0
  )
  const totalVolumeM3 = (workerRows.data ?? []).reduce(
    (s, r) => s + parseFloat(r.total_volume_m3 ?? 0),
    0
  )

  const hourly = (hourlyRows.data ?? []).map((row: any) => ({
    hour: new Date(row.hour_bucket).toLocaleTimeString("es-MX", {
      hour: "numeric",
      hour12: true,
    }),
    teamUE: parseFloat(row.team_total_ue ?? 0),
    activeWorkers: Number(row.active_workers ?? 0),
  }))

  return {
    date,
    teamUE: parseFloat(dailyRow.data.team_total_ue ?? 0),
    activeWorkers: Number(dailyRow.data.active_workers ?? 0),
    totalRoutes: Number(dailyRow.data.total_routes_completed ?? 0),
    totalFolios,
    totalSkus,
    totalWeightKg,
    totalVolumeM3,
    hourly,
  }
}

// ─── Helpers: week range ──────────────────────────────────────────────────────

function getWeekRangeStartDate(range: MembersRange): string {
  const now = new Date()
  const weeksBack = range === "week" ? 0 : range === "2weeks" ? 1 : 3
  const d = new Date(now)
  d.setDate(d.getDate() - weeksBack * 7)
  // Return Monday of that week
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d.toISOString().split("T")[0]
}

// ─── Members Range Summary ────────────────────────────────────────────────────

export async function getMembersRangeSummary(
  range: MembersRange
): Promise<MemberRangeSummary[]> {
  const startDate = getWeekRangeStartDate(range)

  const [weeklyResult, dailyResult] = await Promise.all([
    supabase
      .from("performance_weekly")
      .select(
        `
        worker_key,
        worker_name,
        total_ue,
        hours_worked,
        routes_completed,
        days_worked,
        avg_ue_per_hour,
        efficiency_score,
        weekly_rank,
        current_streak,
        trend,
        trend_percentage,
        week_start_date,
        workers (avatar_initials)
        `
      )
      .gte("week_start_date", startDate)
      .order("worker_key"),

    supabase
      .from("performance_daily")
      .select("worker_key, hit_target")
      .gte("date", startDate),
  ])

  if (weeklyResult.error) throw weeklyResult.error
  if (!weeklyResult.data || weeklyResult.data.length === 0) return []

  // Group weekly rows by worker
  type WeeklyRow = (typeof weeklyResult.data)[number]
  const byWorker = new Map<string, WeeklyRow[]>()
  for (const row of weeklyResult.data) {
    if (!byWorker.has(row.worker_key)) byWorker.set(row.worker_key, [])
    byWorker.get(row.worker_key)!.push(row)
  }

  // hit_target per worker
  const hitMap = new Map<string, { total: number; hit: number }>()
  if (dailyResult.data) {
    for (const row of dailyResult.data) {
      if (!hitMap.has(row.worker_key)) hitMap.set(row.worker_key, { total: 0, hit: 0 })
      const entry = hitMap.get(row.worker_key)!
      entry.total++
      if (row.hit_target) entry.hit++
    }
  }

  return Array.from(byWorker.entries()).map(([worker_key, rows]) => {
    const latest = rows.reduce((a, b) =>
      a.week_start_date > b.week_start_date ? a : b
    )
    const totalUE = rows.reduce((s, r) => s + parseFloat(r.total_ue ?? 0), 0)
    const totalHours = rows.reduce((s, r) => s + parseFloat(r.hours_worked ?? 0), 0)
    const totalRoutes = rows.reduce((s, r) => s + Number(r.routes_completed ?? 0), 0)
    const totalDays = rows.reduce((s, r) => s + Number(r.days_worked ?? 0), 0)
    const avgUePerHour = totalHours > 0 ? totalUE / totalHours : 0
    const avgEfficiency =
      rows.reduce((s, r) => s + Number(r.efficiency_score ?? 0), 0) / rows.length
    const avgRank =
      rows.reduce((s, r) => s + Number(r.weekly_rank ?? 0), 0) / rows.length
    const hitEntry = hitMap.get(worker_key)
    const hitPct = hitEntry && hitEntry.total > 0
      ? Math.round((hitEntry.hit / hitEntry.total) * 100)
      : 0

    return {
      worker_key,
      worker_name: latest.worker_name,
      avatar_initials: (latest.workers as Array<{ avatar_initials: string | null }> | null)?.[0]?.avatar_initials ?? null,
      total_ue: parseFloat(totalUE.toFixed(1)),
      total_hours: parseFloat(totalHours.toFixed(1)),
      total_routes: totalRoutes,
      days_worked: totalDays,
      avg_ue_per_hour: parseFloat(avgUePerHour.toFixed(2)),
      avg_efficiency_score: parseFloat(avgEfficiency.toFixed(1)),
      avg_weekly_rank: parseFloat(avgRank.toFixed(1)),
      current_streak: Number(latest.current_streak ?? 0),
      hit_target_pct: hitPct,
      trend: (latest.trend as "up" | "down" | "stable") ?? "stable",
      trend_pct: parseFloat(latest.trend_percentage ?? 0),
    }
  })
}

export async function getMembersWeeklyTrend(weeks: number): Promise<MemberWeeklyTrendPoint[]> {
  const startDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() - (weeks - 1) * 7)
    const day = d.getDay() || 7
    d.setDate(d.getDate() - day + 1)
    return d.toISOString().split("T")[0]
  })()

  const { data, error } = await supabase
    .from("performance_weekly")
    .select("worker_key, worker_name, week_number, year, week_start_date, total_ue")
    .gte("week_start_date", startDate)
    .order("week_start_date", { ascending: true })

  if (error) throw error
  return (data ?? []).map((r) => ({
    worker_key: r.worker_key,
    worker_name: r.worker_name,
    week_number: Number(r.week_number),
    year: Number(r.year),
    week_start_date: r.week_start_date,
    total_ue: parseFloat(r.total_ue ?? 0),
  }))
}
