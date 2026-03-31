"use client"

import { useState } from "react"
import { ZoneHeaderBar, ZoneInsight, Legend } from "../shared/zone-header"
import { CHART } from "../shared/di-tokens"
import { flowNodes, flowEdges, type FlowNode, type FlowEdge } from "../mock-data/supply"

function getNodeColor(status: FlowNode["status"]) {
  switch (status) {
    case "óptimo":
      return { fill: CHART.growth, stroke: CHART.growth }
    case "riesgo-desabasto":
      return { fill: CHART.opportunity, stroke: CHART.opportunity }
    case "sobrestock":
      return { fill: CHART.total, stroke: CHART.total }
  }
}

function getNodeRadius(level: number, type: FlowNode["type"]) {
  const base = type === "almacén" ? 7 : type === "hub" ? 5.5 : 4
  const scale = 0.6 + (level / 100) * 0.7
  return Math.max(3, Math.min(8, base * scale))
}

export function MapaFlujoAbastecimiento() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const nodeMap = new Map(flowNodes.map((n) => [n.id, n]))

  const getEdgePath = (edge: FlowEdge) => {
    const from = nodeMap.get(edge.from)!
    const to = nodeMap.get(edge.to)!
    const midX = (from.x + to.x) / 2
    const midY = (from.y + to.y) / 2
    const offsetX = (to.y - from.y) * 0.12
    const offsetY = (from.x - to.x) * 0.12
    return `M ${from.x} ${from.y} Q ${midX + offsetX} ${midY + offsetY} ${to.x} ${to.y}`
  }

  const isEdgeHighlighted = (edge: FlowEdge) => {
    if (!selectedNode) return false
    return edge.from === selectedNode || edge.to === selectedNode
  }

  const activeNode = hoveredNode ? nodeMap.get(hoveredNode) : null

  return (
    <div className="animate-in fade-in duration-500" style={{ animationDelay: "0ms" }}>
      <ZoneHeaderBar
        title="FLUJO DE ABASTECIMIENTO"
        right={
          <Legend
            items={[
              { color: CHART.growth, label: "Óptimo" },
              { color: CHART.opportunity, label: "Riesgo de Desabasto" },
              { color: CHART.total, label: "Sobrestock" },
            ]}
          />
        }
      />
      <ZoneInsight
        message="5 tiendas representan 63% del riesgo de desabasto"
        variant="warning"
      />
      <div className="px-6 py-5">
        <div className="relative">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-[360px]"
            style={{ background: "linear-gradient(180deg, hsl(var(--muted) / 0.3) 0%, hsl(var(--muted) / 0.5) 100%)" }}
          >
            <defs>
              <pattern id="supply-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(var(--border))" strokeWidth="0.2" />
              </pattern>
              <filter id="supply-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#supply-grid)" />

            {flowEdges.map((edge, i) => {
              const highlighted = isEdgeHighlighted(edge)
              const path = getEdgePath(edge)
              return (
                <g key={i}>
                  <path
                    d={path}
                    fill="none"
                    stroke={highlighted ? CHART.total : "hsl(var(--border))"}
                    strokeWidth={highlighted ? 0.8 : 0.4 + (edge.flowVolume / 3000)}
                    strokeOpacity={highlighted ? 0.9 : 0.5}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                  <circle r="1" fill={highlighted ? CHART.total : "hsl(var(--muted-foreground))"} opacity="0.8">
                    <animateMotion
                      dur={`${2.5 - edge.flowVolume / 2400}s`}
                      repeatCount="indefinite"
                      path={path}
                    />
                  </circle>
                </g>
              )
            })}

            {flowNodes.map((node) => {
              const colors = getNodeColor(node.status)
              const r = getNodeRadius(node.inventoryLevel, node.type)
              const isSelected = selectedNode === node.id
              const isHovered = hoveredNode === node.id
              const showGlow = node.status === "riesgo-desabasto"

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNode(isSelected ? null : node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="cursor-pointer"
                >
                  {(isSelected || isHovered) && (
                    <circle
                      r={r + 2.5}
                      fill="none"
                      stroke={colors.stroke}
                      strokeWidth="0.8"
                      strokeDasharray="2 1"
                      opacity="0.6"
                    />
                  )}
                  <circle
                    r={r}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth="0.6"
                    filter={showGlow ? "url(#supply-glow)" : undefined}
                    className="transition-all duration-200"
                  />
                  {node.type !== "tienda" && (
                    <rect
                      x={-r * 0.4}
                      y={-r * 0.3}
                      width={r * 0.8}
                      height={r * 0.6}
                      fill="white"
                      opacity="0.75"
                      rx="0.8"
                    />
                  )}
                  <text
                    y={r + 3.5}
                    textAnchor="middle"
                    fontSize="2.8"
                    className="fill-foreground font-medium"
                    style={{ fontWeight: 500 }}
                  >
                    {node.name}
                  </text>
                  <text
                    y={r + 6.5}
                    textAnchor="middle"
                    fontSize="2.2"
                    className="fill-muted-foreground"
                  >
                    {node.inventoryLevel}% stock
                  </text>
                </g>
              )
            })}
          </svg>

          {activeNode && (
            <div
              className="absolute bg-card border border-border rounded-xl shadow-lg p-3 z-20 pointer-events-none"
              style={{
                left: `${activeNode.x}%`,
                top: `${activeNode.y + 10}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="text-sm font-semibold text-foreground mb-1">
                {activeNode.name}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Stock: ${activeNode.stockValue.toLocaleString()}</span>
                <span>Demanda: {activeNode.demand}/día</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
