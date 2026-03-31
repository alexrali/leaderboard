"use client"

import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Legend,
} from "recharts"
import { ZoneHeaderBar } from "../shared/zone-header"
import { DI_COLORS } from "../shared/di-tokens"
import {
  momentumTrendData,
  categoryStats,
  inflectionPoints,
} from "../mock-data/category"

const CATEGORY_COLORS: Record<string, string> = {
  Aceites: DI_COLORS.warning,
  Limpieza: DI_COLORS.neutral,
  "C. Personal": DI_COLORS.pink,
  Alimentos: DI_COLORS.positive,
  Bebidas: DI_COLORS.purple,
}

const CATEGORY_KEYS = ["Aceites", "Limpieza", "C. Personal", "Alimentos", "Bebidas"] as const

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        <div className="space-y-1.5 text-sm">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function MomentumCategoria({
  selectedCategory,
}: {
  selectedCategory: string | null
}) {
  return (
    <div className="animate-in fade-in duration-500" style={{ animationDelay: '300ms' }}>
      <ZoneHeaderBar title="MOMENTUM POR CATEGORÍA" />
      <div className="px-6 py-5">
        <div className="flex flex-wrap gap-3 mb-4">
          {categoryStats.map((cat) => {
            const color = CATEGORY_COLORS[cat.category] ?? DI_COLORS.slate
            const isUp = cat.vsMarket >= 0
            return (
              <div
                key={cat.category}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs ${
                  selectedCategory === cat.category
                    ? "border-foreground/30 bg-secondary/50"
                    : "border-border/50 bg-background"
                }`}
              >
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium text-foreground">{cat.category}</span>
                <span className="font-medium" style={{ color }}>{cat.index}</span>
                <span
                  className={`font-medium ${isUp ? "text-emerald-500" : "text-red-500"}`}
                >
                  {isUp ? "+" : ""}{cat.vsMarket}%
                </span>
                {isUp ? (
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
              </div>
            )
          })}
        </div>

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={momentumTrendData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={{ className: "stroke-border/40" }}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ className: "stroke-border/40" }}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                domain={[70, 160]}
                label={{
                  value: "Índice (Base 100)",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />

              <Line
                type="monotone"
                dataKey="mercado"
                className="stroke-muted-foreground/50"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="mercado"
              />

              {CATEGORY_KEYS.map((key) => {
                const color = CATEGORY_COLORS[key]
                const isSelected = selectedCategory === key
                const noSelection = selectedCategory === null
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={isSelected || noSelection ? 2.5 : 1.5}
                    strokeOpacity={isSelected || noSelection ? 1 : 0.3}
                    dot={false}
                    activeDot={{ r: 5, fill: color }}
                    name={key}
                  />
                )
              })}

              {inflectionPoints.map((point, index) => {
                const monthData = momentumTrendData.find(
                  (d) => d.month === point.month
                )
                const yVal = monthData
                  ? (monthData[point.category as keyof typeof monthData] as number)
                  : undefined
                if (yVal === undefined) return null
                return (
                  <ReferenceDot
                    key={index}
                    x={point.month}
                    y={yVal}
                    r={6}
                    fill="hsl(var(--foreground))"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {inflectionPoints.map((point, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs px-3 py-1.5 bg-secondary/30"
            >
              <div className="h-2 w-2 rounded-full bg-foreground mr-2 inline-block" />
              {point.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
