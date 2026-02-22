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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [open, member, viewMode])

  if (!member) return null

  const totalUE = details.reduce((s, d) => s + d.ue, 0)
  const totalQty = details.reduce((s, d) => s + d.quantity, 0)
  const totalWeight = details.reduce((s, d) => s + d.totalWeight, 0)
  const totalVolume = details.reduce((s, d) => s + d.totalVolume, 0)
  const uniqueFolios = new Set(details.map((d) => d.folio)).size
  const uniqueSkus = new Set(details.map((d) => d.itemCode)).size

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex max-h-[85vh] flex-col">
        <DrawerHeader className="px-6 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="border-muted size-10 border-2">
              <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
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
          <div className="bg-muted/30 flex flex-col items-center rounded-lg border px-2 py-2.5">
            <Zap className="text-primary mb-1 size-3.5" />
            <span className="text-foreground text-xs font-bold">
              {totalUE.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
            </span>
            <span className="text-muted-foreground text-[10px]">UE</span>
          </div>
          <div className="bg-muted/30 flex flex-col items-center rounded-lg border px-2 py-2.5">
            <Package className="text-primary mb-1 size-3.5" />
            <span className="text-foreground text-xs font-bold">{uniqueFolios}</span>
            <span className="text-muted-foreground text-[10px]">Folios</span>
          </div>
          <div className="bg-muted/30 flex flex-col items-center rounded-lg border px-2 py-2.5">
            <Box className="text-primary mb-1 size-3.5" />
            <span className="text-foreground text-xs font-bold">{uniqueSkus}</span>
            <span className="text-muted-foreground text-[10px]">SKUs</span>
          </div>
          <div className="bg-muted/30 flex flex-col items-center rounded-lg border px-2 py-2.5">
            <span className="text-primary mb-1 text-xs font-bold">#</span>
            <span className="text-foreground text-xs font-bold">
              {totalQty.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
            </span>
            <span className="text-muted-foreground text-[10px]">Qty</span>
          </div>
          <div className="bg-muted/30 flex flex-col items-center rounded-lg border px-2 py-2.5">
            <Weight className="text-primary mb-1 size-3.5" />
            <span className="text-foreground text-xs font-bold">
              {totalWeight.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
            </span>
            <span className="text-muted-foreground text-[10px]">kg</span>
          </div>
          <div className="bg-muted/30 flex flex-col items-center rounded-lg border px-2 py-2.5">
            <Box className="text-primary mb-1 size-3.5" />
            <span className="text-foreground text-xs font-bold">
              {totalVolume.toLocaleString("es-MX", { maximumFractionDigits: 3 })}
            </span>
            <span className="text-muted-foreground text-[10px]">m³</span>
          </div>
        </div>

        <Separator />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
                <span className="text-muted-foreground text-xs">Cargando detalle...</span>
              </div>
            </div>
          ) : details.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <span className="text-muted-foreground text-sm">Sin registros para este período</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    {viewMode === "weekly" && (
                      <TableHead className="text-muted-foreground pl-4 text-[10px] font-medium tracking-wide uppercase">
                        Fecha
                      </TableHead>
                    )}
                    <TableHead className="text-muted-foreground pl-4 text-[10px] font-medium tracking-wide uppercase">
                      Hora
                    </TableHead>
                    <TableHead className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                      Folio
                    </TableHead>
                    <TableHead className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                      SKU
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right text-[10px] font-medium tracking-wide uppercase">
                      Qty
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right text-[10px] font-medium tracking-wide uppercase">
                      Peso
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right text-[10px] font-medium tracking-wide uppercase">
                      Volumen
                    </TableHead>
                    <TableHead className="text-muted-foreground pr-4 text-right text-[10px] font-medium tracking-wide uppercase">
                      UE
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.map((row, i) => (
                    <TableRow
                      key={`${row.folio}-${row.itemCode}-${row.hourBucket}-${i}`}
                      className="text-xs"
                    >
                      {viewMode === "weekly" && (
                        <TableCell className="text-muted-foreground pl-4 font-mono">
                          {row.date}
                        </TableCell>
                      )}
                      <TableCell className="text-muted-foreground pl-4 font-mono">
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
                      <TableCell className="text-muted-foreground text-right font-mono">
                        {row.totalWeight.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right font-mono">
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
        </div>

        {!loading && details.length > 0 && (
          <>
            <Separator />
            <div className="text-muted-foreground flex items-center justify-between px-6 py-3 text-xs">
              <span>{details.length} registros</span>
              <span>
                {uniqueFolios} folios · {uniqueSkus} SKUs ·{" "}
                {totalUE.toLocaleString("es-MX", { maximumFractionDigits: 1 })} UE
              </span>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
