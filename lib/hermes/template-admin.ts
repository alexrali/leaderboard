import { createHermesAdminClient } from "@/lib/hermes/server"
import type { HermesJsonObject, HermesTemplateRecord, HermesTemplateVariable } from "@/lib/hermes/types"
import { coerceHermesJsonObject, isHermesRecord, isHermesValidEmail, normalizeHermesJsonValue } from "@/lib/hermes/utils"

const hermesTemplateSelectFields =
  "id, name, slug, description, subject, html_content, text_content, variables, default_values, from_email, from_name, reply_to, is_active, created_at, updated_at"

const hermesTemplateVariableTypes = ["string", "number", "boolean", "date", "json"] as const

type HermesTemplateVariableType = (typeof hermesTemplateVariableTypes)[number]

type HermesTemplateRow = {
  id: string
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
  created_at: string
  updated_at: string
}

export interface HermesTemplateMutationInput {
  name: string
  slug: string
  description: string | null
  subject: string
  html_content: string
  text_content: string | null
  variables: HermesTemplateVariable[]
  default_values: HermesJsonObject
  from_email: string | null
  from_name: string | null
  reply_to: string | null
  is_active: boolean
}

export type HermesTemplateInputParseResult =
  | { success: true; data: HermesTemplateMutationInput }
  | { success: false; errors: string[] }

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function mapHermesTemplateVariable(value: unknown): HermesTemplateVariable | null {
  if (!isHermesRecord(value)) return null
  if (typeof value.name !== "string" || value.name.trim().length === 0) return null

  const rawType = value.type
  const type = hermesTemplateVariableTypes.includes(rawType as HermesTemplateVariableType)
    ? (rawType as HermesTemplateVariableType)
    : "string"

  return {
    name: value.name.trim(),
    type,
    required: typeof value.required === "boolean" ? value.required : undefined,
    path: typeof value.path === "string" && value.path.trim().length > 0 ? value.path.trim() : undefined,
    defaultValue: value.defaultValue === undefined ? undefined : normalizeHermesJsonValue(value.defaultValue),
  }
}

function mapHermesTemplateRow(row: HermesTemplateRow): HermesTemplateRecord {
  return {
    ...row,
    variables: Array.isArray(row.variables)
      ? row.variables
          .map((entry) => mapHermesTemplateVariable(entry))
          .filter((entry): entry is HermesTemplateVariable => entry !== null)
      : [],
    default_values: coerceHermesJsonObject(row.default_values),
  }
}

export function parseHermesTemplateInput(input: unknown): HermesTemplateInputParseResult {
  if (!isHermesRecord(input)) {
    return {
      success: false,
      errors: ["Request body must be a JSON object"],
    }
  }

  const errors: string[] = []
  const name = typeof input.name === "string" ? input.name.trim() : ""
  const slug = typeof input.slug === "string" ? input.slug.trim().toLowerCase() : ""
  const subject = typeof input.subject === "string" ? input.subject.trim() : ""
  const htmlContent = typeof input.html_content === "string" ? input.html_content : ""
  const description = normalizeNullableString(input.description)
  const textContent = normalizeNullableString(input.text_content)
  const fromEmail = normalizeNullableString(input.from_email)
  const fromName = normalizeNullableString(input.from_name)
  const replyTo = normalizeNullableString(input.reply_to)
  const isActive = typeof input.is_active === "boolean" ? input.is_active : true

  if (name.length === 0) {
    errors.push("Template name is required")
  } else if (name.length > 255) {
    errors.push("Template name must be at most 255 characters")
  }

  if (slug.length === 0) {
    errors.push("Template slug is required")
  } else if (slug.length > 100) {
    errors.push("Template slug must be at most 100 characters")
  } else if (!/^[a-z0-9._-]+$/.test(slug)) {
    errors.push("Template slug may only contain letters, numbers, dots, dashes, and underscores")
  }

  if (subject.length === 0) {
    errors.push("Template subject is required")
  } else if (subject.length > 500) {
    errors.push("Template subject must be at most 500 characters")
  }

  if (htmlContent.trim().length === 0) {
    errors.push("Template HTML content is required")
  }

  if (fromEmail && !isHermesValidEmail(fromEmail)) {
    errors.push("from_email must be a valid email address")
  }

  if (replyTo && !isHermesValidEmail(replyTo)) {
    errors.push("reply_to must be a valid email address")
  }

  if (!Array.isArray(input.variables)) {
    errors.push("variables must be an array")
  }

  const variables = Array.isArray(input.variables)
    ? input.variables
        .map((entry, index) => {
          const variable = mapHermesTemplateVariable(entry)
          if (!variable) {
            errors.push(`variables[${index}] is invalid`)
          }
          return variable
        })
        .filter((entry): entry is HermesTemplateVariable => entry !== null)
    : []

  if (!isHermesRecord(input.default_values)) {
    errors.push("default_values must be a JSON object")
  }

  const defaultValues = isHermesRecord(input.default_values) ? coerceHermesJsonObject(input.default_values) : {}

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    }
  }

  return {
    success: true,
    data: {
      name,
      slug,
      description,
      subject,
      html_content: htmlContent,
      text_content: textContent,
      variables,
      default_values: defaultValues,
      from_email: fromEmail,
      from_name: fromName,
      reply_to: replyTo,
      is_active: isActive,
    },
  }
}

export async function createHermesTemplate(input: HermesTemplateMutationInput): Promise<HermesTemplateRecord> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_templates")
    .insert(input)
    .select(hermesTemplateSelectFields)
    .single()

  if (error) {
    throw error
  }

  return mapHermesTemplateRow(data as HermesTemplateRow)
}

export async function updateHermesTemplate(id: string, input: HermesTemplateMutationInput): Promise<HermesTemplateRecord> {
  const supabase = createHermesAdminClient()
  const { data, error } = await supabase
    .from("hermes_templates")
    .update(input)
    .eq("id", id)
    .select(hermesTemplateSelectFields)
    .single()

  if (error) {
    throw error
  }

  return mapHermesTemplateRow(data as HermesTemplateRow)
}

export function isHermesTemplateDuplicateError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const code = "code" in error ? error.code : null
  return code === "23505"
}
