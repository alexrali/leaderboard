"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MemberRangeSummary } from "@/lib/supabase"

interface EquityUeChartProps {
  members: MemberRangeSummary[]
}

export function EquityUeChart({ members }: EquityUeChartProps) {
  const { data, avg } = useMemo(() => {
    const sorted = [...members].sort((a, b) => b.total_ue - a.total_ue)
    const avg =
      sorted.length ? sorted.reduce((s, m) => s + m.total_ue, 0) / sorted.length : 0
    return { data: sorted, avg }
  }, [members])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">UE Total por Miembro</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="worker_name"
              tick={{ fontSize: 11 }}
              width={90}
              tickFormatter={(v: string) => v.split(" ")[0]}
            />
            <Tooltip
              formatter={(value: number) => {
                const delta = value - avg
                const sign = delta >= 0 ? "+" : ""
                return [
                  `${value.toFixed(1)} UE (${sign}${delta.toFixed(1)} vs prom.)`,
                  "UE Total",
                ]
              }}
            />
            <ReferenceLine
              x={avg}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 2"
              label={{ value: "Prom.", position: "top", fontSize: 10 }}
            />
            <Bar dataKey="total_ue" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.worker_key}
                  fill={
                    entry.total_ue >= avg
                      ? "hsl(var(--primary))"
                      : "hsl(var(--warning))"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
