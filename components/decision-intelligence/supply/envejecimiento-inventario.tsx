"use client"

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
import { ZoneHeaderBar, ZoneInsight } from "../shared/zone-header"
import { CHART, DI_COLORS } from "../shared/di-tokens"
import { agingData } from "../mock-data/supply"

const colors = {
  fresh: CHART.growth,
  active: CHART.total,
  slowMoving: CHART.opportunity,
  deadStock: CHART.decline,
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
    <div className="animate-in fade-in duration-500 h-full" style={{ animationDelay: "200ms" }}>
      <ZoneHeaderBar
        title="ENVEJECIMIENTO DE INVENTARIO"
        right={
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
        }
      />
      <ZoneInsight
        message={`${inactivePercent}% del inventario está inactivo (>60 días)`}
        variant="warning"
      />
      <div className="px-6 py-5">
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

        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={agingData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              barSize={20}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12, fontFamily: "var(--font-sans)", fill: DI_COLORS.slate }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                axisLine={false}
                tickLine={false}
                width={85}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
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

        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#ebebeb]">
          <div className="text-center">
            <p className="text-lg font-semibold text-emerald-500">
              {Math.round(totals.fresh / n)}%
            </p>
            <p className="text-xs text-muted-foreground">Prom Fresco</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-500">
              {Math.round(totals.active / n)}%
            </p>
            <p className="text-xs text-muted-foreground">Prom Activo</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-amber-500">
              {Math.round(totals.slowMoving / n)}%
            </p>
            <p className="text-xs text-muted-foreground">Prom Lento</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-red-500">
              {Math.round(totals.deadStock / n)}%
            </p>
            <p className="text-xs text-muted-foreground">Prom Muerto</p>
          </div>
        </div>
      </div>
    </div>
  )
}
