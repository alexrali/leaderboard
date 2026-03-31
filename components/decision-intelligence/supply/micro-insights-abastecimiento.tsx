"use client"

import { Badge } from "@/components/ui/badge"
import { ArrowRight, Target, AlertCircle, Zap } from "lucide-react"
import { supplyInsights, type SupplyInsight } from "../mock-data/supply"

function getInsightStyles(type: SupplyInsight["type"]) {
  switch (type) {
    case "oportunidad":
      return {
        bg: "bg-[#EFF6FF]",
        text: "text-[#1E40AF]",
        border: "border-[#3B82F6]/30",
        iconBg: "bg-[#3B82F6]/20",
        iconColor: "text-[#3B82F6]",
        icon: Target,
      }
    case "alerta":
      return {
        bg: "bg-[#FEF3C7]",
        text: "text-[#92400E]",
        border: "border-[#F59E0B]/30",
        iconBg: "bg-[#F59E0B]/20",
        iconColor: "text-[#F59E0B]",
        icon: AlertCircle,
      }
    case "acción":
      return {
        bg: "bg-[#F0FDF4]",
        text: "text-[#166534]",
        border: "border-[#22C55E]/30",
        iconBg: "bg-[#22C55E]/20",
        iconColor: "text-[#22C55E]",
        icon: Zap,
      }
  }
}

export function MicroInsightsAbastecimiento() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {supplyInsights.map((insight) => {
        const styles = getInsightStyles(insight.type)
        const Icon = styles.icon

        return (
          <Badge
            key={insight.id}
            variant="secondary"
            className={`${styles.bg} ${styles.text} ${styles.border} border px-3 py-2 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity group`}
          >
            <span className={`${styles.iconBg} p-1 rounded mr-2`}>
              <Icon className={`h-3 w-3 ${styles.iconColor}`} />
            </span>
            {insight.text}
            <ArrowRight className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Badge>
        )
      })}
    </div>
  )
}
