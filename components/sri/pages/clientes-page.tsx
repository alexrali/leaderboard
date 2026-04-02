"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { PageFadeIn, staggerContainer, staggerItem } from "../animations"
import { StatusBadge, getStatusLevel } from "../status-badge"
import { ClientHealthPieChart } from "../charts/pie-chart"
import { formatCurrency, formatPercent, formatNumber } from "@/lib/format"
import { useAppStore } from "@/lib/store"
import { useSriClientHealth } from "@/hooks/use-sri-queries"
import type { SriClientHealth } from "@/lib/supabase"

type ActivityStatus = "Active" | "At-risk" | "Dormant"

interface StatusCardProps {
  status: ActivityStatus
  count: number
  percentage: number
  color: string
  bgColor: string
  textColor: string
}

function StatusCard({ status, count, percentage, color, bgColor, textColor }: StatusCardProps) {
  const statusLabels: Record<ActivityStatus, string> = {
    Active: "Activos",
    "At-risk": "En Riesgo",
    Dormant: "Inactivos",
  }

  return (
    <div className="shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] bg-card rounded-lg p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-muted-foreground text-sm font-medium">{statusLabels[status]}</h3>
        <span className={`text-xs font-medium ${textColor}`}>{percentage.toFixed(0)}%</span>
      </div>
      <div className="mb-3 text-2xl font-semibold">{formatNumber(count)}</div>
      <div className="bg-[#ebebeb] h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

interface ClientTableRowProps {
  client: SriClientHealth
  index: number
}

function ClientTableRow({ client, index }: ClientTableRowProps) {
  const recencyLevel = getStatusLevel(client.recency_days, { green: 30, yellow: 60 })

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + "T12:00:00")
      if (isNaN(date.getTime())) {
        return "Fecha inválida"
      }
      return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
    } catch {
      return "Fecha inválida"
    }
  }

  return (
    <motion.tr
      variants={staggerItem}
      tabIndex={0}
      className="border-border/40 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-neutral-400 transition-colors border-b last:border-0 outline-none"
    >
      <td className="py-3 px-4 text-sm font-medium">{client.client_id}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{client.recency_days}</span>
          <StatusBadge level={recencyLevel}>
            {client.recency_days <= 30 ? "Reciente" : client.recency_days <= 60 ? "Medio" : "Antiguo"}
          </StatusBadge>
        </div>
      </td>
      <td className="py-3 px-4 text-sm">{formatCurrency(client.monetary)}</td>
      <td className="py-3 px-4 text-sm">{formatNumber(client.invoice_count)}</td>
      <td className="py-3 px-4 text-muted-foreground text-sm">{formatDate(client.last_purchase_date)}</td>
      <td className="py-3 px-4">
        <StatusBadge
          level={
            client.rfm_segment === "Alto"
              ? "success"
              : client.rfm_segment === "Medio"
                ? "warning"
                : "critical"
          }
        >
          {client.rfm_segment}
        </StatusBadge>
      </td>
    </motion.tr>
  )
}

interface RfmSegmentCardProps {
  segment: "Alto" | "Medio" | "Bajo" | "Perdido"
  count: number
  percentage: number
}

function RfmSegmentCard({ segment, count, percentage }: RfmSegmentCardProps) {
  const colors: Record<typeof segment, { bg: string; text: string; label: string }> = {
    Alto: { bg: "bg-status-success/10", text: "text-status-success", label: "Alto Valor" },
    Medio: { bg: "bg-status-warning/10", text: "text-status-warning", label: "Valor Medio" },
    Bajo: { bg: "bg-status-critical/10", text: "text-status-critical", label: "Bajo Valor" },
    Perdido: { bg: "bg-[#ebebeb]", text: "text-[#4d4d4d]", label: "Perdido" },
  }

  const style = colors[segment]

  return (
    <div className={`shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] rounded-lg p-4 ${style.bg}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>
        <span className={`text-xs font-medium ${style.text}`}>{percentage.toFixed(0)}%</span>
      </div>
      <div className={`text-lg font-semibold ${style.text}`}>{formatNumber(count)}</div>
    </div>
  )
}

export function ClientesPage() {
  const sriMonth = useAppStore((s) => s.sriMonth)
  const { data: clientHealth = [], isLoading } = useSriClientHealth(sriMonth)

  const groupedClients = useMemo(() => {
    const active: SriClientHealth[] = []
    const atRisk: SriClientHealth[] = []
    const dormant: SriClientHealth[] = []
    const rfmSegments: Record<string, number> = { Alto: 0, Medio: 0, Bajo: 0, Perdido: 0 }

    clientHealth.forEach((client) => {
      if (client.activity_status === "Active") active.push(client)
      else if (client.activity_status === "At-risk") atRisk.push(client)
      else if (client.activity_status === "Dormant") dormant.push(client)

      rfmSegments[client.rfm_segment]++
    })

    const total = clientHealth.length

    const distribution = [
      {
        status: "Active" as const,
        count: active.length,
        percentage: total > 0 ? (active.length / total) * 100 : 0,
        color: "var(--status-success)",
        bgColor: "bg-status-success/10",
        textColor: "text-status-success",
      },
      {
        status: "At-risk" as const,
        count: atRisk.length,
        percentage: total > 0 ? (atRisk.length / total) * 100 : 0,
        color: "var(--status-warning)",
        bgColor: "bg-status-warning/10",
        textColor: "text-status-warning",
      },
      {
        status: "Dormant" as const,
        count: dormant.length,
        percentage: total > 0 ? (dormant.length / total) * 100 : 0,
        color: "var(--status-critical)",
        bgColor: "bg-status-critical/10",
        textColor: "text-status-critical",
      },
    ]

    const pieData = distribution.map((d) => ({
      name: d.status,
      value: d.percentage,
      color: d.color,
    }))

    const topAtRisk = [...atRisk]
      .sort((a, b) => b.monetary - a.monetary)
      .slice(0, 10)

    return {
      distribution,
      pieData,
      topAtRisk,
      rfmSegments,
      total,
    }
  }, [clientHealth])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#171717] border-t-transparent dark:border-neutral-50 dark:border-t-transparent" />
          <span className="text-muted-foreground text-sm">Cargando datos...</span>
        </div>
      </div>
    )
  }

  if (groupedClients.total === 0) {
    return (
      <PageFadeIn>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">No hay datos disponibles para este mes</p>
          </div>
        </div>
      </PageFadeIn>
    )
  }

  return (
    <PageFadeIn>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Salud de Clientes</h1>
          <p className="text-muted-foreground text-sm">
            Análisis de actividad, valor y segmentación RFM de clientes
          </p>
        </div>

        {/* Status Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-3"
        >
          {groupedClients.distribution.map((status) => (
            <motion.div key={status.status} variants={staggerItem}>
              <StatusCard
                status={status.status}
                count={status.count}
                percentage={status.percentage}
                color={status.color}
                bgColor={status.bgColor}
                textColor={status.textColor}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] bg-card rounded-lg p-6"
        >
          <h3 className="text-muted-foreground mb-4 text-sm font-medium">Distribución por Estado</h3>
          <ClientHealthPieChart data={groupedClients.pieData} />
        </motion.div>

        {/* At-risk Clients Table */}
        {groupedClients.topAtRisk.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] bg-card rounded-lg overflow-hidden"
          >
            <div className="border-b border-[#ebebeb] px-6 py-4">
              <h3 className="text-foreground text-base font-semibold">
                Clientes en Riesgo — Top 10 por Revenue
              </h3>
              <p className="text-muted-foreground text-xs">
                Clientes con alto valor monetario pero en riesgo de abandono
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Clientes en riesgo con sus métricas RFM">
                <thead>
                  <tr className="bg-muted/50">
                    <th scope="col" className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                      Cliente
                    </th>
                    <th scope="col" className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                      Recencia
                    </th>
                    <th scope="col" className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                      Revenue
                    </th>
                    <th scope="col" className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                      Facturas
                    </th>
                    <th scope="col" className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                      Última Compra
                    </th>
                    <th scope="col" className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">
                      Segmento RFM
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedClients.topAtRisk.map((client, index) => (
                    <ClientTableRow key={client.client_id} client={client} index={index} />
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* RFM Segment Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-foreground mb-4 text-base font-semibold">Distribución RFM</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(["Alto", "Medio", "Bajo", "Perdido"] as const).map((segment) => (
              <RfmSegmentCard
                key={segment}
                segment={segment}
                count={groupedClients.rfmSegments[segment]}
                percentage={
                  groupedClients.total > 0
                    ? (groupedClients.rfmSegments[segment] / groupedClients.total) * 100
                    : 0
                }
              />
            ))}
          </div>
        </motion.div>
      </div>
    </PageFadeIn>
  )
}
