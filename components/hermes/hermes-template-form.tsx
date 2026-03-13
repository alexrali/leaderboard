"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { renderHermesTemplate } from "@/lib/hermes/renderer"
import type { HermesJsonObject, HermesTemplateRecord, HermesTemplateVariable } from "@/lib/hermes/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface HermesTemplateFormInitialValue {
  id?: string
  name: string
  slug: string
  description: string | null
  subject: string
  html_content: string
  text_content: string | null
  variables: unknown
  default_values: unknown
  from_email: string | null
  from_name: string | null
  reply_to: string | null
  is_active: boolean
}

interface HermesTemplateFormProps {
  mode: "create" | "edit"
  initialValue?: HermesTemplateFormInitialValue
}

interface TemplateFormState {
  name: string
  slug: string
  description: string
  subject: string
  html_content: string
  text_content: string
  variables_text: string
  default_values_text: string
  sample_values_text: string
  from_email: string
  from_name: string
  reply_to: string
  is_active: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeTemplateVariables(value: unknown): HermesTemplateVariable[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((entry): entry is HermesTemplateVariable => isRecord(entry) && typeof entry.name === "string")
}

function normalizeJsonObject(value: unknown): HermesJsonObject {
  if (!isRecord(value)) {
    return {}
  }

  return value as HermesJsonObject
}

function buildInitialSampleValues(initialValue?: HermesTemplateFormInitialValue): Record<string, unknown> {
  const variables = normalizeTemplateVariables(initialValue?.variables)
  const defaultValues = normalizeJsonObject(initialValue?.default_values)
  const sampleValues: Record<string, unknown> = { ...defaultValues }

  for (const variable of variables) {
    if (variable.defaultValue !== undefined) {
      sampleValues[variable.name] = variable.defaultValue
      continue
    }

    if (!(variable.name in sampleValues)) {
      sampleValues[variable.name] =
        variable.type === "number"
          ? 0
          : variable.type === "boolean"
            ? true
            : variable.type === "json"
              ? {}
              : variable.type === "date"
                ? new Date().toISOString()
                : ""
    }
  }

  return sampleValues
}

function buildInitialState(initialValue?: HermesTemplateFormInitialValue): TemplateFormState {
  return {
    name: initialValue?.name ?? "",
    slug: initialValue?.slug ?? "",
    description: initialValue?.description ?? "",
    subject: initialValue?.subject ?? "",
    html_content: initialValue?.html_content ?? "",
    text_content: initialValue?.text_content ?? "",
    variables_text: JSON.stringify(initialValue?.variables ?? [], null, 2),
    default_values_text: JSON.stringify(initialValue?.default_values ?? {}, null, 2),
    sample_values_text: JSON.stringify(buildInitialSampleValues(initialValue), null, 2),
    from_email: initialValue?.from_email ?? "",
    from_name: initialValue?.from_name ?? "",
    reply_to: initialValue?.reply_to ?? "",
    is_active: initialValue?.is_active ?? true,
  }
}

export function HermesTemplateForm({ mode, initialValue }: HermesTemplateFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<TemplateFormState>(() => buildInitialState(initialValue))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editorTab, setEditorTab] = useState("html")
  const [previewTab, setPreviewTab] = useState("html")

  const isEditMode = mode === "edit" && typeof initialValue?.id === "string"
  const actionLabel = useMemo(() => (mode === "create" ? "Crear template" : "Guardar cambios"), [mode])

  function updateValue<K extends keyof TemplateFormState>(key: K, value: TemplateFormState[K]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const previewState = useMemo(() => {
    let variables: HermesTemplateVariable[]
    let defaultValues: HermesJsonObject
    let sampleValues: Record<string, unknown>

    try {
      const parsedVariables = JSON.parse(values.variables_text)
      if (!Array.isArray(parsedVariables)) {
        return {
          error: "Variables debe ser un arreglo JSON",
          rendered: null,
          variablesCount: 0,
        }
      }
      variables = normalizeTemplateVariables(parsedVariables)
    } catch {
      return {
        error: "Variables JSON no es válido",
        rendered: null,
        variablesCount: 0,
      }
    }

    try {
      const parsedDefaults = JSON.parse(values.default_values_text)
      if (!isRecord(parsedDefaults)) {
        return {
          error: "Default values debe ser un objeto JSON",
          rendered: null,
          variablesCount: variables.length,
        }
      }
      defaultValues = parsedDefaults as HermesJsonObject
    } catch {
      return {
        error: "Default values JSON no es válido",
        rendered: null,
        variablesCount: variables.length,
      }
    }

    try {
      const parsedSampleValues = JSON.parse(values.sample_values_text)
      if (!isRecord(parsedSampleValues)) {
        return {
          error: "Sample values debe ser un objeto JSON",
          rendered: null,
          variablesCount: variables.length,
        }
      }
      sampleValues = parsedSampleValues
    } catch {
      return {
        error: "Sample values JSON no es válido",
        rendered: null,
        variablesCount: variables.length,
      }
    }

    try {
      const previewTemplate: HermesTemplateRecord = {
        id: initialValue?.id ?? "preview-template",
        name: values.name || "Preview template",
        slug: values.slug || "preview-template",
        description: values.description || null,
        subject: values.subject,
        html_content: values.html_content,
        text_content: values.text_content || null,
        variables,
        default_values: defaultValues,
        from_email: values.from_email || null,
        from_name: values.from_name || null,
        reply_to: values.reply_to || null,
        is_active: values.is_active,
        created_at: initialValue?.id ? "existing" : "preview",
        updated_at: initialValue?.id ? "existing" : "preview",
      }

      return {
        error: null,
        rendered: renderHermesTemplate({
          template: previewTemplate,
          variables: sampleValues,
        }),
        variablesCount: variables.length,
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "No se pudo renderizar el preview",
        rendered: null,
        variablesCount: variables.length,
      }
    }
  }, [
    initialValue?.id,
    values.default_values_text,
    values.description,
    values.from_email,
    values.from_name,
    values.html_content,
    values.is_active,
    values.name,
    values.reply_to,
    values.sample_values_text,
    values.slug,
    values.subject,
    values.text_content,
    values.variables_text,
  ])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    let variables: unknown
    let defaultValues: unknown

    try {
      variables = JSON.parse(values.variables_text)
    } catch {
      toast.error("Variables JSON no es válido")
      return
    }

    try {
      defaultValues = JSON.parse(values.default_values_text)
    } catch {
      toast.error("Default values JSON no es válido")
      return
    }

    if (!Array.isArray(variables)) {
      toast.error("Variables debe ser un arreglo JSON")
      return
    }

    if (!defaultValues || typeof defaultValues !== "object" || Array.isArray(defaultValues)) {
      toast.error("Default values debe ser un objeto JSON")
      return
    }

    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      subject: values.subject,
      html_content: values.html_content,
      text_content: values.text_content || null,
      variables,
      default_values: defaultValues,
      from_email: values.from_email || null,
      from_name: values.from_name || null,
      reply_to: values.reply_to || null,
      is_active: values.is_active,
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(isEditMode ? `/api/hermes/admin/templates/${initialValue.id}` : "/api/hermes/admin/templates", {
        method: isEditMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json().catch(() => ({ success: false, error: ["Invalid JSON response"] }))) as {
        success: boolean
        item?: { id: string }
        error?: string[]
      }

      if (!response.ok || !data.success || !data.item) {
        throw new Error(data.error?.join(" | ") ?? "No se pudo guardar el template")
      }

      toast.success(mode === "create" ? "Template creado" : "Template actualizado")
      router.push(`/messaging/templates/${data.item.id}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el template")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "create" ? "Nuevo template" : "Editar template"}</CardTitle>
            <CardDescription>Conserva el contrato actual de Hermes, pero con una superficie de edición más cómoda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando…" : actionLabel}
              </Button>
              <Button asChild variant="outline">
                <Link href={isEditMode ? `/messaging/templates/${initialValue.id}` : "/messaging/templates"}>Cancelar</Link>
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="template-name">Nombre</FieldLabel>
                  <Input id="template-name" value={values.name} onChange={(event) => updateValue("name", event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="template-slug">Slug</FieldLabel>
                  <Input id="template-slug" value={values.slug} onChange={(event) => updateValue("slug", event.target.value)} />
                  <FieldDescription>Se usa para identificar el template de forma estable en la capa Hermes.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="template-description">Descripción</FieldLabel>
                  <Textarea id="template-description" rows={3} value={values.description} onChange={(event) => updateValue("description", event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="template-subject">Asunto</FieldLabel>
                  <Input id="template-subject" value={values.subject} onChange={(event) => updateValue("subject", event.target.value)} />
                  <FieldDescription>Soporta placeholders Hermes como `{"{{user.name}}"}` y helpers del renderer.</FieldDescription>
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="template-from-email">From email</FieldLabel>
                  <Input
                    id="template-from-email"
                    value={values.from_email}
                    onChange={(event) => updateValue("from_email", event.target.value)}
                    placeholder="notificaciones@tu-dominio.com"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="template-from-name">From name</FieldLabel>
                  <Input
                    id="template-from-name"
                    value={values.from_name}
                    onChange={(event) => updateValue("from_name", event.target.value)}
                    placeholder="Hermes"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="template-reply-to">Reply-to</FieldLabel>
                  <Input
                    id="template-reply-to"
                    value={values.reply_to}
                    onChange={(event) => updateValue("reply_to", event.target.value)}
                    placeholder="soporte@tu-dominio.com"
                  />
                </Field>
                <Field className="flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <FieldLabel htmlFor="template-active">Activo</FieldLabel>
                    <FieldDescription>Los templates inactivos no se usarán en envíos ni previews asociados.</FieldDescription>
                  </div>
                  <Switch id="template-active" checked={values.is_active} onCheckedChange={(checked) => updateValue("is_active", checked)} />
                </Field>
              </FieldGroup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Editor</CardTitle>
            <CardDescription>Organiza HTML, texto y configuración avanzada en una sola superficie.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={editorTab} onValueChange={setEditorTab}>
              <TabsList className="bg-secondary/80 grid w-full grid-cols-4 rounded-full p-1">
                <TabsTrigger value="html" className="data-[state=active]:bg-card rounded-full data-[state=active]:shadow-sm">HTML</TabsTrigger>
                <TabsTrigger value="text" className="data-[state=active]:bg-card rounded-full data-[state=active]:shadow-sm">Texto</TabsTrigger>
                <TabsTrigger value="variables" className="data-[state=active]:bg-card rounded-full data-[state=active]:shadow-sm">Variables</TabsTrigger>
                <TabsTrigger value="defaults" className="data-[state=active]:bg-card rounded-full data-[state=active]:shadow-sm">Defaults</TabsTrigger>
              </TabsList>

              <TabsContent value="html" className="mt-6">
                <Field>
                  <FieldLabel htmlFor="template-html-content">Contenido HTML</FieldLabel>
                  <Textarea
                    id="template-html-content"
                    className="min-h-[520px] font-mono text-sm"
                    value={values.html_content}
                    onChange={(event) => updateValue("html_content", event.target.value)}
                  />
                </Field>
              </TabsContent>

              <TabsContent value="text" className="mt-6">
                <Field>
                  <FieldLabel htmlFor="template-text-content">Contenido texto</FieldLabel>
                  <Textarea
                    id="template-text-content"
                    className="min-h-[520px] font-mono text-sm"
                    value={values.text_content}
                    onChange={(event) => updateValue("text_content", event.target.value)}
                  />
                  <FieldDescription>Si queda vacío, Hermes genera texto plano a partir del HTML renderizado.</FieldDescription>
                </Field>
              </TabsContent>

              <TabsContent value="variables" className="mt-6">
                <Field>
                  <FieldLabel htmlFor="template-variables">Variables</FieldLabel>
                  <Textarea
                    id="template-variables"
                    className="min-h-[520px] font-mono text-sm"
                    value={values.variables_text}
                    onChange={(event) => updateValue("variables_text", event.target.value)}
                  />
                  <FieldDescription>
                    Mantiene el formato avanzado actual: arreglo JSON de variables Hermes con `name`, `type`, `path` y `defaultValue`.
                  </FieldDescription>
                </Field>
              </TabsContent>

              <TabsContent value="defaults" className="mt-6">
                <Field>
                  <FieldLabel htmlFor="template-default-values">Default values</FieldLabel>
                  <Textarea
                    id="template-default-values"
                    className="min-h-[520px] font-mono text-sm"
                    value={values.default_values_text}
                    onChange={(event) => updateValue("default_values_text", event.target.value)}
                  />
                  <FieldDescription>Objeto JSON usado por Hermes para completar variables ausentes antes del render.</FieldDescription>
                </Field>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 self-start xl:sticky xl:top-6">
        <Card>
          <CardHeader>
            <CardTitle>Sample values</CardTitle>
            <CardDescription>Objeto JSON para simular variables y validar el render en tiempo real.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[220px] font-mono text-sm"
              value={values.sample_values_text}
              onChange={(event) => updateValue("sample_values_text", event.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {previewState.error
                ? previewState.error
                : `${previewState.variablesCount} variable${previewState.variablesCount === 1 ? "" : "s"} disponibles para render.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">Asunto renderizado</div>
              <div className="text-sm font-medium break-words">{previewState.rendered?.subject || "—"}</div>
            </div>

            <Tabs value={previewTab} onValueChange={setPreviewTab}>
              <TabsList className="bg-secondary/80 grid w-full grid-cols-2 rounded-full p-1">
                <TabsTrigger value="html" className="data-[state=active]:bg-card rounded-full data-[state=active]:shadow-sm">HTML</TabsTrigger>
                <TabsTrigger value="text" className="data-[state=active]:bg-card rounded-full data-[state=active]:shadow-sm">Texto</TabsTrigger>
              </TabsList>

              <TabsContent value="html" className="mt-4">
                {previewState.rendered ? (
                  <div className="max-h-[680px] overflow-auto rounded-lg border bg-white p-4">
                    <div dangerouslySetInnerHTML={{ __html: previewState.rendered.html }} />
                  </div>
                ) : (
                  <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
                    Corrige el JSON o el contenido del template para habilitar el preview.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="text" className="mt-4">
                {previewState.rendered ? (
                  <pre className="max-h-[680px] overflow-auto rounded-lg border bg-muted/20 p-4 text-xs leading-6 whitespace-pre-wrap break-words">
                    {previewState.rendered.text}
                  </pre>
                ) : (
                  <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
                    Corrige el JSON o el contenido del template para habilitar el preview.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
