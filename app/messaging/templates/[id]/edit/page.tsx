import Link from "next/link"
import { notFound } from "next/navigation"
import { HermesTemplateForm } from "@/components/hermes/hermes-template-form"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { Button } from "@/components/ui/button"
import { getHermesAdminTemplate } from "@/lib/hermes/admin"

interface TemplateEditPageProps {
  params: Promise<{ id: string }>
}

export default async function MessagingTemplateEditPage({ params }: TemplateEditPageProps) {
  const { id } = await params
  const template = await getHermesAdminTemplate(id)

  if (!template) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title={`Editar ${template.name}`}
        description="Actualiza contenido, variables y configuración de envío del template Hermes."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/messaging/templates/${template.id}`}>Cancelar</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/messaging/templates">Listado</Link>
            </Button>
          </>
        }
      />

      <HermesTemplateForm mode="edit" initialValue={template} />
    </div>
  )
}
