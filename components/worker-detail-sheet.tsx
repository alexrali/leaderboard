"use client"

import { useState, useEffect } from "react"
import { Package, Weight, Box, Zap } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { TeamMember } from "@/lib/leaderboard-data"
import { getWorkerFolioDetail, type FolioDetail } from "@/lib/leaderboard-queries"

interface WorkerDetailDrawerProps {
  member: TeamMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
  viewMode: "daily" | "weekly"
}

export function WorkerDetailDrawer({
  member,
  open,
  onOpenChange,
  viewMode,
}: WorkerDetailDrawerProps) {
  const [details, setDetails] = useState<FolioDetail[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !member) {
      setDetails([])
      return
    }

    let cancelled = false
    setLoading(true)

    getWorkerFolioDetail(member.id, viewMode)
      .then((data) => {
        if (!cancelled) setDetails(data)
      })
      .catch((err) => {
        console.error("Error fetching worker detail:", err)
        if (!cancelled) setDetails([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, member?.id, viewMode])

  if (!member) return null

  const totalUE = details.reduce((s, d) => s + d.ue, 0)
  const totalQty = details.reduce((s, d) => s + d.quantity, 0)
  const totalWeight = details.reduce((s, d) => s + d.totalWeight, 0)
  const totalVolume = details.reduce((s, d) => s + d.totalVolume, 0)
  const uniqueFolios = new Set(details.map((d) => d.folio)).size
  const uniqueSkus = new Set(details.map((d) => d.itemCode)).size

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] flex flex-col">
        <DrawerHeader className="px-6 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 border-2 border-muted">
              <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
                {member.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <DrawerTitle className="text-base">{member.name}</DrawerTitle>
              <DrawerDescription className="text-xs">
                {viewMode === "daily" ? "Detalle del día" : "Detalle de la semana"} — {member.role}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="grid grid-cols-3 gap-3 px-6 pb-4 sm:grid-cols-6">
          <div className="flex flex-col items-center rounded-lg border bg-muted/30 px-2 py-2.5">
            <Zap className="mb-1 size-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground">
              {totalUE.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
            </span>
            <span className="text-[10px] text-muted-foreground">UE</span>
          </div>
          <div className="flex flex-col items-center rounded-lg border bg-muted/30 px-2 py-2.5">
            <Package className="mb-1 size-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground">{uniqueFolios}</span>
            <span className="text-[10px] text-muted-foreground">Folios</span>
          </div>
          <div className="flex flex-col items-center rounded-lg border bg-muted/30 px-2 py-2.5">
            <Box className="mb-1 size-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground">{uniqueSkus}</span>
            <span className="text-[10px] text-muted-foreground">SKUs</span>
          </div>
          <div className="flex flex-col items-center rounded-lg border bg-muted/30 px-2 py-2.5">
            <span className="mb-1 text-xs text-primary font-bold">#</span>
            <span className="text-xs font-bold text-foreground">
              {totalQty.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-muted-foreground">Qty</span>
          </div>
          <div className="flex flex-col items-center rounded-lg border bg-muted/30 px-2 py-2.5">
            <Weight className="mb-1 size-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground">
              {totalWeight.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
            </span>
            <span className="text-[10px] text-muted-foreground">kg</span>
          </div>
          <div className="flex flex-col items-center rounded-lg border bg-muted/30 px-2 py-2.5">
            <Box className="mb-1 size-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground">
              {totalVolume.toLocaleString("es-MX", { maximumFractionDigits: 3 })}
            </span>
            <span className="text-[10px] text-muted-foreground">m³</span>
          </div>
        </div>

        <Separator />

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-xs text-muted-foreground">Cargando detalle...</span>
              </div>
            </div>
          ) : details.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <span className="text-sm text-muted-foreground">Sin registros para este período</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  {viewMode === "weekly" && (
                    <TableHead className="pl-4 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Fecha
                    </TableHead>
                  )}
                  <TableHead className="pl-4 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Hora
                  </TableHead>
                  <TableHead className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Folio
                  </TableHead>
                  <TableHead className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    SKU
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Qty
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Peso
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Volumen
                  </TableHead>
                  <TableHead className="pr-4 text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    UE
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.map((row, i) => (
                  <TableRow key={`${row.folio}-${row.itemCode}-${row.hourBucket}-${i}`} className="text-xs">
                    {viewMode === "weekly" && (
                      <TableCell className="pl-4 font-mono text-muted-foreground">
                        {row.date}
                      </TableCell>
                    )}
                    <TableCell className="pl-4 font-mono text-muted-foreground">
                      {new Date(row.hourBucket).toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md font-mono text-[10px]">
                        {row.folio}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{row.itemCode}</TableCell>
                    <TableCell className="text-right font-mono">
                      {row.quantity.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {row.totalWeight.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {row.totalVolume.toLocaleString("es-MX", { maximumFractionDigits: 4 })}
                    </TableCell>
                    <TableCell className="pr-4 text-right font-mono font-semibold">
                      {row.ue.toLocaleString("es-MX", { maximumFractionDigits: 3 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </ScrollArea>

        {!loading && details.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between px-6 py-3 text-xs text-muted-foreground">
              <span>{details.length} registros</span>
              <span>
                {uniqueFolios} folios · {uniqueSkus} SKUs · {totalUE.toLocaleString("es-MX", { maximumFractionDigits: 1 })} UE
              </span>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
