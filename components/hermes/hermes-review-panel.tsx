"use client"

import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { HermesEventTimeline } from "@/components/hermes/hermes-event-timeline"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { HermesEventTimelineData } from "@/lib/hermes/review"
import type { HermesEventSource } from "@/lib/hermes/types"

interface ReviewResponse {
  success: boolean
  error?: string[]
  timeline?: HermesEventTimelineData
  mode?: "preview" | "process"
}

export function HermesReviewPanel() {
  const [type, setType] = useState("user.signup")
  const [source, setSource] = useState<HermesEventSource>("api")
  const [externalId, setExternalId] = useState("")
  const [payloadJson, setPayloadJson] = useState('{\n  "user": {\n    "email": "demo@example.com",\n    "name": "Demo User"\n  }\n}')
  const [metadataJson, setMetadataJson] = useState('{\n  "review": true\n}')
  const [busyMode, setBusyMode] = useState<"preview" | "process" | null>(null)
  const [result, setResult] = useState<ReviewResponse | null>(null)

  async function run(mode: "preview" | "process") {
    let payload: unknown
    let metadata: unknown

    try {
      payload = JSON.parse(payloadJson)
    } catch {
      toast.error("El payload no tiene formato JSON válido. Revisa que tenga llaves y comillas correctas.")
      return
    }

    try {
      metadata = JSON.parse(metadataJson)
    } catch {
      toast.error("La metadata no tiene formato JSON válido. Revisa que tenga llaves y comillas correctas.")
      return
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      toast.error("El payload debe ser un objeto JSON, no un arreglo. Usa llaves {} en lugar de corchetes []")
      return
    }

    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      toast.error("La metadata debe ser un objeto JSON, no un arreglo. Usa llaves {} en lugar de corchetes []")
      return
    }

    try {
      setBusyMode(mode)
      const response = await fetch("/api/hermes/admin/review/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          type,
          source,
          externalId: externalId || undefined,
          payload,
          metadata,
        }),
      })

      const data = (await response.json().catch(() => ({ success: false, error: ["El servidor no respondió con un formato válido"] }))) as ReviewResponse
      setResult(data)

      if (!response.ok || !data.success) {
        throw new Error(data.error?.join(". ") ?? "No se pudo procesar el evento")
      }

      toast.success(mode === "preview" ? "Preview generado correctamente" : "Evento creado y procesado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo procesar el evento. Intenta de nuevo.")
    } finally {
      setBusyMode(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Evento de prueba</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 xl:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="review-type">Type</FieldLabel>
                <Input id="review-type" value={type} onChange={(event) => setType(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Source</FieldLabel>
                <Select value={source} onValueChange={(value) => setSource(value as HermesEventSource)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api">api</SelectItem>
                    <SelectItem value="queue">queue</SelectItem>
                    <SelectItem value="cron">cron</SelectItem>
                    <SelectItem value="webhook">webhook</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="review-external-id">External ID</FieldLabel>
                <Input id="review-external-id" value={externalId} onChange={(event) => setExternalId(event.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="review-payload">Payload</FieldLabel>
                <Textarea id="review-payload" className="min-h-[260px] font-mono text-sm" value={payloadJson} onChange={(event) => setPayloadJson(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="review-metadata">Metadata</FieldLabel>
                <Textarea id="review-metadata" className="min-h-[260px] font-mono text-sm" value={metadataJson} onChange={(event) => setMetadataJson(event.target.value)} />
                <FieldDescription>Usa preview para revisar matches sin persistir nada. Usa crear y procesar para ejecutar el flujo real.</FieldDescription>
              </Field>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" disabled={busyMode !== null} onClick={() => run("preview")}>
                {busyMode === "preview" ? "Generando…" : "Preview matching"}
              </Button>
              <Button type="button" disabled={busyMode !== null} onClick={() => run("process")}>
                {busyMode === "process" ? "Procesando…" : "Crear y procesar evento"}
              </Button>
              {result?.timeline && !result.timeline.event.id.startsWith("preview-") ? (
                <Button asChild variant="secondary">
                  <Link href={`/messaging/events/${result.timeline.event.id}`}>Abrir detalle del evento</Link>
                </Button>
              ) : null}
              {result?.timeline && !result.timeline.event.id.startsWith("preview-") ? (
                <Button asChild variant="secondary">
                  <Link href={`/messaging/events/${result.timeline.event.id}/timeline`}>Abrir timeline</Link>
                </Button>
              ) : null}
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {result?.timeline ? <HermesEventTimeline {...result.timeline} showEventLinks={!result.timeline.event.id.startsWith("preview-")} /> : null}
    </div>
  )
}
