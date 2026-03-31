"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Rocket,
  ChevronRight,
  TrendingUp,
  Layers,
  BarChart3,
  Target,
  Clock,
  Zap,
} from "lucide-react"
import { DI_COLORS, CHART } from "../shared/di-tokens"
import { growthActions, type GrowthAction } from "../mock-data/category"

const getTypeIcon = (type: GrowthAction["type"]) => {
  switch (type) {
    case "expansión":   return Rocket
    case "optimización":return Layers
    case "crecimiento": return TrendingUp
    default:            return BarChart3
  }
}

const getTypeColor = (type: GrowthAction["type"]) => {
  switch (type) {
    case "expansión":   return CHART.growth
    case "optimización":return CHART.total
    case "crecimiento": return CHART.opportunity
    default:            return DI_COLORS.slate
  }
}

const getPriorityStyle = (priority: GrowthAction["priority"]) => {
  switch (priority) {
    case "alta":
      return "bg-red-500/10 text-red-800 border-red-500/20"
    case "media":
      return "bg-amber-500/10 text-amber-800 border-amber-500/20"
    case "baja":
      return "bg-emerald-500/10 text-emerald-800 border-emerald-500/20"
    default:
      return "bg-secondary text-muted-foreground"
  }
}

const PRIORITY_LABELS: Record<GrowthAction["priority"], string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
}

export function AccionesCrecimiento({
  selectedCategory,
}: {
  selectedCategory: string | null
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredActions = selectedCategory
    ? growthActions.filter((a) => a.category === selectedCategory)
    : growthActions

  return (
    <div className="h-full animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
      <div className="px-5 pt-5 pb-4">
        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-1">
          Acciones Estratégicas
        </p>
        <p className="text-[11px] text-muted-foreground font-mono">
          {filteredActions.length} recomendaciones · {selectedCategory ?? 'todas las categorías'}
        </p>
      </div>
      <div className="border-t border-border" />

      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        <div className="divide-y divide-border/60">
          {filteredActions.map((action, index) => {
            const TypeIcon = getTypeIcon(action.type)
            const typeColor = getTypeColor(action.type)
            const isExpanded = expandedId === action.id

            return (
              <div
                key={action.id}
                role="button"
                tabIndex={0}
                className="px-5 py-4 hover:bg-muted/50 transition-colors group cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : action.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setExpandedId(isExpanded ? null : action.id)
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-6 w-1 rounded-full shrink-0"
                    style={{ backgroundColor: typeColor }}
                  />
                  <span className="text-[10px] font-semibold text-muted-foreground tracking-wider shrink-0">
                    #{String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <TypeIcon
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: typeColor }}
                    />
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-blue-500 transition-colors">
                      {action.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto shrink-0">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      {action.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 ${getPriorityStyle(action.priority)}`}
                    >
                      {PRIORITY_LABELS[action.priority]}
                    </Badge>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pl-4">
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="text-center p-2 rounded-lg bg-secondary/50">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                            Impacto
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground">{action.impact}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-secondary/50">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Zap className="h-3 w-3 text-amber-500" />
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                            Confianza
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground">
                          {action.confidence}%
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-secondary/50 col-span-2">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                            Plazo
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground">
                          {action.timeHorizon}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="space-y-2 text-sm">
                        {action.details.targetStores && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tiendas Objetivo</span>
                            <span className="font-medium">{action.details.targetStores}</span>
                          </div>
                        )}
                        {action.details.currentPenetration && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Penetración Actual</span>
                            <span className="font-medium">{action.details.currentPenetration}</span>
                          </div>
                        )}
                        {action.details.targetPenetration && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Penetración Meta</span>
                            <span className="font-medium text-emerald-500">{action.details.targetPenetration}</span>
                          </div>
                        )}
                        {action.details.description && (
                          <p className="text-xs text-muted-foreground pt-1 border-t border-border/30">
                            {action.details.description}
                          </p>
                        )}
                      </div>
                      <button className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors">
                        Ejecutar Acción
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
