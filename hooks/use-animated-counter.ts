"use client"

import { useState, useEffect, useRef } from "react"

export function useAnimatedCounter(
  end: number,
  duration: number = 2000,
  delay: number = 0
) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp
        const progress = timestamp - startTimeRef.current
        const percentage = Math.min(progress / duration, 1)

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - percentage, 4)
        const currentValue = Math.floor(easeOutQuart * end)

        if (currentValue !== countRef.current) {
          countRef.current = currentValue
          setCount(currentValue)
        }

        if (percentage < 1) {
          requestAnimationFrame(animate)
        } else {
          setCount(end)
        }
      }

      requestAnimationFrame(animate)
    }, delay)

    return () => clearTimeout(timeout)
  }, [end, duration, delay])

  return count
}
