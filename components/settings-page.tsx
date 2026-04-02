"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor, Save } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAppStore } from "@/lib/store"
import { useSettingsSync } from "@/hooks/use-settings-sync"

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  displayName: z.string().min(1, "El nombre es requerido").max(50),
  role: z.string().min(1, "El rol es requerido").max(50),
})

const prefsSchema = z.object({
  defaultView: z.enum(["daily", "weekly"]),
  defaultSection: z.enum(["overview", "metrics", "day-progress", "resources", "dashboard", "panel", "account", "notifications"]),
  refreshInterval: z.coerce.number().refine((v) => [1, 5, 10, 30].includes(v), {
    message: "Selecciona un intervalo válido",
  }),
})

type ProfileForm = z.infer<typeof profileSchema>
type PrefsForm = z.infer<typeof prefsSchema>

// ─── Component ────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { setTheme } = useTheme()
  const settings = useAppStore((s) => s.settings)
  const updateUserProfile = useAppStore((s) => s.updateUserProfile)
  const updateAppearance = useAppStore((s) => s.updateAppearance)
  const updateDashboardPrefs = useAppStore((s) => s.updateDashboardPrefs)
  const { saveSettings, isSaving } = useSettingsSync()

  // ── Profile form ────────────────────────────────────────────────────────────
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: settings.userProfile,
  })

  useEffect(() => {
    profileForm.reset(settings.userProfile)
  }, [settings.userProfile]) // eslint-disable-line react-hooks/exhaustive-deps

  function onSaveProfile(data: ProfileForm) {
    updateUserProfile(data)
    saveSettings()
  }

  // ── Prefs form ──────────────────────────────────────────────────────────────
  const prefsForm = useForm<PrefsForm>({
    resolver: zodResolver(prefsSchema),
    defaultValues: {
      defaultView: settings.dashboardPrefs.defaultView,
      defaultSection: settings.dashboardPrefs.defaultSection,
      refreshInterval: settings.dashboardPrefs.refreshInterval,
    },
  })

  useEffect(() => {
    prefsForm.reset({
      defaultView: settings.dashboardPrefs.defaultView,
      defaultSection: settings.dashboardPrefs.defaultSection,
      refreshInterval: settings.dashboardPrefs.refreshInterval,
    })
  }, [settings.dashboardPrefs]) // eslint-disable-line react-hooks/exhaustive-deps

  function onSavePrefs(data: PrefsForm) {
    updateDashboardPrefs({
      defaultView: data.defaultView,
      defaultSection: data.defaultSection,
      refreshInterval: data.refreshInterval as 1 | 5 | 10 | 30,
    })
    saveSettings()
  }

  // ── Theme (instant save) ────────────────────────────────────────────────────
  function onThemeChange(theme: "light" | "dark" | "system") {
    setTheme(theme)
    updateAppearance({ theme })
    saveSettings()
  }

  const currentTheme = settings.appearance.theme

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-semibold tracking-[-0.04em]">Configuración</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Personaliza tu experiencia en el dashboard
        </p>
      </div>

      <Separator className="opacity-20" />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
        </TabsList>

        {/* ── Perfil ─────────────────────────────────────────────────────────── */}
        <TabsContent value="profile">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Perfil de usuario</CardTitle>
              <CardDescription>
                Tu nombre y rol se muestran en la barra lateral.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="displayName">Nombre</Label>
                  <Input
                    id="displayName"
                    placeholder="Tu nombre"
                    {...profileForm.register("displayName")}
                  />
                  {profileForm.formState.errors.displayName && (
                    <p className="text-destructive text-xs">
                      {profileForm.formState.errors.displayName.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="role">Rol</Label>
                  <Input
                    id="role"
                    placeholder="Tu rol"
                    {...profileForm.register("role")}
                  />
                  {profileForm.formState.errors.role && (
                    <p className="text-destructive text-xs">
                      {profileForm.formState.errors.role.message}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={isSaving} className="self-start">
                  <Save className="mr-2 size-4" />
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Apariencia ─────────────────────────────────────────────────────── */}
        <TabsContent value="appearance">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>Elige el tema de la interfaz.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {(
                  [
                    { value: "light", label: "Claro", Icon: Sun },
                    { value: "dark", label: "Oscuro", Icon: Moon },
                    { value: "system", label: "Sistema", Icon: Monitor },
                  ] as const
                ).map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onThemeChange(value)}
                    className={`flex flex-1 flex-col items-center gap-2 rounded-xl border px-4 py-5 text-sm font-medium transition-colors ${
                      currentTheme === value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-5" />
                    {label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Preferencias ───────────────────────────────────────────────────── */}
        <TabsContent value="preferences">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Preferencias del dashboard</CardTitle>
              <CardDescription>
                Define los valores por defecto al abrir el dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={prefsForm.handleSubmit(onSavePrefs)} className="flex flex-col gap-6">
                {/* Default view */}
                <div className="flex flex-col gap-3">
                  <Label>Vista por defecto</Label>
                  <RadioGroup
                    value={prefsForm.watch("defaultView")}
                    onValueChange={(v) =>
                      prefsForm.setValue("defaultView", v as "daily" | "weekly")
                    }
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="daily" id="view-daily" />
                      <Label htmlFor="view-daily" className="font-normal cursor-pointer">Hoy</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="weekly" id="view-weekly" />
                      <Label htmlFor="view-weekly" className="font-normal cursor-pointer">Semana</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Default section */}
                <div className="flex flex-col gap-2">
                  <Label>Sección inicial</Label>
                  <Select
                    value={prefsForm.watch("defaultSection")}
                    onValueChange={(v) =>
                      prefsForm.setValue("defaultSection", v as PrefsForm["defaultSection"])
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overview">Resumen Semanal</SelectItem>
                      <SelectItem value="metrics">Métricas Generales</SelectItem>
                      <SelectItem value="day-progress">Progreso del Día</SelectItem>
                      <SelectItem value="resources">Recursos</SelectItem>
                      <SelectItem value="dashboard">Panel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Refresh interval */}
                <div className="flex flex-col gap-2">
                  <Label>Intervalo de actualización</Label>
                  <Select
                    value={String(prefsForm.watch("refreshInterval"))}
                    onValueChange={(v) =>
                      prefsForm.setValue("refreshInterval", Number(v) as 1 | 5 | 10 | 30)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Cada 1 minuto</SelectItem>
                      <SelectItem value="5">Cada 5 minutos</SelectItem>
                      <SelectItem value="10">Cada 10 minutos</SelectItem>
                      <SelectItem value="30">Cada 30 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    Requiere recargar la página para aplicar.
                  </p>
                </div>

                <Button type="submit" disabled={isSaving} className="self-start">
                  <Save className="mr-2 size-4" />
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
