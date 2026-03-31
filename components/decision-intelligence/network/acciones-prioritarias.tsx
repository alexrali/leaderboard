"use client"

import { Package, Tag, ShoppingBag, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DI_COLORS, CHART } from "../shared/di-tokens"
import { priorityActions } from "../mock-data/network"
import type { PriorityAction } from "../mock-data/network"

const getTypeIcon = (type: PriorityAction["type"]) => {
  switch (type) {
    case "inventario":
      return Package
    case "precio":
      return Tag
    case "surtido":
      return ShoppingBag
    case "distribución":
      return Truck
    default:
      return Package
  }
}

const getPriorityLabel = (priority: PriorityAction["priority"]) => {
  switch (priority) {
    case "crítico":
      return "CRÍTICO"
    case "alto":
      return "ALTO"
    case "óptimo":
      return "ÓPTIMO"
  }
}

const getPriorityStyles = (priority: PriorityAction["priority"]) => {
  switch (priority) {
    case "crítico":
      return {
        badge: "bg-red-500 text-white border-red-500",
        iconBg: "bg-red-50 text-red-500",
        bar: DI_COLORS.negative,
      }
    case "alto":
      return {
        badge: "bg-amber-500 text-white border-amber-500",
        iconBg: "bg-amber-50 text-amber-500",
        bar: DI_COLORS.warning,
      }
    case "óptimo":
      return {
        badge: "bg-green-500 text-white border-green-500",
        iconBg: "bg-green-50 text-green-500",
        bar: DI_COLORS.positive,
      }
    default:
      return {
        badge: "bg-secondary text-secondary-foreground",
        iconBg: "bg-secondary text-secondary-foreground",
        bar: DI_COLORS.slate,
      }
  }
}

export function AccionesPrioritarias() {
  return (
    <div className="h-full animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
      <div className="px-5 pt-5 pb-4">
        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-1">
          Acciones Prioritarias
        </p>
        <p className="text-[11px] text-muted-foreground font-mono">
          {priorityActions.length} acciones · clasificadas por impacto
        </p>
      </div>
      <div className="border-t border-border" />

      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        <div className="divide-y divide-border/60">
          {priorityActions.map((action) => {
            const Icon = getTypeIcon(action.type)
            const styles = getPriorityStyles(action.priority)

            return (
              <div
                key={action.rank}
                className={cn(
                  "px-5 py-4 hover:bg-muted/50 transition-colors group relative",
                  action.rank === 1 && "bg-red-50/30"
                )}
              >
                <div
                  className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
                  style={{
                    backgroundColor: styles.bar,
                    opacity: action.rank === 1 ? 1 : 0.3,
                  }}
                />

                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg shrink-0", styles.iconBg)}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-muted-foreground tracking-wider">
                        #{String(action.rank).padStart(2, "0")}
                      </span>
                      <Badge className={cn("text-[10px] font-semibold px-2 py-0", styles.badge)}>
                        {getPriorityLabel(action.priority)}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-semibold text-foreground mb-1 leading-tight text-pretty group-hover:text-blue-500 transition-colors">
                      {action.title}
                    </h4>

                    <p className="text-xs text-muted-foreground mb-3">{action.context}</p>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                          {action.impact}
                        </p>
                        <p className="text-sm font-bold" style={{ color: CHART.growth }}>{action.impactValue}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                          Gap Score
                        </p>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${action.gapScore}%`,
                                backgroundColor:
                                  action.gapScore >= 80
                                    ? DI_COLORS.negative
                                    : action.gapScore >= 60
                                    ? DI_COLORS.warning
                                    : DI_COLORS.positive,
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold text-foreground">{action.gapScore}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
