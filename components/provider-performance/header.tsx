"use client"

import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { useLiveClock } from "@/hooks/use-live-clock"
import { cn } from "@/lib/utils"

export function DashboardHeader() {
  const time = useLiveClock()

  return (
    <header className="border-b border-border/40 px-6 lg:px-8 py-3 bg-background sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Left: Brand + Context */}
        <div className="flex items-center gap-6">
          <h1 className="text-sm font-mono font-bold tracking-tight">
            SALES<span className="text-muted-foreground">.track</span>
          </h1>
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
            <span>Q1 2026</span>
            <span className="text-border">·</span>
            <span>multi-channel retail</span>
            <span className="text-border">·</span>
            <span>5 categories</span>
            <span className="text-border">·</span>
            <span>12 active reps</span>
          </div>
        </div>

        {/* Right: Controls + Stats + Clock */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Live Button */}
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 h-7 px-3 font-mono text-[10px] uppercase tracking-wider",
              "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/5 hover:border-emerald-500/60",
              "transition-all duration-300"
            )}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <Play className="h-2.5 w-2.5 fill-current" />
            <span>LIVE</span>
          </Button>

          {/* Header Stats */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Best Day</p>
              <p className="text-sm font-mono font-semibold tabular-nums">$47.2K</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Target</p>
              <p className="text-sm font-mono font-semibold tabular-nums">$2.5M</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">Frequency</p>
              <p className="text-sm font-mono font-semibold tabular-nums">1 / 2min</p>
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
