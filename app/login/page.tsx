import { LoginForm } from "@/components/login-form"

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm flex flex-col gap-4">
        {error === "auth_failed" && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
            Your login link has expired or is invalid. Please request a new one.
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  )
}
