export interface ExclusionResult {
  blocked: boolean
  reason?: string
}

const BLOCKED_KEYWORDS = [
  'alcohol', 'liquor', 'beer', 'wine', 'spirits', 'brewery',
  'tobacco', 'cigarette', 'vaping',
  'gambling', 'casino', 'betting', 'lottery',
  'weapons', 'ammunition', 'firearms', 'defence contractor',
  'pornography', 'adult content',
  'interest', 'conventional bank', 'moneylending',
  'pork', 'swine',
]

export function checkSectorExclusion(
  description: string
): ExclusionResult {
  const lower = description.toLowerCase()
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { blocked: true, reason: `Business description contains prohibited term: "${keyword}"` }
    }
  }
  return { blocked: false }
}
