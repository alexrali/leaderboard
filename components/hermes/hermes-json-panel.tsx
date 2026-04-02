import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function HermesJsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="max-h-[420px] overflow-auto rounded-lg shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] bg-[#fafafa] p-4 text-xs leading-6 whitespace-pre-wrap break-words">
          {JSON.stringify(value, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}
