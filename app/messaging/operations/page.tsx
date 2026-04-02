export const dynamic = 'force-dynamic'

import Link from "next/link"
import { HermesOperationsPanel } from "@/components/hermes/hermes-operations-panel"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { HermesStatusBadge } from "@/components/hermes/hermes-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getHermesExampleScenarios } from "@/lib/hermes/example-admin"
import { listHermesAdminRules, listHermesAdminTemplates } from "@/lib/hermes/admin"
import { formatHermesBoolean, formatHermesDateTime, shortenHermesId } from "@/lib/hermes/display"
import { getHermesOperationsContextData } from "@/lib/hermes/operations-context"

export default async function MessagingOperationsPage() {
  const [context, scenarios, templates, rules] = await Promise.all([
    getHermesOperationsContextData(),
    Promise.resolve(getHermesExampleScenarios()),
    listHermesAdminTemplates(100),
    listHermesAdminRules(100),
  ])

  const templateMap = new Map(templates.map((template) => [template.slug, template]))
  const ruleMap = new Map(rules.map((rule) => [rule.name, rule]))

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title="Operaciones"
        description="Controles manuales, contexto operacional y escenarios de validación para ejecutar Hermes desde el panel autenticado del administrador."
        actions={
          <Button asChild variant="outline">
            <Link href="/messaging">Volver al resumen</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Panel de operaciones manuales</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm leading-6">
          Usa estos controles para procesar eventos, reintentar tareas fallidas o cargar datos de ejemplo. Las operaciones se ejecutan con tu sesión de admin sin necesidad de claves API.
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eventos pendientes</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{context.summary.pendingEvents}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eventos fallidos</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{context.summary.failedEvents}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tareas pendientes</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{context.summary.pendingTasks}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tareas en retry</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{context.summary.retryingTasks}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cambios recientes de configuración</CardTitle>
            <CardDescription>Últimas templates y rules tocadas desde el panel Hermes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Actualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {context.recentConfigChanges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">Sin cambios recientes.</TableCell>
                  </TableRow>
                ) : (
                  context.recentConfigChanges.map((change) => (
                    <TableRow key={`${change.kind}-${change.id}`}>
                      <TableCell>{change.kind}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Link
                            href={change.kind === "RULE" ? `/messaging/rules/${change.id}` : `/messaging/templates/${change.id}`}
                            className="font-medium hover:underline"
                          >
                            {change.name}
                          </Link>
                          <span className="text-muted-foreground text-xs">{change.created_by ?? "Sistema / no disponible"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatHermesBoolean(change.is_active)}</TableCell>
                      <TableCell>{formatHermesDateTime(change.updated_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incidentes recientes</CardTitle>
            <CardDescription>Eventos fallidos y tareas en retry que justifican acciones manuales.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {context.failedEvents.length === 0 && context.retryingTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">Sin eventos fallidos ni tareas en retry.</TableCell>
                  </TableRow>
                ) : (
                  <>
                    {context.failedEvents.map((event) => (
                      <TableRow key={`event-${event.id}`}>
                        <TableCell>Evento</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <Link href={`/messaging/events/${event.id}`} className="font-medium hover:underline">
                              {event.type}
                            </Link>
                            <span className="text-muted-foreground text-xs">{shortenHermesId(event.id, 12)}</span>
                          </div>
                        </TableCell>
                        <TableCell><HermesStatusBadge status={event.status} /></TableCell>
                        <TableCell>{formatHermesDateTime(event.updated_at)}</TableCell>
                      </TableRow>
                    ))}
                    {context.retryingTasks.map((task) => (
                      <TableRow key={`task-${task.id}`}>
                        <TableCell>Tarea</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <Link href={`/messaging/tasks/${task.id}`} className="font-medium hover:underline">
                              {shortenHermesId(task.id, 12)}
                            </Link>
                            <span className="text-muted-foreground text-xs">Rule {shortenHermesId(task.rule_id, 12)}</span>
                          </div>
                        </TableCell>
                        <TableCell><HermesStatusBadge status={task.status} /></TableCell>
                        <TableCell>{formatHermesDateTime(task.updated_at)}</TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Escenarios de validación end-to-end</CardTitle>
          <CardDescription>Instala los ejemplos desde este panel y luego usa Review para probar los payloads sugeridos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/messaging/review">Abrir review</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/messaging/templates">Ver templates</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/messaging/rules">Ver rules</Link>
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Rule</TableHead>
                <TableHead>Payload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarios.map((scenario) => {
                const template = templateMap.get(scenario.templateSlug)
                const rule = ruleMap.get(scenario.ruleName)

                return (
                  <TableRow key={scenario.key}>
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{scenario.title}</span>
                        <span className="text-muted-foreground text-xs">{scenario.description}</span>
                        <span className="text-muted-foreground text-xs">Evento: {scenario.eventType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      {template ? (
                        <div className="flex flex-col">
                          <Link href={`/messaging/templates/${template.id}`} className="font-medium hover:underline">
                            {template.name}
                          </Link>
                          <span className="text-muted-foreground text-xs">{template.slug}</span>
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm">No instalado aún</div>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      {rule ? (
                        <div className="flex flex-col">
                          <Link href={`/messaging/rules/${rule.id}`} className="font-medium hover:underline">
                            {rule.name}
                          </Link>
                          <span className="text-muted-foreground text-xs">Priority {rule.priority}</span>
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm">No instalado aún</div>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <pre className="max-w-[560px] overflow-auto rounded-lg bg-[#fafafa] shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] p-4 text-xs leading-6 whitespace-pre-wrap break-words">
                        {JSON.stringify(scenario.sampleEvent, null, 2)}
                      </pre>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <HermesOperationsPanel />
    </div>
  )
}
