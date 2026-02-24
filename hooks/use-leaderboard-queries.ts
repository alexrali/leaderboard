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
} from "@/lib/leaderboard-queries"

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
