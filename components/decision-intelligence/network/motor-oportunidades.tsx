"use client"

import { cn } from "@/lib/utils"
import { ZoneHeaderBar, ZoneInsight } from "../shared/zone-header"
import { gapMatrixData, gapCategories, categoryGaps } from "../mock-data/network"

const getGapColor = (value: number): string => {
  if (value >= 80) return "bg-red-500 text-white"
  if (value >= 60) return "bg-orange-500/80 text-white"
  if (value >= 40) return "bg-yellow-500/70 text-white"
  if (value >= 20) return "bg-lime-500/60 text-green-900"
  return "bg-green-500/40 text-green-900"
}

const topGapCells = [
  { store: "Suc. Insurgentes", category: "C. Personal", value: 92 },
  { store: "Suc. Insurgentes", category: "Alimentos",   value: 81 },
  { store: "Suc. Satélite",    category: "Alimentos",   value: 90 },
]

const isHighGap = (store: string, category: string): boolean => {
  return topGapCells.some((g) => g.store === store && g.category === category)
}

const allAvgGaps = gapMatrixData.map((r) => r.avgGap)
const overallAvg = (allAvgGaps.reduce((a, b) => a + b, 0) / allAvgGaps.length).toFixed(1)

export function MotorOportunidades() {
  return (
    <div className="animate-in fade-in duration-500" style={{ animationDelay: "100ms" }}>
      <ZoneHeaderBar title="ANÁLISIS DE BRECHAS" />
      <ZoneInsight
        message="Top 3 gaps representan +$240K de ingreso mensual no realizado"
        variant="warning"
      />
      <div className="px-6 py-5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-3 border-b border-[#ebebeb]">
                  Sucursal
                </th>
                {gapCategories.map((cat) => (
                  <th
                    key={cat}
                    className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-3 border-b border-[#ebebeb]"
                  >
                    {cat}
                  </th>
                ))}
                <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-3 border-b border-[#ebebeb] bg-secondary/30">
                  Gap Promedio
                </th>
              </tr>
            </thead>
            <tbody>
              {gapMatrixData.map((row, idx) => (
                <tr key={row.storeId} className={cn(idx % 2 === 0 ? "bg-card" : "bg-secondary/20")}>
                  <td className="p-3 border-b border-[#ebebeb]">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{row.store}</span>
                      <span className="text-[10px] text-muted-foreground">#{row.storeId}</span>
                    </div>
                  </td>
                  {gapCategories.map((cat) => {
                    const value = row.categories[cat]
                    const highlight = isHighGap(row.store, cat)
                    return (
                      <td key={cat} className="p-2 border-b border-[#ebebeb] text-center">
                        <div
                          className={cn(
                            "inline-flex items-center justify-center min-w-[44px] h-9 rounded-lg text-sm font-semibold transition-all",
                            getGapColor(value),
                            highlight && "ring-2 ring-red-500 ring-offset-2 ring-offset-card"
                          )}
                        >
                          {value}
                        </div>
                      </td>
                    )
                  })}
                   <td className="p-2 border-b border-[#ebebeb] text-center bg-secondary/30">
                     <span className="text-sm font-semibold text-foreground">{row.avgGap.toFixed(1)}</span>
                  </td>
                </tr>
              ))}
              <tr className="bg-primary/5">
                <td className="p-3 border-t-2 border-[#ebebeb]">
                  <span className="text-sm font-semibold text-foreground">Promedio Categoría</span>
                </td>
                {gapCategories.map((cat) => (
                  <td key={cat} className="p-2 border-t-2 border-[#ebebeb] text-center">
                    <span className="text-sm font-semibold text-foreground">
                      {categoryGaps[cat].toFixed(1)}
                    </span>
                  </td>
                ))}
                <td className="p-2 border-t-2 border-[#ebebeb] text-center bg-secondary/30">
                  <span className="text-sm font-semibold text-primary">{overallAvg}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-6 text-xs flex-wrap">
          <span className="text-muted-foreground font-medium">Gap Score:</span>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded bg-green-500/40" />
            <span className="text-muted-foreground">0–20</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded bg-lime-500/60" />
            <span className="text-muted-foreground">20–40</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded bg-yellow-500/70" />
            <span className="text-muted-foreground">40–60</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded bg-orange-500/80" />
            <span className="text-muted-foreground">60–80</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded bg-red-500" />
            <span className="text-muted-foreground">80+</span>
          </div>
        </div>
      </div>
    </div>
  )
}
