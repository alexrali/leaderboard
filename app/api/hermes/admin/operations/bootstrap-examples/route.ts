import { NextResponse } from "next/server"
import { installHermesExampleScenarios } from "@/lib/hermes/example-admin"
import { createClient } from "@/lib/supabase/server"

function getBootstrapErrorDetails(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code ?? "") : ""
  const message = error instanceof Error
    ? error.message
    : typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "Internal server error"

  if (code === "PGRST205") {
    return {
      status: 503,
      errors: [
        "Las tablas Hermes no existen todavía en este proyecto de Supabase. Aplica la sección Hermes de `leaderboard/supabase-schema.sql` en el SQL Editor y vuelve a intentar `Instalar ejemplos`.",
      ],
    }
  }

  return {
    status: 500,
    errors: [message],
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    const result = await installHermesExampleScenarios(data.user?.id ?? null)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    const details = getBootstrapErrorDetails(error)
    console.error("Hermes admin bootstrap examples error:", error)
    return NextResponse.json({ success: false, error: details.errors }, { status: details.status })
  }
}
