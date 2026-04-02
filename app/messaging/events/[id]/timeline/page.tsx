export const dynamic = 'force-dynamic'

import Link from "next/link"
import { notFound } from "next/navigation"
import { HermesEventTimeline } from "@/components/hermes/hermes-event-timeline"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { Button } from "@/components/ui/button"
import { getHermesAdminEventTimeline } from "@/lib/hermes/review"

interface EventTimelinePageProps {
  params: Promise<{ id: string }>
}

export default async function MessagingEventTimelinePage({ params }: EventTimelinePageProps) {
  const { id } = await params
  const timeline = await getHermesAdminEventTimeline(id)

  if (!timeline) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title={`Timeline ${timeline.event.type}`}
        description="Vista end-to-end del evento, sus matches, tareas y entregas derivadas."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/messaging/events/${timeline.event.id}`}>Detalle</Link>
            </Button>
            <Button asChild>
              <Link href={`/api/hermes/admin/events/${timeline.event.id}/timeline`}>Ver API</Link>
            </Button>
          </>
        }
      />

      <HermesEventTimeline {...timeline} />
    </div>
  )
}
