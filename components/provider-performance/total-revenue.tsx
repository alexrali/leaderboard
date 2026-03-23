"use client"

import { useAnimatedCounter } from "@/hooks/use-animated-counter"

export function TotalRevenue() {
  const revenue = useAnimatedCounter(847392, 2500, 300)
  const orders = useAnimatedCounter(2847, 2000, 500)

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
        Total Revenue
      </p>
      <div className="flex items-baseline gap-4">
        <h2 className="text-6xl md:text-[80px] font-bold tracking-tighter font-mono leading-none">
          ${revenue.toLocaleString()}
        </h2>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
        <span className="text-emerald-600 font-semibold">+12.4%</span>
        <span className="tabular-nums">{orders.toLocaleString()} orders</span>
        <span className="text-border/60">·</span>
        <span>tracking 24/7</span>
        <span className="text-border/60">·</span>
        <span>no manual entry since Jan</span>
      </div>
    </div>
  )
}
