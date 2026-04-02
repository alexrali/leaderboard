"use client"

import { Badge } from "@/components/ui/badge"
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { CHART } from "../shared/di-tokens"
import { supplyActions, type SupplyAction } from "../mock-data/supply"

function getUrgencyConfig(urgency: SupplyAction["urgency"]) {
  switch (urgency) {
    case "crítico":
      return {
        color: "bg-red-100 text-red-800 border-red-500/30",
        icon: AlertCircle,
        label: "Crítico",
      }
    case "alto":
      return {
        color: "bg-amber-100 text-amber-800 border-amber-500/30",
        icon: AlertTriangle,
        label: "Alto",
      }
    case "preventivo":
      return {
        color: "bg-blue-100 text-blue-800 border-blue-500/30",
        icon: CheckCircle2,
        label: "Preventivo",
      }
  }
}

export function AccionesAbastecimiento() {
  return (
    <div className="h-full animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
      <div className="px-5 pt-5 pb-4">
        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-1">
          Acciones de Abastecimiento
        </p>
        <p className="text-[11px] text-muted-foreground font-mono">
          {supplyActions.length} acciones · reasignación y reposición
        </p>
      </div>
      <div className="border-t border-[#ebebeb]" />

      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        <div className="divide-y divide-[#ebebeb]/60">
          {supplyActions.map((action, index) => {
            const urgencyConfig = getUrgencyConfig(action.urgency)
            const UrgencyIcon = urgencyConfig.icon
            const isAhorra = action.impact === "Ahorra"

            return (
              <div
                key={action.rank}
                className="px-5 py-4 hover:bg-[#fafafa]/50 transition-colors group relative"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-muted-foreground tracking-wider">
                    #{String(index + 1).padStart(2, "0")}
                  </span>
                  <Badge variant="secondary" className={urgencyConfig.color}>
                    <UrgencyIcon className="h-3 w-3 mr-1" />
                    {urgencyConfig.label}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold text-foreground leading-tight group-hover:text-blue-500 transition-colors">
                  {action.action}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {action.quantity} unidades de {action.sku}
                </p>

                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mt-2">
                  <span className="truncate">{action.source}</span>
                  <span>→</span>
                  <span className="truncate">{action.destination}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs mt-2">
                  <div className={`p-1 rounded ${isAhorra ? "bg-emerald-100" : "bg-blue-100"}`}>
                    {isAhorra ? (
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-blue-600" />
                    )}
                  </div>
                  <span className="text-muted-foreground">{action.impact}</span>
                  <span className={`font-semibold ${isAhorra ? "text-emerald-600" : "text-blue-600"}`}>
                    {action.impactValue}
                  </span>
                </div>

                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="px-2 py-1 text-[10px] font-mono bg-foreground text-background hover:bg-foreground/90 transition-colors">
                    Ejecutar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-[#ebebeb] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
              Impacto Potencial
            </p>
            <p className="text-lg font-mono font-semibold">
              {supplyActions.map((a) => a.impactValue).filter((v) => v.startsWith("$"))[0] ?? "—"}
            </p>
          </div>
          <button className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90 transition-colors">
            Ejecutar Todos
          </button>
        </div>
      </div>
    </div>
  )
}
