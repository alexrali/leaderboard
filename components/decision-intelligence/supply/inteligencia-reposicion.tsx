"use client"

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
import { ZoneHeaderBar, ZoneInsight } from "../shared/zone-header"
import { CHART, DI_COLORS } from "../shared/di-tokens"
import { replenishmentData, type ReplenishmentPoint } from "../mock-data/supply"

function getStatusColor(status: ReplenishmentPoint["status"]) {
  switch (status) {
    case "óptimo":
      return CHART.growth
    case "sobre-pedido":
      return CHART.total
    case "sub-pedido":
      return CHART.decline
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
      <div className="bg-card rounded-lg shadow-lg shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] p-3">
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
                  ? "bg-emerald-100 text-emerald-800"
                  : data.status === "sobre-pedido"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-red-100 text-red-800"
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
    <div className="animate-in fade-in duration-500 h-full" style={{ animationDelay: "300ms" }}>
      <ZoneHeaderBar
        title="EFICIENCIA DE REPOSICIÓN"
        right={
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
        }
      />
      <div className="px-6 py-5">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Óptimo ({optimalCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">Sobre-pedido ({overCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Sub-pedido ({underCount})</span>
          </div>
        </div>

        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

              <ReferenceArea
                x1={0} x2={50} y1={70} y2={100}
                fill={CHART.total} fillOpacity={0.05}
                stroke="none"
              />
              <ReferenceArea
                x1={50} x2={100} y1={0} y2={50}
                fill={CHART.decline} fillOpacity={0.05}
                stroke="none"
              />
              <ReferenceArea
                x1={20} x2={60} y1={50} y2={80}
                fill={CHART.growth} fillOpacity={0.05}
                stroke="none"
              />

              <XAxis
                type="number"
                dataKey="demandVariability"
                domain={[0, 100]}
                tick={{ fontSize: 12, fontFamily: "var(--font-sans)", fill: DI_COLORS.slate }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                label={{
                  value: "Variabilidad de Demanda",
                  position: "bottom",
                  offset: -5,
                  style: { fontSize: 11, fill: DI_COLORS.slate },
                }}
              />
              <YAxis
                type="number"
                dataKey="replenishmentFrequency"
                domain={[0, 100]}
                tick={{ fontSize: 12, fontFamily: "var(--font-sans)", fill: DI_COLORS.slate }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                label={{
                  value: "Frecuencia de Reposición",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  style: { fontSize: 11, fill: DI_COLORS.slate },
                }}
              />
              <ZAxis type="number" dataKey="volume" range={[80, 400]} />
              <RechartsTooltip content={<CustomTooltip />} />

              <ReferenceLine
                segment={[{ x: 0, y: 50 }, { x: 100, y: 50 }]}
                stroke="hsl(var(--muted-foreground))"
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

        <div className="flex justify-between mt-2 px-4">
          <div className="text-[10px] text-blue-500 font-medium">
            Zona sobre-pedido
          </div>
          <div className="text-[10px] text-emerald-500 font-medium">
            Zona óptima
          </div>
          <div className="text-[10px] text-red-500 font-medium">
            Zona sub-pedido
          </div>
        </div>
      </div>
    </div>
  )
}
