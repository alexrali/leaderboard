// ─── Types ────────────────────────────────────────────────────────────────────

export interface StorePerformance {
  id: string
  name: string
  revenue: number       // $K
  margin: number        // %
  volume: number        // units
  status: "alto-rendimiento" | "en-riesgo" | "objetivo-crecimiento" | "inactivo"
  growth?: number
  tag?: string
}

export interface GapMatrixRow {
  store: string
  storeId: string
  categories: Record<string, number>  // category name → gap score 0–100
  avgGap: number
}

export interface ProductLifecycle {
  id: string
  name: string
  sku: string
  frequency: number    // 0–100 %
  revenue: number      // 0–100 %
  category: string
  quadrant: "core" | "crecimiento" | "nicho" | "bajo-rendimiento"
}

export interface WaterfallItem {
  name: string
  value: number
  isTotal?: boolean
}

export interface PriorityAction {
  rank: number
  title: string
  context: string
  impact: string
  impactValue: string
  gapScore: number
  priority: "crítico" | "alto" | "óptimo"
  type: "inventario" | "precio" | "surtido" | "distribución"
}

export interface MicroInsight {
  id: string
  text: string
  type: "info" | "oportunidad" | "alerta" | "éxito"
}

// ─── Network Insights ─────────────────────────────────────────────────────────

export const networkInsights: MicroInsight[] = [
  { id: "1", text: "42% de ingresos concentrados en 3 sucursales", type: "alerta" },
  { id: "2", text: "Lácteos bajo rendimiento en zona Tier-2", type: "oportunidad" },
  { id: "3", text: "2 SKUs impulsan 68% del crecimiento", type: "éxito" },
  { id: "4", text: "Segmento premium +18% vs trimestre anterior", type: "info" },
]

// ─── Store Performance (Scatter) ──────────────────────────────────────────────

export const storePerformanceData: StorePerformance[] = [
  { id: "s1", name: "Suc. Centro",       revenue: 420, margin: 28, volume: 3800, status: "alto-rendimiento",     growth: 12,  tag: "Top" },
  { id: "s2", name: "Suc. Galerías",     revenue: 380, margin: 31, volume: 3200, status: "alto-rendimiento",     growth: 8 },
  { id: "s3", name: "Suc. Revolución",   revenue: 290, margin: 22, volume: 2600, status: "objetivo-crecimiento", growth: 5 },
  { id: "s4", name: "Suc. Américas",     revenue: 240, margin: 18, volume: 2200, status: "objetivo-crecimiento", growth: 3 },
  { id: "s5", name: "Suc. Insurgentes",  revenue: 180, margin: 14, volume: 1800, status: "en-riesgo",            growth: -4, tag: "Riesgo" },
  { id: "s6", name: "Suc. Satélite",     revenue: 150, margin: 12, volume: 1500, status: "en-riesgo",            growth: -7 },
  { id: "s7", name: "Ab. López",         revenue: 95,  margin: 9,  volume: 900,  status: "inactivo",             growth: -12 },
  { id: "s8", name: "Dist. Reyes",       revenue: 80,  margin: 7,  volume: 750,  status: "inactivo",             growth: -15 },
  { id: "s9", name: "Suc. Pedregal",     revenue: 310, margin: 26, volume: 2800, status: "alto-rendimiento",     growth: 9 },
  { id: "s10", name: "Suc. Polanco",     revenue: 200, margin: 20, volume: 1950, status: "objetivo-crecimiento", growth: 6 },
]

// ─── Gap Matrix ───────────────────────────────────────────────────────────────

export const gapCategories = ["Aceites", "Limpieza", "C. Personal", "Alimentos", "Bebidas"]

export const gapMatrixData: GapMatrixRow[] = [
  { store: "Suc. Centro",      storeId: "s1",  categories: { Aceites: 12, Limpieza: 45, "C. Personal": 28, Alimentos: 67, Bebidas: 34 }, avgGap: 37 },
  { store: "Suc. Galerías",    storeId: "s2",  categories: { Aceites: 23, Limpieza: 31, "C. Personal": 56, Alimentos: 44, Bebidas: 19 }, avgGap: 35 },
  { store: "Suc. Revolución",  storeId: "s3",  categories: { Aceites: 78, Limpieza: 62, "C. Personal": 41, Alimentos: 55, Bebidas: 72 }, avgGap: 62 },
  { store: "Suc. Américas",    storeId: "s4",  categories: { Aceites: 55, Limpieza: 48, "C. Personal": 70, Alimentos: 38, Bebidas: 61 }, avgGap: 54 },
  { store: "Suc. Insurgentes", storeId: "s5",  categories: { Aceites: 88, Limpieza: 75, "C. Personal": 92, Alimentos: 81, Bebidas: 68 }, avgGap: 81 },
  { store: "Suc. Satélite",    storeId: "s6",  categories: { Aceites: 72, Limpieza: 84, "C. Personal": 65, Alimentos: 90, Bebidas: 77 }, avgGap: 78 },
]

export const categoryGaps: Record<string, number> = {
  Aceites: 55,
  Limpieza: 58,
  "C. Personal": 59,
  Alimentos: 63,
  Bebidas: 55,
}

// ─── Product Lifecycle ────────────────────────────────────────────────────────

export const productLifecycleData: ProductLifecycle[] = [
  { id: "p1",  name: "Aceite Vegetal 1L",      sku: "AV-1L",   frequency: 85, revenue: 78, category: "Aceites",     quadrant: "core" },
  { id: "p2",  name: "Aceite Oliva 750ml",      sku: "AO-750",  frequency: 42, revenue: 55, category: "Aceites",     quadrant: "crecimiento" },
  { id: "p3",  name: "Detergente Líquido 3L",   sku: "DL-3L",   frequency: 90, revenue: 82, category: "Limpieza",    quadrant: "core" },
  { id: "p4",  name: "Jabón Barra 3pk",         sku: "JB-3P",   frequency: 65, revenue: 48, category: "Limpieza",    quadrant: "crecimiento" },
  { id: "p5",  name: "Jabón de Tocador 3pk",    sku: "JT-3P",   frequency: 38, revenue: 22, category: "C. Personal", quadrant: "nicho" },
  { id: "p6",  name: "Shampoo 400ml",           sku: "SH-400",  frequency: 72, revenue: 60, category: "C. Personal", quadrant: "core" },
  { id: "p7",  name: "Pasta Dental 2pk",        sku: "PD-2P",   frequency: 55, revenue: 38, category: "C. Personal", quadrant: "crecimiento" },
  { id: "p8",  name: "Cereal Integral 800g",    sku: "CI-800",  frequency: 18, revenue: 12, category: "Alimentos",   quadrant: "bajo-rendimiento" },
  { id: "p9",  name: "Galletas Surtidas 500g",  sku: "GS-500",  frequency: 48, revenue: 32, category: "Alimentos",   quadrant: "nicho" },
  { id: "p10", name: "Agua Natural 1.5L",       sku: "AN-1.5",  frequency: 92, revenue: 70, category: "Bebidas",     quadrant: "core" },
  { id: "p11", name: "Refresco Lata 6pk",       sku: "RL-6P",   frequency: 78, revenue: 65, category: "Bebidas",     quadrant: "core" },
  { id: "p12", name: "Jugo Natural 1L",         sku: "JN-1L",   frequency: 25, revenue: 18, category: "Bebidas",     quadrant: "bajo-rendimiento" },
]

// ─── Waterfall Chart ──────────────────────────────────────────────────────────

export const waterfallRawData: WaterfallItem[] = [
  { name: "Ingreso Base",       value: 1200, isTotal: true },
  { name: "Impacto Volumen",    value: 280 },
  { name: "Precio/Mezcla",      value: 95 },
  { name: "Expansión",          value: 340 },
  { name: "Pérdidas",           value: -185 },
  { name: "Resultado Neto",     value: 1730, isTotal: true },
]

// ─── Priority Actions ─────────────────────────────────────────────────────────

export const priorityActions: PriorityAction[] = [
  {
    rank: 1,
    title: "Reponer inventario en Suc. Insurgentes",
    context: "Aceites y Limpieza con 0 días de stock",
    impact: "Ingreso Potencial",
    impactValue: "+$48K/mes",
    gapScore: 92,
    priority: "crítico",
    type: "inventario",
  },
  {
    rank: 2,
    title: "Ajustar precios en Suc. Satélite",
    context: "Margen 5pts por debajo del benchmark de zona",
    impact: "Mejora de Margen",
    impactValue: "+3.2 pts",
    gapScore: 81,
    priority: "crítico",
    type: "precio",
  },
  {
    rank: 3,
    title: "Ampliar surtido C. Personal en Suc. Américas",
    context: "Penetración 28% vs 55% benchmark cluster",
    impact: "Expansión de Mercado",
    impactValue: "+$32K/mes",
    gapScore: 74,
    priority: "alto",
    type: "surtido",
  },
  {
    rank: 4,
    title: "Incorporar Dist. Reyes a ruta premium",
    context: "Ticket promedio $420 alineado a segmento",
    impact: "Ingreso Potencial",
    impactValue: "+$22K/mes",
    gapScore: 65,
    priority: "alto",
    type: "distribución",
  },
  {
    rank: 5,
    title: "Activar promoción Bebidas en Suc. Revolución",
    context: "Índice de penetración 34% vs 60% objetivo",
    impact: "Ingreso Potencial",
    impactValue: "+$18K/mes",
    gapScore: 58,
    priority: "óptimo",
    type: "surtido",
  },
]
