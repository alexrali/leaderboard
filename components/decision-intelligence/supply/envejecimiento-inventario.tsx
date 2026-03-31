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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts"
import { agingData } from "../mock-data/supply"

const colors = {
  fresh: "#22C55E",
  active: "#3B82F6",
  slowMoving: "#EAB308",
  deadStock: "#EF4444",
}

const totals = agingData.reduce(
  (acc, item) => ({
    fresh: acc.fresh + item.fresh,
    active: acc.active + item.active,
    slowMoving: acc.slowMoving + item.slowMoving,
    deadStock: acc.deadStock + item.deadStock,
  }),
  { fresh: 0, active: 0, slowMoving: 0, deadStock: 0 }
)

const totalSum = totals.fresh + totals.active + totals.slowMoving + totals.deadStock
const inactivePercent = Math.round(
  ((totals.slowMoving + totals.deadStock) / totalSum) * 100
)

const n = agingData.length

export function EnvejecimientoInventario() {
  return (
    <Card className="bg-card border-border shadow-sm h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold text-foreground">
              Envejecimiento y Rotación de Inventario
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Distribución del inventario por antigüedad</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Insight Banner */}
        <div className="mb-4">
          <Badge
            variant="secondary"
            className="bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/30 px-3 py-1.5 text-xs font-medium"
          >
            {inactivePercent}% del inventario está inactivo ({">"}60 días)
          </Badge>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded" style={{ backgroundColor: colors.fresh }} />
            <span className="text-xs text-muted-foreground">Fresco (0-7d)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded" style={{ backgroundColor: colors.active }} />
            <span className="text-xs text-muted-foreground">Activo (7-30d)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded" style={{ backgroundColor: colors.slowMoving }} />
            <span className="text-xs text-muted-foreground">Lento (30-90d)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded" style={{ backgroundColor: colors.deadStock }} />
            <span className="text-xs text-muted-foreground">Muerto (90+d)</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={agingData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              barSize={20}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#64748B" }}
                axisLine={{ stroke: "#E2E8F0" }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 11, fill: "#1F2937" }}
                axisLine={false}
                tickLine={false}
                width={85}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name === "fresh"
                    ? "Fresco"
                    : name === "active"
                    ? "Activo"
                    : name === "slowMoving"
                    ? "Lento"
                    : "Muerto",
                ]}
              />
              <Bar dataKey="fresh" stackId="a" fill={colors.fresh} radius={[0, 0, 0, 0]} />
              <Bar dataKey="active" stackId="a" fill={colors.active} />
              <Bar dataKey="slowMoving" stackId="a" fill={colors.slowMoving} />
              <Bar dataKey="deadStock" stackId="a" fill={colors.deadStock} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-lg font-bold text-[#22C55E]">
              {Math.round(totals.fresh / n)}%
            </p>
            <p className="text-xs text-muted-foreground">Prom Fresco</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#3B82F6]">
              {Math.round(totals.active / n)}%
            </p>
            <p className="text-xs text-muted-foreground">Prom Activo</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#EAB308]">
              {Math.round(totals.slowMoving / n)}%
            </p>
            <p className="text-xs text-muted-foreground">Prom Lento</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#EF4444]">
              {Math.round(totals.deadStock / n)}%
            </p>
            <p className="text-xs text-muted-foreground">Prom Muerto</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
