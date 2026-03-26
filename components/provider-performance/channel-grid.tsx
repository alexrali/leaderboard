"use client"

import { cn } from "@/lib/utils"
import type { ProviderChannel } from "@/lib/provider-types"

interface ChannelGridProps {
  channels?: ProviderChannel[]
}

type ChannelDisplay = {
  icon: string
  label: string
  condition: string
  amount: number
  deployed: string
  color?: string
}

function ChannelColumn({
  channel,
  isLast
}: {
  channel: ChannelDisplay
  isLast: boolean
}) {
  return (
    <div
      className={cn(
        "flex-1 py-5 px-6",
        !isLast && "border-b sm:border-b-0 sm:border-r border-stone-200/60"
      )}
    >
      {/* Icon and Label */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className={cn("text-[10px]", channel.color || "text-foreground")}>{channel.icon}</span>
        <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">
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
        ${channel.amount.toLocaleString()}
      </p>

      {/* Deployed */}
      <p className="text-[10px] text-muted-foreground font-mono mt-3">{channel.deployed}</p>
    </div>
  )
}

export function ChannelGrid({ channels: channelData }: ChannelGridProps) {
  if (!channelData || channelData.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-6 py-3 bg-muted/30">
          <div className="h-3 w-40 bg-muted animate-pulse rounded" />
          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex flex-col sm:flex-row bg-muted/20 p-6 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const ICONS = ['▲', '●', '▼']
  const COLORS = ['text-emerald-600', 'text-amber-600', 'text-red-600']

  const channels: ChannelDisplay[] = (channelData ?? []).map((ch, i) => ({
    icon: ICONS[i] ?? '●',
    label: ch.displayName.toUpperCase(),
    condition: `${ch.units.toLocaleString()} pzas · ${ch.orders.toLocaleString()} órdenes · ${ch.locations} ${ch.channel === 'distribucion' ? 'clientes' : 'tiendas'}`,
    amount: Math.round(ch.revenue),
    deployed: `$${Math.round(ch.revenue / 1000).toLocaleString()}K MTD`,
    color: COLORS[i],
  }))

  const totalRevenue = (channelData ?? []).reduce((s, c) => s + c.revenue, 0)

  return (
    <div className="animate-in fade-in duration-700 delay-500">
      {/* Zone Header Bar - INSIDE the zone */}
      <div className="flex items-center justify-between px-6 py-3 bg-stone-50/80 border-b border-stone-200/60">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
          Rendimiento por Canal de Venta
        </p>
        <p className="text-[11px] text-muted-foreground font-mono">
          ${Math.round(totalRevenue / 1000).toLocaleString()}K distribuidos en canales
        </p>
      </div>

      {/* Channel Columns */}
      <div className="flex flex-col sm:flex-row bg-background">
        {channels.map((channel, index) => (
          <ChannelColumn
            key={channel.label}
            channel={channel}
            isLast={index === channels.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
