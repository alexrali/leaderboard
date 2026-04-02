export const dynamic = 'force-dynamic'

import Link from "next/link"
import { HermesTemplateForm } from "@/components/hermes/hermes-template-form"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { Button } from "@/components/ui/button"

export default function MessagingTemplateCreatePage() {
  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title="Nuevo template"
        description="Crea un template Hermes administrado desde el panel autenticado de mensajería."
        actions={
          <Button asChild variant="outline">
            <Link href="/messaging/templates">Volver</Link>
          </Button>
        }
      />

      <HermesTemplateForm mode="create" />
    </div>
  )
}
