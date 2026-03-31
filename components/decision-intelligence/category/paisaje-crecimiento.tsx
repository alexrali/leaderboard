"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ReferenceArea,
  ZAxis,
} from "recharts"
import { ZoneHeaderBar, ZoneInsight, Legend } from "../shared/zone-header"
import { DI_COLORS, CHART } from "../shared/di-tokens"
import { categoryLandscapeData, type CategoryLandscape } from "../mock-data/category"

const CATEGORY_COLORS: Record<string, string> = {
  Aceites: DI_COLORS.warning,
  Limpieza: DI_COLORS.neutral,
  "C. Personal": DI_COLORS.pink,
  Alimentos: DI_COLORS.positive,
  Bebidas: DI_COLORS.purple,
}

const getGrowthColor = (growth: string) => {
  switch (growth) {
    case "alto":    return CHART.growth
    case "estable": return CHART.total
    case "decline": return CHART.decline
    default:        return DI_COLORS.slate
  }
}

const getGrowthLabel = (growth: string) => {
  switch (growth) {
    case "alto":    return "Alto Crecimiento"
    case "estable": return "Estable"
    case "decline": return "En Decline"
    default:        return growth
  }
}

const getQuadrant = (penetration: number, revenue: number) => {
  if (penetration >= 50 && revenue >= 50) return "Categorías Core"
  if (penetration < 50 && revenue >= 50) return "Oportunidad de Expansión"
  if (penetration >= 50 && revenue < 50) return "Optimizar Mezcla"
  return "Baja Prioridad"
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: CategoryLandscape }>
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const quadrant = getQuadrant(data.penetration, data.revenue)
    const growthColor = getGrowthColor(data.growth)
    return (
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
        <p className="font-semibold text-foreground text-sm">{data.name}</p>
        <div className="mt-2 space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Penetración de Mercado</span>
            <span className="font-medium">{data.penetration}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Contribución de Ingresos</span>
            <span className="font-medium">{data.revenue}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Ventas Totales</span>
            <span className="font-medium">${(data.sales / 1000).toFixed(1)}M</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Estado de Crecimiento</span>
            <Badge
              variant="outline"
              className="text-[10px] capitalize"
              style={{ borderColor: growthColor, color: growthColor }}
            >
              {getGrowthLabel(data.growth)}
            </Badge>
          </div>
          <div className="pt-2 border-t border-border mt-2">
            <span className="text-muted-foreground text-xs">Cuadrante: </span>
            <span className="text-xs font-medium">{quadrant}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function PaisajeCrecimiento({
  onCategorySelect,
}: {
  onCategorySelect: (category: string | null) => void
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleClick = (data: CategoryLandscape) => {
    const newSelection = selectedCategory === data.name ? null : data.name
    setSelectedCategory(newSelection)
    onCategorySelect(newSelection)
  }

  return (
    <div className="animate-in fade-in duration-500" style={{ animationDelay: '0ms' }}>
      <ZoneHeaderBar
        title="PAISAJE DE CATEGORÍAS"
        right={
          <Legend
            items={[
              { color: CHART.growth, label: "Alto Crecimiento" },
              { color: CHART.total, label: "Estable" },
              { color: CHART.decline, label: "En Decline" },
            ]}
          />
        }
      />
      <ZoneInsight
        message="Aceites tiene 28% de espacio de expansión en tiendas Tier-2"
        variant="success"
      />
      <div className="px-6 py-5">
        <div className="h-[400px] relative">
          <div className="absolute top-2 left-12 text-[10px] text-muted-foreground/60 font-medium z-10">
            Optimizar Mezcla
          </div>
          <div className="absolute top-2 right-4 text-[10px] text-muted-foreground/60 font-medium z-10">
            Categorías Core
          </div>
          <div className="absolute bottom-12 left-12 text-[10px] text-muted-foreground/60 font-medium z-10">
            Baja Prioridad
          </div>
          <div className="absolute bottom-12 right-4 text-[10px] text-muted-foreground/60 font-medium z-10">
            Oportunidad de Expansión
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />

              <ReferenceArea x1={0}  x2={50}  y1={50} y2={100} fill={DI_COLORS.warning} fillOpacity={0.03} />
              <ReferenceArea x1={50} x2={100} y1={50} y2={100} fill={DI_COLORS.positive} fillOpacity={0.03} />
              <ReferenceArea x1={0}  x2={50}  y1={0}  y2={50}  fill={DI_COLORS.slate} fillOpacity={0.03} />
              <ReferenceArea x1={50} x2={100} y1={0}  y2={50}  fill={DI_COLORS.neutral} fillOpacity={0.03} />

              <XAxis
                type="number"
                dataKey="penetration"
                name="Penetración de Mercado"
                domain={[0, 100]}
                tickLine={false}
                axisLine={{ className: "stroke-border/40" }}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                label={{
                  value: "Penetración de Mercado (%)",
                  position: "bottom",
                  offset: 0,
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <YAxis
                type="number"
                dataKey="revenue"
                name="Contribución de Ingresos"
                domain={[0, 100]}
                tickLine={false}
                axisLine={{ className: "stroke-border/40" }}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                label={{
                  value: "Contribución de Ingresos (%)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <ZAxis type="number" dataKey="sales" range={[200, 1200]} />

              <ReferenceLine x={50} className="stroke-muted-foreground/40" strokeDasharray="4 4" />
              <ReferenceLine y={50} className="stroke-muted-foreground/40" strokeDasharray="4 4" />

              <Tooltip content={<CustomTooltip />} />

              <Scatter data={categoryLandscapeData} cursor="pointer">
                {categoryLandscapeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getGrowthColor(entry.growth)}
                    fillOpacity={
                      selectedCategory === null || selectedCategory === entry.name ? 0.8 : 0.3
                    }
                    stroke={selectedCategory === entry.name ? "hsl(var(--foreground))" : "transparent"}
                    strokeWidth={selectedCategory === entry.name ? 2 : 0}
                    onClick={() => handleClick(entry)}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categoryLandscapeData.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleClick(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat.name
                  ? "bg-foreground text-background"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
