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
