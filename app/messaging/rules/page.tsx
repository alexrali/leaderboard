import Link from "next/link"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { HermesStatusBadge } from "@/components/hermes/hermes-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listHermesAdminRules } from "@/lib/hermes/admin"
import { formatHermesDateTime, shortenHermesId } from "@/lib/hermes/display"

export default async function MessagingRulesPage() {
  const rules = await listHermesAdminRules(100)

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title="Rules"
        description="Rules persistidas que hacen match con eventos y disparan entregas o tareas programadas."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/api/hermes/admin/rules">Ver API</Link>
            </Button>
            <Button asChild>
              <Link href="/messaging/rules/new">Nueva rule</Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Sin rules</EmptyTitle>
                <EmptyDescription>No hay rules registradas todavía en `hermes_rules`.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Event type</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Actualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link href={`/messaging/rules/${rule.id}`} className="font-medium hover:underline">
                          {rule.name}
                        </Link>
                        <span className="text-muted-foreground text-xs">{rule.description ?? "Sin descripción"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{rule.event_type}</TableCell>
                    <TableCell>{rule.schedule_type}</TableCell>
                    <TableCell>{rule.recipient_type}</TableCell>
                    <TableCell>
                      {rule.template_id ? (
                        <Link href={`/messaging/templates/${rule.template_id}`} className="hover:underline">
                          {shortenHermesId(rule.template_id)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>
                      <HermesStatusBadge status={rule.is_active ? "COMPLETED" : "CANCELLED"} />
                    </TableCell>
                    <TableCell>{formatHermesDateTime(rule.updated_at)}</TableCell>
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
