"use client"

import { useState, useEffect } from "react"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils"
import { ChevronRight, ExternalLink } from "lucide-react"
import { CategoryDetailPanel, type CategoryData } from "@/components/provider-performance/category-detail-panel"

const categories: CategoryData[] = [
  {
    name: "Electronics",
    share: 0.38,
    revenue: "$321,608",
    revenueNum: 321608,
    growth: "+15.2%",
    growthNum: 15.2,
    orders: 1082,
    avgTicket: "$297",
    topProducts: [
      { name: "MacBook Pro 14\"", revenue: "$89,400", units: 45 },
      { name: "iPhone 15 Pro Max", revenue: "$67,200", units: 56 },
      { name: "Sony WH-1000XM5", revenue: "$34,900", units: 100 },
      { name: "iPad Air", revenue: "$28,750", units: 46 },
    ],
    monthlyData: [
      { month: "Oct", revenue: 42000, orders: 142 },
      { month: "Nov", revenue: 48000, orders: 156 },
      { month: "Dec", revenue: 61000, orders: 198 },
      { month: "Jan", revenue: 52000, orders: 172 },
      { month: "Feb", revenue: 58000, orders: 195 },
      { month: "Mar", revenue: 60608, orders: 219 },
    ],
    channelSplit: [
      { channel: "Online Store", percentage: 58, revenue: "$186,532" },
      { channel: "Retail Stores", percentage: 28, revenue: "$90,050" },
      { channel: "B2B Sales", percentage: 14, revenue: "$45,026" },
    ],
    topReps: [
      { name: "J. Martinez", sales: "$42,800", deals: 18 },
      { name: "S. Kim", sales: "$38,200", deals: 15 },
      { name: "A. Thompson", sales: "$31,500", deals: 12 },
    ],
  },
  {
    name: "Apparel",
    share: 0.24,
    revenue: "$203,374",
    revenueNum: 203374,
    growth: "+8.7%",
    growthNum: 8.7,
    orders: 856,
    avgTicket: "$238",
    topProducts: [
      { name: "Nike Air Max 90", revenue: "$42,300", units: 282 },
      { name: "Lululemon Align Leggings", revenue: "$31,800", units: 318 },
      { name: "North Face Jacket", revenue: "$28,400", units: 71 },
      { name: "Adidas Ultraboost", revenue: "$24,200", units: 121 },
    ],
    monthlyData: [
      { month: "Oct", revenue: 28000, orders: 118 },
      { month: "Nov", revenue: 32000, orders: 134 },
      { month: "Dec", revenue: 45000, orders: 189 },
      { month: "Jan", revenue: 31000, orders: 130 },
      { month: "Feb", revenue: 33000, orders: 138 },
      { month: "Mar", revenue: 34374, orders: 147 },
    ],
    channelSplit: [
      { channel: "Retail Stores", percentage: 52, revenue: "$105,754" },
      { channel: "Online Store", percentage: 38, revenue: "$77,282" },
      { channel: "B2B Sales", percentage: 10, revenue: "$20,338" },
    ],
    topReps: [
      { name: "M. Chen", sales: "$28,400", deals: 24 },
      { name: "R. Patel", sales: "$22,100", deals: 19 },
    ],
  },
  {
    name: "Home & Garden",
    share: 0.19,
    revenue: "$161,004",
    revenueNum: 161004,
    growth: "+12.1%",
    growthNum: 12.1,
    orders: 542,
    avgTicket: "$297",
    topProducts: [
      { name: "Dyson V15 Detect", revenue: "$38,200", units: 51 },
      { name: "KitchenAid Mixer", revenue: "$29,400", units: 70 },
      { name: "Roomba j7+", revenue: "$24,800", units: 31 },
      { name: "Weber Grill", revenue: "$18,600", units: 24 },
    ],
    monthlyData: [
      { month: "Oct", revenue: 22000, orders: 74 },
      { month: "Nov", revenue: 25000, orders: 84 },
      { month: "Dec", revenue: 31000, orders: 104 },
      { month: "Jan", revenue: 26000, orders: 87 },
      { month: "Feb", revenue: 28000, orders: 94 },
      { month: "Mar", revenue: 29004, orders: 99 },
    ],
    channelSplit: [
      { channel: "Online Store", percentage: 45, revenue: "$72,452" },
      { channel: "Retail Stores", percentage: 42, revenue: "$67,622" },
      { channel: "B2B Sales", percentage: 13, revenue: "$20,930" },
    ],
    topReps: [
      { name: "L. Rodriguez", sales: "$31,200", deals: 14 },
      { name: "T. Wilson", sales: "$24,800", deals: 11 },
    ],
  },
  {
    name: "Sports",
    share: 0.11,
    revenue: "$93,213",
    revenueNum: 93213,
    growth: "+22.4%",
    growthNum: 22.4,
    orders: 387,
    avgTicket: "$241",
    topProducts: [
      { name: "Peloton Bike+", revenue: "$28,400", units: 12 },
      { name: "Bowflex Dumbbells", revenue: "$14,200", units: 47 },
      { name: "Garmin Fenix 7", revenue: "$12,800", units: 16 },
      { name: "YETI Cooler", revenue: "$9,600", units: 32 },
    ],
    monthlyData: [
      { month: "Oct", revenue: 11000, orders: 46 },
      { month: "Nov", revenue: 13000, orders: 54 },
      { month: "Dec", revenue: 18000, orders: 75 },
      { month: "Jan", revenue: 16000, orders: 66 },
      { month: "Feb", revenue: 17000, orders: 71 },
      { month: "Mar", revenue: 18213, orders: 75 },
    ],
    channelSplit: [
      { channel: "Online Store", percentage: 62, revenue: "$57,792" },
      { channel: "Retail Stores", percentage: 28, revenue: "$26,100" },
      { channel: "B2B Sales", percentage: 10, revenue: "$9,321" },
    ],
    topReps: [
      { name: "D. Brown", sales: "$18,200", deals: 8 },
    ],
  },
  {
    name: "Beauty",
    share: 0.08,
    revenue: "$68,193",
    revenueNum: 68193,
    growth: "+6.3%",
    growthNum: 6.3,
    orders: 423,
    avgTicket: "$161",
    topProducts: [
      { name: "Dyson Airwrap", revenue: "$18,600", units: 31 },
      { name: "La Mer Moisturizer", revenue: "$12,400", units: 62 },
      { name: "Charlotte Tilbury Set", revenue: "$8,900", units: 89 },
      { name: "Tom Ford Perfume", revenue: "$7,200", units: 24 },
    ],
    monthlyData: [
      { month: "Oct", revenue: 9500, orders: 59 },
      { month: "Nov", revenue: 10500, orders: 65 },
      { month: "Dec", revenue: 14000, orders: 87 },
      { month: "Jan", revenue: 10800, orders: 67 },
      { month: "Feb", revenue: 11200, orders: 70 },
      { month: "Mar", revenue: 12193, orders: 75 },
    ],
    channelSplit: [
      { channel: "Retail Stores", percentage: 55, revenue: "$37,506" },
      { channel: "Online Store", percentage: 40, revenue: "$27,277" },
      { channel: "B2B Sales", percentage: 5, revenue: "$3,410" },
    ],
    topReps: [
      { name: "E. Garcia", sales: "$12,400", deals: 15 },
    ],
  },
]

const milestones = [
  { label: "Best single day", value: "$47,200" },
  { label: "Monthly target", value: "$208,333" },
  { label: "Products sold", value: "8,541" },
  { label: "Top category", value: "Electronics", highlight: true },
  { label: "Active reps", value: "12" },
  { label: "Tracking since", value: "Jan 2026" },
]

const revenueMatrix = [
  [
    { label: "<$50k", value: "0.41" },
    { label: "$50-65k", value: "0.54" },
    { label: "$65-87k", value: "0.30" },
    { label: ">$87k", value: "0.11" },
  ],
  [
    { label: "$70-73k", value: "0.57" },
    { label: "$73-78k", value: "0.40" },
    { label: ">$78k", value: "0.14" },
    { label: "implied", value: "0.19" },
  ],
]

function CategorySlide({
  category,
  isActive,
  onClick
}: {
  category: CategoryData
  isActive: boolean
  onClick: () => void
}) {
  return (
    <div className={cn(
      "absolute inset-0 flex flex-col justify-between transition-all duration-500 cursor-pointer group",
      isActive ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"
    )}
    onClick={onClick}
    >
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-mono font-bold">{category.name}</h3>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="text-sm text-muted-foreground mt-1">{category.revenue} revenue</p>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Share</p>
          <p className="text-3xl font-mono font-bold">{(category.share * 100).toFixed(0)}%</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Growth</p>
          <p className={cn(
            "text-lg font-mono font-semibold",
            category.growthNum >= 0 ? "text-emerald-600" : "text-red-600"
          )}>{category.growth}</p>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <span>View details</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </div>
  )
}

export function ProviderSidebar() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const targetValue = useAnimatedCounter(2500000, 2500, 200)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % categories.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleCategoryClick = (category: CategoryData) => {
    setSelectedCategory(category)
    setPanelOpen(true)
  }

  const handleSelectFromPicker = (index: number) => {
    setActiveSlide(index)
    setSelectedCategory(categories[index])
    setPanelOpen(true)
  }

  return (
    <>
      {/* Sidebar content - no extra wrapper needed, bg comes from parent */}
      <div className="h-full animate-in fade-in slide-in-from-right-4 duration-700 delay-300">

        {/* ANNUAL TARGET Section */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-3">
            Annual Target
          </p>
          <p className="text-[42px] font-mono font-bold tracking-tighter leading-none">
            ${(targetValue / 1000000).toFixed(1)}M
          </p>
          <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            across all sales channels and categories
          </p>
        </div>

        {/* Thin border separator */}
        <div className="border-t border-stone-200/80" />

        {/* Category Slideshow Section */}
        <div className="px-5 py-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-3">
            Category Focus
          </p>

          <div className="h-28 relative overflow-hidden">
            {categories.map((category, index) => (
              <CategorySlide
                key={category.name}
                category={category}
                isActive={index === activeSlide}
                onClick={() => handleCategoryClick(category)}
              />
            ))}
          </div>

          {/* Slide Indicators */}
          <div className="flex gap-1.5 mt-3">
            {categories.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  index === activeSlide ? "w-4 bg-foreground" : "w-1 bg-foreground/20 hover:bg-foreground/40"
                )}
              />
            ))}
          </div>
        </div>

        {/* Thin border separator */}
        <div className="border-t border-stone-200/80" />

        {/* SESSION MILESTONES Section */}
        <div className="px-5 py-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-3">
            Performance Milestones
          </p>

          <div className="space-y-2">
            {milestones.map((milestone, index) => (
              <div
                key={milestone.label}
                className="flex justify-between items-center animate-in fade-in slide-in-from-right-2 duration-300"
                style={{ animationDelay: `${index * 80 + 500}ms` }}
              >
                <span className="text-[11px] text-muted-foreground">{milestone.label}</span>
                <span className={cn(
                  "font-mono text-[11px] font-semibold tabular-nums",
                  milestone.highlight && "text-amber-600"
                )}>
                  {milestone.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Thin border separator */}
        <div className="border-t border-stone-200/80" />

        {/* REVENUE PROBABILITY SURFACE Section */}
        <div className="px-5 py-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-4">
            Revenue Distribution Surface
          </p>

          {/* Matrix Grid */}
          <div className="space-y-3">
            {revenueMatrix.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-4 gap-x-3">
                {row.map((cell, cellIndex) => (
                  <div
                    key={cell.label}
                    className="text-center animate-in fade-in zoom-in-95 duration-300"
                    style={{ animationDelay: `${(rowIndex * 4 + cellIndex) * 60 + 800}ms` }}
                  >
                    <p className="text-[8px] text-muted-foreground/70 mb-0.5">{cell.label}</p>
                    <p className="font-mono text-sm font-bold tabular-nums">{cell.value}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Thin border separator */}
        <div className="border-t border-stone-200/80" />

        {/* Quick Category Picker */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Quick Select
            </p>
            <p className="text-[8px] text-muted-foreground">tap for details</p>
          </div>
          <div className="grid grid-cols-5 gap-px bg-stone-200/60">
            {categories.map((cat, index) => (
              <button
                key={cat.name}
                onClick={() => handleSelectFromPicker(index)}
                className={cn(
                  "py-2 px-1 text-center transition-all duration-200",
                  index === activeSlide
                    ? "bg-foreground text-background"
                    : "bg-background hover:bg-stone-50"
                )}
              >
                <p className="text-[7px] text-inherit opacity-60 truncate">{cat.name.slice(0, 4)}</p>
                <p className="font-mono text-[10px] font-bold tabular-nums">{(cat.share * 100).toFixed(0)}%</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Detail Panel */}
      <CategoryDetailPanel
        category={selectedCategory}
        open={panelOpen}
        onOpenChange={setPanelOpen}
      />
    </>
  )
}
