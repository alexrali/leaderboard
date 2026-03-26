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
  ProviderYoYPoint,
  ProviderCategoryVelocity,
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

// getProviderDailySeries — uses RPC instead of fetching 10K rows client-side
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

// getProviderChannels — uses RPC instead of fetching 2.5K rows client-side
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

// getProviderCategories — uses RPC instead of fetching 52K rows client-side
export async function getProviderCategories(limit = 5): Promise<ProviderCategory[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_provider_categories', {
    p_provider_code: PROVIDER_CODE,
    p_year: new Date().getFullYear(),
    p_limit: limit,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: any) => ({
    category_code: row.category_code,
    category_name: normalizeName(row.category_name ?? ''),
    revenue: Number(row.revenue),
    units: Number(row.units_pieces),
    orders: Number(row.orders),
    share: Number(row.share),
  }))
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

// getCategoryDetail — uses RPC instead of fetching 21K rows client-side
export async function getCategoryDetail(categoryCode: string): Promise<CategoryDetail | null> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_provider_category_detail', {
    p_provider_code: PROVIDER_CODE,
    p_category_code: categoryCode,
  })
  if (error) throw new Error(error.message)
  return data as CategoryDetail
}

// getProviderCategoryVelocity — month-over-month velocity per category
export async function getProviderCategoryVelocity(): Promise<ProviderCategoryVelocity[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_provider_category_velocity', {
    p_provider_code: PROVIDER_CODE,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: any) => ({
    category_code: row.category_code,
    category_name: normalizeName(row.category_name ?? ''),
    current_month_revenue: Number(row.current_month_revenue),
    prior_month_revenue: Number(row.prior_month_revenue),
    velocity_pct: row.velocity_pct != null ? Number(row.velocity_pct) : null,
  }))
}

// getProviderYoYSeries — year-over-year weekly comparison
export async function getProviderYoYSeries(): Promise<ProviderYoYPoint[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_provider_yoy_series', {
    p_provider_code: PROVIDER_CODE,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: any) => ({
    week_num: Number(row.week_num),
    weekLabel: `Sem ${row.week_num}`,
    revenue_current: Number(row.revenue_current),
    revenue_prior: Number(row.revenue_prior),
  }))
}
