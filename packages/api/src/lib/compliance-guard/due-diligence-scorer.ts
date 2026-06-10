export interface BusinessApplication {
  yearsInOperation: number
  hasDefaultHistory: boolean
  annualRevenueRM: number
  debtToEquityRatio: number
  jobsPerMillionRM: number
  revenueGrowthPct: number
  sectorImpactScore: number   // manually assessed 0–20
  hasExcludedRevenueSources: boolean
  carbonIntensityScore: number // 0–20, higher = lower carbon
}

export interface DueDiligenceScore {
  total: number
  breakdown: {
    financialViability: number
    managementTrackRecord: number
    sectorImpactPotential: number
    shariahCompliance: number
    environmentalFootprint: number
  }
  eligible: boolean
}

export function scoreBusiness(app: BusinessApplication): DueDiligenceScore {
  const financialViability = Math.min(20,
    (app.annualRevenueRM > 500_000 ? 8 : 4) +
    (app.debtToEquityRatio < 1 ? 6 : app.debtToEquityRatio < 2 ? 3 : 0) +
    (app.revenueGrowthPct > 10 ? 6 : app.revenueGrowthPct > 0 ? 3 : 0)
  )

  const managementTrackRecord = Math.min(20,
    Math.min(app.yearsInOperation * 3, 15) +
    (app.hasDefaultHistory ? 0 : 5)
  )

  const sectorImpactPotential = Math.min(20,
    Math.min(app.jobsPerMillionRM * 2, 10) +
    Math.min(app.sectorImpactScore, 10)
  )

  const shariahCompliance = app.hasExcludedRevenueSources ? 0 : 20

  const environmentalFootprint = Math.min(20, app.carbonIntensityScore)

  const breakdown = { financialViability, managementTrackRecord, sectorImpactPotential, shariahCompliance, environmentalFootprint }
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0)

  return { total, breakdown, eligible: total >= 70 }
}
