"use client"

interface SriEmptyStateProps {
  message?: string
  hint?: string
}

export function SriEmptyState({
  message = "No hay datos disponibles",
  hint = "Selecciona otro mes o espera la próxima ejecución del pipeline",
}: SriEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[#ebebeb] flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-[#666666]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <p className="text-base font-medium text-[#171717]">{message}</p>
      <p className="text-sm text-[#666666] mt-1 max-w-md">{hint}</p>
    </div>
  )
}
