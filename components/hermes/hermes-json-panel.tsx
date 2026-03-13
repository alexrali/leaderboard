import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function HermesJsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="max-h-[420px] overflow-auto rounded-lg border bg-muted/20 p-4 text-xs leading-6 whitespace-pre-wrap break-words">
          {JSON.stringify(value, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}
