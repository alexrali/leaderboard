"use client"

import { useMemo } from "react"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MemberRangeSummary } from "@/lib/supabase"

interface EquityHoursChartProps {
  members: MemberRangeSummary[]
}

export function EquityHoursChart({ members }: EquityHoursChartProps) {
  const data = useMemo(
    () =>
      [...members]
        .sort((a, b) => b.total_hours - a.total_hours)
        .map((m) => ({
          name: m.worker_name.split(" ")[0],
          horas: parseFloat(m.total_hours.toFixed(1)),
          ue_por_hora: parseFloat(m.avg_ue_per_hour.toFixed(2)),
        })),
    [members]
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Horas Trabajadas vs Eficiencia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ left: 0, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              label={{ value: "Horas", angle: -90, position: "insideLeft", fontSize: 10 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              label={{ value: "UE/hr", angle: 90, position: "insideRight", fontSize: 10 }}
            />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              yAxisId="left"
              dataKey="horas"
              name="Horas trabajadas"
              fill="hsl(var(--primary))"
              fillOpacity={0.5}
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ue_por_hora"
              name="UE/hora"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
