"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Legend, LegendItem } from "./card-header"

interface ZoneHeaderBarProps {
  title: string
  right?: ReactNode
  className?: string
}

export function ZoneHeaderBar({ title, right, className }: ZoneHeaderBarProps) {
  return (
    <div className={cn("bg-[#fafafa] border-b border-[#ebebeb]/60 px-6 py-3 flex items-center justify-between", className)}>
      <h3 className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
        {title}
      </h3>
      {right && <div className="flex items-center gap-3 shrink-0">{right}</div>}
    </div>
  )
}

interface ZoneInsightProps {
  message: string
  variant?: "warning" | "info" | "success" | "danger"
  className?: string
}

export function ZoneInsight({ message, variant = "info", className }: ZoneInsightProps) {
  const variants = {
    warning: "border-l-2 border-amber-500 text-amber-700",
    success: "border-l-2 border-emerald-500 text-emerald-700",
    info: "border-l-2 border-blue-500 text-blue-700",
    danger: "border-l-2 border-red-500 text-red-700",
  }

  return (
    <div className={cn("text-[11px] font-mono px-4 py-2 mx-6 mt-1", variants[variant], className)}>
      {message}
    </div>
  )
}

export function ZoneDivider() {
    return <div className="border-t border-[#ebebeb]/60" />
}

export { Legend, LegendItem }
export type { LegendItem as LegendItemProps } from "./card-header"
