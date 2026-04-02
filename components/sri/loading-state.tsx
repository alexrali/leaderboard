"use client"

export function SriLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ebebeb] border-t-[#171717]" />
      <p className="mt-4 text-sm text-[#4d4d4d]">Cargando datos de SRI...</p>
    </div>
  )
}
