"use client"

import { Badge } from "@/components/ui/badge"
import { ZoneHeaderBar, ZoneInsight, Legend } from "../shared/zone-header"
import { CHART } from "../shared/di-tokens"
import { imbalanceMatrix } from "../mock-data/supply"

function getCellColor(value: number) {
  if (value < 5)  return "bg-red-100 text-red-800 border-red-200"
  if (value < 10) return "bg-red-100 text-red-800 border-red-200"
  if (value < 15) return "bg-orange-200 text-orange-800 border-orange-300"
  if (value < 22) return "bg-yellow-100 text-yellow-800 border-yellow-200"
  if (value <= 30) return "bg-emerald-100 text-emerald-800 border-emerald-200"
  if (value <= 40) return "bg-blue-100 text-blue-800 border-blue-200"
  return "bg-blue-200 text-blue-900 border-blue-300"
}

function getImbalanceColor(score: number) {
  if (score >= 70) return "text-red-500"
  if (score >= 40) return "text-amber-500"
  return "text-emerald-500"
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
    <div className="animate-in fade-in duration-500" style={{ animationDelay: "100ms" }}>
      <ZoneHeaderBar
        title="DESBALANCE DE INVENTARIO"
        right={
          <Legend
            items={[
              { color: "bg-red-100", label: "Substock" },
              { color: "bg-green-100", label: "Óptimo" },
              { color: "bg-blue-100", label: "Sobrestock" },
            ]}
          />
        }
      />
      <ZoneInsight
        message="Sobrestock en 3 tiendas podría cubrir 78% de desabastos"
        variant="info"
      />
      <div className="px-6 py-5">
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
                    ? "bg-red-100 text-red-800 border-red-500/30"
                    : "bg-blue-100 text-blue-800 border-blue-500/30"
                }
              >
                {zone.store} - {zone.sku}: {zone.value}d{" "}
                {zone.isLow ? "crítico" : "exceso"}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
