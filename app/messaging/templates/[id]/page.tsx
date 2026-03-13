import Link from "next/link"
import { notFound } from "next/navigation"
import { HermesDetailGrid } from "@/components/hermes/hermes-detail-grid"
import { HermesJsonPanel } from "@/components/hermes/hermes-json-panel"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getHermesAdminTemplate, listHermesAdminRulesByTemplate } from "@/lib/hermes/admin"
import { formatHermesBoolean, formatHermesDateTime, shortenHermesId } from "@/lib/hermes/display"

interface TemplateDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MessagingTemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { id } = await params
  const [template, relatedRules] = await Promise.all([
    getHermesAdminTemplate(id),
    listHermesAdminRulesByTemplate(id, 20),
  ])

  if (!template) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title={template.name}
        description="Detalle completo del template Hermes, incluyendo contenido y defaults de renderizado."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/messaging/templates">Volver</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/messaging/templates/${template.id}/edit`}>Editar</Link>
            </Button>
            <Button asChild>
              <Link href={`/api/hermes/admin/templates/${template.id}`}>Ver API</Link>
            </Button>
          </>
        }
      />

      <HermesDetailGrid
        title="Resumen"
        fields={[
          { label: "ID", value: shortenHermesId(template.id, 12) },
          { label: "Slug", value: template.slug },
          { label: "Estado", value: formatHermesBoolean(template.is_active) },
          { label: "Asunto", value: template.subject },
          { label: "From email", value: template.from_email ?? "Usa default env" },
          { label: "From name", value: template.from_name ?? "—" },
          { label: "Reply-to", value: template.reply_to ?? "—" },
          { label: "Creado", value: formatHermesDateTime(template.created_at) },
          { label: "Actualizado", value: formatHermesDateTime(template.updated_at) },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <HermesJsonPanel title="Variables" value={template.variables} />
        <HermesJsonPanel title="Default values" value={template.default_values} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <HermesJsonPanel title="HTML content" value={template.html_content} />
        <HermesJsonPanel title="Text content" value={template.text_content ?? ""} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rules relacionadas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Event type</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relatedRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Link href={`/messaging/rules/${rule.id}`} className="font-medium hover:underline">
                      {rule.name}
                    </Link>
                  </TableCell>
                  <TableCell>{rule.event_type}</TableCell>
                  <TableCell>{rule.schedule_type}</TableCell>
                  <TableCell>{formatHermesBoolean(rule.is_active)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
