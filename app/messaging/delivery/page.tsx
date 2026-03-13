import Link from "next/link"
import { HermesFilterLinks } from "@/components/hermes/hermes-filter-links"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { HermesStatusBadge } from "@/components/hermes/hermes-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listHermesAdminDeliveryLogs } from "@/lib/hermes/admin"
import { formatHermesDateTime, shortenHermesId } from "@/lib/hermes/display"
import type { HermesDeliveryStatus } from "@/lib/hermes/types"

interface DeliveryPageProps {
  searchParams: Promise<{ status?: string }>
}

const deliveryFilters: Array<{ label: string; value: HermesDeliveryStatus | "ALL" }> = [
  { label: "Todos", value: "ALL" },
  { label: "Sent", value: "SENT" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Opened", value: "OPENED" },
  { label: "Clicked", value: "CLICKED" },
  { label: "Failed", value: "FAILED" },
  { label: "Bounced", value: "BOUNCED" },
]

export default async function MessagingDeliveryPage({ searchParams }: DeliveryPageProps) {
  const { status } = await searchParams
  const currentStatus = (status ?? "ALL") as HermesDeliveryStatus | "ALL"
  const deliveries = await listHermesAdminDeliveryLogs({ limit: 100, status: currentStatus })

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title="Entregas"
        description="Historial de envío y engagement registrado en `hermes_delivery_logs`."
        actions={
          <Button asChild variant="outline">
            <Link href={currentStatus === "ALL" ? "/api/hermes/admin/delivery-logs" : `/api/hermes/admin/delivery-logs?status=${currentStatus}`}>
              Ver API
            </Link>
          </Button>
        }
      />

      <HermesFilterLinks basePath="/messaging/delivery" currentValue={currentStatus} items={deliveryFilters} />

      <Card>
        <CardHeader>
          <CardTitle>Entregas recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Sin entregas</EmptyTitle>
                <EmptyDescription>No hay registros para el filtro seleccionado.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Resend</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Enviado</TableHead>
                  <TableHead>Entregado</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link href={`/messaging/delivery/${delivery.id}`} className="font-medium hover:underline">
                          {delivery.recipient_email}
                        </Link>
                        <span className="text-muted-foreground text-xs">{delivery.subject ?? "Sin asunto"}</span>
                      </div>
                    </TableCell>
                    <TableCell><HermesStatusBadge status={delivery.status} /></TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{delivery.resend_status ?? "—"}</span>
                        <span className="text-muted-foreground text-xs">{shortenHermesId(delivery.resend_id)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {delivery.event_id ? (
                        <Link href={`/messaging/events/${delivery.event_id}`} className="hover:underline">
                          {shortenHermesId(delivery.event_id)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{formatHermesDateTime(delivery.sent_at)}</TableCell>
                    <TableCell>{formatHermesDateTime(delivery.delivered_at)}</TableCell>
                    <TableCell className="max-w-[260px] truncate">{delivery.error_message ?? "—"}</TableCell>
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
