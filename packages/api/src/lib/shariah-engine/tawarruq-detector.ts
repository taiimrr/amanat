export interface Transaction {
  businessId: string
  commodityId: string
  role: 'BUYER' | 'SELLER'
  amountRM: number
  timestamp: Date
}

export interface TawarruqFlag {
  flagged: boolean
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  evidence: string
}

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000
const AMOUNT_TOLERANCE = 0.02  // 2%

export function detectTawarruqPattern(recentTransactions: Transaction[]): TawarruqFlag {
  // Group transactions by businessId + commodityId
  const byBusinessAndCommodity = new Map<string, Transaction[]>()

  for (const tx of recentTransactions) {
    const key = `${tx.businessId}::${tx.commodityId}`
    const group = byBusinessAndCommodity.get(key) ?? []
    group.push(tx)
    byBusinessAndCommodity.set(key, group)
  }

  for (const [key, txs] of byBusinessAndCommodity) {
    const buyers  = txs.filter(t => t.role === 'BUYER')
    const sellers = txs.filter(t => t.role === 'SELLER')

    // Pattern: same business appears as both buyer and seller of same commodity
    if (buyers.length === 0 || sellers.length === 0) continue

    for (const buy of buyers) {
      for (const sell of sellers) {
        const timeDiff = Math.abs(buy.timestamp.getTime() - sell.timestamp.getTime())
        if (timeDiff > FORTY_EIGHT_HOURS_MS) continue

        const [lo, hi] = buy.amountRM < sell.amountRM
          ? [buy.amountRM, sell.amountRM]
          : [sell.amountRM, buy.amountRM]

        const amountRatio = (hi - lo) / hi
        const amountsMatch = amountRatio <= AMOUNT_TOLERANCE

        const [businessId] = key.split('::')
        const evidence = `Business ${businessId} acted as both BUYER and SELLER of the same commodity within ${Math.round(timeDiff / 3_600_000)}h`

        if (amountsMatch) {
          return {
            flagged: true,
            confidence: 'HIGH',
            evidence: `${evidence}. Amounts match within ${(amountRatio * 100).toFixed(1)}% tolerance (buy: ${buy.amountRM}, sell: ${sell.amountRM}).`,
          }
        }

        // Roles match within 48h but amounts differ — lower confidence
        return {
          flagged: true,
          confidence: 'MEDIUM',
          evidence: `${evidence}. Amounts differ: buy ${buy.amountRM} vs sell ${sell.amountRM}.`,
        }
      }
    }
  }

  return { flagged: false, confidence: 'LOW', evidence: 'No Tawarruq pattern detected.' }
}
