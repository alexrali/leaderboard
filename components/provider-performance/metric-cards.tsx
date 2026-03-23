"use client"

import { useAnimatedCounter } from "@/hooks/use-animated-counter"

const stats = [
  { label: "Orders", value: 44, suffix: "", sublabel: "executed" },
  { label: "Conv. Rate", value: 84.1, suffix: "%", sublabel: "self-tracked", decimals: 1 },
  { label: "Avg Order", value: 3.5, prefix: "$", suffix: "K", sublabel: "per sale", decimals: 1 },
  { label: "Avg Margin", value: 5.0, prefix: "+", suffix: "¢", sublabel: "surface Δ", decimals: 1 },
]

const volatilityCards = [
  { label: "YTD Growth", value: "58.5%", sublabel: "on-chain 30d" },
  { label: "Target Hit", value: "44.5%", sublabel: "Polymarket" },
  { label: "Vol. Spread", value: "+14.0%", sublabel: "mispricing" },
]

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

export function MetricCards() {
  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-6 sm:gap-x-10 lg:gap-x-14">
      {/* Primary Stats */}
      {stats.map((stat, index) => (
        <AnimatedStat
          key={stat.label}
          label={stat.label}
          value={stat.value}
          prefix={stat.prefix}
          suffix={stat.suffix}
          sublabel={stat.sublabel}
          decimals={stat.decimals}
          delay={index * 150 + 600}
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
