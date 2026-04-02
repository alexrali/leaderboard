"use client"

import { DashboardHeader } from "@/components/provider-performance/header"
import { MetricCards } from "@/components/provider-performance/metric-cards"
import { SalesChart } from "@/components/provider-performance/sales-chart"
import { ProviderSidebar } from "@/components/provider-performance/provider-sidebar"
import { ChannelGrid } from "@/components/provider-performance/channel-grid"
import { SalesLog } from "@/components/provider-performance/sales-log"
import { HeroSection } from "@/components/provider-performance/hero-section"
import {
  useProviderSummary,
  useProviderDailySeries,
  useProviderChannels,
  useProviderCategories,
  useProviderTransactions,
  useProviderYoYSeries,
  useProviderCategoryVelocity,
} from "@/hooks/use-provider-queries"

export function ProviderPerformancePage() {
  const { data: summary, error: e1 } = useProviderSummary('mtd')
  const { data: annualSummary } = useProviderSummary('ytd')
  const { data: dailySeries } = useProviderDailySeries(90)
  const { data: channels } = useProviderChannels()
  const { data: categories } = useProviderCategories(5)
  const { data: transactions } = useProviderTransactions(50)
  const { data: yoySeries } = useProviderYoYSeries()
  const { data: velocity } = useProviderCategoryVelocity()

  return (
    <div className="bg-[#fafafa] overflow-hidden -mx-4 -my-8 md:-mx-6 lg:-mx-8 lg:-my-10">
      {e1 && (
        <div className="px-6 py-3 shadow-[rgba(239,68,68,0.3)_0px_0px_0px_1px] bg-red-50">
          <p className="text-xs text-destructive font-mono">Error cargando datos del proveedor. Intenta de nuevo.</p>
        </div>
      )}
      <DashboardHeader summary={annualSummary ?? summary} />

      {/* Main Dashboard Body */}
      <div>
        {/* Top Section: Main Zone + Sidebar */}
        <div className="flex flex-col lg:flex-row border-y border-[#ebebeb]">

          {/* LEFT: Main Content Zone */}
          <div className="flex-1 bg-background min-w-0">
            <HeroSection />
            <div className="px-6 pb-5">
              <MetricCards summary={summary} />
            </div>
            <div className="border-t border-[#ebebeb]/60 mx-6" />
            <div className="px-6 py-5">
              <SalesChart data={dailySeries} yoyData={yoySeries} />
            </div>
            <div className="border-t border-[#ebebeb]/60" />
            <ChannelGrid channels={channels} />
          </div>

          {/* RIGHT: Sidebar Zone */}
          <div className="w-full lg:w-72 xl:w-80 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-[#ebebeb] bg-[#fafafa]">
            <ProviderSidebar categories={categories} summary={summary} velocity={velocity} />
          </div>
        </div>

        {/* Bottom: Sales Activity Log */}
        <SalesLog initialTransactions={transactions} />

        {/* Footer Stats Line */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-[#ebebeb]/60">
          <p className="text-xs text-muted-foreground font-mono tabular-nums">
            {summary
              ? `— ${summary.total_orders.toLocaleString()} órdenes · $0 → $${Math.round(summary.total_revenue).toLocaleString()} · MTD`
              : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
