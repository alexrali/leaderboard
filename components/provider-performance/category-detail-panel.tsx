"use client"

import { useState } from "react"
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
import { TrendingUp, TrendingDown, Package, Users, ShoppingCart } from "lucide-react"

export interface CategoryData {
  name: string
  share: number
  revenue: string
  revenueNum: number
  growth: string
  growthNum: number
  orders: number
  avgTicket: string
  topProducts: { name: string; revenue: string; units: number }[]
  monthlyData: { month: string; revenue: number; orders: number }[]
  channelSplit: { channel: string; percentage: number; revenue: string }[]
  topReps: { name: string; sales: string; deals: number }[]
}

interface CategoryDetailPanelProps {
  category: CategoryData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoryDetailPanel({ category, open, onOpenChange }: CategoryDetailPanelProps) {
  if (!category) return null

  const isPositive = category.growthNum >= 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-0">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-foreground animate-pulse" />
            <SheetDescription className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Category Deep Dive
            </SheetDescription>
          </div>
          <SheetTitle className="text-3xl font-mono font-bold tracking-tight">
            {category.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-8 p-4 pt-6">
          {/* Hero Stats */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                Total Revenue
              </p>
              <p className="text-4xl font-mono font-bold tracking-tight">{category.revenue}</p>
              <div className="flex items-center gap-1.5">
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={cn(
                  "text-sm font-mono font-semibold",
                  isPositive ? "text-emerald-600" : "text-red-600"
                )}>
                  {category.growth}
                </span>
                <span className="text-[10px] text-muted-foreground">vs last period</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                Market Share
              </p>
              <p className="text-4xl font-mono font-bold tracking-tight">{(category.share * 100).toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground">of total revenue</p>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/40 rounded-lg">
            <div className="text-center">
              <ShoppingCart className="h-4 w-4 mx-auto text-muted-foreground mb-1.5" />
              <p className="text-lg font-mono font-bold">{category.orders.toLocaleString()}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Orders</p>
            </div>
            <div className="text-center">
              <Package className="h-4 w-4 mx-auto text-muted-foreground mb-1.5" />
              <p className="text-lg font-mono font-bold">{category.avgTicket}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Avg Ticket</p>
            </div>
            <div className="text-center">
              <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1.5" />
              <p className="text-lg font-mono font-bold">{category.topReps.length}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Active Reps</p>
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <div className="space-y-3">
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Revenue Trend — 6 Months
            </p>
            <div className="h-36 w-full bg-muted/20 rounded-lg p-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={category.monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="catFill" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#catFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Channel Distribution */}
          <div className="space-y-3">
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Channel Distribution
            </p>
            <div className="space-y-2">
              {category.channelSplit.map((ch, idx) => (
                <div key={ch.channel} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{ch.channel}</span>
                    <span className="font-mono font-semibold">{ch.revenue}</span>
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
          <div className="space-y-3">
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Top Products
            </p>
            <div className="border border-border/50 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/30">
                    <TableHead className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-medium h-8">Product</TableHead>
                    <TableHead className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-medium h-8 text-right">Units</TableHead>
                    <TableHead className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-medium h-8 text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {category.topProducts.map((product, idx) => (
                    <TableRow key={product.name} className="border-b border-border/20">
                      <TableCell className="text-[11px] py-2">{product.name}</TableCell>
                      <TableCell className="text-[11px] font-mono text-muted-foreground py-2 text-right tabular-nums">{product.units.toLocaleString()}</TableCell>
                      <TableCell className="text-[11px] font-mono font-semibold py-2 text-right tabular-nums">{product.revenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Top Sales Reps */}
          <div className="space-y-3">
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Top Sales Representatives
            </p>
            <div className="space-y-2">
              {category.topReps.map((rep, idx) => (
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
                      <p className="text-[10px] text-muted-foreground">{rep.deals} deals closed</p>
                    </div>
                  </div>
                  <p className="font-mono text-sm font-semibold">{rep.sales}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
