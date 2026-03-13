import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HermesFilterLinksProps {
  basePath: string
  currentValue: string
  paramName?: string
  items: Array<{
    label: string
    value: string
  }>
}

export function HermesFilterLinks({
  basePath,
  currentValue,
  paramName = "status",
  items,
}: HermesFilterLinksProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const href = item.value === "ALL" ? basePath : `${basePath}?${paramName}=${encodeURIComponent(item.value)}`
        const isActive = currentValue === item.value

        return (
          <Link
            key={item.value}
            href={href}
            className={cn(
              buttonVariants({ variant: isActive ? "default" : "outline", size: "sm" }),
              "h-8"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
