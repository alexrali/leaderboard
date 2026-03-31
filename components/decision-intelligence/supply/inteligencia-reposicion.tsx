"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ZAxis,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ReferenceArea,
} from "recharts"
import { replenishmentData, type ReplenishmentPoint } from "../mock-data/supply"

function getStatusColor(status: ReplenishmentPoint["status"]) {
  switch (status) {
    case "óptimo":
      return "#22C55E"
    case "sobre-pedido":
      return "#3B82F6"
    case "sub-pedido":
      return "#EF4444"
  }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ReplenishmentPoint }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-foreground mb-2">{data.name}</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Variabilidad de Demanda:</span>
            <span className="font-medium text-foreground">{data.demandVariability}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Frecuencia de Reposición:</span>
            <span className="font-medium text-foreground">{data.replenishmentFrequency}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Volumen:</span>
            <span className="font-medium text-foreground">{data.volume.toLocaleString()} uds</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Estado:</span>
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 ${
                data.status === "óptimo"
                  ? "bg-[#DCFCE7] text-[#166534]"
                  : data.status === "sobre-pedido"
                  ? "bg-[#DBEAFE] text-[#1E40AF]"
                  : "bg-[#FEE2E2] text-[#991B1B]"
              }`}
            >
              {data.status === "óptimo"
                ? "Óptimo"
                : data.status === "sobre-pedido"
                ? "Sobre-pedido"
                : "Sub-pedido"}
            </Badge>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function InteligenciaReposicion() {
  const optimalCount = replenishmentData.filter((d) => d.status === "óptimo").length
  const overCount = replenishmentData.filter((d) => d.status === "sobre-pedido").length
  const underCount = replenishmentData.filter((d) => d.status === "sub-pedido").length

  return (
    <Card className="bg-card border-border shadow-sm h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold text-foreground">
              Eficiencia de Reposición
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Patrones de pedido por sucursal y hub</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#22C55E]" />
            <span className="text-xs text-muted-foreground">Óptimo ({optimalCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#3B82F6]" />
            <span className="text-xs text-muted-foreground">Sobre-pedido ({overCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
            <span className="text-xs text-muted-foreground">Sub-pedido ({underCount})</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />

              {/* Zone areas */}
              <ReferenceArea
                x1={0} x2={50} y1={70} y2={100}
                fill="#3B82F6" fillOpacity={0.05}
                stroke="none"
              />
              <ReferenceArea
                x1={50} x2={100} y1={0} y2={50}
                fill="#EF4444" fillOpacity={0.05}
                stroke="none"
              />
              <ReferenceArea
                x1={20} x2={60} y1={50} y2={80}
                fill="#22C55E" fillOpacity={0.05}
                stroke="none"
              />

              <XAxis
                type="number"
                dataKey="demandVariability"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#64748B" }}
                axisLine={{ stroke: "#E2E8F0" }}
                tickLine={false}
                label={{
                  value: "Variabilidad de Demanda",
                  position: "bottom",
                  offset: -5,
                  style: { fontSize: 11, fill: "#64748B" },
                }}
              />
              <YAxis
                type="number"
                dataKey="replenishmentFrequency"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#64748B" }}
                axisLine={{ stroke: "#E2E8F0" }}
                tickLine={false}
                label={{
                  value: "Frecuencia de Reposición",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  style: { fontSize: 11, fill: "#64748B" },
                }}
              />
              <ZAxis type="number" dataKey="volume" range={[80, 400]} />
              <RechartsTooltip content={<CustomTooltip />} />

              {/* Reference line */}
              <ReferenceLine
                segment={[{ x: 0, y: 50 }, { x: 100, y: 50 }]}
                stroke="#94A3B8"
                strokeDasharray="4 4"
                strokeWidth={1}
              />

              {replenishmentData.map((entry, index) => (
                <Scatter
                  key={index}
                  data={[entry]}
                  fill={getStatusColor(entry.status)}
                  fillOpacity={0.8}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Zone labels */}
        <div className="flex justify-between mt-2 px-4">
          <div className="text-[10px] text-[#3B82F6] font-medium">
            Zona sobre-pedido
          </div>
          <div className="text-[10px] text-[#22C55E] font-medium">
            Zona óptima
          </div>
          <div className="text-[10px] text-[#EF4444] font-medium">
            Zona sub-pedido
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
