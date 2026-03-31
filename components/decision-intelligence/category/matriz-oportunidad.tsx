"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Grid3X3, ArrowUpRight, ArrowDownRight } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CardHeaderContent, Legend } from "../shared/card-header"
import {
  clusterData,
  clusterCategories,
  clusterMatrixData,
} from "../mock-data/category"

const getCellColor = (penetration: number, benchmark: number) => {
  const diff = penetration - benchmark
  if (diff >= 10)  return "bg-[#22C55E]/20 text-[#22C55E]"
  if (diff >= 0)   return "bg-[#22C55E]/10 text-[#22C55E]/80"
  if (diff >= -10) return "bg-[#F59E0B]/10 text-[#F59E0B]"
  return "bg-[#EF4444]/15 text-[#EF4444]"
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
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardHeaderContent
          icon={Grid3X3}
          iconColor="#3B82F6"
          title="Matriz de Oportunidad por Categoría"
          description="Penetración vs benchmark por cluster"
          actions={
            <Legend
              items={[
                { color: "#22C55E", label: "Sobre benchmark" },
                { color: "#EF4444", label: "Oportunidad" },
              ]}
            />
          }
        />
      </CardHeader>
      <CardContent>
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
                          className="text-[9px] px-1 py-0 bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
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
                <tr key={cluster} className="border-t border-border/30">
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
                                    <ArrowUpRight className="h-3 w-3 text-[#22C55E]" />
                                  )}
                                  {cell.trend === "down" && (
                                    <ArrowDownRight className="h-3 w-3 text-[#EF4444]" />
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
                                          ? "text-[#22C55E]"
                                          : "text-[#EF4444]"
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
                          ? "bg-[#F59E0B]/15 text-[#F59E0B]"
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
      </CardContent>
    </Card>
  )
}
