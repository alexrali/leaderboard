"use client"

import { useId } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Area, AreaChart, ResponsiveContainer, XAxis, Tooltip } from "recharts"
import { cn } from "@/lib/utils"
import { Package, Users, ShoppingCart } from "lucide-react"
import { useCategoryDetail } from "@/hooks/use-provider-queries"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"

interface CategoryDetailPanelProps {
  categoryCode: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoryDetailPanel({ categoryCode, open, onOpenChange }: CategoryDetailPanelProps) {
  const uid = useId().replace(/:/g, '')
  const { data: detail, isLoading } = useCategoryDetail(categoryCode)

  const revenueCounter = useAnimatedCounter(detail?.revenue ?? 0, 1500, 100)
  const ordersCounter = useAnimatedCounter(detail?.orders ?? 0, 1500, 200)
  const unitsCounter = useAnimatedCounter(detail?.units ?? 0, 1500, 300)

  const avgTicket = detail && detail.orders > 0
    ? `$${Math.round(detail.revenue / detail.orders).toLocaleString()}`
    : '—'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-0">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-foreground animate-pulse" />
            <SheetDescription className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Detalle de Categoría
            </SheetDescription>
          </div>
          <SheetTitle className="text-3xl font-mono font-bold tracking-tight">
            {detail?.category_name ?? categoryCode ?? ''}
          </SheetTitle>
        </SheetHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="size-6 animate-spin rounded-full border-2 border-border border-t-transparent" />
          </div>
        )}

        {!isLoading && detail && (
          <div className="space-y-8 p-4 pt-6">
            {/* Hero Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  Ingresos Totales
                </p>
                <p className="text-4xl font-mono font-bold tracking-tight">
                  ${revenueCounter.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">últimos 6 meses</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  Piezas Vendidas
                </p>
                <p className="text-4xl font-mono font-bold tracking-tight">
                  {unitsCounter.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">unidades normalizadas</p>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/40 rounded-lg">
              <div className="text-center">
                <ShoppingCart className="h-4 w-4 mx-auto text-muted-foreground mb-1.5" />
                <p className="text-lg font-mono font-bold">{ordersCounter.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Órdenes</p>
              </div>
              <div className="text-center">
                <Package className="h-4 w-4 mx-auto text-muted-foreground mb-1.5" />
                <p className="text-lg font-mono font-bold">{avgTicket}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Ticket Prom.</p>
              </div>
              <div className="text-center">
                <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1.5" />
                <p className="text-lg font-mono font-bold">{detail.topReps.length}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Top Reps</p>
              </div>
            </div>

            {/* Revenue Trend Chart */}
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                Tendencia de Ingresos — 6 Meses
              </p>
              <div className="h-36 w-full bg-muted/20 rounded-lg p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={detail.monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id={`catFill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-md px-3 py-2 shadow-lg">
                              <p className="text-[10px] text-muted-foreground">{payload[0].payload.month}</p>
                              <p className="font-mono text-sm font-semibold">
                                ${Number(payload[0].value).toLocaleString()}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      fill={`url(#catFill-${uid})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Channel Distribution */}
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                Distribución por Canal
              </p>
              <div className="space-y-2">
                {detail.channelSplit.map((ch, idx) => (
                  <div key={ch.channel} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">{ch.channel}</span>
                      <span className="font-mono font-semibold">${ch.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          idx === 0 ? "bg-foreground" : idx === 1 ? "bg-foreground/60" : "bg-foreground/30"
                        )}
                        style={{ width: `${ch.percentage}%`, transitionDelay: `${idx * 150}ms` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            {detail.topProducts.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  Productos Destacados
                </p>
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-border/30">
                        <TableHead className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium h-8">Producto</TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium h-8 text-right">Pzas</TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium h-8 text-right">Ingreso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.topProducts.map((product) => (
                        <TableRow key={product.clave} className="border-b border-border/20">
                          <TableCell className="text-[11px] py-2">{product.name}</TableCell>
                          <TableCell className="text-[11px] font-mono text-muted-foreground py-2 text-right tabular-nums">{product.units.toLocaleString()}</TableCell>
                          <TableCell className="text-[11px] font-mono font-semibold py-2 text-right tabular-nums">${product.revenue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Top Sales Reps */}
            {detail.topReps.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  Top Representantes
                </p>
                <div className="space-y-2">
                  {detail.topReps.map((rep, idx) => (
                    <div
                      key={rep.name}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-mono font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-[11px] font-medium">{rep.name}</p>
                          <p className="text-[10px] text-muted-foreground">{rep.deals} órdenes</p>
                        </div>
                      </div>
                      <p className="font-mono text-sm font-semibold">${rep.sales.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
