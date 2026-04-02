"use client"

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts"

interface LineChartData {
  week: string
  value: number
}

interface TrendLineChartProps {
  data: LineChartData[]
  color?: string
  unit?: string
  height?: number
}

export function TrendLineChart({
  data,
  color = "var(--primary)",
  unit = "",
  height = 200
}: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--neutral-200)"
          vertical={false}
        />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 12, fill: "var(--neutral-500)", fontFamily: "var(--font-sans)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--neutral-500)", fontFamily: "var(--font-sans)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--neutral-900)",
            border: "none",
            borderRadius: "6px",
            color: "var(--neutral-50)",
            fontSize: "12px",
            padding: "8px 12px",
          }}
          formatter={(value: number) => [value.toFixed(1) + unit, ""]}
          labelFormatter={(label) => `Week ${label}`}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
