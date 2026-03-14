"use client"

import { cn } from "@/lib/utils"
import { getStatusLevel, type StatusLevel } from "./status-badge"

interface ApiScoreBarProps {
  score: number
  label?: string
  showValue?: boolean
  className?: string
}

export function ApiScoreBar({
  score,
  label,
  showValue = true,
  className,
}: ApiScoreBarProps) {
  const level = getStatusLevel(score, { green: 65, yellow: 45 })
  const percentage = Math.round(score)
  const color = level === "success" ? "var(--status-success)" :
                 level === "warning" ? "var(--status-warning)" :
                 "var(--status-critical)"

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {label && (
        <span className="text-sm text-neutral-600 min-w-fit">{label}</span>
      )}
      <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {showValue && (
        <span className="text-sm font-medium tabular-nums min-w-[3ch] text-right">
          {score.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// Stacked API score component (shows 4 components)
interface ApiScoreStackedProps {
  scores: {
    revenue: number
    portfolio: number
    cpi: number
    quality: number
  }
  weights: {
    revenue: number
    portfolio: number
    cpi: number
    quality: number
  }
}

export function ApiScoreStacked({ scores, weights }: ApiScoreStackedProps) {
  const total =
    scores.revenue * weights.revenue +
    scores.portfolio * weights.portfolio +
    scores.cpi * weights.cpi +
    scores.quality * weights.quality

  return (
    <div className="space-y-2">
      <ApiScoreBar score={total} showValue={false} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex justify-between text-neutral-600">
          <span>Revenue ({Math.round(weights.revenue * 100)}%)</span>
          <span className="font-medium tabular-nums">{scores.revenue.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Portfolio ({Math.round(weights.portfolio * 100)}%)</span>
          <span className="font-medium tabular-nums">{scores.portfolio.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>CPI ({Math.round(weights.cpi * 100)}%)</span>
          <span className="font-medium tabular-nums">{scores.cpi.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Quality ({Math.round(weights.quality * 100)}%)</span>
          <span className="font-medium tabular-nums">{scores.quality.toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}
