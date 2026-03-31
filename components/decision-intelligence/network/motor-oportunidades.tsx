"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Grid3X3 } from "lucide-react"
import { CardHeaderContent, InsightBanner } from "../shared/card-header"
import { gapMatrixData, gapCategories, categoryGaps } from "../mock-data/network"

const getGapColor = (value: number): string => {
  if (value >= 80) return "bg-[#EF4444] text-white"
  if (value >= 60) return "bg-[#F97316]/80 text-white"
  if (value >= 40) return "bg-[#EAB308]/70 text-white"
  if (value >= 20) return "bg-[#84CC16]/60 text-[#166534]"
  return "bg-[#22C55E]/40 text-[#166534]"
}

// Top 3 cells with the highest gap scores
const topGapCells = [
  { store: "Suc. Insurgentes", category: "C. Personal", value: 92 },
  { store: "Suc. Insurgentes", category: "Alimentos",   value: 81 },
  { store: "Suc. Satélite",    category: "Alimentos",   value: 90 },
]

const isHighGap = (store: string, category: string): boolean => {
  return topGapCells.some((g) => g.store === store && g.category === category)
}

// Compute overall average gap
const allAvgGaps = gapMatrixData.map((r) => r.avgGap)
const overallAvg = (allAvgGaps.reduce((a, b) => a + b, 0) / allAvgGaps.length).toFixed(1)

export function MotorOportunidades() {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardHeaderContent
          icon={Grid3X3}
          iconColor="#F59E0B"
          title="Motor de Oportunidades"
          description="Optimización de Gap Score por sucursal y categoría"
        />
        <div className="mt-4">
          <InsightBanner
            message="Top 3 gaps representan +$240K de ingreso mensual no realizado"
            variant="warning"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-3 border-b border-border">
                  Sucursal
                </th>
                {gapCategories.map((cat) => (
                  <th
                    key={cat}
                    className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-3 border-b border-border"
                  >
                    {cat}
                  </th>
                ))}
                <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-3 border-b border-border bg-secondary/30">
                  Gap Promedio
                </th>
              </tr>
            </thead>
            <tbody>
              {gapMatrixData.map((row, idx) => (
                <tr key={row.storeId} className={cn(idx % 2 === 0 ? "bg-card" : "bg-secondary/20")}>
                  <td className="p-3 border-b border-border">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{row.store}</span>
                      <span className="text-[10px] text-muted-foreground">#{row.storeId}</span>
                    </div>
                  </td>
                  {gapCategories.map((cat) => {
                    const value = row.categories[cat]
                    const highlight = isHighGap(row.store, cat)
                    return (
                      <td key={cat} className="p-2 border-b border-border text-center">
                        <div
                          className={cn(
                            "inline-flex items-center justify-center min-w-[44px] h-9 rounded-lg text-sm font-semibold transition-all",
                            getGapColor(value),
                            highlight && "ring-2 ring-[#EF4444] ring-offset-2 ring-offset-card"
                          )}
                        >
                          {value}
                        </div>
                      </td>
                    )
                  })}
                  <td className="p-2 border-b border-border text-center bg-secondary/30">
                    <span className="text-sm font-bold text-foreground">{row.avgGap.toFixed(1)}</span>
                  </td>
                </tr>
              ))}
              {/* Fila de promedios por categoría */}
              <tr className="bg-primary/5">
                <td className="p-3 border-t-2 border-border">
                  <span className="text-sm font-semibold text-foreground">Promedio Categoría</span>
                </td>
                {gapCategories.map((cat) => (
                  <td key={cat} className="p-2 border-t-2 border-border text-center">
                    <span className="text-sm font-bold text-foreground">
                      {categoryGaps[cat].toFixed(1)}
                    </span>
                  </td>
                ))}
                <td className="p-2 border-t-2 border-border text-center bg-secondary/30">
                  <span className="text-sm font-bold text-primary">{overallAvg}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Leyenda de colores */}
        <div className="mt-4 flex items-center gap-6 text-xs flex-wrap">
          <span className="text-muted-foreground font-medium">Gap Score:</span>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded bg-[#22C55E]/40" />
            <span className="text-muted-foreground">0–20</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded bg-[#84CC16]/60" />
            <span className="text-muted-foreground">20–40</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded bg-[#EAB308]/70" />
            <span className="text-muted-foreground">40–60</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded bg-[#F97316]/80" />
            <span className="text-muted-foreground">60–80</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded bg-[#EF4444]" />
            <span className="text-muted-foreground">80+</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
