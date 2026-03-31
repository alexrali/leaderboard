// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryLandscape {
  name: string
  penetration: number   // %
  revenue: number       // % contribution
  sales: number         // $K total
  growth: "alto" | "estable" | "decline"
}

export interface ClusterCategoryData {
  penetration: number
  benchmark: number
  trend: "up" | "down" | "stable"
}

export type ClusterCategoryMatrix = Record<string, Record<string, ClusterCategoryData>>

export interface SkuAssortment {
  name: string
  contribution: number    // %
  stores: number
  status: "core" | "crecimiento" | "revisión" | "faltante"
  category: string
  cumulative: number      // cumulative %
}

export interface MomentumPoint {
  month: string
  Aceites: number
  Limpieza: number
  "C. Personal": number
  Alimentos: number
  Bebidas: number
  mercado: number
}

export interface InflectionPoint {
  month: string
  label: string
  category: string
}

export interface CategoryStat {
  category: string
  index: number       // current index value
  vsMarket: number    // delta vs market
}

export interface GrowthAction {
  id: string
  title: string
  category: string
  type: "expansión" | "optimización" | "crecimiento"
  impact: string
  confidence: number  // % IA score
  timeHorizon: string
  priority: "alta" | "media" | "baja"
  details: {
    targetStores?: string
    currentPenetration?: string
    targetPenetration?: string
    description: string
  }
}

export interface CategoryInsight {
  id: string
  text: string
  type: "info" | "oportunidad" | "alerta" | "éxito"
}

// ─── Category Insights ────────────────────────────────────────────────────────

export const categoryInsights: CategoryInsight[] = [
  { id: "1", text: "Aceites tiene 28% de espacio de expansión en tiendas Tier-2", type: "oportunidad" },
  { id: "2", text: "Bebidas en decline —3.4% vs mercado en Cluster Rural", type: "alerta" },
  { id: "3", text: "Limpieza supera benchmark en 4 de 5 clusters", type: "éxito" },
  { id: "4", text: "Lanzamiento Q4: 3 nuevos SKUs Cuidado Personal pendientes", type: "info" },
]

// ─── Category Landscape (Scatter) ────────────────────────────────────────────

export const categoryLandscapeData: CategoryLandscape[] = [
  { name: "Aceites",      penetration: 62, revenue: 28, sales: 1840, growth: "alto" },
  { name: "Limpieza",     penetration: 75, revenue: 32, sales: 2100, growth: "estable" },
  { name: "C. Personal",  penetration: 44, revenue: 18, sales: 1180, growth: "alto" },
  { name: "Alimentos",    penetration: 55, revenue: 14, sales: 920,  growth: "decline" },
  { name: "Bebidas",      penetration: 38, revenue: 8,  sales: 520,  growth: "decline" },
]

// ─── Cluster-Category Matrix ──────────────────────────────────────────────────

export const clusterCategories = ["Aceites", "Limpieza", "C. Personal", "Alimentos", "Bebidas"]

export const clusterData = [
  "Cluster Metropolitano",
  "Cluster Suburbano",
  "Cluster Rural",
  "Cluster Premium",
  "Cluster Económico",
]

export const clusterMatrixData: ClusterCategoryMatrix = {
  "Cluster Metropolitano": {
    Aceites:      { penetration: 72, benchmark: 65, trend: "up" },
    Limpieza:     { penetration: 81, benchmark: 70, trend: "up" },
    "C. Personal":{ penetration: 55, benchmark: 60, trend: "down" },
    Alimentos:    { penetration: 48, benchmark: 55, trend: "down" },
    Bebidas:      { penetration: 42, benchmark: 45, trend: "stable" },
  },
  "Cluster Suburbano": {
    Aceites:      { penetration: 58, benchmark: 60, trend: "down" },
    Limpieza:     { penetration: 70, benchmark: 65, trend: "up" },
    "C. Personal":{ penetration: 40, benchmark: 55, trend: "down" },
    Alimentos:    { penetration: 62, benchmark: 55, trend: "up" },
    Bebidas:      { penetration: 35, benchmark: 40, trend: "stable" },
  },
  "Cluster Rural": {
    Aceites:      { penetration: 45, benchmark: 50, trend: "down" },
    Limpieza:     { penetration: 55, benchmark: 60, trend: "down" },
    "C. Personal":{ penetration: 28, benchmark: 45, trend: "down" },
    Alimentos:    { penetration: 70, benchmark: 65, trend: "up" },
    Bebidas:      { penetration: 25, benchmark: 35, trend: "down" },
  },
  "Cluster Premium": {
    Aceites:      { penetration: 88, benchmark: 80, trend: "up" },
    Limpieza:     { penetration: 92, benchmark: 85, trend: "up" },
    "C. Personal":{ penetration: 78, benchmark: 75, trend: "up" },
    Alimentos:    { penetration: 42, benchmark: 50, trend: "stable" },
    Bebidas:      { penetration: 65, benchmark: 60, trend: "up" },
  },
  "Cluster Económico": {
    Aceites:      { penetration: 52, benchmark: 55, trend: "stable" },
    Limpieza:     { penetration: 60, benchmark: 60, trend: "stable" },
    "C. Personal":{ penetration: 32, benchmark: 40, trend: "down" },
    Alimentos:    { penetration: 75, benchmark: 70, trend: "up" },
    Bebidas:      { penetration: 30, benchmark: 35, trend: "down" },
  },
}

// ─── SKU Assortment (Pareto) ──────────────────────────────────────────────────

export const skuAssortmentData: SkuAssortment[] = [
  { name: "Aceite Vegetal 1L",     contribution: 22, stores: 94, status: "core",       category: "Aceites",     cumulative: 22 },
  { name: "Detergente Líq. 3L",    contribution: 18, stores: 91, status: "core",       category: "Limpieza",    cumulative: 40 },
  { name: "Agua Natural 1.5L",     contribution: 14, stores: 88, status: "core",       category: "Bebidas",     cumulative: 54 },
  { name: "Shampoo 400ml",         contribution: 11, stores: 82, status: "core",       category: "C. Personal", cumulative: 65 },
  { name: "Refresco Lata 6pk",     contribution: 9,  stores: 78, status: "crecimiento",category: "Bebidas",     cumulative: 74 },
  { name: "Aceite Oliva 750ml",    contribution: 7,  stores: 65, status: "crecimiento",category: "Aceites",     cumulative: 81 },
  { name: "Jabón Barra 3pk",       contribution: 5,  stores: 58, status: "crecimiento",category: "Limpieza",    cumulative: 86 },
  { name: "Pasta Dental 2pk",      contribution: 4,  stores: 50, status: "revisión",   category: "C. Personal", cumulative: 90 },
  { name: "Galletas Surtidas 500g",contribution: 3,  stores: 42, status: "revisión",   category: "Alimentos",   cumulative: 93 },
  { name: "Cereal Integral 800g",  contribution: 2,  stores: 30, status: "faltante",   category: "Alimentos",   cumulative: 95 },
  { name: "Jugo Natural 1L",       contribution: 2,  stores: 25, status: "faltante",   category: "Bebidas",     cumulative: 97 },
  { name: "Jabón Tocador 3pk",     contribution: 1,  stores: 18, status: "faltante",   category: "C. Personal", cumulative: 98 },
]

// ─── Momentum Trend (Line Chart Indexed) ─────────────────────────────────────

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export const momentumTrendData: MomentumPoint[] = [
  { month: "Ene", Aceites: 100, Limpieza: 100, "C. Personal": 100, Alimentos: 100, Bebidas: 100, mercado: 100 },
  { month: "Feb", Aceites: 104, Limpieza: 102, "C. Personal": 106, Alimentos: 98,  Bebidas: 99,  mercado: 101 },
  { month: "Mar", Aceites: 108, Limpieza: 105, "C. Personal": 110, Alimentos: 97,  Bebidas: 98,  mercado: 103 },
  { month: "Abr", Aceites: 115, Limpieza: 108, "C. Personal": 118, Alimentos: 95,  Bebidas: 96,  mercado: 105 },
  { month: "May", Aceites: 119, Limpieza: 112, "C. Personal": 122, Alimentos: 94,  Bebidas: 94,  mercado: 106 },
  { month: "Jun", Aceites: 122, Limpieza: 116, "C. Personal": 128, Alimentos: 92,  Bebidas: 92,  mercado: 108 },
  { month: "Jul", Aceites: 118, Limpieza: 120, "C. Personal": 124, Alimentos: 91,  Bebidas: 88,  mercado: 107 },
  { month: "Ago", Aceites: 124, Limpieza: 124, "C. Personal": 129, Alimentos: 90,  Bebidas: 87,  mercado: 109 },
  { month: "Sep", Aceites: 128, Limpieza: 127, "C. Personal": 134, Alimentos: 89,  Bebidas: 85,  mercado: 110 },
  { month: "Oct", Aceites: 131, Limpieza: 130, "C. Personal": 138, Alimentos: 88,  Bebidas: 84,  mercado: 111 },
  { month: "Nov", Aceites: 135, Limpieza: 132, "C. Personal": 142, Alimentos: 87,  Bebidas: 82,  mercado: 112 },
  { month: "Dic", Aceites: 138, Limpieza: 135, "C. Personal": 145, Alimentos: 86,  Bebidas: 80,  mercado: 113 },
]

export const inflectionPoints: InflectionPoint[] = [
  { month: "Abr", label: "Abr: Lanzamiento nuevo producto", category: "C. Personal" },
  { month: "Jul", label: "Jul: Baja estacional", category: "Bebidas" },
  { month: "Oct", label: "Oct: Entrada competencia", category: "Alimentos" },
]

export const categoryStats: CategoryStat[] = [
  { category: "Aceites",      index: 138, vsMarket: 25 },
  { category: "Limpieza",     index: 135, vsMarket: 22 },
  { category: "C. Personal",  index: 145, vsMarket: 32 },
  { category: "Alimentos",    index: 86,  vsMarket: -27 },
  { category: "Bebidas",      index: 80,  vsMarket: -33 },
]

// ─── Growth Actions ───────────────────────────────────────────────────────────

export const growthActions: GrowthAction[] = [
  {
    id: "ga1",
    title: "Expansión Aceites en Cluster Rural",
    category: "Aceites",
    type: "expansión",
    impact: "+$58K/mes",
    confidence: 88,
    timeHorizon: "4 semanas",
    priority: "alta",
    details: {
      targetStores: "18 tiendas Cluster Rural",
      currentPenetration: "45%",
      targetPenetration: "65%",
      description: "Aumentar presencia en puntos de venta rurales con SKUs de alta rotación.",
    },
  },
  {
    id: "ga2",
    title: "Optimizar Mezcla C. Personal en Cluster Metropolitano",
    category: "C. Personal",
    type: "optimización",
    impact: "+$34K/mes",
    confidence: 82,
    timeHorizon: "6 semanas",
    priority: "alta",
    details: {
      targetStores: "12 tiendas Metropolitanas",
      currentPenetration: "55%",
      targetPenetration: "75%",
      description: "Priorizar SKUs premium: shampoo y pasta dental doble presentación.",
    },
  },
  {
    id: "ga3",
    title: "Activar Bebidas en Cluster Premium",
    category: "Bebidas",
    type: "crecimiento",
    impact: "+$22K/mes",
    confidence: 75,
    timeHorizon: "3 semanas",
    priority: "media",
    details: {
      targetStores: "8 tiendas Premium",
      currentPenetration: "65%",
      targetPenetration: "80%",
      description: "Introducir línea premium de jugos naturales y agua mineralizada.",
    },
  },
  {
    id: "ga4",
    title: "Recuperar Alimentos en Cluster Suburbano",
    category: "Alimentos",
    type: "optimización",
    impact: "+$16K/mes",
    confidence: 68,
    timeHorizon: "8 semanas",
    priority: "media",
    details: {
      targetStores: "22 tiendas Suburbanas",
      currentPenetration: "62%",
      targetPenetration: "72%",
      description: "Reintroducir presentaciones familiares con precio competitivo.",
    },
  },
  {
    id: "ga5",
    title: "Ampliar Limpieza en Cluster Económico",
    category: "Limpieza",
    type: "expansión",
    impact: "+$12K/mes",
    confidence: 71,
    timeHorizon: "5 semanas",
    priority: "baja",
    details: {
      targetStores: "15 tiendas Económicas",
      currentPenetration: "60%",
      targetPenetration: "70%",
      description: "Presentaciones de bajo costo con alto volumen para maximizar cobertura.",
    },
  },
]
