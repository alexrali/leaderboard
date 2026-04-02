export const dynamic = 'force-dynamic'

import Link from "next/link"
import { notFound } from "next/navigation"
import { HermesDetailGrid } from "@/components/hermes/hermes-detail-grid"
import { HermesJsonPanel } from "@/components/hermes/hermes-json-panel"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { HermesStatusBadge } from "@/components/hermes/hermes-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getHermesAdminEvent, listHermesAdminDeliveryLogsByEvent, listHermesAdminTasksByEvent } from "@/lib/hermes/admin"
import { formatHermesDateTime, shortenHermesId } from "@/lib/hermes/display"

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MessagingEventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params
  const [event, tasks, deliveries] = await Promise.all([
    getHermesAdminEvent(id),
    listHermesAdminTasksByEvent(id, 20),
    listHermesAdminDeliveryLogsByEvent(id, 20),
  ])

  if (!event) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title={event.type}
        description="Detalle del evento Hermes, sus payloads y los efectos derivados en tareas y entregas."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/messaging/events">Volver</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/messaging/events/${event.id}/timeline`}>Timeline</Link>
            </Button>
            <Button asChild>
              <Link href={`/api/hermes/admin/events/${event.id}`}>Ver API</Link>
            </Button>
          </>
        }
      />

      <HermesDetailGrid
        title="Resumen"
        fields={[
          { label: "ID", value: shortenHermesId(event.id, 12) },
          { label: "Source", value: event.source },
          { label: "Status", value: <HermesStatusBadge status={event.status} /> },
          { label: "External ID", value: event.external_id ?? "—" },
          { label: "Retries", value: event.retry_count },
          { label: "Procesado", value: formatHermesDateTime(event.processed_at) },
          { label: "Creado", value: formatHermesDateTime(event.created_at) },
          { label: "Actualizado", value: formatHermesDateTime(event.updated_at) },
          { label: "Error", value: event.error_message ?? "—" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <HermesJsonPanel title="Payload" value={event.payload} />
        <HermesJsonPanel title="Metadata" value={event.metadata} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tareas derivadas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Programada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Link href={`/messaging/tasks/${task.id}`} className="font-medium hover:underline">
                        {shortenHermesId(task.id, 12)}
                      </Link>
                    </TableCell>
                    <TableCell><HermesStatusBadge status={task.status} /></TableCell>
                    <TableCell>{formatHermesDateTime(task.scheduled_for)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entregas derivadas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      <Link href={`/messaging/delivery/${delivery.id}`} className="font-medium hover:underline">
                        {delivery.recipient_email}
                      </Link>
                    </TableCell>
                    <TableCell><HermesStatusBadge status={delivery.status} /></TableCell>
                    <TableCell>{formatHermesDateTime(delivery.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
