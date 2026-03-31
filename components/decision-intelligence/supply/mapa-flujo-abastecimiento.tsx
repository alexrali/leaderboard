"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { GitBranch } from "lucide-react"
import { CardHeaderContent, InsightBanner, Legend } from "../shared/card-header"
import { flowNodes, flowEdges, type FlowNode, type FlowEdge } from "../mock-data/supply"

function getNodeColor(status: FlowNode["status"]) {
  switch (status) {
    case "óptimo":
      return { fill: "#22C55E", stroke: "#16A34A" }
    case "riesgo-desabasto":
      return { fill: "#F59E0B", stroke: "#D97706" }
    case "sobrestock":
      return { fill: "#3B82F6", stroke: "#2563EB" }
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
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardHeaderContent
          icon={GitBranch}
          iconColor="#3B82F6"
          title="Flujo de Abastecimiento y Salud de Inventario"
          description="Tamaño del nodo = nivel de inventario, color = estado de stock"
          actions={
            <Legend
              items={[
                { color: "#22C55E", label: "Óptimo" },
                { color: "#F59E0B", label: "Riesgo de Desabasto" },
                { color: "#3B82F6", label: "Sobrestock" },
              ]}
            />
          }
        />
        <div className="mt-4">
          <InsightBanner
            message="5 tiendas representan 63% del riesgo de desabasto"
            variant="warning"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-[360px]"
            style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)" }}
          >
            <defs>
              <pattern id="supply-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E2E8F0" strokeWidth="0.2" />
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

            {/* Edges */}
            {flowEdges.map((edge, i) => {
              const highlighted = isEdgeHighlighted(edge)
              const path = getEdgePath(edge)
              return (
                <g key={i}>
                  <path
                    d={path}
                    fill="none"
                    stroke={highlighted ? "#3B82F6" : "#CBD5E1"}
                    strokeWidth={highlighted ? 0.8 : 0.4 + (edge.flowVolume / 3000)}
                    strokeOpacity={highlighted ? 0.9 : 0.5}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                  <circle r="1" fill={highlighted ? "#3B82F6" : "#94A3B8"} opacity="0.8">
                    <animateMotion
                      dur={`${2.5 - edge.flowVolume / 2400}s`}
                      repeatCount="indefinite"
                      path={path}
                    />
                  </circle>
                </g>
              )
            })}

            {/* Nodes */}
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

          {/* Hover tooltip */}
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
      </CardContent>
    </Card>
  )
}
