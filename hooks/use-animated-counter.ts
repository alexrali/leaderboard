"use client"

import { useState, useEffect, useRef } from "react"

interface UseAnimatedCounterOptions {
  /** Animation duration in milliseconds. Default: 2000 */
  duration?: number
  /** Delay before animation starts in milliseconds. Default: 0 */
  delay?: number
  /** Number of decimal places to preserve during animation. Default: 0 */
  decimals?: number
}

/**
 * Animates a numeric value from 0 to `end`.
 *
 * Supports integers, decimals (weight, volume), negative numbers,
 * and gracefully handles null/undefined by returning 0.
 *
 * Backward-compatible: accepts the legacy positional API `(end, duration, delay)`
 * or the new options-object API `(end, { decimals, ... })`.
 *
 * @example
 * // Legacy API (still works)
 * const count = useAnimatedCounter(142, 2000, 300)
 *
 * @example
 * // New options API — integer counter (UEs, folios, SKUs)
 * const count = useAnimatedCounter(142)
 *
 * @example
 * // Decimal counter with 2 decimal places (weight in kg)
 * const weight = useAnimatedCounter(847.35, { decimals: 2 })
 *
 * @example
 * // Percentage with delay and custom duration
 * const margin = useAnimatedCounter(23.8, { decimals: 1, delay: 500, duration: 1500 })
 */
export function useAnimatedCounter(
  end: number | null | undefined,
  legacyDurationOrOptions?: number | UseAnimatedCounterOptions,
  legacyDelay?: number
) {
  // Backward-compatible: detect legacy positional args vs new options object
  let duration = 2000
  let delay = 0
  let decimals = 0

  if (typeof legacyDurationOrOptions === "number") {
    // Legacy API: useAnimatedCounter(end, duration, delay)
    duration = legacyDurationOrOptions
    delay = legacyDelay ?? 0
  } else if (legacyDurationOrOptions && typeof legacyDurationOrOptions === "object") {
    // New API: useAnimatedCounter(end, { duration, delay, decimals })
    duration = legacyDurationOrOptions.duration ?? 2000
    delay = legacyDurationOrOptions.delay ?? 0
    decimals = legacyDurationOrOptions.decimals ?? 0
  }

  const safeEnd = end ?? 0
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    // Reset start time when dependencies change
    startTimeRef.current = null

    const timeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp
        const progress = timestamp - startTimeRef.current
        const percentage = Math.min(progress / duration, 1)

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - percentage, 4)
        const currentValue = decimals > 0
          ? parseFloat((easeOutQuart * safeEnd).toFixed(decimals))
          : Math.round(easeOutQuart * safeEnd)

        setCount(currentValue)

        if (percentage < 1) {
          rafRef.current = requestAnimationFrame(animate)
        } else {
          setCount(safeEnd)
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [safeEnd, duration, delay, decimals])

  return count
}
