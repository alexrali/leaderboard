import { createHermesAdminClient } from "@/lib/hermes/server"
import { createHermesTemplate, updateHermesTemplate } from "@/lib/hermes/template-admin"
import { createHermesRule, updateHermesRule } from "@/lib/hermes/rule-admin"
import type { HermesTemplateMutationInput } from "@/lib/hermes/template-admin"
import type { HermesRuleMutationInput } from "@/lib/hermes/rule-admin"
import type { HermesJsonObject, HermesRuleRecord, HermesTemplateRecord } from "@/lib/hermes/types"

interface HermesExampleTemplateDefinition {
  key: string
  data: HermesTemplateMutationInput
}

interface HermesExampleRuleDefinition {
  key: string
  data: (templates: Record<string, HermesTemplateRecord>, createdBy: string | null) => HermesRuleMutationInput
}

export interface HermesExampleScenario {
  key: string
  title: string
  eventType: string
  description: string
  templateSlug: string
  ruleName: string
  sampleEvent: {
    type: string
    source: "api"
    payload: HermesJsonObject
    metadata: HermesJsonObject
  }
}

export interface HermesExampleInstallResult {
  templates: HermesTemplateRecord[]
  rules: HermesRuleRecord[]
  scenarios: HermesExampleScenario[]
}

const hermesExampleTemplates: HermesExampleTemplateDefinition[] = [
  {
    key: "welcome_signup",
    data: {
      name: "[Example] Welcome Signup",
      slug: "example-welcome-signup",
      description: "Ejemplo end-to-end de bienvenida inmediata inspirado en hermes-base.",
      subject: "Bienvenido a Hermes, {{userName}}",
      html_content: `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
    <h1 style="margin-bottom: 12px;">Hola {{userName}} 👋</h1>
    <p>Tu cuenta <strong>{{userEmail}}</strong> ya quedó registrada en Hermes.</p>
    <p>
      Puedes entrar al panel desde
      <a href="{{accountUrl}}">{{accountUrl}}</a>.
    </p>
    <p style="margin-top: 24px; color: #6b7280;">Evento: {{eventType}}</p>
  </body>
</html>`,
      text_content: "Hola {{userName}}. Tu cuenta {{userEmail}} ya quedó registrada en Hermes. Accede al panel en {{accountUrl}}.",
      variables: [
        { name: "userName", type: "string", path: "user.name", required: true },
        { name: "userEmail", type: "string", path: "user.email", required: true },
        { name: "accountUrl", type: "string", defaultValue: "https://example.com/app" },
      ],
      default_values: {
        accountUrl: "https://example.com/app",
      },
      from_email: null,
      from_name: "Hermes",
      reply_to: null,
      is_active: true,
    },
  },
  {
    key: "report_ready",
    data: {
      name: "[Example] Report Ready",
      slug: "example-report-ready",
      description: "Ejemplo end-to-end de reporte generado con delivery diferido y fallback operacional.",
      subject: "Reporte {{reportName}} listo para {{requesterName}}",
      html_content: `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
    <h1 style="margin-bottom: 12px;">Tu reporte está listo</h1>
    <p><strong>{{reportName}}</strong> terminó de procesarse correctamente.</p>
    <p>Solicitante: {{requesterName}}</p>
    {{#if downloadUrl}}
      <p>Descárgalo aquí: <a href="{{downloadUrl}}">{{downloadUrl}}</a></p>
    {{/if}}
    <p style="margin-top: 24px; color: #6b7280;">Prioridad: {{reportPriority}}</p>
  </body>
</html>`,
      text_content: "El reporte {{reportName}} está listo. Solicitante: {{requesterName}}. Descarga: {{downloadUrl}}. Prioridad: {{reportPriority}}.",
      variables: [
        { name: "reportName", type: "string", path: "report.name", required: true },
        { name: "reportPriority", type: "string", path: "report.priority", required: true },
        { name: "requesterName", type: "string", path: "requester.name", required: true },
        { name: "downloadUrl", type: "string", path: "report.downloadUrl" },
      ],
      default_values: {
        reportPriority: "normal",
      },
      from_email: null,
      from_name: "Hermes Reports",
      reply_to: null,
      is_active: true,
    },
  },
]

const hermesExampleRules: HermesExampleRuleDefinition[] = [
  {
    key: "welcome_signup",
    data: (templates, createdBy) => ({
      name: "[Example] Welcome Signup Rule",
      description: "Envía un correo inmediato de bienvenida usando recipient dinámico.",
      event_type: "user.signup",
      event_conditions: [{ field: "user.email", operator: "exists" }],
      schedule_type: "IMMEDIATE",
      schedule_config: {},
      timezone: "UTC",
      recipient_type: "DYNAMIC",
      recipient_config: {
        emailPath: "user.email",
        namePath: "user.name",
      },
      template_id: templates.welcome_signup.id,
      priority: 10,
      is_active: true,
      created_by: createdBy,
    }),
  },
  {
    key: "report_ready",
    data: (templates, createdBy) => ({
      name: "[Example] Report Ready Rule",
      description: "Programa una notificación diferida y usa recipient condicional para escalar reportes de alta prioridad.",
      event_type: "report.generated",
      event_conditions: [
        { field: "report.status", operator: "eq", value: "READY" },
        { field: "requester.email", operator: "exists" },
      ],
      schedule_type: "DELAYED",
      schedule_config: {
        delayMinutes: 15,
      },
      timezone: "UTC",
      recipient_type: "CONDITIONAL",
      recipient_config: {
        conditions: [
          {
            when: [{ field: "report.priority", operator: "eq", value: "high" }],
            then: { emails: ["ops@example.com"] },
          },
        ],
        default: {
          emailPath: "requester.email",
          namePath: "requester.name",
        },
      },
      template_id: templates.report_ready.id,
      priority: 20,
      is_active: true,
      created_by: createdBy,
    }),
  },
]

const hermesExampleScenarios: HermesExampleScenario[] = [
  {
    key: "welcome_signup",
    title: "Signup inmediato",
    description: "Valida matching inmediato, recipient dinámico y render de placeholders básicos.",
    eventType: "user.signup",
    templateSlug: "example-welcome-signup",
    ruleName: "[Example] Welcome Signup Rule",
    sampleEvent: {
      type: "user.signup",
      source: "api",
      payload: {
        user: {
          name: "Ada Lovelace",
          email: "ada@example.com",
        },
      },
      metadata: {
        scenario: "welcome_signup",
      },
    },
  },
  {
    key: "report_ready",
    title: "Reporte generado con delay",
    description: "Valida task diferida, conditions múltiples y recipient condicional con fallback dinámico.",
    eventType: "report.generated",
    templateSlug: "example-report-ready",
    ruleName: "[Example] Report Ready Rule",
    sampleEvent: {
      type: "report.generated",
      source: "api",
      payload: {
        report: {
          name: "Weekly Operations Summary",
          status: "READY",
          priority: "normal",
          downloadUrl: "https://example.com/reports/weekly-operations-summary",
        },
        requester: {
          name: "Grace Hopper",
          email: "grace@example.com",
        },
      },
      metadata: {
        scenario: "report_ready",
      },
    },
  },
]

async function getTemplateBySlug(slug: string): Promise<HermesTemplateRecord | null> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_templates")
    .select("id, name, slug, description, subject, html_content, text_content, variables, default_values, from_email, from_name, reply_to, is_active, created_at, updated_at")
    .eq("slug", slug)
    .single()

  if (error || !data) {
    return null
  }

  return data as HermesTemplateRecord
}

async function getRuleByName(name: string): Promise<HermesRuleRecord | null> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_rules")
    .select("id, name, description, event_type, event_conditions, schedule_type, schedule_config, timezone, recipient_type, recipient_config, template_id, priority, is_active, created_by, created_at, updated_at")
    .eq("name", name)
    .single()

  if (error || !data) {
    return null
  }

  return data as HermesRuleRecord
}

export async function installHermesExampleScenarios(createdBy: string | null): Promise<HermesExampleInstallResult> {
  const templates: HermesTemplateRecord[] = []
  const templateMap = {} as Record<string, HermesTemplateRecord>

  for (const definition of hermesExampleTemplates) {
    const existing = await getTemplateBySlug(definition.data.slug)
    const template = existing
      ? await updateHermesTemplate(existing.id, definition.data)
      : await createHermesTemplate(definition.data)

    templates.push(template)
    templateMap[definition.key] = template
  }

  const rules: HermesRuleRecord[] = []

  for (const definition of hermesExampleRules) {
    const ruleInput = definition.data(templateMap, createdBy)
    const existing = await getRuleByName(ruleInput.name)
    const rule = existing
      ? await updateHermesRule(existing.id, ruleInput)
      : await createHermesRule(ruleInput)

    rules.push(rule)
  }

  return {
    templates,
    rules,
    scenarios: hermesExampleScenarios,
  }
}

export function getHermesExampleScenarios(): HermesExampleScenario[] {
  return hermesExampleScenarios
}
