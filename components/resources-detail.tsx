"use client"

import { useState } from "react"
import {
  Database,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Server,
  Cloud,
  Globe,
  Cpu,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Resource } from "@/lib/leaderboard-data"

function StatusBadge({ status }: { status: Resource["status"] }) {
  const styles = {
    "on-track": "rounded-full border-success/30 bg-success/10 text-success",
    "at-risk": "rounded-full border-warning/30 bg-warning/10 text-warning",
    exceeded: "rounded-full border-destructive/30 bg-destructive/10 text-destructive",
  }
  const icons = {
    "on-track": CheckCircle2,
    "at-risk": AlertTriangle,
    exceeded: XCircle,
  }
  const labels = {
    "on-track": "On Track",
    "at-risk": "At Risk",
    exceeded: "Exceeded",
  }

  const Icon = icons[status]

  return (
    <Badge variant="outline" className={`gap-1 ${styles[status]}`}>
      <Icon className="size-3" />
      {labels[status]}
    </Badge>
  )
}

function CategoryIcon({ category }: { category: string }) {
  const map: Record<string, { icon: typeof Server; color: string }> = {
    Infrastructure: { icon: Server, color: "text-info" },
    Services: { icon: Cloud, color: "text-primary" },
    DevOps: { icon: Cpu, color: "text-warning" },
    Network: { icon: Globe, color: "text-chart-4" },
  }
  const entry = map[category] ?? { icon: Database, color: "text-muted-foreground" }
  const Icon = entry.icon

  return <Icon className={`size-4 ${entry.color}`} />
}

function formatNumber(n: number): string {
  if (n >= 100000) return `${(n / 1000).toFixed(0)}K`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

interface ResourcesDetailProps {
  resources: Resource[]
}

export function ResourcesDetail({ resources }: ResourcesDetailProps) {
  const [activeTab, setActiveTab] = useState("all")

  const onTrack = resources.filter((r) => r.status === "on-track").length
  const atRisk = resources.filter((r) => r.status === "at-risk").length
  const exceeded = resources.filter((r) => r.status === "exceeded").length
  const overallUsage = Math.round(
    (resources.reduce((acc, r) => acc + r.used, 0) /
      resources.reduce((acc, r) => acc + r.allocated, 0)) *
      100
  )

  const filteredResources =
    activeTab === "all" ? resources : resources.filter((r) => r.status === activeTab)

  return (
    <section className="flex flex-col gap-6" aria-labelledby="resources-heading">
      <div className="flex items-center gap-2.5">
        <Database className="text-primary size-4" />
        <h2 id="resources-heading" className="text-foreground text-base font-semibold">
          Resources Detail & Progress
        </h2>
      </div>

      {/* Resource Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="px-5 pt-5 pb-1">
            <CardDescription className="text-xs tracking-wide uppercase">
              Overall Usage
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pt-0 pb-5">
            <CardTitle className="text-3xl font-bold">{overallUsage}%</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Progress value={overallUsage} className="mt-3 h-1.5 rounded-full" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span>{overallUsage}% of total allocated resources consumed</span>
              </TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="px-5 pt-5 pb-1">
            <CardDescription className="text-xs tracking-wide uppercase">On Track</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pt-0 pb-5">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-success text-3xl font-bold">{onTrack}</CardTitle>
              <span className="text-muted-foreground text-sm">resources</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="px-5 pt-5 pb-1">
            <CardDescription className="text-xs tracking-wide uppercase">At Risk</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pt-0 pb-5">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-warning text-3xl font-bold">{atRisk}</CardTitle>
              <span className="text-muted-foreground text-sm">resources</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="px-5 pt-5 pb-1">
            <CardDescription className="text-xs tracking-wide uppercase">Exceeded</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pt-0 pb-5">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-destructive text-3xl font-bold">{exceeded}</CardTitle>
              <span className="text-muted-foreground text-sm">resources</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filterable Resource Grid */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/80 rounded-full p-1">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-card gap-1.5 rounded-full px-4 py-1.5 text-sm data-[state=active]:shadow-sm"
          >
            All ({resources.length})
          </TabsTrigger>
          <TabsTrigger
            value="on-track"
            className="data-[state=active]:bg-card gap-1.5 rounded-full px-4 py-1.5 text-sm data-[state=active]:shadow-sm"
          >
            <CheckCircle2 className="size-3.5" />
            On Track ({onTrack})
          </TabsTrigger>
          <TabsTrigger
            value="at-risk"
            className="data-[state=active]:bg-card gap-1.5 rounded-full px-4 py-1.5 text-sm data-[state=active]:shadow-sm"
          >
            <AlertTriangle className="size-3.5" />
            At Risk ({atRisk})
          </TabsTrigger>
          <TabsTrigger
            value="exceeded"
            className="data-[state=active]:bg-card gap-1.5 rounded-full px-4 py-1.5 text-sm data-[state=active]:shadow-sm"
          >
            <XCircle className="size-3.5" />
            Exceeded ({exceeded})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => {
              const pct = Math.round((resource.used / resource.allocated) * 100)
              const clampedPct = Math.min(pct, 100)
              const progressColor =
                resource.status === "exceeded"
                  ? "[&>[data-slot=progress-indicator]]:bg-destructive"
                  : resource.status === "at-risk"
                    ? "[&>[data-slot=progress-indicator]]:bg-warning"
                    : ""

              return (
                <Card
                  key={resource.id}
                  className="rounded-2xl transition-all duration-200 hover:translate-y-[-1px]"
                >
                  <CardContent className="flex flex-col gap-3.5 p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted/60 flex size-9 items-center justify-center rounded-xl">
                          <CategoryIcon category={resource.category} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-foreground text-sm font-semibold">
                            {resource.name}
                          </span>
                          <span className="text-muted-foreground text-xs">{resource.category}</span>
                        </div>
                      </div>
                      <StatusBadge status={resource.status} />
                    </div>

                    {/* Usage Bar */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">Usage</span>
                        <span className="text-foreground font-mono text-xs font-bold">{pct}%</span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Progress
                              value={clampedPct}
                              className={`h-2 rounded-full ${progressColor}`}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>
                            {formatNumber(resource.used)} / {formatNumber(resource.allocated)}{" "}
                            {resource.unit}
                          </span>
                        </TooltipContent>
                      </Tooltip>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-mono text-xs">
                          {formatNumber(resource.used)} {resource.unit}
                        </span>
                        <span className="text-muted-foreground font-mono text-xs">
                          {formatNumber(resource.allocated)} {resource.unit}
                        </span>
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="border-border flex items-center justify-between border-t pt-3">
                      <span className="text-muted-foreground text-xs">Owner</span>
                      <div className="flex items-center gap-2">
                        <Avatar className="border-muted size-6 border-2">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px] font-semibold">
                            {resource.owner
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-foreground text-xs font-medium">
                          {resource.owner}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}
