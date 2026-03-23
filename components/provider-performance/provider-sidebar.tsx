"use client"

import { useState, useEffect } from "react"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils"
import { ChevronRight, ExternalLink } from "lucide-react"
import { CategoryDetailPanel } from "@/components/provider-performance/category-detail-panel"
import type { ProviderCategory, ProviderSummary } from "@/lib/provider-types"

interface ProviderSidebarProps {
  categories?: ProviderCategory[]
  summary?: ProviderSummary | null
}

type CategorySlideData = {
  name: string
  share: number
  revenue: string
  category_code: string
}

function CategorySlide({
  category,
  isActive,
  onClick
}: {
  category: CategorySlideData
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
      </div>

      <div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <span>Ver detalles</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </div>
  )
}

export function ProviderSidebar({ categories = [], summary }: ProviderSidebarProps) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string | null>(null)
  const targetValue = useAnimatedCounter(summary?.target_amount ?? 0, 2500, 200)

  const categorySlides: CategorySlideData[] = categories.map(c => ({
    name: c.category_name,
    share: c.share,
    revenue: `$${Math.round(c.revenue / 1000).toLocaleString()}K`,
    category_code: c.category_code,
  }))

  const milestones = [
    { label: "Mejor día", value: summary ? `$${Math.round(summary.best_day_revenue / 1000)}K` : '—' },
    { label: "Meta mensual", value: summary ? `$${Math.round((summary.target_amount ?? 0) / 12 / 1000)}K` : '—' },
    { label: "Piezas vendidas", value: summary ? summary.total_units.toLocaleString() : '—' },
    { label: "Top categoría", value: categories[0]?.category_name ?? '—', highlight: true },
    { label: "Agentes activos", value: summary ? summary.active_reps.toString() : '—' },
    {
      label: "Seguimiento desde", value: summary?.tracking_since
        ? new Date(summary.tracking_since + 'T12:00:00').toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })
        : '—'
    },
  ]

  useEffect(() => {
    if (categorySlides.length === 0) return
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % categorySlides.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [categorySlides.length])

  const handleCategoryClick = (code: string) => {
    setSelectedCategoryCode(code)
  }

  const handleSelectFromPicker = (index: number) => {
    setActiveSlide(index)
    setSelectedCategoryCode(categorySlides[index]?.category_code ?? null)
  }

  return (
    <>
      <div className="h-full animate-in fade-in slide-in-from-right-4 duration-700 delay-300">

        {/* ANNUAL TARGET Section */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-3">
            Objetivo Anual
          </p>
          <p className="text-[42px] font-mono font-bold tracking-tighter leading-none">
            ${(targetValue / 1000000).toFixed(1)}M
          </p>
          <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            todos los canales y categorías
          </p>
        </div>

        <div className="border-t border-stone-200/80" />

        {/* Category Slideshow Section */}
        <div className="px-5 py-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-3">
            Category Focus
          </p>

          <div className="h-28 relative overflow-hidden">
            {categorySlides.map((category, index) => (
              <CategorySlide
                key={category.category_code}
                category={category}
                isActive={index === activeSlide}
                onClick={() => handleCategoryClick(category.category_code)}
              />
            ))}
          </div>

          {/* Slide Indicators */}
          <div className="flex gap-1.5 mt-3">
            {categorySlides.map((_, index) => (
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

        <div className="border-t border-stone-200/80" />

        {/* SESSION MILESTONES Section */}
        <div className="px-5 py-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-3">
            Milestones
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
            {categorySlides.map((cat, index) => (
              <button
                key={cat.category_code}
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
        categoryCode={selectedCategoryCode}
        open={selectedCategoryCode !== null}
        onOpenChange={(open) => { if (!open) setSelectedCategoryCode(null) }}
      />
    </>
  )
}
