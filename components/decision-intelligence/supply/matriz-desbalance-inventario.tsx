"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutGrid } from "lucide-react"
import { CardHeaderContent, InsightBanner, Legend } from "../shared/card-header"
import { imbalanceMatrix } from "../mock-data/supply"

function getCellColor(value: number) {
  if (value < 5)  return "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]"   // crítico stockout
  if (value < 10) return "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]"   // stockout rojo
  if (value < 15) return "bg-[#FED7AA] text-[#92400E] border-[#FDBA74]"   // naranja
  if (value < 22) return "bg-[#FEF9C3] text-[#713F12] border-[#FDE047]"   // amarillo
  if (value <= 30) return "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]"  // óptimo verde
  if (value <= 40) return "bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]"  // sobrestock leve azul
  return "bg-[#BFDBFE] text-[#1E3A8A] border-[#93C5FD]"                   // sobrestock alto
}

function getImbalanceColor(score: number) {
  if (score >= 70) return "text-[#EF4444]"
  if (score >= 40) return "text-[#F59E0B]"
  return "text-[#22C55E]"
}

export function MatrizDesbalanceInventario() {
  const topImbalanceZones = imbalanceMatrix.data
    .flatMap((row, i) =>
      row.map((value, j) => ({
        store: imbalanceMatrix.stores[i],
        sku: imbalanceMatrix.skus[j],
        value,
        isLow: value < 10,
        isHigh: value > 35,
        severity: value < 10 ? (10 - value) * 10 : value > 35 ? (value - 25) * 4 : 0,
      }))
    )
    .filter((z) => z.isLow || z.isHigh)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3)

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardHeaderContent
          icon={LayoutGrid}
          iconColor="#F59E0B"
          title="Matriz de Desbalance de Inventario"
          description="Días de inventario restante por tienda y categoría"
          actions={
            <Legend
              items={[
                { color: "#FEE2E2", label: "Substock" },
                { color: "#DCFCE7", label: "Óptimo" },
                { color: "#DBEAFE", label: "Sobrestock" },
              ]}
            />
          }
        />
        <div className="mt-4">
          <InsightBanner
            message="Sobrestock en 3 tiendas podría cubrir 78% de desabastos"
            variant="info"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50 rounded-tl-lg">
                  Tienda / SKU
                </th>
                {imbalanceMatrix.skus.map((sku, i) => (
                  <th
                    key={sku}
                    className="p-2 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50 min-w-[80px]"
                  >
                    <div>{sku}</div>
                    <div className={`text-[9px] font-normal mt-0.5 ${getImbalanceColor(imbalanceMatrix.skuScores[i])}`}>
                      {imbalanceMatrix.skuScores[i]}% desb
                    </div>
                  </th>
                ))}
                <th className="p-2 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50 rounded-tr-lg min-w-[70px]">
                  Puntaje
                </th>
              </tr>
            </thead>
            <tbody>
              {imbalanceMatrix.stores.map((store, rowIndex) => (
                <tr key={store} className="border-t border-border/50">
                  <td className="p-2 text-xs font-medium text-foreground bg-secondary/30 whitespace-nowrap">
                    {store}
                  </td>
                  {imbalanceMatrix.data[rowIndex].map((value, colIndex) => (
                    <td key={colIndex} className="p-1">
                      <div
                        className={`h-10 flex items-center justify-center rounded-md border text-xs font-semibold transition-all hover:scale-105 cursor-pointer ${getCellColor(value)}`}
                      >
                        {value}d
                      </div>
                    </td>
                  ))}
                  <td className="p-2 text-center">
                    <span className={`text-sm font-bold ${getImbalanceColor(imbalanceMatrix.scores[rowIndex])}`}>
                      {imbalanceMatrix.scores[rowIndex]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Imbalance Zones */}
        <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Zonas de Mayor Desbalance
          </p>
          <div className="flex flex-wrap gap-2">
            {topImbalanceZones.map((zone, i) => (
              <Badge
                key={i}
                variant="secondary"
                className={
                  zone.isLow
                    ? "bg-[#FEE2E2] text-[#991B1B] border-[#EF4444]/30"
                    : "bg-[#DBEAFE] text-[#1E40AF] border-[#3B82F6]/30"
                }
              >
                {zone.store} - {zone.sku}: {zone.value}d{" "}
                {zone.isLow ? "crítico" : "exceso"}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
