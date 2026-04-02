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
import { getHermesAdminRule, listHermesAdminDeliveryLogsByRule, listHermesAdminTasksByRule } from "@/lib/hermes/admin"
import { formatHermesBoolean, formatHermesDateTime, shortenHermesId } from "@/lib/hermes/display"

interface RuleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MessagingRuleDetailPage({ params }: RuleDetailPageProps) {
  const { id } = await params
  const [rule, tasks, deliveries] = await Promise.all([
    getHermesAdminRule(id),
    listHermesAdminTasksByRule(id, 20),
    listHermesAdminDeliveryLogsByRule(id, 20),
  ])

  if (!rule) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title={rule.name}
        description="Detalle de matching, schedule y targeting de una rule Hermes."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/messaging/rules">Volver</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/messaging/rules/${rule.id}/edit`}>Editar</Link>
            </Button>
            <Button asChild>
              <Link href={`/api/hermes/admin/rules/${rule.id}`}>Ver API</Link>
            </Button>
          </>
        }
      />

      <HermesDetailGrid
        title="Resumen"
        fields={[
          { label: "ID", value: shortenHermesId(rule.id, 12) },
          { label: "Event type", value: rule.event_type },
          { label: "Schedule", value: rule.schedule_type },
          { label: "Timezone", value: rule.timezone },
          { label: "Recipient type", value: rule.recipient_type },
          {
            label: "Template",
            value: rule.template_id ? (
              <Link href={`/messaging/templates/${rule.template_id}`} className="hover:underline">
                {shortenHermesId(rule.template_id, 12)}
              </Link>
            ) : (
              "—"
            ),
          },
          { label: "Prioridad", value: rule.priority },
          { label: "Estado", value: formatHermesBoolean(rule.is_active) },
          { label: "Creado por", value: rule.created_by ?? "—" },
          { label: "Creado", value: formatHermesDateTime(rule.created_at) },
          { label: "Actualizado", value: formatHermesDateTime(rule.updated_at) },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <HermesJsonPanel title="Event conditions" value={rule.event_conditions} />
        <HermesJsonPanel title="Schedule config" value={rule.schedule_config} />
        <HermesJsonPanel title="Recipient config" value={rule.recipient_config} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tareas relacionadas</CardTitle>
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
            <CardTitle>Entregas relacionadas</CardTitle>
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
