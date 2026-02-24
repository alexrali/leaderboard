import { create } from "zustand"
import { persist } from "zustand/middleware"

// ─── Settings Types ───────────────────────────────────────────────────────────

export type AppTheme = "light" | "dark" | "system"
export type ViewMode = "daily" | "weekly"
export type RefreshInterval = 1 | 5 | 10 | 30

export interface UserProfile {
  displayName: string
  role: string
}

export interface AppearanceSettings {
  theme: AppTheme
}

export type SectionKey = "overview" | "metrics" | "day-progress" | "resources" | "dashboard" | "panel"

export interface DashboardPrefs {
  defaultView: ViewMode
  defaultSection: SectionKey
  refreshInterval: RefreshInterval
}

export interface AppSettings {
  userProfile: UserProfile
  appearance: AppearanceSettings
  dashboardPrefs: DashboardPrefs
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface AppState {
  // Navigation
  activeSection: string
  setActiveSection: (section: string) => void

  // Settings
  settings: AppSettings
  updateUserProfile: (profile: Partial<UserProfile>) => void
  updateAppearance: (appearance: Partial<AppearanceSettings>) => void
  updateDashboardPrefs: (prefs: Partial<DashboardPrefs>) => void
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultSettings: AppSettings = {
  userProfile: {
    displayName: "Alejandro RL",
    role: "Ingeniero Líder",
  },
  appearance: {
    theme: "system",
  },
  dashboardPrefs: {
    defaultView: "daily",
    defaultSection: "overview",
    refreshInterval: 5,
  },
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeSection: "overview",
      setActiveSection: (section) => set({ activeSection: section }),

      settings: defaultSettings,

      updateUserProfile: (profile) =>
        set((state) => ({
          settings: {
            ...state.settings,
            userProfile: { ...state.settings.userProfile, ...profile },
          },
        })),

      updateAppearance: (appearance) =>
        set((state) => ({
          settings: {
            ...state.settings,
            appearance: { ...state.settings.appearance, ...appearance },
          },
        })),

      updateDashboardPrefs: (prefs) =>
        set((state) => ({
          settings: {
            ...state.settings,
            dashboardPrefs: { ...state.settings.dashboardPrefs, ...prefs },
          },
        })),
    }),
    {
      name: "leaderboard-app-settings",
      // Only persist settings, not activeSection (navigation is transient)
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)
