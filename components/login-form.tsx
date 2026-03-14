"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

const emailSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
})

const codeSchema = z.object({
  code: z.string().min(8, "Ingresa el código de 8 dígitos de tu correo"),
})

type EmailFormData = z.infer<typeof emailSchema>
type CodeFormData = z.infer<typeof codeSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "code">("email")
  const [submittedEmail, setSubmittedEmail] = useState("")

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })

  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  })

  async function onEmailSubmit(data: EmailFormData) {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    setSubmittedEmail(data.email)
    setStep("code")
  }

  async function onCodeSubmit(data: CodeFormData) {
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email: submittedEmail,
      token: data.code,
      type: "email",
    })

    if (error) {
      toast.error(error.message)
      codeForm.reset()
      return
    }

    router.refresh()
    router.push("/")
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="p-6 md:p-8">
          {step === "email" ? (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Bienvenido</h1>
                  <p className="text-muted-foreground text-sm text-balance">
                    Ingresa tu correo para recibir un código de acceso
                  </p>
                </div>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...emailForm.register("email")}
                  />
                  {emailForm.formState.errors.email && (
                    <p className="text-destructive text-sm">
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </Field>
                <Field>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={emailForm.formState.isSubmitting}
                  >
                    {emailForm.formState.isSubmitting ? "Enviando…" : "Enviar código"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          ) : (
            <form onSubmit={codeForm.handleSubmit(onCodeSubmit)}>
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Revisa tu correo</h1>
                  <p className="text-muted-foreground text-sm text-balance">
                    Enviamos un código de acceso a{" "}
                    <span className="font-medium text-foreground">
                      {submittedEmail}
                    </span>
                  </p>
                </div>
                <Field>
                  <FieldLabel htmlFor="code">Código de acceso</FieldLabel>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    placeholder="12345678"
                    maxLength={8}
                    autoComplete="one-time-code"
                    className="text-center text-lg tracking-widest"
                    {...codeForm.register("code")}
                  />
                  {codeForm.formState.errors.code && (
                    <p className="text-destructive text-sm">
                      {codeForm.formState.errors.code.message}
                    </p>
                  )}
                </Field>
                <Field>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={codeForm.formState.isSubmitting}
                  >
                    {codeForm.formState.isSubmitting ? "Verificando…" : "Iniciar sesión"}
                  </Button>
                </Field>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Usar otro correo
                </button>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
