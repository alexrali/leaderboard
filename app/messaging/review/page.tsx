export const dynamic = 'force-dynamic'

import Link from "next/link"
import { HermesReviewPanel } from "@/components/hermes/hermes-review-panel"
import { HermesStatusBadge } from "@/components/hermes/hermes-status-badge"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listHermesAdminEvents } from "@/lib/hermes/admin"
import { formatHermesDateTime, shortenHermesId } from "@/lib/hermes/display"

export default async function MessagingReviewPage() {
  const recentEvents = await listHermesAdminEvents({ limit: 10 })

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title="Review end-to-end"
        description="Preview y ejecución controlada de eventos Hermes para revisar el flujo completo desde matching hasta entregas."
        actions={
          <Button asChild variant="outline">
            <Link href="/messaging/events">Ver eventos</Link>
          </Button>
        }
      />

      <HermesReviewPanel />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Eventos recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Timeline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link href={`/messaging/events/${event.id}`} className="font-medium hover:underline">
                          {event.type}
                        </Link>
                        <span className="text-muted-foreground text-xs">{shortenHermesId(event.id, 12)}</span>
                      </div>
                    </TableCell>
                    <TableCell><HermesStatusBadge status={event.status} /></TableCell>
                    <TableCell>{formatHermesDateTime(event.created_at)}</TableCell>
                    <TableCell>
                      <Link href={`/messaging/events/${event.id}/timeline`} className="hover:underline">
                        Abrir
                      </Link>
                    </TableCell>
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
