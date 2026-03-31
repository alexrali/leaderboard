"use client"

import { AlertCircle, Target, TrendingUp, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { categoryInsights, type CategoryInsight } from "../mock-data/category"

const styleMap: Record<CategoryInsight["type"], { wrapper: string; icon: string }> = {
  alerta: {
    wrapper: "bg-[#FEF3C7] border-[#F59E0B]/30 text-[#92400E]",
    icon: "text-[#F59E0B]",
  },
  oportunidad: {
    wrapper: "bg-[#EFF6FF] border-[#3B82F6]/30 text-[#1E40AF]",
    icon: "text-[#3B82F6]",
  },
  éxito: {
    wrapper: "bg-[#F0FDF4] border-[#22C55E]/30 text-[#166534]",
    icon: "text-[#22C55E]",
  },
  info: {
    wrapper: "bg-secondary border-border text-foreground",
    icon: "text-muted-foreground",
  },
}

const iconMap: Record<CategoryInsight["type"], React.ElementType> = {
  alerta: AlertCircle,
  oportunidad: Target,
  éxito: TrendingUp,
  info: Lightbulb,
}

export function MicroInsightsCategorias() {
  return (
    <div className="flex flex-wrap gap-2">
      {categoryInsights.map((insight) => {
        const styles = styleMap[insight.type]
        const Icon = iconMap[insight.type]
        return (
          <div
            key={insight.id}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition-all hover:shadow-sm cursor-default",
              styles.wrapper
            )}
          >
            <Icon className={cn("h-3.5 w-3.5 shrink-0", styles.icon)} />
            <span>{insight.text}</span>
          </div>
        )
      })}
    </div>
  )
}
