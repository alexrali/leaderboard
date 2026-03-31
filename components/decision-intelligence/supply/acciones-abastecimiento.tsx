"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Truck,
} from "lucide-react"
import { CardHeaderContent } from "../shared/card-header"
import { supplyActions, type SupplyAction } from "../mock-data/supply"

function getUrgencyConfig(urgency: SupplyAction["urgency"]) {
  switch (urgency) {
    case "crítico":
      return {
        color: "bg-[#FEE2E2] text-[#991B1B] border-[#EF4444]/30",
        bar: "#EF4444",
        barOpacity: 1,
        icon: AlertCircle,
        label: "Crítico",
      }
    case "alto":
      return {
        color: "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/30",
        bar: "#F59E0B",
        barOpacity: 0.6,
        icon: AlertTriangle,
        label: "Alto",
      }
    case "preventivo":
      return {
        color: "bg-[#DBEAFE] text-[#1E40AF] border-[#3B82F6]/30",
        bar: "#3B82F6",
        barOpacity: 0.6,
        icon: CheckCircle2,
        label: "Preventivo",
      }
  }
}

export function AccionesAbastecimiento() {
  return (
    <Card className="bg-card border-border shadow-sm h-full">
      <CardHeader className="pb-4">
        <CardHeaderContent
          icon={Truck}
          iconColor="#3B82F6"
          title="Acciones Prioritarias de Abastecimiento"
          description="Recomendaciones de reasignación y reposición"
          badge={
            <Badge
              variant="secondary"
              className="bg-[#DCFCE7] text-[#166534] border-[#22C55E]/30 text-[10px]"
            >
              {supplyActions.length} acciones
            </Badge>
          }
        />
      </CardHeader>
      <CardContent className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        {supplyActions.map((action, index) => {
          const urgencyConfig = getUrgencyConfig(action.urgency)
          const UrgencyIcon = urgencyConfig.icon
          const isAhorra = action.impact === "Ahorra"

          return (
            <div
              key={action.rank}
              className="group relative p-4 rounded-xl border border-border bg-card hover:bg-secondary/20 hover:border-border/80 transition-all duration-200 cursor-pointer"
            >
              {/* Priority indicator bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                style={{
                  backgroundColor: urgencyConfig.bar,
                  opacity: urgencyConfig.barOpacity,
                }}
              />

              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground tracking-wider">
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                    <Badge variant="secondary" className={urgencyConfig.color}>
                      <UrgencyIcon className="h-3 w-3 mr-1" />
                      {urgencyConfig.label}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground leading-tight group-hover:text-[#3B82F6] transition-colors">
                    {action.action}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {action.quantity} unidades de {action.sku}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md shrink-0">
                  <Clock className="h-3 w-3" />
                  {action.timeframe}
                </div>
              </div>

              {/* Flow indicator */}
              <div className="flex items-center gap-2 mb-3 p-2 bg-secondary/50 rounded-lg">
                <div className="flex-1 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">De</p>
                  <p className="text-sm font-medium text-foreground truncate">{action.source}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Hacia</p>
                  <p className="text-sm font-medium text-foreground truncate">{action.destination}</p>
                </div>
              </div>

              {/* Impact */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className={`p-1 rounded ${isAhorra ? "bg-[#DCFCE7]" : "bg-[#DBEAFE]"}`}>
                    {isAhorra ? (
                      <TrendingUp className="h-3 w-3 text-[#16A34A]" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-[#2563EB]" />
                    )}
                  </div>
                  <span className="text-muted-foreground">{action.impact}</span>
                  <span className={`font-semibold ${isAhorra ? "text-[#16A34A]" : "text-[#2563EB]"}`}>
                    {action.impactValue}
                  </span>
                </div>
              </div>

              {/* Hover action button */}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  className="h-7 text-xs bg-foreground hover:bg-foreground/90 text-background"
                >
                  Ejecutar
                </Button>
              </div>
            </div>
          )
        })}

        {/* Summary footer */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-[#22C55E]/10 to-[#3B82F6]/10 border border-[#22C55E]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Impacto Potencial Total
              </p>
              <p className="text-lg font-bold text-foreground">
                {supplyActions.map((a) => a.impactValue).filter((v) => v.startsWith("$"))[0] ?? "—"}
              </p>
            </div>
            <Button variant="outline" size="sm" className="text-xs">
              Ejecutar Todos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
