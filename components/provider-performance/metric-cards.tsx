"use client"

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
}: {
  label: string
  value: number
  prefix?: string
  suffix?: string
  sublabel: string
  decimals?: number
}) {
  const displayValue = decimals
    ? value.toFixed(decimals)
    : Math.floor(value).toLocaleString()

  return (
    <div className="text-center">
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-1.5">
        {label}
      </p>
      <p className="text-2xl font-mono font-semibold tabular-nums">
        {prefix}{displayValue}{suffix}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">{sublabel}</p>
    </div>
  )
}

export function MetricCards({ summary }: MetricCardsProps) {
  if (!summary) {
    return (
      <div className="flex flex-wrap items-start gap-x-6 gap-y-6 sm:gap-x-10 lg:gap-x-14">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-3 w-16 bg-[#fafafa] animate-pulse rounded mx-auto mb-2" />
            <div className="h-7 w-12 bg-[#fafafa] animate-pulse rounded mx-auto mb-1" />
            <div className="h-3 w-20 bg-[#fafafa] animate-pulse rounded mx-auto" />
          </div>
        ))}
      </div>
    )
  }

  const stats = [
    { label: "Órdenes", value: summary?.total_orders ?? 0, suffix: "", sublabel: "en el mes" },
    { label: "Categorías", value: summary?.active_categories ?? 0, suffix: "", sublabel: "activas" },
    { label: "Ticket Prom.", value: summary?.avg_order_value ?? 0, prefix: "$", suffix: "", sublabel: "por orden", decimals: 0 },
    { label: "Margen Prom.", value: summary?.avg_margin_pct ?? 0, suffix: "%", sublabel: "bruto", decimals: 1 },
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
        />
      ))}

      {/* Divider - visible on larger screens */}
      <div className="hidden lg:block w-px h-12 bg-[#ebebeb]/30 self-center" />

      {/* Volatility Cards */}
      {volatilityCards.map((card) => (
        <div
          key={card.label}
        >
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-1.5">
            {card.label}
          </p>
          <p className="text-xl font-mono font-semibold tabular-nums">{card.value}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{card.sublabel}</p>
        </div>
      ))}
    </div>
  )
}
