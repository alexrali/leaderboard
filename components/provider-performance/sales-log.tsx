"use client"

import { cn } from "@/lib/utils"
import type { ProviderTransaction } from "@/lib/provider-types"

interface Sale {
  time: string
  orderId: string
  amount: number
  channel: "ONLINE" | "STORE" | "B2B"
  product: string
  qty: number
  margin: number
  rep: string
  profit: number
}

interface SalesLogProps {
  initialTransactions?: ProviderTransaction[]
}

function txToSale(tx: ProviderTransaction): Sale {
  const d = new Date(tx.transaction_time)
  const time = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  return {
    time,
    orderId: tx.folio || String(tx.id),
    amount: tx.revenue,
    channel: tx.channel === 'distribucion' ? 'B2B' : 'STORE',
    product: tx.descripcion.length > 28 ? tx.descripcion.slice(0, 28) + '…' : tx.descripcion,
    qty: Math.round(tx.units_pieces),
    margin: (tx.margin_pct ?? 0) / 100,
    rep: tx.sales_rep?.trim() || tx.store_id || '—',
    profit: Math.round(tx.profit),
  }
}

function getChannelIndicator(channel: string) {
  switch (channel) {
    case "ONLINE":
      return { symbol: "▲", label: "UP", color: "text-emerald-600" }
    case "B2B":
      return { symbol: "▲", label: "DIST", color: "text-emerald-600" }
    case "STORE":
      return { symbol: "●", label: "AUTO", color: "text-amber-600" }
    default:
      return { symbol: "—", label: channel, color: "text-muted-foreground" }
  }
}

export function SalesLog({ initialTransactions = [] }: SalesLogProps) {
  const sales: Sale[] = initialTransactions.slice(0, 20).map(txToSale)

  return (
    <div className="animate-in fade-in duration-700 delay-700">
      {/* Header with title */}
      <div className="px-6 py-3 border-b border-stone-200/60 bg-stone-50/50">
        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
          Registro de Ejecución
        </p>
      </div>

      {/* Table Structure */}
      <div className="bg-background">
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            {/* Header Row */}
            <div className="grid grid-cols-[70px_80px_80px_1fr_50px_50px_50px_100px_80px] gap-3 px-4 py-2.5 bg-stone-50/80 border-b border-stone-200/60 text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-medium">
              <span>Hora</span>
              <span>ID</span>
              <span>Canal</span>
              <span>Producto</span>
              <span className="text-right">n</span>
              <span className="text-right">f</span>
              <span className="text-right">%</span>
              <span>Rep</span>
              <span className="text-right">P&L</span>
            </div>

            {/* Data Rows */}
            <div className="font-mono text-[11px]">
              {sales.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <p className="text-xs text-muted-foreground">Sin transacciones recientes.</p>
                </div>
              )}
              {sales.map((sale, index) => {
                const indicator = getChannelIndicator(sale.channel)
                return (
                  <div
                    key={sale.orderId + sale.time + index}
                    className={cn(
                      "grid grid-cols-[70px_80px_80px_1fr_50px_50px_50px_100px_80px] gap-3 px-4 py-2.5 transition-all duration-500",
                      index % 2 === 0 ? "bg-stone-50/50" : "bg-background",
                      "border-b border-stone-100 last:border-b-0"
                    )}
                  >
                    <span className="text-muted-foreground tabular-nums">{sale.time}</span>
                    <span className="text-muted-foreground tabular-nums">{sale.orderId}</span>
                    <span className="flex items-center gap-1.5">
                      <span className={cn("text-[9px]", indicator.color)}>{indicator.symbol}</span>
                      <span className={indicator.color}>{indicator.label}</span>
                    </span>
                    <span className="truncate">{sale.product}</span>
                    <span className="text-right text-muted-foreground tabular-nums">{sale.qty}</span>
                    <span className="text-right text-muted-foreground tabular-nums">{(sale.margin * 0.7).toFixed(2)}</span>
                    <span className="text-right text-muted-foreground tabular-nums">{(sale.margin * 100).toFixed(0)}%</span>
                    <span className="text-muted-foreground truncate">{sale.rep}</span>
                    <span className={cn(
                      "text-right font-semibold tabular-nums",
                      sale.profit > 1000 ? "text-emerald-600" : "text-foreground"
                    )}>
                      +${sale.profit.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Quote */}
      <div className="flex items-center justify-end mt-4">
        <p className="text-[11px] italic text-muted-foreground">
          &ldquo;Don&apos;t stop until it&apos;s profitable.&rdquo;{" "}
          <span className="not-italic font-semibold text-foreground">It never stopped.</span>
        </p>
      </div>
    </div>
  )
}
