import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"
import { HermesAdminNav } from "@/components/hermes/hermes-admin-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Hermes Messaging Admin",
  description: "Administración de templates, reglas, eventos y entregas de Hermes",
}

export default function MessagingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#ebf5ff] px-3 py-1 text-xs text-[#0068d6]">
              <Mail className="size-3.5" />
              <span>Hermes Messaging Platform</span>
            </div>
            <h1 className="text-[32px] font-semibold tracking-[-0.04em]">Centro de mensajería</h1>
            <p className="text-muted-foreground text-sm">
              Administración aislada de templates, reglas, eventos, entregas y tareas programadas.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/" className="gap-2">
              <ArrowLeft className="size-4" />
              <span>Volver al dashboard</span>
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Navegación</CardTitle>
            <CardDescription>
              Estas vistas usan las tablas y rutas Hermes sin alterar los flujos actuales del leaderboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HermesAdminNav />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">{children}</div>
      </div>
    </div>
  )
}
