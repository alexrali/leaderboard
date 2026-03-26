"use client"

import { useLiveClock } from "@/hooks/use-live-clock"
import type { ProviderSummary } from '@/lib/provider-types'

interface DashboardHeaderProps {
  summary?: ProviderSummary | null
}

export function DashboardHeader({ summary }: DashboardHeaderProps) {
  const time = useLiveClock()

  const now = new Date()
  const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`

  const bestDay = summary?.best_day_revenue
    ? `$${(summary.best_day_revenue / 1000).toFixed(1)}K`
    : '—'

  const target = summary?.target_amount
    ? `$${(summary.target_amount / 1000000).toFixed(1)}M`
    : '—'

  return (
    <header className="border-b border-border/40 px-6 lg:px-8 py-3 bg-background sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Left: Brand + Context */}
        <div className="flex items-center gap-6">
          <h1 className="text-sm font-mono font-bold tracking-tight">
            SALES<span className="text-muted-foreground">.track</span>
          </h1>
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
            <span>{quarter}</span>
            <span className="text-border">·</span>
            <span>distribución + autoservicio</span>
            <span className="text-border">·</span>
            <span>{summary?.active_categories ?? '—'} categorías</span>
            <span className="text-border">·</span>
            <span>{summary?.active_reps ?? '—'} agentes activos</span>
          </div>
        </div>

        {/* Right: Controls + Stats + Clock */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Header Stats */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Mejor Día</p>
              <p className="text-sm font-mono font-semibold tabular-nums">{bestDay}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Meta</p>
              <p className="text-sm font-mono font-semibold tabular-nums">{target}</p>
            </div>
          </div>

          {/* Live Clock */}
          <div className="text-right font-mono text-sm font-medium tabular-nums tracking-tight min-w-[70px] text-foreground">
            {time || "00:00:00"}
          </div>
        </div>
      </div>
    </header>
  )
}
