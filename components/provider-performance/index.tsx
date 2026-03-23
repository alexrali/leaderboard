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

      {/* Main Dashboard Body */}
      <div>
        {/* Top Section: Main Zone + Sidebar */}
        <div className="flex flex-col lg:flex-row border-y border-stone-200/80">

          {/* LEFT: Main Content Zone */}
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

          {/* RIGHT: Sidebar Zone */}
          <div className="w-full lg:w-72 xl:w-80 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-stone-200/80 bg-stone-100/70">
            <ProviderSidebar categories={categories} summary={summaryMtd} />
          </div>
        </div>

        {/* Bottom: Sales Activity Log */}
        <SalesLog initialTransactions={transactions} />

        {/* Footer Stats Line */}
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
