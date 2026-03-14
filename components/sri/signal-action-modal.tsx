"use client"

import { useEffect, useRef, useState } from "react"
import { ScaleIn } from "./animations"

export type SignalActionType = "plan" | "share" | "monitor"

interface SignalActionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { title: string; description: string }) => void
  type: SignalActionType
  agentName: string
  agentId: string
  signalLevel: string
  signalMessage?: string
}

const actionTypeLabels: Record<SignalActionType, string> = {
  plan: "Crear Plan de Acción",
  share: "Compartir Práctica",
  monitor: "Configurar Monitoreo",
}

export function SignalActionModal({
  isOpen,
  onClose,
  onSave,
  type,
  agentName,
  agentId,
  signalLevel,
  signalMessage,
}: SignalActionModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const modalRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElementRef.current = document.activeElement as HTMLElement

      // Focus the first input after a short delay to ensure the modal is rendered
      setTimeout(() => {
        titleInputRef.current?.focus()
      }, 50)

      // Prevent body scroll
      document.body.style.overflow = "hidden"
    } else {
      // Restore focus to the trigger element when modal closes
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus()
      }

      // Restore body scroll
      document.body.style.overflow = ""

      // Reset form
      setTitle("")
      setDescription("")
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Focus trap
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return

    const focusableElements = modalRef.current?.querySelectorAll<
      HTMLElement
    >(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (!focusableElements || focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  if (!isOpen) return null

  const handleSave = () => {
    if (title.trim()) {
      onSave({ title: title.trim(), description: description.trim() })
      setTitle("")
      setDescription("")
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <ScaleIn>
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
          className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          <h2
            id="modal-title"
            className="mb-1 text-xl font-semibold text-neutral-900"
          >
            {actionTypeLabels[type]}
          </h2>
          <p
            id="modal-description"
            className="mb-4 text-sm text-neutral-600"
          >
            {agentName} · ID: {agentId} · {signalLevel}
          </p>

          {type === "plan" && signalMessage && (
            <div className="mb-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-700">{signalMessage}</p>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-neutral-700">
              Título
            </label>
            <input
              ref={titleInputRef}
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: Plan de recuperación de cartera"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-neutral-700">
              Descripción
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Describe el plan, práctica o configuración de monitoreo..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!title.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
      </ScaleIn>
    </div>
  )
}
