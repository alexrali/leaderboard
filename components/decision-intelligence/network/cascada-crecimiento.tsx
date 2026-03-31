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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

// Calcular posiciones del gráfico cascada
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
        fill: "#3B82F6",
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
        fill: item.value >= 0 ? "#22C55E" : "#EF4444",
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
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
        <p className="font-semibold text-foreground mb-1">{data.name}</p>
        <p
          className={`text-lg font-bold ${
            data.displayValue >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"
          }`}
        >
          {data.displayValue >= 0 ? "+" : ""}${data.displayValue}K
        </p>
      </div>
    )
  }
  return null
}

// Métricas de resumen calculadas desde los datos raw
const baseValue   = waterfallRawData[0].value
const positiveSum = waterfallRawData.filter((d) => !d.isTotal && d.value > 0).reduce((a, b) => a + b.value, 0)
const negativeSum = waterfallRawData.filter((d) => !d.isTotal && d.value < 0).reduce((a, b) => a + b.value, 0)
const netResult   = waterfallRawData.find((d) => d.isTotal && d !== waterfallRawData[0])?.value ?? 0

export function CascadaCrecimiento() {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Descomposición de Crecimiento vs Objetivo
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Análisis de impulsores y detractores de ingreso
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded bg-[#22C55E]" />
              <span className="text-muted-foreground">Impulsor Positivo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded bg-[#EF4444]" />
              <span className="text-muted-foreground">Impulsor Negativo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded bg-[#3B82F6]" />
              <span className="text-muted-foreground">Total</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={waterfallData}
              margin={{ top: 30, right: 30, bottom: 20, left: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E2E8F0"
                opacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
                tick={{ fill: "#64748B", fontSize: 10 }}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: "#CBD5E1" }}
                tick={{ fill: "#64748B", fontSize: 11 }}
                tickFormatter={(v) => `$${v}K`}
                domain={[0, 2000]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#CBD5E1" />

              {/* Barra invisible para efecto flotante */}
              <Bar dataKey="start" stackId="stack" fill="transparent" />

              {/* Barra visible */}
              <Bar dataKey="value" stackId="stack" radius={[4, 4, 0, 0]}>
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="displayValue"
                  position="top"
                  formatter={(v: number) => `${v >= 0 ? "+" : ""}$${v}K`}
                  style={{ fill: "#1F2937", fontSize: 10, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Métricas clave */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Base</p>
            <p className="text-lg font-bold text-foreground">${baseValue}K</p>
          </div>
          <div className="text-center p-3 bg-[#22C55E]/10 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Crecimiento</p>
            <p className="text-lg font-bold text-[#22C55E]">+${positiveSum}K</p>
          </div>
          <div className="text-center p-3 bg-[#EF4444]/10 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pérdidas</p>
            <p className="text-lg font-bold text-[#EF4444]">${negativeSum}K</p>
          </div>
          <div className="text-center p-3 bg-primary/5 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Resultado Neto</p>
            <p className="text-lg font-bold text-foreground">${netResult}K</p>
          </div>
        </div>

        {/* Banner de insight */}
        <div className="mt-4 px-4 py-3 bg-[#F0FDF4] border border-[#22C55E]/20 rounded-lg">
          <span className="text-sm font-medium text-[#166534]">
            Crecimiento impulsado 70% por expansión, pero márgenes en decline (–1.2 pts)
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
