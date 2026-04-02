"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "bulk-reprocess-events" | "bulk-retry-tasks" | "bulk-cancel-tasks"
    count: number
  } | null>(null)

  function parseIds(value: string) {
    return value
      .split(/[\n,\s]+/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  }

  function getBulkCount() {
    const eventIds = parseIds(bulkEventIds)
    const taskIds = parseIds(bulkTaskIds)
    return {
      eventCount: eventIds.length > 0 ? eventIds.length : Number(bulkEventLimit) || 10,
      taskCount: taskIds.length > 0 ? taskIds.length : Number(bulkTaskLimit) || 10,
    }
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
        const errorMsg = data.error?.join(". ") ?? "No se pudo completar la operación"
        throw new Error(errorMsg)
      }

      toast.success("Operación completada")
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Ocurrió un error al ejecutar la operación"
      toast.error(msg)
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Procesar tareas vencidas</CardTitle>
          <CardDescription>Ejecuta tareas programadas cuya hora ya pasó. Útil para procesar envíos pendientes.</CardDescription>
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
            {busyKey === "process-due" ? "Procesando…" : "Procesar tareas"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reprocesar evento</CardTitle>
          <CardDescription>Vuelve a ejecutar el pipeline de matching y delivery para un evento existente.</CardDescription>
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
          <CardDescription>Marca una tarea fallida para que se intente ejecutar nuevamente.</CardDescription>
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
          <CardTitle>Reprocesar varios eventos</CardTitle>
          <CardDescription>Reprocesa eventos por ID o los últimos eventos fallidos (máx. 100).</CardDescription>
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
            onClick={() => {
              const count = getBulkCount()
              setConfirmDialog({ type: "bulk-reprocess-events", count: count.eventCount })
            }}
          >
            {busyKey === "bulk-reprocess-events" ? "Procesando…" : "Reprocesar eventos"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reintentar varias tareas</CardTitle>
          <CardDescription>Reintenta tareas por ID o las últimas tareas en estado failed/retrying/pending.</CardDescription>
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
            onClick={() => {
              const count = getBulkCount()
              setConfirmDialog({ type: "bulk-retry-tasks", count: count.taskCount })
            }}
          >
            {busyKey === "bulk-retry-tasks" ? "Procesando…" : "Reintentar tareas"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cancelar varias tareas</CardTitle>
          <CardDescription>Cancela tareas por ID o las últimas tareas activas de la cola (pending/retrying).</CardDescription>
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
            onClick={() => {
              const count = getBulkCount()
              setConfirmDialog({ type: "bulk-cancel-tasks", count: count.taskCount })
            }}
          >
            {busyKey === "bulk-cancel-tasks" ? "Procesando…" : "Cancelar tareas"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instalar ejemplos Hermes</CardTitle>
          <CardDescription>Crea 2 templates y 2 rules de ejemplo para probar el sistema end-to-end.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground text-sm leading-6">
            Úsalo para tener datos de prueba en review, timeline y deliveries. No sobrescribe templates/rules existentes con el mismo nombre.
          </div>
          <Button
            className="w-full"
            disabled={busyKey === "bootstrap-examples"}
            onClick={() => runOperation("bootstrap-examples", "/api/hermes/admin/operations/bootstrap-examples")}
          >
            {busyKey === "bootstrap-examples" ? "Instalando ejemplos…" : "Instalar ejemplos"}
          </Button>
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Último resultado</CardTitle>
          <CardDescription>Respuesta cruda del último endpoint de operación ejecutado desde este panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[420px] overflow-auto rounded-lg shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] bg-[#fafafa] p-4 text-xs leading-6 whitespace-pre-wrap break-words">
            {JSON.stringify(result, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog !== null} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.type === "bulk-reprocess-events" && "Reprocesar eventos"}
              {confirmDialog?.type === "bulk-retry-tasks" && "Reintentar tareas"}
              {confirmDialog?.type === "bulk-cancel-tasks" && "Cancelar tareas"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.type === "bulk-reprocess-events" &&
                `¿Reprocesar ${confirmDialog.count} evento${confirmDialog.count > 1 ? "s" : ""}? Esto volverá a ejecutar el pipeline de matching y delivery.`}
              {confirmDialog?.type === "bulk-retry-tasks" &&
                `¿Reintentar ${confirmDialog.count} tarea${confirmDialog.count > 1 ? "s" : ""}? Esto marcará las tareas para ejecutar nuevamente.`}
              {confirmDialog?.type === "bulk-cancel-tasks" &&
                `¿Cancelar ${confirmDialog.count} tarea${confirmDialog.count > 1 ? "s" : ""}? Esto eliminará las tareas de la cola y no se pueden recuperar.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDialog) return
                const { type, count } = confirmDialog

                if (type === "bulk-reprocess-events") {
                  await runOperation("bulk-reprocess-events", "/api/hermes/admin/operations/events/bulk-reprocess", {
                    ids: parseIds(bulkEventIds),
                    limit: Number(bulkEventLimit) || 10,
                    status: "FAILED",
                  })
                } else if (type === "bulk-retry-tasks") {
                  await runOperation("bulk-retry-tasks", "/api/hermes/admin/operations/tasks/bulk-retry", {
                    ids: parseIds(bulkTaskIds),
                    limit: Number(bulkTaskLimit) || 10,
                  })
                } else if (type === "bulk-cancel-tasks") {
                  await runOperation("bulk-cancel-tasks", "/api/hermes/admin/operations/tasks/bulk-cancel", {
                    ids: parseIds(bulkTaskIds),
                    limit: Number(bulkTaskLimit) || 10,
                  })
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
