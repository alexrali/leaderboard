"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts"

interface HorizontalBarData {
  name: string
  value: number
  target?: number
  color?: string
}

interface HorizontalBarChartProps {
  data: HorizontalBarData[]
  unit?: string
  width?: number
}

export function HorizontalBarChart({
  data,
  unit = "",
}: HorizontalBarChartProps) {
  const max = Math.max(...data.map(d => d.value))

  return (
    <ResponsiveContainer width="100%" height={data.length * 40 + 40}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
      >
        <XAxis
          type="number"
          domain={[0, max * 1.1]}
          hide
        />
        <YAxis
          type="category"
          dataKey="name"
          width={55}
          tick={{ fontSize: 12, fill: "var(--neutral-600)", fontFamily: "var(--font-sans)" }}
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
        />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          animationBegin={0}
          animationDuration={500}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color ?? "var(--primary)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
