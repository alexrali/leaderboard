export const dynamic = 'force-dynamic'

import Link from "next/link"
import { notFound } from "next/navigation"
import { HermesDetailGrid } from "@/components/hermes/hermes-detail-grid"
import { HermesJsonPanel } from "@/components/hermes/hermes-json-panel"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { HermesStatusBadge } from "@/components/hermes/hermes-status-badge"
import { Button } from "@/components/ui/button"
import { getHermesAdminDeliveryLog } from "@/lib/hermes/admin"
import { formatHermesDateTime, shortenHermesId } from "@/lib/hermes/display"

interface DeliveryDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MessagingDeliveryDetailPage({ params }: DeliveryDetailPageProps) {
  const { id } = await params
  const delivery = await getHermesAdminDeliveryLog(id)

  if (!delivery) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title={delivery.recipient_email}
        description="Detalle del registro de entrega, estado reportado por Resend y metadata persistida por Hermes."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/messaging/delivery">Volver</Link>
            </Button>
            <Button asChild>
              <Link href={`/api/hermes/admin/delivery-logs/${delivery.id}`}>Ver API</Link>
            </Button>
          </>
        }
      />

      <HermesDetailGrid
        title="Resumen"
        fields={[
          { label: "ID", value: shortenHermesId(delivery.id, 12) },
          { label: "Status", value: <HermesStatusBadge status={delivery.status} /> },
          { label: "Resend ID", value: delivery.resend_id ?? "—" },
          { label: "Resend status", value: delivery.resend_status ?? "—" },
          { label: "Asunto", value: delivery.subject ?? "—" },
          { label: "Recipient name", value: delivery.recipient_name ?? "—" },
          { label: "Event", value: delivery.event_id ? <Link href={`/messaging/events/${delivery.event_id}`} className="hover:underline">{shortenHermesId(delivery.event_id, 12)}</Link> : "—" },
          { label: "Rule", value: delivery.rule_id ? <Link href={`/messaging/rules/${delivery.rule_id}`} className="hover:underline">{shortenHermesId(delivery.rule_id, 12)}</Link> : "—" },
          { label: "Template", value: delivery.template_id ? <Link href={`/messaging/templates/${delivery.template_id}`} className="hover:underline">{shortenHermesId(delivery.template_id, 12)}</Link> : "—" },
          { label: "Sent at", value: formatHermesDateTime(delivery.sent_at) },
          { label: "Delivered at", value: formatHermesDateTime(delivery.delivered_at) },
          { label: "Opened at", value: formatHermesDateTime(delivery.opened_at) },
          { label: "Clicked at", value: formatHermesDateTime(delivery.clicked_at) },
          { label: "Creado", value: formatHermesDateTime(delivery.created_at) },
          { label: "Error", value: delivery.error_message ?? "—" },
        ]}
      />

      <HermesJsonPanel title="Metadata" value={delivery.metadata} />
    </div>
  )
}
