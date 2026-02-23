"use client"

import { useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAppStore, type AppSettings } from "@/lib/store"
import { getDeviceKey } from "@/lib/utils"

// ─── Remote read ──────────────────────────────────────────────────────────────

async function fetchRemoteSettings(): Promise<AppSettings | null> {
  const id = getDeviceKey()
  const { data, error } = await supabase
    .from("user_settings")
    .select("profile, appearance, preferences")
    .eq("id", id)
    .single()

  if (error) {
    if (error.code !== "PGRST116") throw error
    return null // no row yet — expected on first visit
  }
  if (!data) return null

  return {
    userProfile: data.profile as AppSettings["userProfile"],
    appearance: data.appearance as AppSettings["appearance"],
    dashboardPrefs: data.preferences as AppSettings["dashboardPrefs"],
  }
}

// ─── Remote write ─────────────────────────────────────────────────────────────

async function upsertRemoteSettings(settings: AppSettings): Promise<void> {
  const id = getDeviceKey()
  const { error } = await supabase.from("user_settings").upsert({
    id,
    profile: settings.userProfile,
    appearance: settings.appearance,
    preferences: settings.dashboardPrefs,
  })
  if (error) throw error
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSettingsSync() {
  const settings = useAppStore((s) => s.settings)
  const updateUserProfile = useAppStore((s) => s.updateUserProfile)
  const updateAppearance = useAppStore((s) => s.updateAppearance)
  const updateDashboardPrefs = useAppStore((s) => s.updateDashboardPrefs)
  const { setTheme } = useTheme()

  // Hydrate from Supabase on mount (remote wins on conflict)
  const { data: remoteSettings } = useQuery({
    queryKey: ["user-settings"],
    queryFn: fetchRemoteSettings,
    staleTime: Infinity, // only fetch once per session
    retry: 1,
  })

  useEffect(() => {
    if (!remoteSettings) return
    updateUserProfile(remoteSettings.userProfile)
    updateAppearance(remoteSettings.appearance)
    updateDashboardPrefs(remoteSettings.dashboardPrefs)
    setTheme(remoteSettings.appearance.theme)
  // Zustand action references are stable; omitting them from deps is safe
  }, [remoteSettings]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mutation for saving
  const { mutate: saveSettings, isPending } = useMutation({
    mutationFn: upsertRemoteSettings,
    onSuccess: () => toast.success("Configuración guardada"),
    onError: () => toast.error("Error al guardar. Los cambios se guardaron localmente."),
  })

  return {
    saveSettings: () => saveSettings(useAppStore.getState().settings),
    isSaving: isPending,
  }
}
