export const dynamic = 'force-dynamic'

import Link from "next/link"
import { HermesRuleForm } from "@/components/hermes/hermes-rule-form"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { Button } from "@/components/ui/button"
import { listHermesAdminTemplates } from "@/lib/hermes/admin"

export default async function MessagingRuleCreatePage() {
  const templates = await listHermesAdminTemplates(100)

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title="Nueva rule"
        description="Crea una rule Hermes desde el panel autenticado, con matching, schedule y targeting explícitos."
        actions={
          <Button asChild variant="outline">
            <Link href="/messaging/rules">Volver</Link>
          </Button>
        }
      />

      <HermesRuleForm mode="create" templates={templates} />
    </div>
  )
}
