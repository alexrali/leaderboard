'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useAutoRefresh(intervalMs: number = 5 * 60 * 1000) {
  const router = useRouter()
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
      setLastRefresh(new Date())
    }, intervalMs)

    return () => clearInterval(interval)
  }, [router, intervalMs])

  return { lastRefresh }
}
