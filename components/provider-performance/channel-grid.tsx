"use client"

import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils"

const channels = [
  {
    icon: "▲",
    label: "ONLINE STORE",
    condition: "Revenue > $400K",
    amount: 42847,
    deployed: "$440.2K deployed",
  },
  {
    icon: "●",
    label: "RETAIL STORES",
    condition: "$280K - $320K range",
    amount: 28392,
    deployed: "$288.5K deployed",
    color: "text-amber-600",
  },
  {
    icon: "▼",
    label: "B2B SALES",
    condition: "Revenue < $150K",
    amount: 18653,
    deployed: "$118.7K deployed",
    color: "text-red-600",
  },
]

function ChannelColumn({
  channel,
  delay,
  isLast
}: {
  channel: typeof channels[0]
  delay: number
  isLast: boolean
}) {
  const animatedAmount = useAnimatedCounter(channel.amount, 2000, delay)

  return (
    <div
      className={cn(
        "flex-1 py-5 px-6 animate-in fade-in slide-in-from-bottom-3 duration-500",
        !isLast && "border-b sm:border-b-0 sm:border-r border-stone-200/60"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icon and Label */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className={cn("text-[10px]", channel.color || "text-foreground")}>{channel.icon}</span>
        <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
          {channel.label}
        </span>
      </div>

      {/* Condition */}
      <p className="text-[11px] text-muted-foreground font-mono mb-3">{channel.condition}</p>

      {/* Amount */}
      <p className={cn(
        "text-[32px] font-mono font-bold tracking-tight tabular-nums leading-none",
        channel.color || "text-foreground"
      )}>
        +${animatedAmount.toLocaleString()}
      </p>

      {/* Deployed */}
      <p className="text-[10px] text-muted-foreground font-mono mt-3">{channel.deployed}</p>
    </div>
  )
}

export function ChannelGrid() {
  return (
    <div className="animate-in fade-in duration-700 delay-500">
      {/* Zone Header Bar - INSIDE the zone */}
      <div className="flex items-center justify-between px-6 py-3 bg-stone-50/80 border-b border-stone-200/60">
        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
          Sales Channel Performance Grid
        </p>
        <p className="text-[11px] text-muted-foreground font-mono">
          $847K distributed across channels
        </p>
      </div>

      {/* Channel Columns */}
      <div className="flex flex-col sm:flex-row bg-background">
        {channels.map((channel, index) => (
          <ChannelColumn
            key={channel.label}
            channel={channel}
            delay={index * 150 + 800}
            isLast={index === channels.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
