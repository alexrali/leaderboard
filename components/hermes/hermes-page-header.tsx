import type { ReactNode } from "react"

interface HermesPageHeaderProps {
  title: string
  description: string
  actions?: ReactNode
}

export function HermesPageHeader({ title, description, actions }: HermesPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
