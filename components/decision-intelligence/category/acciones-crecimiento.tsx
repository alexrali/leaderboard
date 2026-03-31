"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { CardHeaderContent } from "../shared/card-header"
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
    case "expansión":   return "#22C55E"
    case "optimización":return "#3B82F6"
    case "crecimiento": return "#F59E0B"
    default:            return "#64748B"
  }
}

const getPriorityStyle = (priority: GrowthAction["priority"]) => {
  switch (priority) {
    case "alta":
      return "bg-[#FEF2F2] text-[#991B1B] border-[#EF4444]/20"
    case "media":
      return "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/20"
    case "baja":
      return "bg-[#F0FDF4] text-[#166534] border-[#22C55E]/20"
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
    <Card className="bg-card border-border shadow-sm h-full">
      <CardHeader className="pb-4">
        <CardHeaderContent
          icon={Target}
          iconColor="#22C55E"
          title="Acciones Estratégicas de Crecimiento"
          description="Recomendaciones de expansión y optimización"
          badge={
            <Badge
              variant="secondary"
              className="bg-[#DCFCE7] text-[#166534] border-[#22C55E]/30 text-[10px]"
            >
              {filteredActions.length} acciones
            </Badge>
          }
        />
      </CardHeader>
      <CardContent className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        {filteredActions.map((action, index) => {
          const TypeIcon = getTypeIcon(action.type)
          const typeColor = getTypeColor(action.type)
          const isExpanded = expandedId === action.id

          return (
            <div
              key={action.id}
              className={`group relative rounded-xl border transition-all cursor-pointer ${
                isExpanded
                  ? "border-foreground/20 bg-secondary/30"
                  : "border-border bg-card hover:border-border/80 hover:bg-secondary/20"
              }`}
              onClick={() => setExpandedId(isExpanded ? null : action.id)}
            >
              {/* Priority indicator bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                style={{ backgroundColor: typeColor }}
              />

              <div className="p-4 pl-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${typeColor}15` }}
                    >
                      <TypeIcon
                        className="h-4 w-4"
                        style={{ color: typeColor }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight group-hover:text-[#3B82F6] transition-colors">
                        {action.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {action.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${getPriorityStyle(action.priority)}`}
                        >
                          {PRIORITY_LABELS[action.priority]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground tracking-wider">
                    #{String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-secondary/50">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3 text-[#22C55E]" />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Impacto
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{action.impact}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Incremento de Ingreso
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/50">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Zap className="h-3 w-3 text-[#F59E0B]" />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Confianza
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {action.confidence}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Score IA</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/50">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-[#3B82F6]" />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Plazo
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {action.timeHorizon}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Para implementar
                    </p>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Detalles de Acción
                    </h4>
                    <div className="space-y-2 text-sm">
                      {action.details.targetStores && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Tiendas Objetivo
                          </span>
                          <span className="font-medium">
                            {action.details.targetStores}
                          </span>
                        </div>
                      )}
                      {action.details.currentPenetration && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Penetración Actual
                          </span>
                          <span className="font-medium">
                            {action.details.currentPenetration}
                          </span>
                        </div>
                      )}
                      {action.details.targetPenetration && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Penetración Meta
                          </span>
                          <span className="font-medium text-[#22C55E]">
                            {action.details.targetPenetration}
                          </span>
                        </div>
                      )}
                      {action.details.description && (
                        <p className="text-xs text-muted-foreground pt-1 border-t border-border/30">
                          {action.details.description}
                        </p>
                      )}
                    </div>
                    <button className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors">
                      Ejecutar Acción
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
