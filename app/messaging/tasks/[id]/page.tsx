export const dynamic = 'force-dynamic'

import Link from "next/link"
import { notFound } from "next/navigation"
import { HermesDetailGrid } from "@/components/hermes/hermes-detail-grid"
import { HermesJsonPanel } from "@/components/hermes/hermes-json-panel"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { HermesStatusBadge } from "@/components/hermes/hermes-status-badge"
import { Button } from "@/components/ui/button"
import { getHermesAdminScheduledTask } from "@/lib/hermes/admin"
import { formatHermesDateTime, shortenHermesId } from "@/lib/hermes/display"

interface TaskDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MessagingTaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params
  const task = await getHermesAdminScheduledTask(id)

  if (!task) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title={`Task ${shortenHermesId(task.id, 12)}`}
        description="Detalle de una tarea diferida, incluyendo payload persistido, resultado y estado de reintentos."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/messaging/tasks">Volver</Link>
            </Button>
            <Button asChild>
              <Link href={`/api/hermes/admin/scheduled-tasks/${task.id}`}>Ver API</Link>
            </Button>
          </>
        }
      />

      <HermesDetailGrid
        title="Resumen"
        fields={[
          { label: "ID", value: shortenHermesId(task.id, 12) },
          { label: "Status", value: <HermesStatusBadge status={task.status} /> },
          { label: "Rule", value: <Link href={`/messaging/rules/${task.rule_id}`} className="hover:underline">{shortenHermesId(task.rule_id, 12)}</Link> },
          { label: "Event", value: task.event_id ? <Link href={`/messaging/events/${task.event_id}`} className="hover:underline">{shortenHermesId(task.event_id, 12)}</Link> : "—" },
          { label: "Scheduled for", value: formatHermesDateTime(task.scheduled_for) },
          { label: "Processed at", value: formatHermesDateTime(task.processed_at) },
          { label: "Retries", value: `${task.retry_count} / ${task.max_retries}` },
          { label: "Next retry", value: formatHermesDateTime(task.next_retry_at) },
          { label: "Creado", value: formatHermesDateTime(task.created_at) },
          { label: "Actualizado", value: formatHermesDateTime(task.updated_at) },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <HermesJsonPanel title="Event data" value={task.event_data} />
        <HermesJsonPanel title="Result" value={task.result ?? {}} />
      </div>
    </div>
  )
}
