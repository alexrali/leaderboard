"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"

// QueryClient is created once per mount. Interval is read from localStorage at
// initialization time — a refreshInterval change takes effect on next page load.
function getRefreshIntervalMs(): number {
  if (typeof window === "undefined") return 5 * 60 * 1000
  try {
    const raw = localStorage.getItem("leaderboard-app-settings")
    if (!raw) return 5 * 60 * 1000
    const parsed = JSON.parse(raw)
    const interval = parsed?.state?.settings?.dashboardPrefs?.refreshInterval ?? 5
    return interval * 60 * 1000
  } catch {
    return 5 * 60 * 1000
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchInterval: getRefreshIntervalMs(),
            retry: 2,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
