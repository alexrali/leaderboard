"use client"

import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import type { ProviderSummary } from "@/lib/provider-types"

interface TotalRevenueProps {
  summary?: ProviderSummary | null
}

export function TotalRevenue({ summary }: TotalRevenueProps) {
  if (!summary) {
    return (
      <div className="space-y-3">
        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
        <div className="h-14 w-56 bg-muted animate-pulse rounded" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  const revenue = useAnimatedCounter(summary?.total_revenue ?? 0, 2500, 300)
  const orders = useAnimatedCounter(summary?.total_orders ?? 0, 2000, 500)

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
        Ingresos Totales
      </p>
      <div className="flex items-baseline gap-4">
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[80px] font-bold tracking-tighter font-mono leading-none">
          ${revenue.toLocaleString()}
        </h2>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
        <span className="text-emerald-600 font-semibold">
          {summary?.ytd_growth_pct != null
            ? `${summary.ytd_growth_pct > 0 ? '+' : ''}${summary.ytd_growth_pct.toFixed(1)}% YTD`
            : '—'}
        </span>
        <span className="tabular-nums">{orders.toLocaleString()} órdenes</span>
        <span className="text-border/60">·</span>
        <span>seguimiento 24/7</span>
        <span className="text-border/60">·</span>
        <span>sin captura manual desde ene</span>
      </div>
    </div>
  )
}
