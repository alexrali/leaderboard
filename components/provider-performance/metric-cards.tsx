"use client"

import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import type { ProviderSummary } from "@/lib/provider-types"

interface MetricCardsProps {
  summary?: ProviderSummary | null
}

function AnimatedStat({
  label,
  value,
  prefix = "",
  suffix = "",
  sublabel,
  decimals = 0,
  delay = 0
}: {
  label: string
  value: number
  prefix?: string
  suffix?: string
  sublabel: string
  decimals?: number
  delay?: number
}) {
  const animatedValue = useAnimatedCounter(Math.floor(value * (decimals ? Math.pow(10, decimals) : 1)), 1800, delay)
  const displayValue = decimals ? (animatedValue / Math.pow(10, decimals)).toFixed(decimals) : animatedValue

  return (
    <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-1.5">
        {label}
      </p>
      <p className="text-2xl font-mono font-bold tabular-nums">
        {prefix}{displayValue}{suffix}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">{sublabel}</p>
    </div>
  )
}

export function MetricCards({ summary }: MetricCardsProps) {
  const stats = [
    { label: "Órdenes", value: summary?.total_orders ?? 0, suffix: "", sublabel: "en el mes", delay: 600 },
    { label: "Categorías", value: summary?.active_categories ?? 0, suffix: "", sublabel: "activas", delay: 700 },
    { label: "Ticket Prom.", value: summary?.avg_order_value ?? 0, prefix: "$", suffix: "", sublabel: "por orden", decimals: 0, delay: 800 },
    { label: "Margen Prom.", value: summary?.avg_margin_pct ?? 0, suffix: "%", sublabel: "bruto", decimals: 1, delay: 900 },
  ]

  const volatilityCards = [
    {
      label: "Crec. YTD",
      value: summary?.ytd_growth_pct != null ? `${summary.ytd_growth_pct > 0 ? '+' : ''}${summary.ytd_growth_pct.toFixed(1)}%` : '—',
      sublabel: "vs año anterior",
    },
    {
      label: "Meta Alcanzada",
      value: summary?.target_hit_pct != null ? `${summary.target_hit_pct.toFixed(1)}%` : '—',
      sublabel: "del objetivo",
    },
    {
      label: "Mejor Día",
      value: summary?.best_day_revenue != null
        ? `$${(summary.best_day_revenue / 1000).toFixed(0)}K`
        : '—',
      sublabel: summary?.best_day_date ?? '',
    },
  ]

  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-6 sm:gap-x-10 lg:gap-x-14">
      {/* Primary Stats */}
      {stats.map((stat) => (
        <AnimatedStat
          key={stat.label}
          label={stat.label}
          value={stat.value}
          prefix={stat.prefix}
          suffix={stat.suffix}
          sublabel={stat.sublabel}
          decimals={stat.decimals}
          delay={stat.delay}
        />
      ))}

      {/* Divider - visible on larger screens */}
      <div className="hidden lg:block w-px h-12 bg-border/30 self-center" />

      {/* Volatility Cards */}
      {volatilityCards.map((card, index) => (
        <div
          key={card.label}
          className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: `${index * 100 + 1000}ms` }}
        >
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-1.5">
            {card.label}
          </p>
          <p className="text-xl font-mono font-bold tabular-nums">{card.value}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{card.sublabel}</p>
        </div>
      ))}
    </div>
  )
}
