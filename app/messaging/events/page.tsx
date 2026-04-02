export const dynamic = 'force-dynamic'

import Link from "next/link"
import { Zap } from "lucide-react"
import { HermesFilterLinks } from "@/components/hermes/hermes-filter-links"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { HermesStatusBadge } from "@/components/hermes/hermes-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listHermesAdminEvents } from "@/lib/hermes/admin"
import { formatHermesDateTime, shortenHermesId } from "@/lib/hermes/display"
import type { HermesEventStatus } from "@/lib/hermes/types"

interface EventsPageProps {
  searchParams: Promise<{ status?: string }>
}

const eventFilters: Array<{ label: string; value: HermesEventStatus | "ALL" }> = [
  { label: "Todos", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
]

export default async function MessagingEventsPage({ searchParams }: EventsPageProps) {
  const { status } = await searchParams
  const currentStatus = (status ?? "ALL") as HermesEventStatus | "ALL"
  const events = await listHermesAdminEvents({ limit: 100, status: currentStatus })

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title="Eventos"
        description="Eventos ingeridos por Hermes y estado del pipeline de procesamiento."
        actions={
          <Button asChild variant="outline">
            <Link href={currentStatus === "ALL" ? "/api/hermes/admin/events" : `/api/hermes/admin/events?status=${currentStatus}`}>
              Ver API
            </Link>
          </Button>
        }
      />

      <HermesFilterLinks basePath="/messaging/events" currentValue={currentStatus} items={eventFilters} />

      <Card>
        <CardHeader>
          <CardTitle>Eventos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Zap className="size-6" />
                </EmptyMedia>
                <EmptyTitle>Sin eventos</EmptyTitle>
                <EmptyDescription>
                  {currentStatus === "ALL"
                    ? "No hay eventos registrados todavía. Los eventos llegan vía API o webhook y disparan rules configuradas."
                    : "No hay eventos con el estado seleccionado. Prueba cambiando el filtro."}
                </EmptyDescription>
              </EmptyHeader>
              {currentStatus === "ALL" && (
                <EmptyContent>
                  <Button asChild variant="outline">
                    <Link href="/messaging/review">Probar evento de prueba</Link>
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>External ID</TableHead>
                  <TableHead>Procesado</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link href={`/messaging/events/${event.id}`} className="font-medium hover:underline">
                          {event.type}
                        </Link>
                        <span className="text-muted-foreground text-xs">{shortenHermesId(event.id)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{event.source}</TableCell>
                    <TableCell><HermesStatusBadge status={event.status} /></TableCell>
                    <TableCell>{event.retry_count}</TableCell>
                    <TableCell>{event.external_id ?? "—"}</TableCell>
                    <TableCell>{formatHermesDateTime(event.processed_at)}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{event.error_message ?? "—"}</TableCell>
                    <TableCell>{formatHermesDateTime(event.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
