// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlowNode {
  id: string
  name: string
  type: "almacén" | "hub" | "tienda"
  x: number
  y: number
  inventoryLevel: number   // 0–100
  status: "óptimo" | "riesgo-desabasto" | "sobrestock"
  stockValue: number       // $K
  demand: number           // units/day
}

export interface FlowEdge {
  from: string
  to: string
  flowVolume: number   // units/week
}

export interface ImbalanceMatrixData {
  stores: string[]
  skus: string[]
  data: number[][]       // days of inventory remaining
  scores: number[]       // imbalance score per store (row)
  skuScores: number[]    // imbalance score per sku (col)
}

export interface AgingData {
  category: string
  fresh: number        // % 0–7d
  active: number       // % 7–30d
  slowMoving: number   // % 30–90d
  deadStock: number    // % 90+d
}

export interface ReplenishmentPoint {
  name: string
  demandVariability: number      // 0–100
  replenishmentFrequency: number // 0–100
  volume: number                 // units
  status: "óptimo" | "sobre-pedido" | "sub-pedido"
}

export interface SupplyAction {
  rank: number
  action: string
  source: string
  destination: string
  quantity: number
  sku: string
  impact: string
  impactValue: string
  urgency: "crítico" | "alto" | "preventivo"
  timeframe: string
}

export interface SupplyInsight {
  id: string
  text: string
  type: "oportunidad" | "alerta" | "acción"
}

// ─── Supply Insights ──────────────────────────────────────────────────────────

export const supplyInsights: SupplyInsight[] = [
  { id: "1", text: "Reasignación podría reducir desabasto en 42%", type: "oportunidad" },
  { id: "2", text: "Top 2 SKUs generan 55% de volatilidad de demanda", type: "alerta" },
  { id: "3", text: "Ciclos de reposición desalineados en tiendas Tier-2", type: "acción" },
]

// ─── Flow Nodes ───────────────────────────────────────────────────────────────

export const flowNodes: FlowNode[] = [
  { id: "n1", name: "Almacén Central",  type: "almacén", x: 50,  y: 50,  inventoryLevel: 82, status: "óptimo",           stockValue: 2400, demand: 580 },
  { id: "n2", name: "Hub Regional Este",type: "hub",     x: 75,  y: 30,  inventoryLevel: 65, status: "óptimo",           stockValue: 980,  demand: 240 },
  { id: "n3", name: "Hub Regional Sur", type: "hub",     x: 65,  y: 70,  inventoryLevel: 42, status: "riesgo-desabasto", stockValue: 620,  demand: 210 },
  { id: "n4", name: "Suc. Alpha",       type: "tienda",  x: 88,  y: 18,  inventoryLevel: 78, status: "óptimo",           stockValue: 380,  demand: 95 },
  { id: "n5", name: "Suc. Beta",        type: "tienda",  x: 90,  y: 42,  inventoryLevel: 15, status: "riesgo-desabasto", stockValue: 120,  demand: 110 },
  { id: "n6", name: "Suc. Gamma",       type: "tienda",  x: 78,  y: 55,  inventoryLevel: 95, status: "sobrestock",       stockValue: 680,  demand: 72 },
  { id: "n7", name: "Suc. Delta",       type: "tienda",  x: 55,  y: 82,  inventoryLevel: 20, status: "riesgo-desabasto", stockValue: 140,  demand: 88 },
  { id: "n8", name: "Suc. Epsilon",     type: "tienda",  x: 82,  y: 78,  inventoryLevel: 88, status: "sobrestock",       stockValue: 520,  demand: 65 },
]

export const flowEdges: FlowEdge[] = [
  { from: "n1", to: "n2", flowVolume: 2400 },
  { from: "n1", to: "n3", flowVolume: 1800 },
  { from: "n2", to: "n4", flowVolume: 950 },
  { from: "n2", to: "n5", flowVolume: 1100 },
  { from: "n3", to: "n6", flowVolume: 720 },
  { from: "n3", to: "n7", flowVolume: 880 },
  { from: "n3", to: "n8", flowVolume: 650 },
]

// ─── Imbalance Matrix (Heatmap) ───────────────────────────────────────────────

export const imbalanceMatrix: ImbalanceMatrixData = {
  stores: ["Suc. Alpha", "Suc. Beta", "Suc. Gamma", "Suc. Delta", "Suc. Epsilon"],
  skus:   ["Aceite 1L", "Det. 3L", "Shampoo", "Agua 1.5L", "Cereal"],
  data: [
    [18, 22,  4, 30, 14],  // Alpha — mostly good
    [ 3,  2, 60, 55,  8],  // Beta  — Aceite/Det critical
    [45, 52, 48, 42, 38],  // Gamma — over-stocked
    [ 5,  3,  2, 18,  7],  // Delta — near-stockout
    [40, 38, 42, 35, 44],  // Epsilon — over-stocked
  ],
  scores:    [72, 92, 58, 88, 55],
  skuScores: [80, 82, 65, 58, 70],
}

// ─── Aging Data (Stacked BarChart) ────────────────────────────────────────────

export const agingData: AgingData[] = [
  { category: "Aceites",      fresh: 55, active: 28, slowMoving: 12, deadStock: 5  },
  { category: "Limpieza",     fresh: 48, active: 32, slowMoving: 15, deadStock: 5  },
  { category: "C. Personal",  fresh: 42, active: 30, slowMoving: 18, deadStock: 10 },
  { category: "Alimentos",    fresh: 30, active: 25, slowMoving: 28, deadStock: 17 },
  { category: "Bebidas",      fresh: 38, active: 28, slowMoving: 22, deadStock: 12 },
]

// ─── Replenishment Points (Scatter) ──────────────────────────────────────────

export const replenishmentData: ReplenishmentPoint[] = [
  { name: "Suc. Alpha",   demandVariability: 22, replenishmentFrequency: 58, volume: 950,  status: "óptimo" },
  { name: "Suc. Beta",    demandVariability: 75, replenishmentFrequency: 82, volume: 1100, status: "sobre-pedido" },
  { name: "Suc. Gamma",   demandVariability: 18, replenishmentFrequency: 62, volume: 720,  status: "óptimo" },
  { name: "Suc. Delta",   demandVariability: 85, replenishmentFrequency: 35, volume: 880,  status: "sub-pedido" },
  { name: "Suc. Epsilon", demandVariability: 35, replenishmentFrequency: 55, volume: 650,  status: "óptimo" },
  { name: "Hub Este",     demandVariability: 48, replenishmentFrequency: 78, volume: 2400, status: "sobre-pedido" },
  { name: "Hub Sur",      demandVariability: 62, replenishmentFrequency: 28, volume: 1800, status: "sub-pedido" },
]

// ─── Supply Actions ───────────────────────────────────────────────────────────

export const supplyActions: SupplyAction[] = [
  {
    rank: 1,
    action: "Reasignar inventario urgente",
    source: "Suc. Gamma",
    destination: "Suc. Beta",
    quantity: 480,
    sku: "Aceite Vegetal 1L",
    impact: "Ahorra",
    impactValue: "$38K",
    urgency: "crítico",
    timeframe: "Hoy",
  },
  {
    rank: 2,
    action: "Reposición de emergencia",
    source: "Almacén Central",
    destination: "Suc. Delta",
    quantity: 320,
    sku: "Detergente Líquido 3L",
    impact: "Reduce",
    impactValue: "92% desabasto",
    urgency: "crítico",
    timeframe: "24h",
  },
  {
    rank: 3,
    action: "Ajustar ciclo de reposición",
    source: "Hub Regional Sur",
    destination: "Suc. Delta",
    quantity: 200,
    sku: "Shampoo 400ml",
    impact: "Ahorra",
    impactValue: "$14K/mes",
    urgency: "alto",
    timeframe: "Esta semana",
  },
  {
    rank: 4,
    action: "Redistribuir excedente",
    source: "Suc. Epsilon",
    destination: "Suc. Beta",
    quantity: 150,
    sku: "Agua Natural 1.5L",
    impact: "Ahorra",
    impactValue: "$8K",
    urgency: "alto",
    timeframe: "3 días",
  },
  {
    rank: 5,
    action: "Optimizar pedido automático",
    source: "Hub Regional Este",
    destination: "Suc. Alpha",
    quantity: 280,
    sku: "Cereal Integral 800g",
    impact: "Reduce",
    impactValue: "35% sobrestock",
    urgency: "preventivo",
    timeframe: "Próximo ciclo",
  },
]
