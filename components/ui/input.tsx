import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 disabled:bg-[#fafafa] h-8 rounded-lg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] bg-transparent px-2.5 py-1 text-base transition-shadow focus-visible:shadow-[0_0_0_2px_hsla(212,100%,48%,1)] file:h-6 file:text-sm file:font-medium focus-visible:ring-3 aria-invalid:ring-3 md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
