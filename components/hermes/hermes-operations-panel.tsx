"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface OperationResponse {
  success: boolean
  error?: string[]
  [key: string]: unknown
}

export function HermesOperationsPanel() {
  const [dueLimit, setDueLimit] = useState("25")
  const [eventId, setEventId] = useState("")
  const [bulkEventIds, setBulkEventIds] = useState("")
  const [bulkEventLimit, setBulkEventLimit] = useState("10")
  const [taskId, setTaskId] = useState("")
  const [bulkTaskIds, setBulkTaskIds] = useState("")
  const [bulkTaskLimit, setBulkTaskLimit] = useState("10")
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [result, setResult] = useState<unknown>(null)

  function parseIds(value: string) {
    return value
      .split(/[\n,\s]+/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  }

  async function runOperation(key: string, url: string, payload?: Record<string, unknown>) {
    try {
      setBusyKey(key)
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload ? JSON.stringify(payload) : undefined,
      })

      const data = (await response.json().catch(() => ({ success: false, error: ["Invalid JSON response"] }))) as OperationResponse
      setResult(data)

      if (!response.ok || !data.success) {
        throw new Error(data.error?.join(" | ") ?? "Operation failed")
      }

      toast.success("Operación ejecutada correctamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Operation failed")
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Procesar tareas vencidas</CardTitle>
          <CardDescription>Ejecuta manualmente la cola vencida sin pasar por el endpoint externo protegido por secret.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            min={1}
            max={100}
            value={dueLimit}
            onChange={(event) => setDueLimit(event.target.value)}
            placeholder="25"
          />
          <Button
            className="w-full"
            disabled={busyKey === "process-due"}
            onClick={() => runOperation("process-due", "/api/hermes/admin/operations/process-due", { limit: Number(dueLimit) || 25 })}
          >
            {busyKey === "process-due" ? "Procesando…" : "Procesar cola"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reprocesar evento</CardTitle>
          <CardDescription>Vuelve a ejecutar el pipeline real de un evento existente por su `id`.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={eventId} onChange={(event) => setEventId(event.target.value)} placeholder="UUID del evento" />
          <Button
            className="w-full"
            disabled={busyKey === "reprocess-event" || eventId.trim().length === 0}
            onClick={() => runOperation("reprocess-event", `/api/hermes/admin/operations/events/${encodeURIComponent(eventId.trim())}/reprocess`)}
          >
            {busyKey === "reprocess-event" ? "Reprocesando…" : "Reprocesar evento"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reintentar tarea</CardTitle>
          <CardDescription>Ejecuta de nuevo una tarea programada específica por su `id`.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={taskId} onChange={(event) => setTaskId(event.target.value)} placeholder="UUID de la tarea" />
          <Button
            className="w-full"
            disabled={busyKey === "retry-task" || taskId.trim().length === 0}
            onClick={() => runOperation("retry-task", `/api/hermes/admin/operations/tasks/${encodeURIComponent(taskId.trim())}/retry`)}
          >
            {busyKey === "retry-task" ? "Reintentando…" : "Reintentar tarea"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk reprocesar eventos</CardTitle>
          <CardDescription>Reprocesa varios eventos por IDs o toma los últimos fallidos por límite.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            className="min-h-[140px] font-mono text-sm"
            value={bulkEventIds}
            onChange={(event) => setBulkEventIds(event.target.value)}
            placeholder={"UUID1\nUUID2"}
          />
          <Input
            type="number"
            min={1}
            max={100}
            value={bulkEventLimit}
            onChange={(event) => setBulkEventLimit(event.target.value)}
            placeholder="10"
          />
          <Button
            className="w-full"
            disabled={busyKey === "bulk-reprocess-events"}
            onClick={() =>
              runOperation("bulk-reprocess-events", "/api/hermes/admin/operations/events/bulk-reprocess", {
                ids: parseIds(bulkEventIds),
                limit: Number(bulkEventLimit) || 10,
                status: "FAILED",
              })
            }
          >
            {busyKey === "bulk-reprocess-events" ? "Procesando…" : "Bulk reprocesar"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk retry tasks</CardTitle>
          <CardDescription>Reintenta varias tareas por IDs o las últimas tareas fallidas/retrying/pending.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            className="min-h-[140px] font-mono text-sm"
            value={bulkTaskIds}
            onChange={(event) => setBulkTaskIds(event.target.value)}
            placeholder={"UUID1\nUUID2"}
          />
          <Input
            type="number"
            min={1}
            max={100}
            value={bulkTaskLimit}
            onChange={(event) => setBulkTaskLimit(event.target.value)}
            placeholder="10"
          />
          <Button
            className="w-full"
            disabled={busyKey === "bulk-retry-tasks"}
            onClick={() =>
              runOperation("bulk-retry-tasks", "/api/hermes/admin/operations/tasks/bulk-retry", {
                ids: parseIds(bulkTaskIds),
                limit: Number(bulkTaskLimit) || 10,
              })
            }
          >
            {busyKey === "bulk-retry-tasks" ? "Procesando…" : "Bulk retry"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk cancel tasks</CardTitle>
          <CardDescription>Cancela varias tareas por IDs o las últimas tareas activas de la cola.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            className="min-h-[140px] font-mono text-sm"
            value={bulkTaskIds}
            onChange={(event) => setBulkTaskIds(event.target.value)}
            placeholder={"UUID1\nUUID2"}
          />
          <Input
            type="number"
            min={1}
            max={100}
            value={bulkTaskLimit}
            onChange={(event) => setBulkTaskLimit(event.target.value)}
            placeholder="10"
          />
          <Button
            className="w-full"
            disabled={busyKey === "bulk-cancel-tasks"}
            onClick={() =>
              runOperation("bulk-cancel-tasks", "/api/hermes/admin/operations/tasks/bulk-cancel", {
                ids: parseIds(bulkTaskIds),
                limit: Number(bulkTaskLimit) || 10,
              })
            }
          >
            {busyKey === "bulk-cancel-tasks" ? "Procesando…" : "Bulk cancel"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instalar ejemplos Hermes</CardTitle>
          <CardDescription>Crea o actualiza 2 templates y 2 rules de referencia inspirados en hermes-base para validar flujos end-to-end.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground text-sm leading-6">
            Ejecuta esta acción cuando quieras dejar una base conocida para probar review, timeline, deliveries inmediatas y tareas diferidas.
          </div>
          <Button
            className="w-full"
            disabled={busyKey === "bootstrap-examples"}
            onClick={() => runOperation("bootstrap-examples", "/api/hermes/admin/operations/bootstrap-examples")}
          >
            {busyKey === "bootstrap-examples" ? "Instalando…" : "Instalar ejemplos"}
          </Button>
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Último resultado</CardTitle>
          <CardDescription>Respuesta cruda del último endpoint de operación ejecutado desde este panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[420px] overflow-auto rounded-lg border bg-muted/20 p-4 text-xs leading-6 whitespace-pre-wrap break-words">
            {JSON.stringify(result, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
