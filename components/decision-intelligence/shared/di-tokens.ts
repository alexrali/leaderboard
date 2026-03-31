export const DI_COLORS = {
  positive: "hsl(142, 71%, 45%)",
  negative: "hsl(0, 84%, 60%)",
  neutral: "hsl(217, 91%, 60%)",
  warning: "hsl(38, 92%, 50%)",
  purple: "hsl(263, 70%, 58%)",
  pink: "hsl(330, 81%, 60%)",
  slate: "hsl(215, 14%, 49%)",
} as const

export const CHART = {
  growth: DI_COLORS.positive,
  decline: DI_COLORS.negative,
  total: DI_COLORS.neutral,
  opportunity: DI_COLORS.warning,
  expansion: DI_COLORS.positive,
  stable: DI_COLORS.neutral,
} as const
