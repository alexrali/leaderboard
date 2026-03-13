import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { HermesStatusBadge } from "@/components/hermes/hermes-status-badge"
import { formatHermesDateTime, shortenHermesId } from "@/lib/hermes/display"
import type { HermesEventTimelineData } from "@/lib/hermes/review"

interface HermesEventTimelineProps extends HermesEventTimelineData {
  showEventLinks?: boolean
}

export function HermesEventTimeline({ event, matchedRules, tasks, deliveries, showEventLinks = true }: HermesEventTimelineProps) {
  const timelineItems = [
    {
      id: `${event.id}-created`,
      timestamp: event.created_at,
      title: "Evento recibido",
      description: `${event.type} desde ${event.source}`,
      kind: "Evento",
      href: showEventLinks && !event.id.startsWith("preview-") ? `/messaging/events/${event.id}` : null,
      status: event.status,
    },
    ...(event.processed_at
      ? [
          {
            id: `${event.id}-processed`,
            timestamp: event.processed_at,
            title: "Evento procesado",
            description: event.error_message ?? "Procesamiento completado",
            kind: "Evento",
            href: showEventLinks && !event.id.startsWith("preview-") ? `/messaging/events/${event.id}` : null,
            status: event.status,
          },
        ]
      : []),
    ...tasks.map((task) => ({
      id: task.id,
      timestamp: task.processed_at ?? task.scheduled_for,
      title: `Task ${shortenHermesId(task.id, 12)}`,
      description: task.processed_at
        ? `Rule ${shortenHermesId(task.rule_id, 12)}`
        : `Programada para ${formatHermesDateTime(task.scheduled_for)}`,
      kind: "Task",
      href: `/messaging/tasks/${task.id}`,
      status: task.status,
    })),
    ...deliveries.map((delivery) => ({
      id: delivery.id,
      timestamp: delivery.clicked_at ?? delivery.opened_at ?? delivery.delivered_at ?? delivery.sent_at ?? delivery.created_at,
      title: delivery.recipient_email,
      description: delivery.subject ?? "Sin asunto",
      kind: "Entrega",
      href: `/messaging/delivery/${delivery.id}`,
      status: delivery.status,
    })),
  ].sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime())

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Línea de tiempo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timelineItems.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{item.kind}</Badge>
                    {item.href ? (
                      <Link href={item.href} className="font-medium hover:underline">
                        {item.title}
                      </Link>
                    ) : (
                      <span className="font-medium">{item.title}</span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm">{item.description}</div>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <HermesStatusBadge status={item.status} />
                  <div className="text-muted-foreground text-xs">{formatHermesDateTime(item.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review de reglas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Preview</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matchedRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">No hubo rules analizadas para este evento.</TableCell>
                </TableRow>
              ) : (
                matchedRules.map((match) => (
                  <TableRow key={match.ruleId}>
                    <TableCell>
                      <Link href={`/messaging/rules/${match.ruleId}`} className="font-medium hover:underline">
                        {match.ruleName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={match.matched ? "default" : "outline"}>{match.matched ? "MATCH" : "NO MATCH"}</Badge>
                    </TableCell>
                    <TableCell>{match.scheduleType}</TableCell>
                    <TableCell>
                      {match.templateId ? (
                        <Link href={`/messaging/templates/${match.templateId}`} className="hover:underline">
                          {shortenHermesId(match.templateId, 12)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{match.recipientCount}</TableCell>
                    <TableCell className="max-w-[420px] truncate">{match.renderError ?? match.subjectPreview ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {matchedRules.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {matchedRules.map((match) => (
            <Card key={`${match.ruleId}-details`}>
              <CardHeader>
                <CardTitle className="text-base">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/messaging/rules/${match.ruleId}`} className="hover:underline">
                      {match.ruleName}
                    </Link>
                    <Badge variant="outline">{match.recipientType}</Badge>
                    <Badge variant="outline">{match.scheduleType}</Badge>
                    <Badge variant={match.matched ? "default" : "outline"}>{match.matched ? "MATCH" : "NO MATCH"}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Condiciones</div>
                  {match.conditionResults.length === 0 ? (
                    <div className="text-muted-foreground text-sm">Sin condiciones configuradas.</div>
                  ) : (
                    <div className="space-y-2">
                      {match.conditionResults.map((condition, index) => (
                        <div key={`${match.ruleId}-condition-${index}`} className="rounded-lg border p-3 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={condition.passed ? "default" : "outline"}>{condition.passed ? "PASS" : "FAIL"}</Badge>
                            <span className="font-medium">{condition.field}</span>
                            <span className="text-muted-foreground">{condition.operator}</span>
                          </div>
                          <div className="mt-2 grid gap-2 md:grid-cols-2">
                            <div>
                              <div className="text-muted-foreground text-xs">Expected</div>
                              <pre className="overflow-auto text-xs whitespace-pre-wrap break-words">{JSON.stringify(condition.expectedValue, null, 2)}</pre>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-xs">Actual</div>
                              <pre className="overflow-auto text-xs whitespace-pre-wrap break-words">{JSON.stringify(condition.actualValue, null, 2)}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Recipients</div>
                  {match.recipientResolutionError ? (
                    <div className="text-sm text-amber-600">{match.recipientResolutionError}</div>
                  ) : null}
                  {match.recipients.length === 0 ? (
                    <div className="text-muted-foreground text-sm">Sin recipients resueltos.</div>
                  ) : (
                    <div className="space-y-2">
                      {match.recipients.map((recipient, index) => (
                        <div key={`${match.ruleId}-recipient-${index}`} className="rounded-lg border p-3 text-sm">
                          <div className="font-medium">{recipient.email}</div>
                          <div className="text-muted-foreground">{recipient.name ?? "Sin nombre"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Extracted data</div>
                  <pre className="max-h-[180px] overflow-auto rounded-lg border bg-muted/20 p-3 text-xs whitespace-pre-wrap break-words">
                    {JSON.stringify(match.extractedData, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

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
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">Sin tareas relacionadas.</TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Link href={`/messaging/tasks/${task.id}`} className="font-medium hover:underline">
                          {shortenHermesId(task.id, 12)}
                        </Link>
                      </TableCell>
                      <TableCell><HermesStatusBadge status={task.status} /></TableCell>
                      <TableCell>{formatHermesDateTime(task.scheduled_for)}</TableCell>
                    </TableRow>
                  ))
                )}
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
                {deliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">Sin entregas relacionadas.</TableCell>
                  </TableRow>
                ) : (
                  deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <Link href={`/messaging/delivery/${delivery.id}`} className="font-medium hover:underline">
                          {delivery.recipient_email}
                        </Link>
                      </TableCell>
                      <TableCell><HermesStatusBadge status={delivery.status} /></TableCell>
                      <TableCell>{formatHermesDateTime(delivery.clicked_at ?? delivery.opened_at ?? delivery.delivered_at ?? delivery.sent_at ?? delivery.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
