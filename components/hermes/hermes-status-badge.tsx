import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-700",
  RETRYING: "bg-orange-50 text-orange-700",
  QUEUED: "bg-sky-50 text-sky-700",
  SENT: "bg-blue-50 text-blue-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  OPENED: "bg-violet-50 text-violet-700",
  CLICKED: "bg-fuchsia-50 text-fuchsia-700",
  BOUNCED: "bg-red-50 text-red-700",
  UNSUBSCRIBED: "bg-slate-100 text-slate-700",
}

export function HermesStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusStyles[status] ?? "bg-[#fafafa] text-[#171717]")}
    >
      {status}
    </Badge>
  )
}
