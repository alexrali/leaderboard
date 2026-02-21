"use client"

import type { ReactNode } from "react"
import { Award, Clock, Database } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SectionTabsProps {
  metricsContent: ReactNode
  dayProgressContent: ReactNode
  resourcesContent: ReactNode
}

export function SectionTabs({
  metricsContent,
  dayProgressContent,
  resourcesContent,
}: SectionTabsProps) {
  return (
    <Tabs defaultValue="metrics" className="gap-8">
      <TabsList className="w-full justify-start rounded-full bg-secondary/80 p-1">
        <TabsTrigger
          value="metrics"
          className="gap-1.5 rounded-full px-5 py-2 text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
        >
          <Award className="size-3.5" />
          General Metrics
        </TabsTrigger>
        <TabsTrigger
          value="day-progress"
          className="gap-1.5 rounded-full px-5 py-2 text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
        >
          <Clock className="size-3.5" />
          Day Progress
        </TabsTrigger>
        <TabsTrigger
          value="resources"
          className="gap-1.5 rounded-full px-5 py-2 text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
        >
          <Database className="size-3.5" />
          Resources
        </TabsTrigger>
      </TabsList>

      <TabsContent value="metrics">{metricsContent}</TabsContent>
      <TabsContent value="day-progress">{dayProgressContent}</TabsContent>
      <TabsContent value="resources">{resourcesContent}</TabsContent>
    </Tabs>
  )
}
