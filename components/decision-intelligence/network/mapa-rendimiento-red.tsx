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
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Network } from "lucide-react"
import { CardHeaderContent, InsightBanner, Legend } from "../shared/card-header"
import { storePerformanceData } from "../mock-data/network"
import type { StorePerformance } from "../mock-data/network"

const getStatusColor = (status: StorePerformance["status"]) => {
  switch (status) {
    case "alto-rendimiento":
      return "#22C55E"
    case "objetivo-crecimiento":
      return "#3B82F6"
    case "en-riesgo":
      return "#F59E0B"
    case "inactivo":
      return "#9CA3AF"
    default:
      return "#64748B"
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
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
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
              className={`pt-1 border-t border-border text-sm font-medium ${
                data.growth > 0 ? "text-[#22C55E]" : "text-[#EF4444]"
              }`}
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
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardHeaderContent
          icon={Network}
          iconColor="#3B82F6"
          title="Mapa de Rendimiento de Red"
          description="Distribución de mercado vs índice de rentabilidad"
          actions={
            <Legend
              items={[
                { color: "#22C55E", label: "Alto Rendimiento" },
                { color: "#3B82F6", label: "Objetivo Crecimiento" },
                { color: "#F59E0B", label: "En Riesgo" },
                { color: "#9CA3AF", label: "Inactivo" },
              ]}
            />
          }
        />
        <div className="mt-4">
          <InsightBanner
            message="3 sucursales representan 42% de ingresos perdidos"
            variant="warning"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.5} />

              {/* Áreas de cuadrante */}
              <ReferenceArea x1={0} x2={300} y1={20} y2={35} fill="#22C55E" fillOpacity={0.03} />
              <ReferenceArea x1={300} x2={500} y1={20} y2={35} fill="#22C55E" fillOpacity={0.06} />
              <ReferenceArea x1={0} x2={300} y1={5} y2={20} fill="#64748B" fillOpacity={0.03} />
              <ReferenceArea x1={300} x2={500} y1={5} y2={20} fill="#F59E0B" fillOpacity={0.03} />

              {/* Divisores de cuadrante */}
              <ReferenceLine x={300} stroke="#CBD5E1" strokeDasharray="4 4" />
              <ReferenceLine y={20} stroke="#CBD5E1" strokeDasharray="4 4" />

              <XAxis
                type="number"
                dataKey="revenue"
                name="Ingresos"
                domain={[0, 500]}
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
                tick={{ fill: "#64748B", fontSize: 11 }}
                label={{
                  value: "Volumen de Ingresos ($K)",
                  position: "bottom",
                  offset: 20,
                  style: { fill: "#64748B", fontSize: 11, fontWeight: 500 },
                }}
              />
              <YAxis
                type="number"
                dataKey="margin"
                name="Margen"
                domain={[5, 35]}
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
                tick={{ fill: "#64748B", fontSize: 11 }}
                label={{
                  value: "Margen de Ganancia (%)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  style: { fill: "#64748B", fontSize: 11, fontWeight: 500 },
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
                    stroke={entry.tag ? "#1F2937" : "transparent"}
                    strokeWidth={entry.tag ? 2 : 0}
                    r={Math.sqrt(entry.volume) / 12}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Etiquetas de cuadrante */}
          <div className="absolute top-8 left-16 text-[10px] font-medium text-muted-foreground bg-card/80 px-2 py-1 rounded">
            Expandir Distribución
          </div>
          <div className="absolute top-8 right-16 text-[10px] font-medium text-[#22C55E] bg-card/80 px-2 py-1 rounded">
            Top Performers
          </div>
          <div className="absolute bottom-16 left-16 text-[10px] font-medium text-muted-foreground bg-card/80 px-2 py-1 rounded">
            Subdesarrollado
          </div>
          <div className="absolute bottom-16 right-16 text-[10px] font-medium text-[#F59E0B] bg-card/80 px-2 py-1 rounded">
            Ajustar Precios
          </div>
        </div>

        {/* Sucursales destacadas */}
        <div className="flex gap-3 mt-4 flex-wrap">
          {highlightedStores.map((store) => (
            <div
              key={store.id}
              className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg border border-border"
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: getStatusColor(store.status) }}
              />
              <span className="text-sm font-medium text-foreground">{store.name}</span>
              {store.growth !== undefined && (
                <span
                  className={`text-xs font-medium ${
                    store.growth > 0 ? "text-[#22C55E]" : "text-[#EF4444]"
                  }`}
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
                      ? "border-[#22C55E]/30 text-[#22C55E] bg-[#22C55E]/5"
                      : "border-[#F59E0B]/30 text-[#F59E0B] bg-[#F59E0B]/5"
                  }`}
                >
                  {store.tag}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
