export const dynamic = 'force-dynamic'

import Link from "next/link"
import { Activity, AlertTriangle, ArrowRight, Clock3, FileText, Send, Workflow } from "lucide-react"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { HermesStatusBadge } from "@/components/hermes/hermes-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getHermesAdminSummary, listHermesAdminDeliveryLogs, listHermesAdminEvents, listHermesAdminScheduledTasks } from "@/lib/hermes/admin"
import { formatHermesDateTime, shortenHermesId } from "@/lib/hermes/display"

export default async function MessagingOverviewPage() {
  const [summary, events, deliveries, tasks] = await Promise.all([
    getHermesAdminSummary(),
    listHermesAdminEvents({ limit: 8 }),
    listHermesAdminDeliveryLogs({ limit: 8 }),
    listHermesAdminScheduledTasks({ limit: 8 }),
  ])

  const isFirstTimeUser = summary.totalTemplates === 0 && summary.totalRules === 0 && summary.pendingEvents === 0

  const cards = [
    {
      title: "Templates activos",
      value: `${summary.activeTemplates} / ${summary.totalTemplates}`,
      description: "Templates activos disponibles",
      icon: FileText,
    },
    {
      title: "Rules activas",
      value: `${summary.activeRules} / ${summary.totalRules}`,
      description: "Rules listas para procesar eventos",
      icon: Workflow,
    },
    {
      title: "Eventos pendientes",
      value: String(summary.pendingEvents),
      description: `${summary.failedEvents} eventos fallidos`,
      icon: Activity,
    },
    {
      title: "Tareas en cola",
      value: String(summary.pendingTasks),
      description: `${summary.retryingTasks} en reintento`,
      icon: Clock3,
    },
    {
      title: "Entregas hoy",
      value: String(summary.sentToday),
      description: "Registros no fallidos del día",
      icon: Send,
    },
    {
      title: "Fallas hoy",
      value: String(summary.failedToday),
      description: "Errores registrados hoy",
      icon: AlertTriangle,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title="Resumen Hermes"
        description="Visión rápida del estado de la plataforma de mensajería y de los últimos movimientos procesados."
        actions={
          <Button asChild>
            <Link href="/api/hermes/admin/summary">Ver summary API</Link>
          </Button>
        }
      />

      {isFirstTimeUser && (
        <Card className="bg-[#fafafa]">
          <CardHeader>
            <CardTitle className="text-lg">Bienvenido a Hermes</CardTitle>
            <CardDescription>
              Hermes es tu plataforma de mensajería transaccional. Configura rules para que eventos automáticos disparen envíos de correo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="bg-[#fafafa] shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <span className="text-lg font-semibold text-primary">1</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Crea un template</p>
                  <p className="text-muted-foreground text-sm">Diseña el contenido de tus correos.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-[#fafafa] shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <span className="text-lg font-semibold text-primary">2</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Configura una rule</p>
                  <p className="text-muted-foreground text-sm">Define qué eventos disparan envíos.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-[#fafafa] shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <span className="text-lg font-semibold text-primary">3</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Prueba un evento</p>
                  <p className="text-muted-foreground text-sm">Valida que todo funcione correctamente.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/messaging/templates/new">
                  Crear primer template
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/messaging/operations">Instalar ejemplos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Icon className="size-4" />
                  <span>{card.title}</span>
                </CardDescription>
                <CardTitle className="text-3xl">{card.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Eventos recientes</CardTitle>
            <CardDescription>Últimos eventos ingeridos y su estado actual.</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Sin eventos</EmptyTitle>
                  <EmptyDescription>No hay eventos registrados todavía.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/messaging/review">Probar evento</Link>
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Status</TableHead>
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
                      <TableCell><HermesStatusBadge status={event.status} /></TableCell>
                      <TableCell>{formatHermesDateTime(event.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Entregas recientes</CardTitle>
            <CardDescription>Últimos intentos de entrega registrados por Hermes.</CardDescription>
          </CardHeader>
          <CardContent>
            {deliveries.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Sin entregas</EmptyTitle>
                  <EmptyDescription>No hay entregas registradas todavía.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/messaging/review">Probar envío</Link>
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
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
                        <div className="flex flex-col">
                          <Link href={`/messaging/delivery/${delivery.id}`} className="font-medium hover:underline">
                            {delivery.recipient_email}
                          </Link>
                          <span className="text-muted-foreground text-xs">{delivery.subject ?? "Sin asunto"}</span>
                        </div>
                      </TableCell>
                      <TableCell><HermesStatusBadge status={delivery.status} /></TableCell>
                      <TableCell>{formatHermesDateTime(delivery.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Tareas programadas</CardTitle>
            <CardDescription>Estado actual de tareas diferidas o en reintento.</CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Sin tareas</EmptyTitle>
                  <EmptyDescription>No hay tareas programadas todavía.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/messaging/rules">Crear rule</Link>
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Programada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <Link href={`/messaging/rules/${task.rule_id}`} className="font-medium hover:underline">
                            {shortenHermesId(task.rule_id)}
                          </Link>
                          <Link href={`/messaging/tasks/${task.id}`} className="text-muted-foreground text-xs hover:underline">
                            {shortenHermesId(task.id)}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell><HermesStatusBadge status={task.status} /></TableCell>
                      <TableCell>{formatHermesDateTime(task.scheduled_for)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
