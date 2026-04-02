"use client"

import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { HermesAdminTemplateListItem } from "@/lib/hermes/admin"
import type { HermesRecipientType, HermesScheduleType } from "@/lib/hermes/types"

interface HermesRuleFormInitialValue {
  id?: string
  name: string
  description: string | null
  event_type: string
  event_conditions: unknown
  schedule_type: string
  schedule_config: unknown
  timezone: string
  recipient_type: string
  recipient_config: unknown
  template_id: string | null
  priority: number
  is_active: boolean
  created_by?: string | null
}

interface HermesRuleFormProps {
  mode: "create" | "edit"
  templates: HermesAdminTemplateListItem[]
  initialValue?: HermesRuleFormInitialValue
}

const scheduleTypes: HermesScheduleType[] = ["IMMEDIATE", "DELAYED", "SCHEDULED", "RECURRING", "BATCHED"]
const recipientTypes: HermesRecipientType[] = ["STATIC", "DYNAMIC", "CONDITIONAL", "LOOKUP", "GROUP"]

interface RuleFormState {
  name: string
  description: string
  event_type: string
  event_conditions_text: string
  schedule_type: HermesScheduleType
  schedule_config_text: string
  timezone: string
  recipient_type: HermesRecipientType
  recipient_config_text: string
  template_id: string
  priority: string
  is_active: boolean
}

interface RuleConfigState {
  eventConditionsCount: number
  scheduleConfigKeys: number
  recipientConfigKeys: number
  error: string | null
}

function buildInitialState(initialValue?: HermesRuleFormInitialValue): RuleFormState {
  return {
    name: initialValue?.name ?? "",
    description: initialValue?.description ?? "",
    event_type: initialValue?.event_type ?? "user.signup",
    event_conditions_text: JSON.stringify(initialValue?.event_conditions ?? [], null, 2),
    schedule_type: (initialValue?.schedule_type as HermesScheduleType) ?? "IMMEDIATE",
    schedule_config_text: JSON.stringify(initialValue?.schedule_config ?? {}, null, 2),
    timezone: initialValue?.timezone ?? "UTC",
    recipient_type: (initialValue?.recipient_type as HermesRecipientType) ?? "STATIC",
    recipient_config_text: JSON.stringify(initialValue?.recipient_config ?? { emails: ["demo@example.com"] }, null, 2),
    template_id: initialValue?.template_id ?? "",
    priority: String(initialValue?.priority ?? 100),
    is_active: initialValue?.is_active ?? true,
  }
}

const scheduleConfigExamples: Record<HermesScheduleType, string> = {
  IMMEDIATE: "{}",
  DELAYED: JSON.stringify({ delayMinutes: 30 }, null, 2),
  SCHEDULED: JSON.stringify({ time: "09:00" }, null, 2),
  RECURRING: JSON.stringify({ cron: "0 9 * * 1-5" }, null, 2),
  BATCHED: JSON.stringify({ windowMinutes: 15, maxBatchSize: 100 }, null, 2),
}

const recipientConfigExamples: Record<HermesRecipientType, string> = {
  STATIC: JSON.stringify({ emails: ["demo@example.com"] }, null, 2),
  DYNAMIC: JSON.stringify({ emailPath: "user.email", namePath: "user.name" }, null, 2),
  CONDITIONAL: JSON.stringify(
    {
      conditions: [
        {
          when: [{ field: "user.country", operator: "eq", value: "MX" }],
          then: { emails: ["ops@example.com"] },
        },
      ],
      default: { emails: ["fallback@example.com"] },
    },
    null,
    2
  ),
  LOOKUP: JSON.stringify({ lookupField: "manager_id", eventPath: "user.managerId" }, null, 2),
  GROUP: JSON.stringify({ groupId: "support-team" }, null, 2),
}

const eventConditionExample = JSON.stringify([{ field: "user.plan", operator: "eq", value: "pro" }], null, 2)

export function HermesRuleForm({ mode, templates, initialValue }: HermesRuleFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<RuleFormState>(() => buildInitialState(initialValue))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [configTab, setConfigTab] = useState("matching")

  const isEditMode = mode === "edit" && typeof initialValue?.id === "string"

  useEffect(() => {
    if (values.template_id || templates.length === 0) {
      return
    }

    setValues((current) => ({
      ...current,
      template_id: templates[0]?.id ?? "",
    }))
  }, [templates, values.template_id])

  function updateValue<K extends keyof RuleFormState>(key: K, value: RuleFormState[K]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === values.template_id) ?? null,
    [templates, values.template_id]
  )

  const configState = useMemo<RuleConfigState>(() => {
    try {
      const parsedConditions = JSON.parse(values.event_conditions_text)
      if (!Array.isArray(parsedConditions)) {
        return {
          error: "Event conditions debe ser un arreglo JSON. Usa corchetes [] con condiciones dentro: [{...}]",
          eventConditionsCount: 0,
          scheduleConfigKeys: 0,
          recipientConfigKeys: 0,
        }
      }

      const parsedScheduleConfig = JSON.parse(values.schedule_config_text)
      if (!parsedScheduleConfig || typeof parsedScheduleConfig !== "object" || Array.isArray(parsedScheduleConfig)) {
        return {
          error: "Schedule config debe ser un objeto JSON. Usa llaves {} con clave:valor",
          eventConditionsCount: parsedConditions.length,
          scheduleConfigKeys: 0,
          recipientConfigKeys: 0,
        }
      }

      const parsedRecipientConfig = JSON.parse(values.recipient_config_text)
      if (!parsedRecipientConfig || typeof parsedRecipientConfig !== "object" || Array.isArray(parsedRecipientConfig)) {
        return {
          error: "Recipient config debe ser un objeto JSON. Usa llaves {} con clave:valor",
          eventConditionsCount: parsedConditions.length,
          scheduleConfigKeys: Object.keys(parsedScheduleConfig).length,
          recipientConfigKeys: 0,
        }
      }

      return {
        error: null,
        eventConditionsCount: parsedConditions.length,
        scheduleConfigKeys: Object.keys(parsedScheduleConfig).length,
        recipientConfigKeys: Object.keys(parsedRecipientConfig).length,
      }
    } catch {
      return {
        error: "Hay JSON inválido en la configuración. Revisa comillas, llaves y comas.",
        eventConditionsCount: 0,
        scheduleConfigKeys: 0,
        recipientConfigKeys: 0,
      }
    }
  }, [values.event_conditions_text, values.recipient_config_text, values.schedule_config_text])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    let eventConditions: unknown
    let scheduleConfig: unknown
    let recipientConfig: unknown

    try {
      eventConditions = JSON.parse(values.event_conditions_text)
    } catch {
      toast.error("Event conditions: formato JSON inválido. Revisa comillas y corchetes.")
      return
    }

    try {
      scheduleConfig = JSON.parse(values.schedule_config_text)
    } catch {
      toast.error("Schedule config: formato JSON inválido. Revisa comillas y llaves.")
      return
    }

    try {
      recipientConfig = JSON.parse(values.recipient_config_text)
    } catch {
      toast.error("Recipient config: formato JSON inválido. Revisa comillas y llaves.")
      return
    }

    if (!Array.isArray(eventConditions)) {
      toast.error("Event conditions debe ser un arreglo JSON. Usa corchetes []: [{...}]")
      return
    }

    if (!scheduleConfig || typeof scheduleConfig !== "object" || Array.isArray(scheduleConfig)) {
      toast.error("Schedule config debe ser un objeto JSON. Usa llaves {}: {...}")
      return
    }

    if (!recipientConfig || typeof recipientConfig !== "object" || Array.isArray(recipientConfig)) {
      toast.error("Recipient config debe ser un objeto JSON. Usa llaves {}: {...}")
      return
    }

    const payload = {
      name: values.name,
      description: values.description || null,
      event_type: values.event_type,
      event_conditions: eventConditions,
      schedule_type: values.schedule_type,
      schedule_config: scheduleConfig,
      timezone: values.timezone,
      recipient_type: values.recipient_type,
      recipient_config: recipientConfig,
      template_id: values.template_id || null,
      priority: Number(values.priority) || 100,
      is_active: values.is_active,
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(isEditMode ? `/api/hermes/admin/rules/${initialValue.id}` : "/api/hermes/admin/rules", {
        method: isEditMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json().catch(() => ({ success: false, error: ["El servidor no respondió correctamente"] }))) as {
        success: boolean
        item?: { id: string }
        error?: string[]
      }

      if (!response.ok || !data.success || !data.item) {
        throw new Error(data.error?.join(". ") ?? "No se pudo guardar la rule. Intenta de nuevo.")
      }

      toast.success(mode === "create" ? "rule creada correctamente" : "rule actualizada correctamente")
      router.push(`/messaging/rules/${data.item.id}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la rule. Verifica tu conexión e intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "create" ? "Nueva rule" : "Editar rule"}</CardTitle>
            <CardDescription>Layout guiado como referencia visual, sin perder el soporte avanzado de matching, schedule y targeting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando…" : mode === "create" ? "Crear rule" : "Guardar cambios"}
              </Button>
              <Button asChild variant="outline">
                <Link href={isEditMode ? `/messaging/rules/${initialValue?.id}` : "/messaging/rules"}>Cancelar y volver</Link>
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="rule-name">Nombre</FieldLabel>
                  <Input id="rule-name" value={values.name} onChange={(event) => updateValue("name", event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="rule-description">Descripción</FieldLabel>
                  <Textarea id="rule-description" rows={3} value={values.description} onChange={(event) => updateValue("description", event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="rule-event-type">Event type</FieldLabel>
                  <Input id="rule-event-type" value={values.event_type} onChange={(event) => updateValue("event_type", event.target.value)} />
                  <FieldDescription>Puedes usar `*` por segmento, por ejemplo `user.*`.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="rule-priority">Prioridad</FieldLabel>
                  <Input id="rule-priority" type="number" value={values.priority} onChange={(event) => updateValue("priority", event.target.value)} />
                  <FieldDescription>Menor número = mayor prioridad dentro del matching.</FieldDescription>
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="rule-template">Template</FieldLabel>
                  <Select value={values.template_id} onValueChange={(value) => updateValue("template_id", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Schedule type</FieldLabel>
                  <Select value={values.schedule_type} onValueChange={(value) => updateValue("schedule_type", value as HermesScheduleType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduleTypes.map((entry) => (
                        <SelectItem key={entry} value={entry}>{entry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {values.schedule_type === "IMMEDIATE" && "Envía inmediatamente cuando el evento coincide."}
                    {values.schedule_type === "DELAYED" && "Espera un tiempo definido antes de enviar."}
                    {values.schedule_type === "SCHEDULED" && "Envía a una hora específica en zona horaria determinada."}
                    {values.schedule_type === "RECURRING" && "Envía periódicamente usando expresión cron."}
                    {values.schedule_type === "BATCHED" && "Agrupa múltiples eventos y envía en ventana de tiempo."}
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="rule-timezone">Timezone</FieldLabel>
                  <Input id="rule-timezone" value={values.timezone} onChange={(event) => updateValue("timezone", event.target.value)} />
                  <FieldDescription>Zona horaria para schedules tipo SCHEDULED y RECURRING. Ej: America/Mexico_City</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>Recipient type</FieldLabel>
                  <Select value={values.recipient_type} onValueChange={(value) => updateValue("recipient_type", value as HermesRecipientType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {recipientTypes.map((entry) => (
                        <SelectItem key={entry} value={entry}>{entry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {values.recipient_type === "STATIC" && "Lista fija de correos definida en la config."}
                    {values.recipient_type === "DYNAMIC" && "Extrae correo del payload del evento usando rutas JSON."}
                    {values.recipient_type === "CONDITIONAL" && "Elige destinatarios basándose en condiciones del evento."}
                    {(values.recipient_type === "LOOKUP" || values.recipient_type === "GROUP") && "⚠️ No implementado aún en el runtime."}
                  </FieldDescription>
                </Field>
                <Field className="flex-row items-center justify-between rounded-lg shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] p-4">
                  <div className="space-y-1">
                    <FieldLabel htmlFor="rule-active">Activa</FieldLabel>
                    <FieldDescription>Solo las rules activas participan en el matching real del runtime.</FieldDescription>
                  </div>
                  <Switch id="rule-active" checked={values.is_active} onCheckedChange={(checked) => updateValue("is_active", checked)} />
                </Field>
              </FieldGroup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración avanzada</CardTitle>
            <CardDescription>Mantiene los tres bloques JSON completos, pero ahora agrupados por intención.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={configTab} onValueChange={setConfigTab}>
              <TabsList className="bg-[#fafafa] grid w-full grid-cols-3 rounded-full p-1">
                <TabsTrigger value="matching" className="data-[state=active]:bg-card rounded-full data-[state=active]:shadow-sm">Matching</TabsTrigger>
                <TabsTrigger value="schedule" className="data-[state=active]:bg-card rounded-full data-[state=active]:shadow-sm">Schedule</TabsTrigger>
                <TabsTrigger value="recipients" className="data-[state=active]:bg-card rounded-full data-[state=active]:shadow-sm">Recipients</TabsTrigger>
              </TabsList>

              <TabsContent value="matching" className="mt-6">
                <Field>
                  <FieldLabel htmlFor="rule-event-conditions">Event conditions</FieldLabel>
                  <Textarea
                    id="rule-event-conditions"
                    className="min-h-[420px] font-mono text-sm"
                    value={values.event_conditions_text}
                    onChange={(event) => updateValue("event_conditions_text", event.target.value)}
                    placeholder={eventConditionExample}
                  />
                  <FieldDescription>Condiciones que debe cumplir el evento para activar esta rule. Formato: arreglo de objetos con propiedades field, operator y value.</FieldDescription>
                </Field>
              </TabsContent>

              <TabsContent value="schedule" className="mt-6">
                <Field>
                  <FieldLabel htmlFor="rule-schedule-config">Schedule config</FieldLabel>
                  <Textarea
                    id="rule-schedule-config"
                    className="min-h-[420px] font-mono text-sm"
                    value={values.schedule_config_text}
                    onChange={(event) => updateValue("schedule_config_text", event.target.value)}
                    placeholder={scheduleConfigExamples[values.schedule_type]}
                  />
                  <FieldDescription>Configuración específica para el tipo de schedule. El placeholder muestra el formato correcto según el tipo seleccionado.</FieldDescription>
                </Field>
              </TabsContent>

              <TabsContent value="recipients" className="mt-6">
                <Field>
                  <FieldLabel htmlFor="rule-recipient-config">Recipient config</FieldLabel>
                  <Textarea
                    id="rule-recipient-config"
                    className="min-h-[420px] font-mono text-sm"
                    value={values.recipient_config_text}
                    onChange={(event) => updateValue("recipient_config_text", event.target.value)}
                    placeholder={recipientConfigExamples[values.recipient_type]}
                  />
                  <FieldDescription>Configuración de destinatarios según el tipo seleccionado. El placeholder muestra ejemplos correctos para STATIC (emails), DYNAMIC (rutas), CONDITIONAL (reglas), etc.</FieldDescription>
                </Field>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 self-start xl:sticky xl:top-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen actual</CardTitle>
            <CardDescription>
              {configState.error
                ? configState.error
                : `${configState.eventConditionsCount} condiciones, ${configState.scheduleConfigKeys} claves de schedule y ${configState.recipientConfigKeys} claves de recipients.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] bg-[#fafafa] p-4">
              <div className="text-muted-foreground text-xs uppercase tracking-wide">Template seleccionado</div>
              <div className="font-medium">{selectedTemplate?.name ?? "Sin template seleccionado"}</div>
              <div className="text-muted-foreground mt-1 text-xs">{selectedTemplate?.slug ?? "Selecciona un template para completar la entrega."}</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-lg shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] p-4">
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Schedule</div>
                <div className="mt-1 font-medium">{values.schedule_type}</div>
                <pre className="text-muted-foreground mt-3 overflow-auto text-xs leading-5 whitespace-pre-wrap break-words">
                  {scheduleConfigExamples[values.schedule_type]}
                </pre>
              </div>

              <div className="rounded-lg shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] p-4">
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Recipient targeting</div>
                <div className="mt-1 font-medium">{values.recipient_type}</div>
                <pre className="text-muted-foreground mt-3 overflow-auto text-xs leading-5 whitespace-pre-wrap break-words">
                  {recipientConfigExamples[values.recipient_type]}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guías rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] p-4">
              <div className="font-medium">Event conditions</div>
              <pre className="text-muted-foreground mt-3 overflow-auto text-xs leading-5 whitespace-pre-wrap break-words">
                {eventConditionExample}
              </pre>
            </div>
            <div className="rounded-lg shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] p-4">
              <div className="font-medium">Runtime actual</div>
              <div className="text-muted-foreground mt-2 leading-6">
                STATIC, DYNAMIC y CONDITIONAL ya tienen debugging enriquecido en review. LOOKUP y GROUP siguen siendo configurables aquí, pero el runtime aún no los resuelve.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
