"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"
import { useHourlyProgress } from "@/hooks/use-leaderboard-queries"
import type { DayProgress } from "@/lib/leaderboard-data"

function buildCumulative(data: DayProgress[]) {
  let running = 0
  return data.map((row) => {
    running += row.teamUE ?? 0
    return {
      hour: row.hour,
      cumulativeUE: parseFloat(running.toFixed(1)),
      hourUE: parseFloat((row.teamUE ?? 0).toFixed(1)),
    }
  })
}

export function TeamPaceChart() {
  const { data = [], isLoading } = useHourlyProgress()

  const chartData = buildCumulative(data)
  const latestUE = chartData.at(-1)?.cumulativeUE ?? 0

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Ritmo del Día</CardTitle>
        </CardHeader>
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground text-sm">Turno aún no iniciado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Ritmo del Día — UE Acumulada</CardTitle>
          <span className="text-muted-foreground text-xs">
            Total actual:{" "}
            <span className="text-foreground font-bold">
              {latestUE.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
            </span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="panelUEGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const cumUE = payload.find((p) => p.dataKey === "cumulativeUE")
                  const hourUE = payload.find((p) => p.dataKey === "hourUE")
                  return (
                    <div className="border-border bg-card rounded-xl border px-4 py-3 shadow-lg">
                      <p className="text-card-foreground mb-1.5 text-xs font-semibold">{label}</p>
                      <p className="text-muted-foreground text-xs">
                        Acumulado:{" "}
                        <span className="text-card-foreground font-mono font-bold">
                          {Number(cumUE?.value ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 1 })}
                        </span>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Esta hora:{" "}
                        <span className="text-card-foreground font-mono font-bold">
                          +{Number(hourUE?.value ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 1 })}
                        </span>
                      </p>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulativeUE"
                stroke="#16a34a"
                strokeWidth={2}
                fill="url(#panelUEGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#22c55e" }}
              />
              {/* Hidden area for hourUE so tooltip can read it */}
              <Area
                type="monotone"
                dataKey="hourUE"
                stroke="transparent"
                fill="transparent"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
