"use client"

import { Lightbulb, TrendingUp, AlertCircle, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { networkInsights } from "../mock-data/network"
import type { MicroInsight } from "../mock-data/network"

const getInsightStyles = (type: MicroInsight["type"]) => {
  switch (type) {
    case "alerta":
      return "bg-[#FEF3C7] border-[#F59E0B]/30 text-[#92400E]"
    case "oportunidad":
      return "bg-[#EFF6FF] border-[#3B82F6]/30 text-[#1E40AF]"
    case "éxito":
      return "bg-[#F0FDF4] border-[#22C55E]/30 text-[#166534]"
    case "info":
    default:
      return "bg-secondary border-border text-foreground"
  }
}

const getIconStyles = (type: MicroInsight["type"]) => {
  switch (type) {
    case "alerta":
      return "text-[#F59E0B]"
    case "oportunidad":
      return "text-[#3B82F6]"
    case "éxito":
      return "text-[#22C55E]"
    case "info":
    default:
      return "text-muted-foreground"
  }
}

const getIcon = (type: MicroInsight["type"]) => {
  switch (type) {
    case "alerta":
      return AlertCircle
    case "oportunidad":
      return Target
    case "éxito":
      return TrendingUp
    case "info":
    default:
      return Lightbulb
  }
}

export function MicroInsightsRed() {
  return (
    <div className="flex flex-wrap gap-2">
      {networkInsights.map((insight) => {
        const Icon = getIcon(insight.type)
        return (
          <div
            key={insight.id}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition-all hover:shadow-sm cursor-default",
              getInsightStyles(insight.type)
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", getIconStyles(insight.type))} />
            <span>{insight.text}</span>
          </div>
        )
      })}
    </div>
  )
}
