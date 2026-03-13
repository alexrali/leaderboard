import { sendHermesMessage, type HermesDeliveryItemResult } from "@/lib/hermes/delivery"
import { getHermesEventById, updateHermesEvent } from "@/lib/hermes/events"
import { renderHermesTemplate } from "@/lib/hermes/renderer"
import { findMatchingHermesRules, getHermesRuleById, resolveHermesRecipients } from "@/lib/hermes/rules"
import {
  createHermesScheduledTask,
  getDueHermesScheduledTasks,
  getHermesScheduledTaskById,
  getHermesTaskEventPayload,
  getHermesTaskRetryTime,
  updateHermesScheduledTask,
} from "@/lib/hermes/tasks"
import { getHermesTemplateById } from "@/lib/hermes/templates"
import type { HermesEventRecord, HermesJsonObject, HermesRuleMatchResult, HermesRuleRecord, HermesScheduledTaskRecord } from "@/lib/hermes/types"
import { coerceHermesJsonObject, isHermesRecord } from "@/lib/hermes/utils"

export interface HermesMatchedRuleSummary {
  ruleId: string
  templateId: string | null
  scheduleType: HermesRuleRecord["schedule_type"]
  recipientCount: number
  subjectPreview: string | null
  disposition: "immediate" | "scheduled" | "skipped"
}

export interface HermesImmediateDispatchSummary {
  ruleId: string
  templateId: string
  recipientCount: number
  subject: string
  deliveries: HermesDeliveryItemResult[]
}

export interface HermesScheduledTaskSummary {
  taskId: string
  ruleId: string
  scheduledFor: string
  status: HermesScheduledTaskRecord["status"]
}

export interface HermesEventProcessingResult {
  eventId: string
  status: HermesEventRecord["status"]
  matchedRules: HermesMatchedRuleSummary[]
  immediateDispatches: HermesImmediateDispatchSummary[]
  scheduledTasks: HermesScheduledTaskSummary[]
  errors: string[]
}

export interface HermesScheduledTaskExecutionResult {
  taskId: string
  status: HermesScheduledTaskRecord["status"]
  error: string | null
  deliveries: HermesDeliveryItemResult[]
}

function getEventContextForRendering(event: HermesEventRecord) {
  return {
    id: event.id,
    type: event.type,
    payload: event.payload,
  }
}

function buildHermesTaskEvent(task: HermesScheduledTaskRecord, storedEvent: HermesEventRecord | null): HermesEventRecord {
  if (storedEvent) {
    return storedEvent
  }

  const eventId = typeof task.event_data.eventId === "string" ? task.event_data.eventId : task.event_id ?? `scheduled-${task.id}`
  const eventType = typeof task.event_data.eventType === "string" ? task.event_data.eventType : "scheduled.task"
  const eventSource = task.event_data.eventSource

  return {
    id: eventId,
    type: eventType,
    source:
      eventSource === "webhook" || eventSource === "cron" || eventSource === "api" || eventSource === "queue"
        ? eventSource
        : "queue",
    external_id: null,
    payload: getHermesTaskEventPayload(task),
    metadata: isHermesRecord(task.event_data.metadata) ? coerceHermesJsonObject(task.event_data.metadata) : {},
    status: "PROCESSING",
    processed_at: null,
    error_message: null,
    retry_count: 0,
    created_at: task.created_at,
    updated_at: task.updated_at,
  }
}

function getHermesExtractedData(value: unknown): Record<string, unknown> {
  return isHermesRecord(value) ? value : {}
}

async function executeHermesRuleDelivery(input: {
  rule: HermesRuleRecord
  event: HermesEventRecord
  extractedData: Record<string, unknown>
  scheduledTaskId?: string
}): Promise<HermesImmediateDispatchSummary> {
  if (!input.rule.template_id) {
    throw new Error(`Rule ${input.rule.id} does not have a template configured`)
  }

  const template = await getHermesTemplateById(input.rule.template_id)
  if (!template || !template.is_active) {
    throw new Error(`Template ${input.rule.template_id} was not found or is inactive`)
  }

  const recipients = resolveHermesRecipients(input.rule, input.event)
  if (recipients.length === 0) {
    throw new Error(`Rule ${input.rule.id} did not resolve any recipients`)
  }

  const rendered = renderHermesTemplate({
    template,
    variables: input.extractedData,
    event: getEventContextForRendering(input.event),
  })

  const metadata: Record<string, unknown> = {
    ...input.event.metadata,
    ...input.extractedData,
  }

  if (input.scheduledTaskId) {
    metadata.scheduledTaskId = input.scheduledTaskId
  }

  const delivery = await sendHermesMessage({
    template,
    recipients,
    rendered,
    eventId: input.event.id,
    ruleId: input.rule.id,
    metadata,
  })

  return {
    ruleId: input.rule.id,
    templateId: template.id,
    recipientCount: recipients.length,
    subject: rendered.subject,
    deliveries: delivery.deliveries,
  }
}

function getPreviewForMatch(match: HermesRuleMatchResult, event: HermesEventRecord): Promise<HermesMatchedRuleSummary> {
  return (async () => {
    const template = match.rule.template_id ? await getHermesTemplateById(match.rule.template_id) : null
    let recipients = [] as ReturnType<typeof resolveHermesRecipients>
    let subjectPreview: string | null = null

    try {
      recipients = resolveHermesRecipients(match.rule, event)
    } catch {
      recipients = []
    }

    if (template) {
      const rendered = renderHermesTemplate({
        template,
        variables: match.extractedData,
        event: getEventContextForRendering(event),
      })
      subjectPreview = rendered.subject
    }

    return {
      ruleId: match.rule.id,
      templateId: match.rule.template_id,
      scheduleType: match.rule.schedule_type,
      recipientCount: recipients.length,
      subjectPreview,
      disposition: match.rule.schedule_type === "IMMEDIATE" ? "immediate" : "scheduled",
    }
  })()
}

export async function processHermesEvent(eventOrId: string | HermesEventRecord): Promise<HermesEventProcessingResult> {
  const event = typeof eventOrId === "string" ? await getHermesEventById(eventOrId) : eventOrId

  if (!event) {
    throw new Error("Hermes event was not found")
  }

  const processingEvent = await updateHermesEvent(event.id, {
    status: "PROCESSING",
    error_message: null,
  })

  const matched = await findMatchingHermesRules(processingEvent)
  const matchedRules = await Promise.all(matched.map((match) => getPreviewForMatch(match, processingEvent)))
  const immediateDispatches: HermesImmediateDispatchSummary[] = []
  const scheduledTasks: HermesScheduledTaskSummary[] = []
  const errors: string[] = []

  for (const match of matched) {
    try {
      if (match.rule.schedule_type === "IMMEDIATE") {
        const dispatch = await executeHermesRuleDelivery({
          rule: match.rule,
          event: processingEvent,
          extractedData: match.extractedData,
        })

        if (dispatch.deliveries.length === 0 || dispatch.deliveries.every((delivery) => !delivery.success)) {
          throw new Error(`Rule ${match.rule.id} failed to deliver to all resolved recipients`)
        }

        immediateDispatches.push(dispatch)
      } else {
        const task = await createHermesScheduledTask({
          rule: match.rule,
          event: processingEvent,
          extractedData: match.extractedData,
        })

        scheduledTasks.push({
          taskId: task.id,
          ruleId: task.rule_id,
          scheduledFor: task.scheduled_for,
          status: task.status,
        })
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown processing error")
    }
  }

  const finishedAt = new Date().toISOString()
  const finalStatus = errors.length > 0 && immediateDispatches.length === 0 && scheduledTasks.length === 0 ? "FAILED" : "COMPLETED"
  const updatedEvent = await updateHermesEvent(processingEvent.id, {
    status: finalStatus,
    processed_at: finishedAt,
    error_message: errors.length > 0 ? errors.join(" | ").slice(0, 1000) : null,
  })

  return {
    eventId: updatedEvent.id,
    status: updatedEvent.status,
    matchedRules,
    immediateDispatches,
    scheduledTasks,
    errors,
  }
}

export async function processHermesScheduledTask(taskOrId: string | HermesScheduledTaskRecord): Promise<HermesScheduledTaskExecutionResult> {
  const task = typeof taskOrId === "string" ? await getHermesScheduledTaskById(taskOrId) : taskOrId

  if (!task) {
    throw new Error("Hermes scheduled task was not found")
  }

  await updateHermesScheduledTask(task.id, {
    status: "PROCESSING",
    processed_at: null,
    next_retry_at: null,
    result: null,
  })

  const rule = await getHermesRuleById(task.rule_id)
  const storedEvent = task.event_id ? await getHermesEventById(task.event_id) : null
  const event = buildHermesTaskEvent(task, storedEvent)
  const extractedData = getHermesExtractedData(task.event_data.extractedData)

  try {
    if (!rule) {
      throw new Error(`Rule ${task.rule_id} was not found`)
    }

    const dispatch = await executeHermesRuleDelivery({
      rule,
      event,
      extractedData,
      scheduledTaskId: task.id,
    })

    if (dispatch.deliveries.length === 0 || dispatch.deliveries.every((delivery) => !delivery.success)) {
      throw new Error(`Scheduled task ${task.id} failed to deliver to all resolved recipients`)
    }

    await updateHermesScheduledTask(task.id, {
      status: "COMPLETED",
      processed_at: new Date().toISOString(),
      result: coerceHermesJsonObject({
        subject: dispatch.subject,
        deliveries: dispatch.deliveries,
      }),
      next_retry_at: null,
    })

    return {
      taskId: task.id,
      status: "COMPLETED",
      error: null,
      deliveries: dispatch.deliveries,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scheduled task error"
    const nextRetryCount = task.retry_count + 1

    if (nextRetryCount >= task.max_retries) {
      await updateHermesScheduledTask(task.id, {
        status: "FAILED",
        processed_at: new Date().toISOString(),
        retry_count: nextRetryCount,
        next_retry_at: null,
        result: coerceHermesJsonObject({ error: message }),
      })

      return {
        taskId: task.id,
        status: "FAILED",
        error: message,
        deliveries: [],
      }
    }

    const nextRetryAt = getHermesTaskRetryTime({
      ...task,
      retry_count: nextRetryCount,
    })

    await updateHermesScheduledTask(task.id, {
      status: "RETRYING",
      processed_at: null,
      retry_count: nextRetryCount,
      next_retry_at: nextRetryAt,
      result: coerceHermesJsonObject({ error: message }),
    })

    return {
      taskId: task.id,
      status: "RETRYING",
      error: message,
      deliveries: [],
    }
  }
}

export async function processDueHermesTasks(limit = 25) {
  const tasks = await getDueHermesScheduledTasks(limit)
  const results: HermesScheduledTaskExecutionResult[] = []

  for (const task of tasks) {
    results.push(await processHermesScheduledTask(task))
  }

  return {
    processedCount: results.length,
    results,
  }
}
