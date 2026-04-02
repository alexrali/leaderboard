"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
} from "recharts"
import { ZoneHeaderBar, ZoneInsight, Legend } from "../shared/zone-header"
import { CHART, DI_COLORS } from "../shared/di-tokens"
import { waterfallRawData } from "../mock-data/network"
import type { WaterfallItem } from "../mock-data/network"

interface WaterfallBar {
  name: string
  value: number
  displayValue: number
  isTotal?: boolean
  start: number
  fill: string
}

const buildWaterfallData = (raw: WaterfallItem[]): WaterfallBar[] => {
  const result: WaterfallBar[] = []
  let runningTotal = 0

  raw.forEach((item, index) => {
    if (item.isTotal) {
      result.push({
        name: item.name,
        value: item.value,
        displayValue: item.value,
        isTotal: true,
        start: 0,
        fill: CHART.total,
      })
      if (index === 0) {
        runningTotal = item.value
      }
    } else {
      const start = item.value >= 0 ? runningTotal : runningTotal + item.value
      result.push({
        name: item.name,
        value: Math.abs(item.value),
        displayValue: item.value,
        start,
        fill: item.value >= 0 ? CHART.growth : CHART.decline,
      })
      runningTotal += item.value
    }
  })

  return result
}

const waterfallData = buildWaterfallData(waterfallRawData)

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: WaterfallBar }>
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-card rounded-xl p-3 shadow-lg shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px]">
        <p className="font-semibold text-foreground mb-1">{data.name}</p>
        <p
          className="text-lg font-semibold"
          style={{ color: data.displayValue >= 0 ? CHART.growth : CHART.decline }}
        >
          {data.displayValue >= 0 ? "+" : ""}${data.displayValue}K
        </p>
      </div>
    )
  }
  return null
}

const baseValue   = waterfallRawData[0].value
const positiveSum = waterfallRawData.filter((d) => !d.isTotal && d.value > 0).reduce((a, b) => a + b.value, 0)
const negativeSum = waterfallRawData.filter((d) => !d.isTotal && d.value < 0).reduce((a, b) => a + b.value, 0)
const netResult   = waterfallRawData.find((d) => d.isTotal && d !== waterfallRawData[0])?.value ?? 0

export function CascadaCrecimiento() {
  return (
    <div className="animate-in fade-in duration-500" style={{ animationDelay: "300ms" }}>
      <ZoneHeaderBar
        title="DESCOMPOSICION DE CRECIMIENTO"
        right={
          <Legend
            items={[
              { color: CHART.growth, label: "Impulsor Positivo" },
              { color: CHART.decline, label: "Impulsor Negativo" },
              { color: CHART.total, label: "Total" },
            ]}
          />
        }
      />
      <div className="px-6 py-5">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={waterfallData}
              margin={{ top: 30, right: 30, bottom: 20, left: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fill: DI_COLORS.slate, fontSize: 12, fontFamily: "var(--font-sans)" }}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fill: DI_COLORS.slate, fontSize: 11 }}
                tickFormatter={(v) => `$${v}K`}
                domain={[0, 2000]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />

              <Bar dataKey="start" stackId="stack" fill="transparent" />

              <Bar dataKey="value" stackId="stack" radius={[4, 4, 0, 0]}>
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="displayValue"
                  position="top"
                  formatter={(v: number) => `${v >= 0 ? "+" : ""}$${v}K`}
                  style={{ fill: "hsl(var(--foreground))", fontSize: 10, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Base</p>
            <p className="text-lg font-semibold text-foreground">${baseValue}K</p>
          </div>
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Crecimiento</p>
            <p className="text-lg font-semibold" style={{ color: CHART.growth }}>+${positiveSum}K</p>
          </div>
          <div className="text-center p-3 bg-red-500/10 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Perdidas</p>
            <p className="text-lg font-semibold" style={{ color: CHART.decline }}>${negativeSum}K</p>
          </div>
          <div className="text-center p-3 bg-primary/5 rounded-lg shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px]">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Resultado Neto</p>
            <p className="text-lg font-semibold text-foreground">${netResult}K</p>
          </div>
        </div>

        <ZoneInsight
          message="Crecimiento impulsado 70% por expansion, pero margenes en decline (-1.2 pts)"
          variant="success"
        />
      </div>
    </div>
  )
}
