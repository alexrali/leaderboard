"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
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
import { CardHeaderContent } from "../shared/card-header"
import {
  momentumTrendData,
  categoryStats,
  inflectionPoints,
} from "../mock-data/category"

const CATEGORY_COLORS: Record<string, string> = {
  Aceites: "#F59E0B",
  Limpieza: "#3B82F6",
  "C. Personal": "#EC4899",
  Alimentos: "#22C55E",
  Bebidas: "#8B5CF6",
}

// Map category name to the dataKey in MomentumPoint
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
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-4">
        <CardHeaderContent
          icon={TrendingUp}
          iconColor="#3B82F6"
          title="Impulsores de Crecimiento en el Tiempo"
          description="Crecimiento por categoría vs mercado total (indexado a 100)"
        />

        {/* Category stats */}
        <div className="mt-4 flex flex-wrap gap-3">
          {categoryStats.map((cat) => {
            const color = CATEGORY_COLORS[cat.category] ?? "#64748B"
            const isUp = cat.vsMarket >= 0
            return (
              <div
                key={cat.category}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all ${
                  selectedCategory === cat.category
                    ? "border-foreground/30 bg-secondary/50"
                    : "border-border/50 bg-background"
                }`}
              >
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {cat.category}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Actual:</span>
                    <span className="font-medium" style={{ color }}>
                      {cat.index}
                    </span>
                    <span className="text-muted-foreground">vs Mercado:</span>
                    <span
                      className={`font-medium ${
                        isUp ? "text-[#22C55E]" : "text-[#EF4444]"
                      }`}
                    >
                      {isUp ? "+" : ""}
                      {cat.vsMarket}%
                    </span>
                  </div>
                </div>
                {isUp ? (
                  <ArrowUpRight className="h-4 w-4 text-[#22C55E]" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-[#EF4444]" />
                )}
              </div>
            )
          })}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={momentumTrendData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                tick={{ fontSize: 11, fill: "#64748B" }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                tick={{ fontSize: 11, fill: "#64748B" }}
                domain={[70, 160]}
                label={{
                  value: "Índice (Base 100)",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 11,
                  fill: "#64748B",
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

              {/* Market baseline — dashed */}
              <Line
                type="monotone"
                dataKey="mercado"
                stroke="#94A3B8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="mercado"
              />

              {/* Category lines */}
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

              {/* Inflection points */}
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
                    fill="#1F2937"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Inflection points legend */}
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
      </CardContent>
    </Card>
  )
}
