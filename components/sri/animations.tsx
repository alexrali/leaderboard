"use client"

import { motion, useReducedMotion } from "framer-motion"

// Staggered entrance variants for lists
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      ease: [0.25, 0.1, 0.25, 1], // ease-out-quart
      duration: 0.3,
    },
  },
}

// Page fade-in
export function PageFadeIn({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        ease: [0.25, 0.1, 0.25, 1],
        duration: shouldReduceMotion ? 0 : 0.4,
      }}
    >
      {children}
    </motion.div>
  )
}

// Card hover effect
export function HoverCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
      transition={{
        ease: [0.25, 0.1, 0.25, 1],
        duration: 0.2,
      }}
    >
      {children}
    </motion.div>
  )
}

// Scale in for modals/drawers
export function ScaleIn({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
      transition={{
        ease: [0.25, 0.1, 0.25, 1],
        duration: shouldReduceMotion ? 0 : 0.2,
      }}
    >
      {children}
    </motion.div>
  )
}

// Slide from right for drawer
export const slideInRight = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
  transition: {
    ease: [0.25, 0.1, 0.25, 1],
    duration: 0.3,
  },
}
