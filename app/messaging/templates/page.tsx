import Link from "next/link"
import { FileX } from "lucide-react"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listHermesAdminTemplates } from "@/lib/hermes/admin"
import { formatHermesBoolean, formatHermesDateTime } from "@/lib/hermes/display"

export default async function MessagingTemplatesPage() {
  const templates = await listHermesAdminTemplates(100)
  const activeCount = templates.filter((template) => template.is_active).length

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title="Templates"
        description="Inventario de templates de Hermes disponibles para renderizado y entrega."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/api/hermes/admin/templates">Ver API</Link>
            </Button>
            <Button asChild>
              <Link href="/messaging/templates/new">Nuevo template</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{templates.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">Templates totales</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{activeCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">Templates activos</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{templates.length - activeCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">Templates inactivos</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileX className="size-6" />
                </EmptyMedia>
                <EmptyTitle>Sin templates</EmptyTitle>
                <EmptyDescription>
                  No hay templates creados todavía. Los templates definen el diseño y contenido de tus correos.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/messaging/templates/new">Crear primer template</Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Remitente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Actualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link href={`/messaging/templates/${template.id}`} className="font-medium hover:underline">
                          {template.name}
                        </Link>
                        <span className="text-muted-foreground text-xs">{template.description ?? "Sin descripción"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{template.slug}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{template.subject}</TableCell>
                    <TableCell>{template.from_email ?? "Usa default env"}</TableCell>
                    <TableCell>{formatHermesBoolean(template.is_active)}</TableCell>
                    <TableCell>{formatHermesDateTime(template.updated_at)}</TableCell>
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
