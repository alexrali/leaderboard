import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface HermesDetailField {
  label: string
  value: ReactNode
}

export function HermesDetailGrid({ title, fields }: { title: string; fields: HermesDetailField[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fields.map((field) => (
            <div key={field.label} className="space-y-1 rounded-lg border bg-muted/20 p-4">
              <div className="text-muted-foreground text-xs uppercase tracking-wide">{field.label}</div>
              <div className="text-sm font-medium break-words">{field.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
