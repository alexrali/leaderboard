"use client"

import { DashboardHeader } from "@/components/provider-performance/header"
import { TotalRevenue } from "@/components/provider-performance/total-revenue"
import { MetricCards } from "@/components/provider-performance/metric-cards"
import { SalesChart } from "@/components/provider-performance/sales-chart"
import { ProviderSidebar } from "@/components/provider-performance/provider-sidebar"
import { ChannelGrid } from "@/components/provider-performance/channel-grid"
import { SalesLog } from "@/components/provider-performance/sales-log"

export function ProviderPerformancePage() {
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
              <TotalRevenue />
            </div>
            <div className="px-6 pb-5">
              <MetricCards />
            </div>
            <div className="border-t border-stone-200/60 mx-6" />
            <div className="px-6 py-5">
              <SalesChart />
            </div>
            <div className="border-t border-stone-200/60" />
            <ChannelGrid />
          </div>

          {/* RIGHT: Sidebar Zone */}
          <div className="w-full lg:w-72 xl:w-80 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-stone-200/80 bg-stone-100/70">
            <ProviderSidebar />
          </div>
        </div>

        {/* Bottom: Sales Activity Log */}
        <SalesLog />

        {/* Footer Stats Line */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-stone-200/60">
          <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
            — 2,847 orders · $0 → $847,392 · 24/7
          </p>
        </div>
      </div>
    </div>
  )
}
