"use client"

import { useState } from "react"
import { Database, AlertTriangle, CheckCircle2, XCircle, Server, Cloud, Globe, Cpu } from "lucide-react"
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
    (resources.reduce((acc, r) => acc + r.used, 0) / resources.reduce((acc, r) => acc + r.allocated, 0)) * 100
  )

  const filteredResources =
    activeTab === "all"
      ? resources
      : resources.filter((r) => r.status === activeTab)

  return (
    <section className="flex flex-col gap-6" aria-labelledby="resources-heading">
      <div className="flex items-center gap-2.5">
        <Database className="size-4 text-primary" />
        <h2 id="resources-heading" className="text-base font-semibold text-foreground">
          Resources Detail & Progress
        </h2>
      </div>

      {/* Resource Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardDescription className="text-xs uppercase tracking-wide">Overall Usage</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
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
          <CardHeader className="pb-1 pt-5 px-5">
            <CardDescription className="text-xs uppercase tracking-wide">On Track</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-3xl font-bold text-success">{onTrack}</CardTitle>
              <span className="text-sm text-muted-foreground">resources</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardDescription className="text-xs uppercase tracking-wide">At Risk</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-3xl font-bold text-warning">{atRisk}</CardTitle>
              <span className="text-sm text-muted-foreground">resources</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardDescription className="text-xs uppercase tracking-wide">Exceeded</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-3xl font-bold text-destructive">{exceeded}</CardTitle>
              <span className="text-sm text-muted-foreground">resources</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filterable Resource Grid */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-full bg-secondary/80 p-1">
          <TabsTrigger value="all" className="gap-1.5 rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
            All ({resources.length})
          </TabsTrigger>
          <TabsTrigger value="on-track" className="gap-1.5 rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <CheckCircle2 className="size-3.5" />
            On Track ({onTrack})
          </TabsTrigger>
          <TabsTrigger value="at-risk" className="gap-1.5 rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <AlertTriangle className="size-3.5" />
            At Risk ({atRisk})
          </TabsTrigger>
          <TabsTrigger value="exceeded" className="gap-1.5 rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
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
                        <div className="flex size-9 items-center justify-center rounded-xl bg-muted/60">
                          <CategoryIcon category={resource.category} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{resource.name}</span>
                          <span className="text-xs text-muted-foreground">{resource.category}</span>
                        </div>
                      </div>
                      <StatusBadge status={resource.status} />
                    </div>

                    {/* Usage Bar */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Usage</span>
                        <span className="font-mono text-xs font-bold text-foreground">{pct}%</span>
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
                            {formatNumber(resource.used)} / {formatNumber(resource.allocated)} {resource.unit}
                          </span>
                        </TooltipContent>
                      </Tooltip>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatNumber(resource.used)} {resource.unit}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatNumber(resource.allocated)} {resource.unit}
                        </span>
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <span className="text-xs text-muted-foreground">Owner</span>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6 border-2 border-muted">
                          <AvatarFallback className="bg-secondary text-[10px] font-semibold text-secondary-foreground">
                            {resource.owner
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground">{resource.owner}</span>
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
