"use client"

import { Fragment, useCallback, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useSriAgentRanking } from "@/hooks/use-sri-queries"
import { generateAgentSignals, groupSignalsByAgent, type AgentSignalDisplay } from "@/lib/sri-signals"
import { formatCurrency } from "@/lib/format"
import { useAppStore } from "@/lib/store"
import { PageFadeIn, staggerContainer, staggerItem } from "../animations"
import { StatusBadge } from "../status-badge"
import { SignalActionModal, type SignalActionType } from "../signal-action-modal"

interface SignalCountCardProps {
  level: "ALTO" | "MEDIO" | "POSITIVO"
  count: number
  description: string
}

function SignalCountCard({ level, count, description }: SignalCountCardProps) {
  const colorMap = {
    ALTO: "red",
    MEDIO: "amber",
    POSITIVO: "emerald",
  }

  const color = colorMap[level]

  return (
    <div className={`rounded-lg bg-${color}-10 p-4`}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`text-sm font-medium text-${color}`}>{level}</span>
        <span className={`text-2xl font-semibold text-${color}`}>{count}</span>
      </div>
      <p className="text-xs text-[#4d4d4d]">{description}</p>
    </div>
  )
}

interface SignalBadgeProps {
  count: number
  level: "ALTO" | "MEDIO" | "POSITIVO"
}

function SignalBadge({ count, level }: SignalBadgeProps) {
  const colorMap = {
    ALTO: "bg-red-500",
    MEDIO: "bg-amber-500",
    POSITIVO: "bg-emerald-500",
  }

  const color = colorMap[level]
  const displayColor = count > 0 ? color : "bg-neutral-200"

  return (
    <div className={`flex h-6 w-6 items-center justify-center rounded-full ${displayColor}`}>
      <span className="text-xs font-semibold text-white">{count}</span>
    </div>
  )
}

interface SignalTableProps {
  signals: AgentSignalDisplay[]
  signalLevel: "ALTO" | "MEDIO" | "POSITIVO"
  actionType: SignalActionType
  onAction: (signal: AgentSignalDisplay) => void
}

function SignalTable({ signals, signalLevel, actionType, onAction }: SignalTableProps) {
  const statusLevelMap: Record<"ALTO" | "MEDIO" | "POSITIVO", "critical" | "warning" | "success"> = {
    ALTO: "critical",
    MEDIO: "warning",
    POSITIVO: "success",
  }
  const statusLevel = statusLevelMap[signalLevel]

  const actionLabels: Record<SignalActionType, string> = {
    plan: "Plan",
    share: "Compartir",
    monitor: "Monitorear",
  }

  const sectionTitles: Record<typeof signalLevel, string> = {
    ALTO: "Acción Inmediata",
    MEDIO: "Monitoreo",
    POSITIVO: "Replicar",
  }

  const handleActionClick = useCallback(
    (signal: AgentSignalDisplay) => {
      onAction(signal)
    },
    [onAction]
  )

  return (
    <div className="mb-8">
      <h3 className="mb-4 text-lg font-semibold text-[#171717]">
        {signalLevel} — {sectionTitles[signalLevel]}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label={`Señales de nivel ${signalLevel}`}>
          <thead>
            <tr className="border-b border-[#ebebeb] text-left">
              <th scope="col" className="pb-2 font-medium text-[#171717]">Agente</th>
              <th scope="col" className="pb-2 font-medium text-[#171717]">Peer Group</th>
              <th scope="col" className="pb-2 font-medium text-[#171717]">Tipo</th>
              <th scope="col" className="pb-2 font-medium text-[#171717]">Detalle</th>
              <th scope="col" className="pb-2 font-medium text-[#171717]">Revenue</th>
              <th scope="col" className="pb-2 font-medium text-[#171717]">Acción</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((signal, idx) => (
              <tr key={`${signal.agentId}-${signal.type}-${idx}`} className="border-b border-[#ebebeb]">
                <td className="py-3 text-[#171717]">{signal.agentName}</td>
                <td className="py-3 text-[#4d4d4d]">{signal.peerGroup}</td>
                <td className="py-3">
                  <StatusBadge level={statusLevel}>{signal.type}</StatusBadge>
                </td>
                <td className="py-3 text-[#4d4d4d]">{signal.message}</td>
                <td className="py-3 text-[#4d4d4d]">{formatCurrency(signal.revenue)}</td>
                <td className="py-3">
                  <button
                    type="button"
                    onClick={() => handleActionClick(signal)}
                    className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-[#171717] hover:bg-[#fafafa]"
                  >
                    {actionLabels[actionType]}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AlertasPage() {
  const sriMonth = useAppStore((s) => s.sriMonth)
  const { data: agents, isLoading } = useSriAgentRanking(sriMonth)
  const [selectedSignal, setSelectedSignal] = useState<AgentSignalDisplay | null>(null)
  const [modalType, setModalType] = useState<SignalActionType>("plan")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const signals = useMemo(() => {
    if (!agents) return []
    return generateAgentSignals(agents)
  }, [agents])

  const signalsByLevel = useMemo(() => {
    return {
      ALTO: signals.filter((s) => s.level === "ALTO"),
      MEDIO: signals.filter((s) => s.level === "MEDIO"),
      POSITIVO: signals.filter((s) => s.level === "POSITIVO"),
    }
  }, [signals])

  const groupedByAgent = useMemo(() => {
    return groupSignalsByAgent(signals)
  }, [signals])

  const handleAction = useCallback((signal: AgentSignalDisplay, actionType: SignalActionType) => {
    setSelectedSignal(signal)
    setModalType(actionType)
    setIsModalOpen(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
    setSelectedSignal(null)
  }, [])

  const handleModalSave = useCallback((data: { title: string; description: string }) => {
    // TODO: Implement save logic (create plan, share practice, or configure monitoring)
    setIsModalOpen(false)
    setSelectedSignal(null)
  }, [modalType, selectedSignal])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#171717] border-t-transparent" />
      </div>
    )
  }

  return (
    <PageFadeIn>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#171717]">Señales de Atención</h1>
          <p className="mt-1 text-sm text-[#4d4d4d]">
            Detecta oportunidades y riesgos basados en métricas clave
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <SignalCountCard
            level="ALTO"
            count={signalsByLevel.ALTO.length}
            description="Requiere acción inmediata"
          />
          <SignalCountCard
            level="MEDIO"
            count={signalsByLevel.MEDIO.length}
            description="Monitoreo continuo"
          />
          <SignalCountCard
            level="POSITIVO"
            count={signalsByLevel.POSITIVO.length}
            description="Prácticas a replicar"
          />
        </div>

        {/* Signal Tables */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          {signalsByLevel.ALTO.length > 0 && (
            <motion.div variants={staggerItem}>
              <SignalTable
                signals={signalsByLevel.ALTO}
                signalLevel="ALTO"
                actionType="plan"
                onAction={(signal) => handleAction(signal, "plan")}
              />
            </motion.div>
          )}

          {signalsByLevel.MEDIO.length > 0 && (
            <motion.div variants={staggerItem}>
              <SignalTable
                signals={signalsByLevel.MEDIO}
                signalLevel="MEDIO"
                actionType="monitor"
                onAction={(signal) => handleAction(signal, "monitor")}
              />
            </motion.div>
          )}

          {signalsByLevel.POSITIVO.length > 0 && (
            <motion.div variants={staggerItem}>
              <SignalTable
                signals={signalsByLevel.POSITIVO}
                signalLevel="POSITIVO"
                actionType="share"
                onAction={(signal) => handleAction(signal, "share")}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Summary by Agent */}
        {groupedByAgent.size > 0 && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-[#171717]">Resumen por Agente</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Resumen de señales por agente">
                <thead>
                  <tr className="border-b border-[#ebebeb] text-left">
                    <th scope="col" className="pb-2 font-medium text-[#171717]">Agente</th>
                    <th scope="col" className="pb-2 font-medium text-[#171717]">Peer Group</th>
                    <th scope="col" className="pb-2 font-medium text-[#171717]">ALTO</th>
                    <th scope="col" className="pb-2 font-medium text-[#171717]">MEDIO</th>
                    <th scope="col" className="pb-2 font-medium text-[#171717]">POSITIVO</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(groupedByAgent.entries()).map(([agentId, counts]) => {
                    const agent = agents?.find((a) => a.agent_id === agentId)
                    if (!agent) return null
                    return (
                      <tr key={agentId} className="border-b border-[#ebebeb]">
                        <td className="py-3 text-[#171717]">{agent.agent_name}</td>
                        <td className="py-3 text-[#4d4d4d]">{agent.peer_group}</td>
                        <td className="py-3">
                          <SignalBadge count={counts.alto} level="ALTO" />
                        </td>
                        <td className="py-3">
                          <SignalBadge count={counts.medio} level="MEDIO" />
                        </td>
                        <td className="py-3">
                          <SignalBadge count={counts.positivo} level="POSITIVO" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No signals message */}
        {signals.length === 0 && (
          <div className="rounded-lg bg-[#fafafa] p-8 text-center">
            <p className="text-[#4d4d4d]">No se detectaron señales de atención</p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedSignal && (
        <SignalActionModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          type={modalType}
          agentName={selectedSignal.agentName}
          agentId={selectedSignal.agentId}
          signalLevel={selectedSignal.level}
          signalMessage={selectedSignal.message}
        />
      )}
    </PageFadeIn>
  )
}
