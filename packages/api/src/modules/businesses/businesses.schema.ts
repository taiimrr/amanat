import { z } from 'zod'

export const ApproveBusinessBody = z.object({
  yearsInOperation:          z.number().int().min(0),
  hasDefaultHistory:         z.boolean(),
  annualRevenueRM:           z.number().min(0),
  debtToEquityRatio:         z.number().min(0),
  jobsPerMillionRM:          z.number().min(0),
  revenueGrowthPct:          z.number(),
  sectorImpactScore:         z.number().min(0).max(20),
  hasExcludedRevenueSources: z.boolean(),
  carbonIntensityScore:      z.number().min(0).max(20),
})

export type ApproveBusinessBodyType = z.infer<typeof ApproveBusinessBody>
