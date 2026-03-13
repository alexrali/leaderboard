export function formatHermesDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function shortenHermesId(value: string | null | undefined, size = 8): string {
  if (!value) {
    return "—"
  }

  if (value.length <= size) {
    return value
  }

  return value.slice(0, size)
}

export function formatHermesBoolean(value: boolean): string {
  return value ? "Activo" : "Inactivo"
}
