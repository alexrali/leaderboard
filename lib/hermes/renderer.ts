import type {
  HermesEventRecord,
  HermesRenderedTemplate,
  HermesTemplateRecord,
  HermesTemplateVariable,
} from "@/lib/hermes/types"
import { getHermesNestedValue, isHermesRecord, normalizeHermesJsonObject } from "@/lib/hermes/utils"

export interface HermesTemplateRenderContext {
  template: HermesTemplateRecord
  variables?: Record<string, unknown>
  event?: Pick<HermesEventRecord, "id" | "type" | "payload"> | { id: string; type: string; payload: Record<string, unknown> }
}

function formatHermesDate(value: Date | string, pattern = "YYYY-MM-DD"): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const pad = (entry: number) => entry.toString().padStart(2, "0")
  const replacements: Record<string, string> = {
    YYYY: date.getFullYear().toString(),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  }

  let result = pattern
  for (const [token, replacement] of Object.entries(replacements)) {
    result = result.replace(token, replacement)
  }

  return result
}

function formatHermesNumber(value: number, locale = "en-US"): string {
  return value.toLocaleString(locale)
}

function formatHermesCurrency(value: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value)
}

function truncateHermesText(value: string, length: number): string {
  if (value.length <= length) return value
  return `${value.slice(0, Math.max(0, length - 3))}...`
}

function htmlToPlainText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function coerceTemplateVariableType(value: unknown, type: HermesTemplateVariable["type"]): unknown {
  switch (type) {
    case "number": {
      const numeric = typeof value === "number" ? value : Number(value)
      return Number.isFinite(numeric) ? numeric : 0
    }
    case "boolean":
      return Boolean(value)
    case "date":
      return value instanceof Date ? value.toISOString() : String(value)
    case "json":
      return isHermesRecord(value) ? normalizeHermesJsonObject(value) : value
    case "string":
    default:
      return String(value)
  }
}

function parseVariableExpression(expression: string) {
  const helperMatch = expression.match(/^\s*(.+?)\s*\|\s*(\w+)(?:\s+(.+))?\s*$/)

  if (!helperMatch) {
    return {
      path: expression.trim(),
      helper: undefined,
      helperArgs: [] as string[],
    }
  }

  return {
    path: helperMatch[1].trim(),
    helper: helperMatch[2],
    helperArgs: helperMatch[3] ? helperMatch[3].trim().split(/\s+/) : [],
  }
}

function applyTemplateHelper(value: unknown, helper: string, args: string[]): unknown {
  switch (helper) {
    case "formatDate":
      return formatHermesDate(String(value), args[0])
    case "formatNumber":
      return formatHermesNumber(Number(value), args[0])
    case "formatCurrency":
      return formatHermesCurrency(Number(value), args[0] || "USD", args[1] || "en-US")
    case "truncate":
      return truncateHermesText(String(value), Number(args[0] || 100))
    case "upper":
      return String(value).toUpperCase()
    case "lower":
      return String(value).toLowerCase()
    case "capitalize":
      return String(value).replace(/\b\w/g, (entry) => entry.toUpperCase())
    default:
      return value
  }
}

export function renderHermesString(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, expression: string) => {
    const { path, helper, helperArgs } = parseVariableExpression(expression)
    let value = getHermesNestedValue(variables, path)

    if (value === undefined || value === null) return ""
    if (helper) {
      value = applyTemplateHelper(value, helper, helperArgs)
    }

    return String(value)
  })
}

export function renderHermesHtml(template: string, variables: Record<string, unknown>): string {
  let result = template

  result = result.replace(/\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, path: string, content: string) => {
    const value = getHermesNestedValue(variables, path)
    return value ? content : ""
  })

  result = result.replace(/\{\{#unless\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_, path: string, content: string) => {
    const value = getHermesNestedValue(variables, path)
    return value ? "" : content
  })

  result = result.replace(/\{\{#each\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, path: string, content: string) => {
    const items = getHermesNestedValue(variables, path)
    if (!Array.isArray(items)) return ""

    return items
      .map((item, index) => {
        let itemContent = content.replace(/\{\{@index\}\}/g, String(index)).replace(/\{\{this\}\}/g, String(item))

        if (isHermesRecord(item)) {
          itemContent = renderHermesString(itemContent, item)
        }

        return itemContent
      })
      .join("")
  })

  return renderHermesString(result, variables)
}

export function resolveHermesTemplateVariables(context: HermesTemplateRenderContext): Record<string, unknown> {
  const explicitVariables = context.variables ?? {}
  const eventPayload = context.event?.payload ?? {}
  const resolved: Record<string, unknown> = {
    eventId: context.event?.id ?? null,
    eventType: context.event?.type ?? null,
    eventPayload,
  }

  for (const variable of context.template.variables) {
    let value: unknown

    if (variable.name in explicitVariables) {
      value = explicitVariables[variable.name]
    } else if (variable.path) {
      value = getHermesNestedValue(eventPayload, variable.path)
    } else if (variable.defaultValue !== undefined) {
      value = variable.defaultValue
    }

    if (value !== undefined) {
      resolved[variable.name] = coerceTemplateVariableType(value, variable.type)
    }
  }

  for (const [key, value] of Object.entries(context.template.default_values)) {
    if (!(key in resolved) || resolved[key] === undefined || resolved[key] === null) {
      resolved[key] = value
    }
  }

  for (const [key, value] of Object.entries(explicitVariables)) {
    if (!(key in resolved)) {
      resolved[key] = value
    }
  }

  return resolved
}

export function renderHermesTemplate(context: HermesTemplateRenderContext): HermesRenderedTemplate {
  const variables = resolveHermesTemplateVariables(context)
  const subject = renderHermesString(context.template.subject, variables)
  const html = renderHermesHtml(context.template.html_content, variables)
  const text = context.template.text_content
    ? renderHermesString(context.template.text_content, variables)
    : htmlToPlainText(html)

  return {
    subject,
    html,
    text,
  }
}
