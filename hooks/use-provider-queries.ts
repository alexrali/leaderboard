// hooks/use-provider-queries.ts
"use client"

import { useQuery } from '@tanstack/react-query'
import {
  getProviderSummary,
  getProviderDailySeries,
  getProviderChannels,
  getProviderCategories,
  getProviderTransactions,
  getCategoryDetail,
  getProviderYoYSeries,
  getProviderCategoryVelocity,
} from '@/lib/provider-queries'

const STALE_5M = 5 * 60 * 1000

export function useProviderSummary(period: 'mtd' | 'qtd' | 'ytd' = 'mtd') {
  return useQuery({
    queryKey: ['provider-summary', period],
    queryFn: () => getProviderSummary(period),
    staleTime: STALE_5M,
  })
}

export function useProviderDailySeries(days = 90) {
  return useQuery({
    queryKey: ['provider-daily-series', days],
    queryFn: () => getProviderDailySeries(days),
    staleTime: STALE_5M,
  })
}

export function useProviderChannels() {
  return useQuery({
    queryKey: ['provider-channels'],
    queryFn: getProviderChannels,
    staleTime: STALE_5M,
  })
}

export function useProviderCategories(limit = 5) {
  return useQuery({
    queryKey: ['provider-categories', limit],
    queryFn: () => getProviderCategories(limit),
    staleTime: STALE_5M,
  })
}

export function useProviderTransactions(limit = 50) {
  return useQuery({
    queryKey: ['provider-transactions', limit],
    queryFn: () => getProviderTransactions(limit),
    staleTime: STALE_5M,
  })
}

export function useCategoryDetail(categoryCode: string | null) {
  return useQuery({
    queryKey: ['provider-category-detail', categoryCode],
    queryFn: () => getCategoryDetail(categoryCode!),
    enabled: !!categoryCode,
    staleTime: STALE_5M,
  })
}

export function useProviderCategoryVelocity() {
  return useQuery({
    queryKey: ['provider-category-velocity'],
    queryFn: () => getProviderCategoryVelocity(),
    staleTime: STALE_5M,
  })
}

export function useProviderYoYSeries() {
  return useQuery({
    queryKey: ['provider-yoy-series'],
    queryFn: () => getProviderYoYSeries(),
    staleTime: STALE_5M,
  })
}
