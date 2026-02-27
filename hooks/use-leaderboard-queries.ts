"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getTodayLeaderboard,
  getWeeklyLeaderboard,
  getTodayHourlyProgress,
  getTodayTeamSummary,
  getLatestDailyDate,
  getWeeklyTeamSummary,
  getWeekDailyTrend,
  getPanelKPIs,
  getTeamDailyHistory,
  getTeamDayDetail,
  getMembersRangeSummary,
  getMembersWeeklyTrend,
} from "@/lib/leaderboard-queries"
import type { MembersRange } from "@/lib/supabase"

export function useLeaderboard(viewMode: "daily" | "weekly") {
  return useQuery({
    queryKey: ["leaderboard", viewMode],
    queryFn: () =>
      viewMode === "daily" ? getTodayLeaderboard() : getWeeklyLeaderboard(),
  })
}

export function useHourlyProgress() {
  return useQuery({
    queryKey: ["hourlyProgress"],
    queryFn: getTodayHourlyProgress,
  })
}

export function useTeamSummary(viewMode: "daily" | "weekly") {
  return useQuery({
    queryKey: ["teamSummary", viewMode],
    queryFn: () =>
      viewMode === "daily" ? getTodayTeamSummary() : Promise.resolve(null),
    enabled: viewMode === "daily",
  })
}

export function useLatestDailyDate() {
  return useQuery({
    queryKey: ["latestDailyDate"],
    queryFn: getLatestDailyDate,
  })
}

export function useWeeklyTeamSummary() {
  return useQuery({
    queryKey: ["weeklyTeamSummary"],
    queryFn: getWeeklyTeamSummary,
  })
}

export function useWeekDailyTrend() {
  return useQuery({
    queryKey: ["weekDailyTrend"],
    queryFn: getWeekDailyTrend,
  })
}

export function usePanelKPIs() {
  return useQuery({
    queryKey: ["panelKPIs"],
    queryFn: getPanelKPIs,
  })
}

export function useTeamDailyHistory(days = 60) {
  return useQuery({
    queryKey: ["teamDailyHistory", days],
    queryFn: () => getTeamDailyHistory(days),
  })
}

export function useTeamDayDetail(date: string | null) {
  return useQuery({
    queryKey: ["teamDayDetail", date],
    queryFn: () => getTeamDayDetail(date!),
    enabled: !!date,
  })
}

export function useMembersRangeSummary(range: MembersRange) {
  return useQuery({
    queryKey: ["membersRange", range],
    queryFn: () => getMembersRangeSummary(range),
    staleTime: 5 * 60 * 1000,
  })
}

export function useMembersWeeklyTrend(weeks: number) {
  return useQuery({
    queryKey: ["membersWeeklyTrend", weeks],
    queryFn: () => getMembersWeeklyTrend(weeks),
    staleTime: 5 * 60 * 1000,
  })
}
