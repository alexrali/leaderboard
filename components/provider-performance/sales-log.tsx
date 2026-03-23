"use client"

import { useState, useEffect } from "react"
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

const initialSales: Sale[] = [
  { time: "14:32:18", orderId: "+4608366", amount: 41.29, channel: "ONLINE", product: "MacBook Pro 14\"", qty: 1, margin: 0.65, rep: "—", profit: 2499 },
  { time: "14:31:45", orderId: "+4152898", amount: 41.53, channel: "STORE", product: "Nike Air Max", qty: 2, margin: 0.44, rep: "Store #12", profit: 340 },
  { time: "14:30:22", orderId: "+3982091", amount: 39.82, channel: "B2B", product: "Office Chairs x50", qty: 50, margin: 0.58, rep: "J. Martinez", profit: 8750 },
  { time: "14:29:58", orderId: "+3170094", amount: 31.70, channel: "ONLINE", product: "Sony WH-1000XM5", qty: 1, margin: 0.41, rep: "—", profit: 349 },
  { time: "14:28:31", orderId: "+2890122", amount: 28.90, channel: "STORE", product: "Lululemon Set", qty: 1, margin: 0.52, rep: "Store #7", profit: 198 },
]

const fallbackPool: Omit<Sale, "time" | "orderId" | "amount">[] = [
  { channel: "ONLINE", product: "iPhone 15 Pro", qty: 1, margin: 0.52, rep: "—", profit: 1199 },
  { channel: "STORE", product: "Dyson V15", qty: 1, margin: 0.38, rep: "Store #7", profit: 749 },
  { channel: "B2B", product: "Dell Monitors x20", qty: 20, margin: 0.45, rep: "S. Kim", profit: 5800 },
  { channel: "ONLINE", product: "AirPods Pro", qty: 2, margin: 0.48, rep: "—", profit: 498 },
  { channel: "STORE", product: "La Mer Cream", qty: 1, margin: 0.62, rep: "Store #3", profit: 198 },
  { channel: "B2B", product: "Herman Miller x10", qty: 10, margin: 0.35, rep: "A. Thompson", profit: 12500 },
  { channel: "ONLINE", product: "PS5 Bundle", qty: 1, margin: 0.28, rep: "—", profit: 549 },
]

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
    case "STORE":
      return { symbol: "●", label: "FLAT", color: "text-amber-600" }
    case "B2B":
      return { symbol: "▼", label: "DOWN", color: "text-red-500" }
    default:
      return { symbol: "", label: "", color: "" }
  }
}

export function SalesLog({ initialTransactions = [] }: SalesLogProps) {
  const [sales, setSales] = useState<Sale[]>(() =>
    initialTransactions.length > 0
      ? initialTransactions.slice(0, 5).map(txToSale)
      : initialSales
  )
  const [newRowId, setNewRowId] = useState<string | null>(null)

  const livePool = initialTransactions.length > 0
    ? initialTransactions.slice(5, 25).map(txToSale)
    : fallbackPool

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const time = now.toLocaleTimeString("es-MX", { hour12: false })
      const randomSale = livePool[Math.floor(Math.random() * livePool.length)]
      const orderId = `+${Math.floor(Math.random() * 1000000) + 4000000}`

      const newSale: Sale = {
        amount: 0,
        ...randomSale,
        time,
        orderId,
      }

      setNewRowId(orderId)
      setSales(prev => [newSale, ...prev.slice(0, 4)])

      setTimeout(() => setNewRowId(null), 2000)
    }, 6000)

    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="animate-in fade-in duration-700 delay-700">
      {/* Header with title */}
      <div className="px-6 py-3 border-b border-stone-200/60 bg-stone-50/50">
        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
          Execution Log — Live Feed
        </p>
      </div>

      {/* Table Structure */}
      <div className="bg-background">
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            {/* Header Row */}
            <div className="grid grid-cols-[70px_80px_80px_1fr_50px_50px_50px_100px_80px] gap-3 px-4 py-2.5 bg-stone-50/80 border-b border-stone-200/60 text-[9px] uppercase tracking-[0.1em] text-muted-foreground/60 font-medium">
              <span>Time</span>
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
              {sales.map((sale, index) => {
                const indicator = getChannelIndicator(sale.channel)
                return (
                  <div
                    key={sale.orderId + sale.time + index}
                    className={cn(
                      "grid grid-cols-[70px_80px_80px_1fr_50px_50px_50px_100px_80px] gap-3 px-4 py-2.5 transition-all duration-500",
                      sale.orderId === newRowId
                        ? "bg-amber-400/25 animate-in fade-in slide-in-from-top-2 duration-500"
                        : index % 2 === 0 ? "bg-stone-50/50" : "bg-background",
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
