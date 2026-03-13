import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  PROCESSING: "border-blue-200 bg-blue-50 text-blue-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FAILED: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-700",
  RETRYING: "border-orange-200 bg-orange-50 text-orange-700",
  QUEUED: "border-sky-200 bg-sky-50 text-sky-700",
  SENT: "border-blue-200 bg-blue-50 text-blue-700",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  OPENED: "border-violet-200 bg-violet-50 text-violet-700",
  CLICKED: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  BOUNCED: "border-red-200 bg-red-50 text-red-700",
  UNSUBSCRIBED: "border-slate-200 bg-slate-100 text-slate-700",
}

export function HermesStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusStyles[status] ?? "border-border bg-background text-foreground")}
    >
      {status}
    </Badge>
  )
}
