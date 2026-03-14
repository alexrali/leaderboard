import Link from "next/link"
import { Clock } from "lucide-react"
import { HermesFilterLinks } from "@/components/hermes/hermes-filter-links"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { HermesStatusBadge } from "@/components/hermes/hermes-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listHermesAdminScheduledTasks } from "@/lib/hermes/admin"
import { formatHermesDateTime, shortenHermesId } from "@/lib/hermes/display"
import type { HermesTaskStatus } from "@/lib/hermes/types"

interface TasksPageProps {
  searchParams: Promise<{ status?: string }>
}

const taskFilters: Array<{ label: string; value: HermesTaskStatus | "ALL" }> = [
  { label: "Todos", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Retrying", value: "RETRYING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
]

export default async function MessagingTasksPage({ searchParams }: TasksPageProps) {
  const { status } = await searchParams
  const currentStatus = (status ?? "ALL") as HermesTaskStatus | "ALL"
  const tasks = await listHermesAdminScheduledTasks({ limit: 100, status: currentStatus })

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title="Tareas programadas"
        description="Cola de tareas diferidas, procesadas o en reintento dentro de Hermes."
        actions={
          <Button asChild variant="outline">
            <Link href={currentStatus === "ALL" ? "/api/hermes/admin/scheduled-tasks" : `/api/hermes/admin/scheduled-tasks?status=${currentStatus}`}>
              Ver API
            </Link>
          </Button>
        }
      />

      <HermesFilterLinks basePath="/messaging/tasks" currentValue={currentStatus} items={taskFilters} />

      <Card>
        <CardHeader>
          <CardTitle>Tareas</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Clock className="size-6" />
                </EmptyMedia>
                <EmptyTitle>Sin tareas</EmptyTitle>
                <EmptyDescription>
                  {currentStatus === "ALL"
                    ? "No hay tareas programadas. Las tareas se crean cuando una rule con schedule procesa un evento."
                    : "No hay tareas con el estado seleccionado. Prueba cambiando el filtro."}
                </EmptyDescription>
              </EmptyHeader>
              {currentStatus === "ALL" && (
                <EmptyContent>
                  <Button asChild variant="outline">
                    <Link href="/messaging/rules">Ver rules</Link>
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Rule</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Programada</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Next retry</TableHead>
                  <TableHead>Procesada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Link href={`/messaging/tasks/${task.id}`} className="hover:underline">
                        {shortenHermesId(task.id)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/messaging/rules/${task.rule_id}`} className="hover:underline">
                        {shortenHermesId(task.rule_id)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {task.event_id ? (
                        <Link href={`/messaging/events/${task.event_id}`} className="hover:underline">
                          {shortenHermesId(task.event_id)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell><HermesStatusBadge status={task.status} /></TableCell>
                    <TableCell>{formatHermesDateTime(task.scheduled_for)}</TableCell>
                    <TableCell>{task.retry_count} / {task.max_retries}</TableCell>
                    <TableCell>{formatHermesDateTime(task.next_retry_at)}</TableCell>
                    <TableCell>{formatHermesDateTime(task.processed_at)}</TableCell>
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
