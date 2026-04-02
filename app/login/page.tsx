import { LoginForm } from "@/components/login-form"

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-white p-6 md:p-10">
      <div className="w-full max-w-sm flex flex-col gap-4">
        {error === "auth_failed" && (
          <div className="rounded-lg shadow-[rgba(239,68,68,0.3)_0px_0px_0px_1px] bg-red-50 px-4 py-3 text-sm text-destructive text-center">
            El enlace de acceso expiró o no es válido. Por favor solicita uno nuevo.
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  )
}
