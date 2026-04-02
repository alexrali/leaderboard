"use client"

import { useState } from "react"
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
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { ZoneHeaderBar, ZoneInsight, Legend } from "../shared/zone-header"
import { DI_COLORS, CHART } from "../shared/di-tokens"
import { storePerformanceData } from "../mock-data/network"
import type { StorePerformance } from "../mock-data/network"

const getStatusColor = (status: StorePerformance["status"]) => {
  switch (status) {
    case "alto-rendimiento":
      return CHART.growth
    case "objetivo-crecimiento":
      return CHART.total
    case "en-riesgo":
      return CHART.opportunity
    case "inactivo":
      return DI_COLORS.slate
    default:
      return DI_COLORS.slate
  }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: StorePerformance }>
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-card rounded-xl p-4 shadow-lg shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px]">
        <p className="font-semibold text-foreground text-sm mb-2">{data.name}</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Ingresos</span>
            <span className="text-foreground font-medium">${data.revenue}K</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Margen</span>
            <span className="text-foreground font-medium">{data.margin}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Volumen</span>
            <span className="text-foreground font-medium">{data.volume} uds</span>
          </div>
          {data.growth !== undefined && (
            <div
              className="pt-1 border-t border-[#ebebeb] text-sm font-medium"
              style={{ color: data.growth > 0 ? CHART.growth : CHART.decline }}
            >
              {data.growth > 0 ? "+" : ""}
              {data.growth}% Crecimiento
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}

export function MapaRendimientoRed() {
  const [hoveredStore, setHoveredStore] = useState<string | null>(null)

  const highlightedStores = storePerformanceData.filter((s) => s.tag)

  return (
    <div className="animate-in fade-in duration-500" style={{ animationDelay: "0ms" }}>
      <ZoneHeaderBar
        title="RENDIMIENTO DE RED"
        right={
          <Legend
            items={[
              { color: CHART.growth, label: "Alto Rendimiento" },
              { color: CHART.total, label: "Objetivo Crecimiento" },
              { color: CHART.opportunity, label: "En Riesgo" },
              { color: DI_COLORS.slate, label: "Inactivo" },
            ]}
          />
        }
      />
      <ZoneInsight
        message="3 sucursales representan 42% de ingresos perdidos"
        variant="warning"
      />
      <div className="px-6 py-5">
        <div className="relative h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />

              <ReferenceArea x1={0} x2={300} y1={20} y2={35} fill={CHART.growth} fillOpacity={0.03} />
              <ReferenceArea x1={300} x2={500} y1={20} y2={35} fill={CHART.growth} fillOpacity={0.06} />
              <ReferenceArea x1={0} x2={300} y1={5} y2={20} fill={DI_COLORS.slate} fillOpacity={0.03} />
              <ReferenceArea x1={300} x2={500} y1={5} y2={20} fill={CHART.opportunity} fillOpacity={0.03} />

              <ReferenceLine x={300} stroke="hsl(var(--border))" strokeDasharray="4 4" />
              <ReferenceLine y={20} stroke="hsl(var(--border))" strokeDasharray="4 4" />

              <XAxis
                type="number"
                dataKey="revenue"
                name="Ingresos"
                domain={[0, 500]}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fill: DI_COLORS.slate, fontSize: 11 }}
                label={{
                  value: "Volumen de Ingresos ($K)",
                  position: "bottom",
                  offset: 20,
                  style: { fill: DI_COLORS.slate, fontSize: 11, fontWeight: 500 },
                }}
              />
              <YAxis
                type="number"
                dataKey="margin"
                name="Margen"
                domain={[5, 35]}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fill: DI_COLORS.slate, fontSize: 11 }}
                label={{
                  value: "Margen de Ganancia (%)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  style: { fill: DI_COLORS.slate, fontSize: 11, fontWeight: 500 },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                data={storePerformanceData}
                onMouseEnter={(data: StorePerformance) => setHoveredStore(data.id)}
                onMouseLeave={() => setHoveredStore(null)}
              >
                {storePerformanceData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={getStatusColor(entry.status)}
                    fillOpacity={hoveredStore === entry.id ? 1 : 0.7}
                    stroke={entry.tag ? "hsl(var(--foreground))" : "transparent"}
                    strokeWidth={entry.tag ? 2 : 0}
                    r={Math.sqrt(entry.volume) / 12}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          <div className="absolute top-8 left-16 text-[10px] font-medium text-muted-foreground bg-card/80 px-2 py-1 rounded">
            Expandir Distribución
          </div>
          <div className="absolute top-8 right-16 text-[10px] font-medium bg-card/80 px-2 py-1 rounded" style={{ color: CHART.growth }}>
            Top Performers
          </div>
          <div className="absolute bottom-16 left-16 text-[10px] font-medium text-muted-foreground bg-card/80 px-2 py-1 rounded">
            Subdesarrollado
          </div>
          <div className="absolute bottom-16 right-16 text-[10px] font-medium bg-card/80 px-2 py-1 rounded" style={{ color: CHART.opportunity }}>
            Ajustar Precios
          </div>
        </div>

        <div className="flex gap-3 mt-4 flex-wrap">
          {highlightedStores.map((store) => (
            <div
              key={store.id}
              className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px]"
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: getStatusColor(store.status) }}
              />
              <span className="text-sm font-medium text-foreground">{store.name}</span>
              {store.growth !== undefined && (
                <span
                  className="text-xs font-medium"
                  style={{ color: store.growth > 0 ? CHART.growth : CHART.decline }}
                >
                  {store.growth > 0 ? "+" : ""}
                  {store.growth}%
                </span>
              )}
              {store.tag && (
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    store.tag === "Top"
                      ? "border-green-500/30 text-green-500 bg-green-500/5"
                      : "border-amber-500/30 text-amber-500 bg-amber-500/5"
                  }`}
                >
                  {store.tag}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
