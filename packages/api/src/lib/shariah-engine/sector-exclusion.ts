export interface ExclusionResult {
  blocked: boolean
  reason?: string
}

// Hard-blocked sector enums — these can never be funded regardless of description
const BLOCKED_SECTORS = new Set([
  'ALCOHOL',
  'TOBACCO',
  'WEAPONS',
  'GAMBLING',
  'PORNOGRAPHY',
  'CONVENTIONAL_INTEREST',
])

// Keywords that flag a description as belonging to a prohibited sector
const BLOCKED_KEYWORDS: Record<string, string> = {
  'alcohol':              'ALCOHOL',
  'liquor':               'ALCOHOL',
  'beer':                 'ALCOHOL',
  'wine':                 'ALCOHOL',
  'spirits':              'ALCOHOL',
  'brewery':              'ALCOHOL',
  'distillery':           'ALCOHOL',
  'tobacco':              'TOBACCO',
  'cigarette':            'TOBACCO',
  'vaping':               'TOBACCO',
  'nicotine':             'TOBACCO',
  'gambling':             'GAMBLING',
  'casino':               'GAMBLING',
  'betting':              'GAMBLING',
  'lottery':              'GAMBLING',
  'slot machine':         'GAMBLING',
  'weapons':              'WEAPONS',
  'ammunition':           'WEAPONS',
  'firearms':             'WEAPONS',
  'defence contractor':   'WEAPONS',
  'arms dealer':          'WEAPONS',
  'pornography':          'PORNOGRAPHY',
  'adult content':        'PORNOGRAPHY',
  'explicit material':    'PORNOGRAPHY',
  'interest income':      'CONVENTIONAL_INTEREST',
  'conventional bank':    'CONVENTIONAL_INTEREST',
  'moneylending':         'CONVENTIONAL_INTEREST',
  'pawn':                 'CONVENTIONAL_INTEREST',
  'pork':                 'CONVENTIONAL_INTEREST',
  'swine':                'CONVENTIONAL_INTEREST',
}

export function checkSectorExclusion(
  sector: string,
  businessDescription: string,
): ExclusionResult {
  // Check declared sector enum first
  if (BLOCKED_SECTORS.has(sector.toUpperCase())) {
    return { blocked: true, reason: `Sector "${sector}" is prohibited under Shariah compliance rules` }
  }

  // Scan description for prohibited keywords
  const lower = businessDescription.toLowerCase()
  for (const [keyword, prohibitedSector] of Object.entries(BLOCKED_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return {
        blocked: true,
        reason: `Business description contains term associated with prohibited sector ${prohibitedSector}: "${keyword}"`,
      }
    }
  }

  return { blocked: false }
}
