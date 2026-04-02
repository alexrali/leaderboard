export const dynamic = 'force-dynamic'

import Link from "next/link"
import { notFound } from "next/navigation"
import { HermesRuleForm } from "@/components/hermes/hermes-rule-form"
import { HermesPageHeader } from "@/components/hermes/hermes-page-header"
import { Button } from "@/components/ui/button"
import { getHermesAdminRule, listHermesAdminTemplates } from "@/lib/hermes/admin"

interface RuleEditPageProps {
  params: Promise<{ id: string }>
}

export default async function MessagingRuleEditPage({ params }: RuleEditPageProps) {
  const { id } = await params
  const [rule, templates] = await Promise.all([
    getHermesAdminRule(id),
    listHermesAdminTemplates(100),
  ])

  if (!rule) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <HermesPageHeader
        title={`Editar ${rule.name}`}
        description="Actualiza la configuración de matching, schedule y targeting de esta rule Hermes."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/messaging/rules/${rule.id}`}>Cancelar</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/messaging/rules">Listado</Link>
            </Button>
          </>
        }
      />

      <HermesRuleForm mode="edit" templates={templates} initialValue={rule} />
    </div>
  )
}
