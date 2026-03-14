"use client"

export function SriLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
      <p className="mt-4 text-sm text-neutral-600">Cargando datos de SRI...</p>
    </div>
  )
}
