"use client"

import { PageFadeIn } from "../animations"
import { StatusBadge } from "../status-badge"
import { HorizontalBarChart } from "../charts/horizontal-bar-chart"
import { formatPercent } from "@/lib/format"
import { useSriAgentRanking } from "@/hooks/use-sri-queries"
import { useAppStore } from "@/lib/store"
import { motion } from "framer-motion"

interface MetricCardProps {
  title: string
  value: string
  description: string
}

function MetricCard({ title, value, description }: MetricCardProps) {
  return (
    <div className="shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] rounded-lg p-6 bg-white">
      <h3 className="text-sm font-medium text-[#4d4d4d] mb-1">{title}</h3>
      <p className="text-3xl font-semibold text-[#171717] mb-1">{value}</p>
      <p className="text-sm text-[#666666]">{description}</p>
    </div>
  )
}

function calculatePeerCpiAverage(data: Array<{ avg_cpi: number | null }>): number {
  const validValues = data.filter((d) => d.avg_cpi !== null).map((d) => d.avg_cpi as number)
  if (validValues.length === 0) return 0
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length
}

function getCpiStatusLevel(cpi: number): "success" | "warning" | "critical" {
  if (cpi >= 75) return "success"
  if (cpi >= 50) return "warning"
  return "critical"
}

function getConcentrationStatusLevel(concentration: number): "success" | "warning" | "critical" {
  if (concentration <= 50) return "success"
  if (concentration <= 60) return "warning"
  return "critical"
}

function getCrossSellStatusLevel(crossSell: number): "success" | "warning" | "critical" {
  if (crossSell >= 80) return "success"
  if (crossSell >= 60) return "warning"
  return "critical"
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function PortafolioPage() {
  const sriMonth = useAppStore((s) => s.sriMonth)
  const { data: rankingData, isLoading } = useSriAgentRanking(sriMonth)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#171717] border-t-transparent" />
      </div>
    )
  }

  if (!rankingData || rankingData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#666666]">No hay datos disponibles para el análisis de portafolio.</p>
      </div>
    )
  }

  // Calculate metrics
  const peerCpiAverage = calculatePeerCpiAverage(rankingData)
  const validCrossSell = rankingData.filter((d) => d.cross_sell_rate !== null).map((d) => d.cross_sell_rate as number)
  const avgCrossSell = validCrossSell.length > 0
    ? validCrossSell.reduce((sum, val) => sum + val, 0) / validCrossSell.length
    : 0
  const validConcentration = rankingData.filter((d) => d.portfolio_concentration_top3 !== null).map((d) => d.portfolio_concentration_top3 as number)
  const avgConcentration = validConcentration.length > 0
    ? validConcentration.reduce((sum, val) => sum + val, 0) / validConcentration.length
    : 0

  // Sort and filter for tables
  const top10ByCpi = [...rankingData]
    .filter((d) => d.avg_cpi !== null)
    .sort((a, b) => (b.avg_cpi ?? 0) - (a.avg_cpi ?? 0))
    .slice(0, 10)

  const top8ByConcentration = [...rankingData]
    .filter((d) => d.portfolio_concentration_top3 !== null)
    .sort((a, b) => (b.portfolio_concentration_top3 ?? 0) - (a.portfolio_concentration_top3 ?? 0))
    .slice(0, 8)

  const top10ByCrossSell = [...rankingData]
    .filter((d) => d.cross_sell_rate !== null)
    .sort((a, b) => (b.cross_sell_rate ?? 0) - (a.cross_sell_rate ?? 0))
    .slice(0, 10)

  return (
    <PageFadeIn>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-[#171717] mb-2">Análisis de Portafolio</h1>
          <p className="text-[#4d4d4d]">
            Análisis detallado del rendimiento de portafolio por agente, incluyendo CPI, cross-sell y concentración de productos.
          </p>
        </div>

        {/* Metric Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants}>
            <MetricCard
              title="CPI Promedio"
              value={formatPercent(peerCpiAverage / 100)}
              description="Promedio de Cumplimiento de Portafolio Individual"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Cross-Sell Promedio"
              value={formatPercent(avgCrossSell / 100)}
              description="Promedio de ventas cruzadas entre categorías"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Concentración Promedio"
              value={formatPercent(avgConcentration / 100)}
              description="Promedio de concentración de productos (menor es mejor)"
            />
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8">
          {/* CPI Table */}
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <motion.h2 className="text-xl font-semibold text-[#171717] mb-4" variants={itemVariants}>
              Top 10 - CPI Score
            </motion.h2>
            <motion.div className="shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] rounded-lg overflow-hidden" variants={itemVariants}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#fafafa] border-b border-[#ebebeb]">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#171717]">Rank</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#171717]">Agente</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#171717]">CPI Score</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#171717]">vs Peer</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#171717]">Categorías</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top10ByCpi.map((agent, index) => {
                      const cpi = agent.avg_cpi ?? 0
                      const peerDiff = cpi - peerCpiAverage
                      const statusLevel = getCpiStatusLevel(cpi)
                      const statusColor = statusLevel === "success" ? "bg-emerald-500" : statusLevel === "warning" ? "bg-amber-500" : "bg-red-500"

                      return (
                        <tr key={agent.agent_id} className="border-b border-[#ebebeb] last:border-b-0">
                          <td className="py-3 px-4 text-sm font-medium text-[#171717]">#{index + 1}</td>
                          <td className="py-3 px-4 text-sm text-[#171717]">{agent.agent_name}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-[#171717] w-12">{formatPercent(cpi / 100)}</span>
                              <div className="flex-1 h-2 bg-[#ebebeb] rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${statusColor} rounded-full transition-all duration-300`}
                                  style={{ width: `${Math.min(cpi, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-sm font-medium ${
                                peerDiff >= 0 ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {peerDiff >= 0 ? "+" : ""}
                              {formatPercent(peerDiff / 100)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-[#666666]">{agent.category_breadth ?? 0}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>

          {/* Concentration Comparison Chart */}
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <motion.h2 className="text-xl font-semibold text-[#171717] mb-4" variants={itemVariants}>
              Concentración de Portafolio - Top 8
            </motion.h2>
            <motion.div className="shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] rounded-lg p-6 bg-white" variants={itemVariants}>
              <HorizontalBarChart
                data={top8ByConcentration.map((agent) => ({
                  name: agent.agent_name,
                  value: agent.portfolio_concentration_top3 ?? 0,
                  color: (() => {
                    const level = getConcentrationStatusLevel(agent.portfolio_concentration_top3 ?? 0)
                    return level === "success" ? "oklch(0.65 0.15 150)" : level === "warning" ? "oklch(0.75 0.12 85)" : "oklch(0.55 0.18 25)"
                  })(),
                }))}
                unit="%"
              />
            </motion.div>
          </motion.div>

          {/* Cross-Sell Leaderboard */}
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <motion.h2 className="text-xl font-semibold text-[#171717] mb-4" variants={itemVariants}>
              Top 10 - Cross-Sell
            </motion.h2>
            <motion.div className="shadow-[rgba(0,0,0,0.08)_0px_0px_0px_1px] rounded-lg overflow-hidden" variants={itemVariants}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#fafafa] border-b border-[#ebebeb]">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#171717]">Agente</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#171717]">Cross-Sell</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#171717]">Categorías</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#171717]">Riesgo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top10ByCrossSell.map((agent) => {
                      const crossSell = agent.cross_sell_rate ?? 0
                      const statusLevel = getCrossSellStatusLevel(crossSell)
                      const statusColor = statusLevel === "success" ? "bg-emerald-500" : statusLevel === "warning" ? "bg-amber-500" : "bg-red-500"

                      return (
                        <tr key={agent.agent_id} className="border-b border-[#ebebeb] last:border-b-0">
                          <td className="py-3 px-4 text-sm text-[#171717]">{agent.agent_name}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-[#171717] w-12">{formatPercent(crossSell / 100)}</span>
                              <div className="flex-1 h-2 bg-[#ebebeb] rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${statusColor} rounded-full transition-all duration-300`}
                                  style={{ width: `${Math.min(crossSell, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-[#666666]">
                            {agent.category_breadth ?? 0}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge level={statusLevel}>
                              {statusLevel === "success" ? "Excelente" : statusLevel === "warning" ? "Aceptable" : "Mejorar"}
                            </StatusBadge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageFadeIn>
  )
}
