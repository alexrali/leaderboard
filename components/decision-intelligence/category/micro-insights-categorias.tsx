"use client"

import { AlertCircle, Target, TrendingUp, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { categoryInsights, type CategoryInsight } from "../mock-data/category"

const getInsightStyles = (type: CategoryInsight["type"]) => {
  switch (type) {
    case "alerta":
      return "border-l-amber-500 text-amber-700"
    case "oportunidad":
      return "border-l-blue-500 text-blue-700"
    case "éxito":
      return "border-l-emerald-500 text-emerald-700"
    case "info":
    default:
      return "border-l-slate-400 text-muted-foreground"
  }
}

const getIconStyles = (type: CategoryInsight["type"]) => {
  switch (type) {
    case "alerta":
      return "text-amber-600"
    case "oportunidad":
      return "text-blue-600"
    case "éxito":
      return "text-emerald-600"
    case "info":
    default:
      return "text-muted-foreground"
  }
}

const iconMap: Record<CategoryInsight["type"], React.ElementType> = {
  alerta: AlertCircle,
  oportunidad: Target,
  éxito: TrendingUp,
  info: Lightbulb,
}

export function MicroInsightsCategorias() {
  return (
    <div className="px-6 py-4">
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-3">INSIGHTS</p>
      <div className="flex flex-wrap gap-2">
        {categoryInsights.map((insight) => {
          const Icon = iconMap[insight.type]
          return (
            <span
              key={insight.id}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono border-l-2 bg-transparent",
                getInsightStyles(insight.type)
              )}
            >
              <Icon className={cn("h-3 w-3", getIconStyles(insight.type))} />
              <span>{insight.text}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
