"use client"

import { Package, Tag, ShoppingBag, Truck, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CardHeaderContent } from "../shared/card-header"
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
        badge: "bg-[#EF4444] text-white border-[#EF4444]",
        glow: "shadow-[0_0_0_1px_rgba(239,68,68,0.2)]",
        iconBg: "bg-[#FEF2F2] text-[#EF4444]",
        bar: "#EF4444",
      }
    case "alto":
      return {
        badge: "bg-[#F59E0B] text-white border-[#F59E0B]",
        glow: "",
        iconBg: "bg-[#FEF3C7] text-[#F59E0B]",
        bar: "#F59E0B",
      }
    case "óptimo":
      return {
        badge: "bg-[#22C55E] text-white border-[#22C55E]",
        glow: "",
        iconBg: "bg-[#F0FDF4] text-[#22C55E]",
        bar: "#22C55E",
      }
    default:
      return {
        badge: "bg-secondary text-secondary-foreground",
        glow: "",
        iconBg: "bg-secondary text-secondary-foreground",
        bar: "#64748B",
      }
  }
}

export function AccionesPrioritarias() {
  return (
    <Card className="bg-card border-border shadow-sm h-full">
      <CardHeader className="pb-4">
        <CardHeaderContent
          icon={AlertTriangle}
          iconColor="#F59E0B"
          title="Acciones Prioritarias"
          description="Clasificadas por impacto de negocio"
          badge={
            <Badge
              variant="secondary"
              className="bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/30 text-[10px]"
            >
              {priorityActions.length} acciones
            </Badge>
          }
        />
      </CardHeader>
      <CardContent className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        {priorityActions.map((action) => {
          const Icon = getTypeIcon(action.type)
          const styles = getPriorityStyles(action.priority)

          return (
            <div
              key={action.rank}
              className={cn(
                "relative p-4 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-md hover:border-muted-foreground/20 cursor-pointer group",
                action.rank === 1 && "border-[#EF4444]/40 bg-[#FEF2F2]/30",
                styles.glow
              )}
            >
              {/* Indicador de prioridad lateral */}
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

                  <h4 className="text-sm font-semibold text-foreground mb-1 leading-tight text-pretty group-hover:text-[#3B82F6] transition-colors">
                    {action.title}
                  </h4>

                  <p className="text-xs text-muted-foreground mb-3">{action.context}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                        {action.impact}
                      </p>
                      <p className="text-sm font-bold text-[#22C55E]">{action.impactValue}</p>
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
                                  ? "#EF4444"
                                  : action.gapScore >= 60
                                  ? "#F59E0B"
                                  : "#22C55E",
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
      </CardContent>
    </Card>
  )
}
