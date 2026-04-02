"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ZoneHeaderBar, Legend } from "../shared/zone-header"
import { DI_COLORS, CHART } from "../shared/di-tokens"
import {
  clusterData,
  clusterCategories,
  clusterMatrixData,
} from "../mock-data/category"

const getCellColor = (penetration: number, benchmark: number) => {
  const diff = penetration - benchmark
  if (diff >= 10)  return "bg-emerald-500/20 text-emerald-500"
  if (diff >= 0)   return "bg-emerald-500/10 text-emerald-500/80"
  if (diff >= -10) return "bg-amber-500/10 text-amber-500"
  return "bg-red-500/15 text-red-500"
}

const getOpportunityScore = (cluster: string) => {
  const row = clusterMatrixData[cluster]
  let score = 0
  Object.values(row).forEach((cell) => {
    if (cell.penetration < cell.benchmark) {
      score += cell.benchmark - cell.penetration
    }
  })
  return Math.round(score / clusterCategories.length)
}

const getCategoryOpportunity = (category: string) => {
  let totalGap = 0
  clusterData.forEach((cluster) => {
    const cell = clusterMatrixData[cluster][category]
    if (cell && cell.penetration < cell.benchmark) {
      totalGap += cell.benchmark - cell.penetration
    }
  })
  return Math.round(totalGap / clusterData.length)
}

export function MatrizOportunidad({
  selectedCategory,
}: {
  selectedCategory: string | null
}) {
  const [hoveredCell, setHoveredCell] = useState<{
    cluster: string
    category: string
  } | null>(null)

  return (
    <div className="animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
      <ZoneHeaderBar
        title="MATRIZ DE OPORTUNIDAD"
        right={
          <Legend
            items={[
              { color: CHART.growth, label: "Sobre benchmark" },
              { color: CHART.decline, label: "Oportunidad" },
            ]}
          />
        }
      />
      <div className="px-6 py-5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-48">
                  Cluster
                </th>
                {clusterCategories.map((cat) => (
                  <th
                    key={cat}
                    className={`p-2 text-[10px] font-semibold text-center uppercase tracking-wider transition-colors ${
                      selectedCategory === cat
                        ? "text-foreground bg-secondary/50"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{cat}</span>
                      {getCategoryOpportunity(cat) > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-500 border-amber-500/20"
                        >
                          +{getCategoryOpportunity(cat)}%
                        </Badge>
                      )}
                    </div>
                  </th>
                ))}
                <th className="p-2 text-[10px] font-semibold text-muted-foreground text-center uppercase tracking-wider w-20">
                  Puntaje
                </th>
              </tr>
            </thead>
            <tbody>
              {clusterData.map((cluster) => (
                <tr key={cluster} className="border-t border-[#ebebeb]/30">
                  <td className="p-2">
                    <p className="text-sm font-medium text-foreground">{cluster}</p>
                  </td>
                  {clusterCategories.map((cat) => {
                    const cell = clusterMatrixData[cluster][cat]
                    const isHighlighted =
                      selectedCategory === cat ||
                      (hoveredCell?.cluster === cluster &&
                        hoveredCell?.category === cat)

                    return (
                      <td key={cat} className="p-1.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`relative p-2 rounded-lg text-center cursor-pointer transition-all ${getCellColor(
                                  cell.penetration,
                                  cell.benchmark
                                )} ${isHighlighted ? "ring-2 ring-foreground/20" : ""}`}
                                onMouseEnter={() =>
                                  setHoveredCell({ cluster, category: cat })
                                }
                                onMouseLeave={() => setHoveredCell(null)}
                              >
                                <span className="text-sm font-semibold">
                                  {cell.penetration}%
                                </span>
                                <div className="absolute top-1 right-1">
                                  {cell.trend === "up" && (
                                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                  )}
                                  {cell.trend === "down" && (
                                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                                  )}
                                  {cell.trend === "stable" && (
                                    <span className="text-[10px] text-muted-foreground leading-none">
                                      —
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="p-3">
                              <div className="space-y-1.5">
                                <p className="font-medium text-sm">
                                  {cat} en {cluster}
                                </p>
                                <div className="text-sm space-y-1">
                                  <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">
                                      Penetración
                                    </span>
                                    <span className="font-medium">
                                      {cell.penetration}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">
                                      Benchmark
                                    </span>
                                    <span className="font-medium">
                                      {cell.benchmark}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">
                                      Brecha
                                    </span>
                                    <span
                                      className={`font-medium ${
                                        cell.penetration >= cell.benchmark
                                          ? "text-emerald-500"
                                          : "text-red-500"
                                      }`}
                                    >
                                      {cell.penetration >= cell.benchmark
                                        ? "+"
                                        : ""}
                                      {cell.penetration - cell.benchmark}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    )
                  })}
                  <td className="p-2 text-center">
                    <div
                      className={`inline-flex items-center justify-center h-8 w-12 rounded-lg text-sm font-semibold ${
                        getOpportunityScore(cluster) > 10
                          ? "bg-amber-500/15 text-amber-500"
                          : "bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      {getOpportunityScore(cluster)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
