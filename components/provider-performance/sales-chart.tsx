"use client"

import { useState, useId } from "react"
import { Area, AreaChart, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip, ReferenceDot } from "recharts"
import { cn } from "@/lib/utils"
import type { ProviderDailyPoint, ProviderYoYPoint } from "@/lib/provider-types"

interface SalesChartProps {
  data?: ProviderDailyPoint[]
  yoyData?: ProviderYoYPoint[]
}

type ChartMode = 'cumulative' | 'yoy'

export function SalesChart({ data, yoyData }: SalesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-3 w-40 bg-muted animate-pulse rounded" />
        <div className="h-[280px] bg-muted/30 animate-pulse rounded" />
      </div>
    )
  }

  const [mode, setMode] = useState<ChartMode>('cumulative')
  const uid = useId().replace(/:/g, '')
  const currentYear = new Date().getFullYear()
  const priorYear = currentYear - 1

  // ── Cumulative mode ──────────────────────────────────────────────────────
  const chartData = data ?? []
  const maxRevenue = chartData.length > 0 ? Math.max(...chartData.map(d => d.revenue)) : 900000
  const yDomain: [number, number] = [-maxRevenue * 0.05, maxRevenue * 1.15]
  const yTicks = [
    0,
    Math.round(maxRevenue * 0.25 / 100000) * 100000,
    Math.round(maxRevenue * 0.5 / 100000) * 100000,
    Math.round(maxRevenue * 0.75 / 100000) * 100000,
    Math.round(maxRevenue / 100000) * 100000,
  ]
  const lastPoint = chartData[chartData.length - 1]
  const currentRevenue = lastPoint?.revenue ?? 0
  const currentLabel = lastPoint?.weekLabel ?? ''

  // ── YoY mode: build cumulative sums per week ─────────────────────────────
  const yoyChartData = (() => {
    if (!yoyData || yoyData.length === 0) return []
    let cum2026 = 0
    let cum2025 = 0
    return yoyData.map(row => {
      cum2026 += row.revenue_current
      cum2025 += row.revenue_prior
      return {
        weekLabel: `S${row.week_num}`,
        current: Math.round(cum2026),
        prior: Math.round(cum2025),
        delta: Math.round(cum2026 - cum2025),
      }
    })
  })()
  const yoyMax = yoyChartData.length > 0
    ? Math.max(...yoyChartData.map(d => Math.max(d.current, d.prior)))
    : 900000
  const yoyDomain: [number, number] = [-yoyMax * 0.05, yoyMax * 1.15]
  const yoyTicks = [
    0,
    Math.round(yoyMax * 0.25 / 1000000) * 1000000,
    Math.round(yoyMax * 0.5 / 1000000) * 1000000,
    Math.round(yoyMax * 0.75 / 1000000) * 1000000,
    Math.round(yoyMax / 1000000) * 1000000,
  ]
  const lastYoY = yoyChartData[yoyChartData.length - 1]

  const hasYoY = (yoyData?.length ?? 0) > 0

  return (
    <div className="animate-in fade-in duration-1000 delay-500">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
          {mode === 'cumulative' ? 'Curva de Ingresos — Acumulada' : 'Revenue — Año vs Año'}
        </p>
        {hasYoY && (
          <div className="flex border border-stone-200/80 divide-x divide-stone-200/80" role="tablist" aria-label="Modo de gráfico">
            <button
              role="tab"
              aria-selected={mode === 'cumulative'}
              onClick={() => setMode('cumulative')}
              className={cn(
                "px-2.5 py-1 text-xs font-mono uppercase tracking-[0.12em] transition-colors duration-150",
                mode === 'cumulative'
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-muted-foreground"
              )}
            >
              Acum
            </button>
            <button
              role="tab"
              aria-selected={mode === 'yoy'}
              onClick={() => setMode('yoy')}
              className={cn(
                "px-2.5 py-1 text-xs font-mono uppercase tracking-[0.12em] transition-colors duration-150",
                mode === 'yoy'
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-muted-foreground"
              )}
            >
              YoY
            </button>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-[280px] w-full relative">
        {mode === 'cumulative' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 70, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id={`fillRevenue-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.04} />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="weekLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                tickMargin={12}
                interval="preserveStartEnd"
              />
              <YAxis
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                tickMargin={8}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                domain={yDomain}
                ticks={yTicks}
              />
              <ReferenceLine
                y={currentRevenue}
                stroke="hsl(var(--foreground))"
                strokeDasharray="2 4"
                strokeOpacity={0.12}
              />
              <ReferenceLine
                y={0}
                stroke="hsl(var(--foreground))"
                strokeOpacity={0.08}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background/95 backdrop-blur-sm border border-border/50 px-3 py-2 shadow-lg">
                        <p className="text-[10px] text-muted-foreground mb-1">{payload[0].payload.weekLabel}</p>
                        <p className="font-mono text-sm font-semibold">
                          ${Number(payload[0].value).toLocaleString()}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--foreground))"
                strokeWidth={1.5}
                fill={`url(#fillRevenue-${uid})`}
                animationDuration={2000}
                animationBegin={800}
              />
              {currentLabel && (
                <ReferenceDot
                  x={currentLabel}
                  y={currentRevenue}
                  r={4}
                  fill="hsl(var(--foreground))"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yoyChartData} margin={{ top: 10, right: 70, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id={`fillCurrent-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.06} />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`fillPrior-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.04} />
                  <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="weekLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                tickMargin={12}
                interval="preserveStartEnd"
              />
              <YAxis
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                tickMargin={8}
                tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                domain={yoyDomain}
                ticks={yoyTicks}
              />
              <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.08} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload
                    const delta = row.current - row.prior
                    const pct = row.prior > 0 ? ((delta / row.prior) * 100).toFixed(1) : '—'
                    return (
                      <div className="bg-background/95 backdrop-blur-sm border border-border/50 px-3 py-2 shadow-lg min-w-[140px]">
                        <p className="text-[10px] text-muted-foreground mb-1.5">{row.weekLabel}</p>
                        <div className="flex justify-between gap-4 text-[10px] font-mono">
                          <span className="text-foreground font-semibold">{currentYear}</span>
                          <span>${(row.current / 1000000).toFixed(2)}M</span>
                        </div>
                        <div className="flex justify-between gap-4 text-[10px] font-mono text-muted-foreground">
                          <span>{priorYear}</span>
                          <span>${(row.prior / 1000000).toFixed(2)}M</span>
                        </div>
                        <div className={cn(
                          "flex justify-between gap-4 text-[10px] font-mono mt-1 pt-1 border-t border-border/30",
                          delta >= 0 ? "text-emerald-600" : "text-red-500"
                        )}>
                          <span>Δ</span>
                          <span>{delta >= 0 ? '+' : ''}{pct}%</span>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              {/* 2025 prior year — dashed, muted */}
              <Area
                type="monotone"
                dataKey="prior"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
                strokeDasharray="4 3"
                strokeOpacity={0.4}
                fill={`url(#fillPrior-${uid})`}
                animationDuration={1500}
              />
              {/* 2026 current year — solid, prominent */}
              <Area
                type="monotone"
                dataKey="current"
                stroke="hsl(var(--foreground))"
                strokeWidth={1.5}
                fill={`url(#fillCurrent-${uid})`}
                animationDuration={2000}
                animationBegin={400}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Current Value Marker */}
        {mode === 'cumulative' && currentRevenue > 0 && (
          <div className="absolute right-0 top-[15%] flex items-center gap-2 animate-in fade-in duration-1000 delay-1500">
            <div className="h-px w-6 bg-foreground/20" />
            <div className="bg-foreground text-background text-[10px] font-mono px-2 py-1">
              ${currentRevenue.toLocaleString()}
            </div>
          </div>
        )}

        {/* YoY legend */}
        {mode === 'yoy' && lastYoY && (
          <div className="absolute right-0 top-[10%] flex flex-col gap-1 animate-in fade-in duration-1000 delay-500">
            <div className="flex items-center gap-2">
              <div className="h-px w-6 bg-foreground" />
              <span className="text-xs font-mono text-foreground">{currentYear}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-px w-6 bg-muted-foreground/40 border-t border-dashed" />
              <span className="text-xs font-mono text-muted-foreground">{priorYear}</span>
            </div>
          </div>
        )}

        {/* Bottom reference */}
        {mode === 'cumulative' && (
          <div className="absolute right-0 bottom-[12%] flex items-center gap-2">
            <div className="h-px w-6 bg-foreground/10" />
            <div className="text-xs font-mono text-muted-foreground tabular-nums">
              $0
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
