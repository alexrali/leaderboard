"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
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
  useProviderYoYSeries,
  useProviderCategoryVelocity,
} from "@/hooks/use-provider-queries"

type Period = 'mtd' | 'qtd' | 'ytd'

function PeriodToggle({ value, onChange }: { value: Period; onChange: (v: Period) => void }) {
  const options: { value: Period; label: string }[] = [
    { value: 'mtd', label: 'Mes' },
    { value: 'qtd', label: 'Trim' },
    { value: 'ytd', label: 'Año' },
  ]
  return (
    <div className="flex border border-stone-200/80 divide-x divide-stone-200/80">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.14em] transition-colors duration-150",
            value === o.value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-muted-foreground bg-transparent"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ProviderPerformancePage() {
  const [period, setPeriod] = useState<Period>('mtd')

  const { data: summary, isLoading: l1, error: e1 } = useProviderSummary(period)
  const { data: annualSummaryData } = useProviderSummary('ytd')
  const annualSummary = period === 'ytd' ? summary : annualSummaryData
  const { data: dailySeries, isLoading: l2, error: e2 } = useProviderDailySeries(90)
  const { data: channels, isLoading: l3, error: e3 } = useProviderChannels()
  const { data: categories, isLoading: l4, error: e4 } = useProviderCategories(5)
  const { data: transactions, isLoading: l5, error: e5 } = useProviderTransactions(50)
  const { data: yoySeries } = useProviderYoYSeries()
  const { data: velocity } = useProviderCategoryVelocity()

  const isLoading = l1 || l2 || l3 || l4 || l5
  const hasError = [e1, e2, e3, e4, e5].some(Boolean)

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

  if (hasError) {
    return (
      <div className="bg-stone-50 overflow-hidden -mx-4 -my-8 md:-mx-6 lg:-mx-8 lg:-my-10 flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="flex flex-col gap-2">
          <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">ERR_LOAD_FAILED</p>
          <p className="text-sm font-mono text-foreground">Error cargando datos del proveedor.</p>
          <p className="text-xs text-muted-foreground font-mono">Intenta de nuevo en unos minutos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-stone-50 overflow-hidden -mx-4 -my-8 md:-mx-6 lg:-mx-8 lg:-my-10">
      <DashboardHeader summary={annualSummary ?? summary} />

      {/* Main Dashboard Body */}
      <div>
        {/* Top Section: Main Zone + Sidebar */}
        <div className="flex flex-col lg:flex-row border-y border-stone-200/80">

          {/* LEFT: Main Content Zone */}
          <div className="flex-1 bg-background min-w-0">
            <div className="px-6 pt-6 pb-5">
              <div className="flex items-start justify-between">
                <TotalRevenue summary={summary} />
                <PeriodToggle value={period} onChange={setPeriod} />
              </div>
            </div>
            <div className="px-6 pb-5">
              <MetricCards summary={summary} />
            </div>
            <div className="border-t border-stone-200/60 mx-6" />
            <div className="px-6 py-5">
              <SalesChart data={dailySeries} yoyData={yoySeries} />
            </div>
            <div className="border-t border-stone-200/60" />
            <ChannelGrid channels={channels} />
          </div>

          {/* RIGHT: Sidebar Zone */}
          <div className="w-full lg:w-72 xl:w-80 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-stone-200/80 bg-stone-100/70">
            <ProviderSidebar categories={categories} summary={summary} velocity={velocity} />
          </div>
        </div>

        {/* Bottom: Sales Activity Log */}
        <SalesLog initialTransactions={transactions} />

        {/* Footer Stats Line */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-stone-200/60">
          <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
            {summary
              ? `— ${summary.total_orders.toLocaleString()} órdenes · $0 → $${Math.round(summary.total_revenue).toLocaleString()} · ${period.toUpperCase()}`
              : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
