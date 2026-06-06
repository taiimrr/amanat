import { Decimal } from 'decimal.js'

export interface ProfitDistribution {
  grossProfitRM: Decimal
  bankFeeCapPct: Decimal
}

export interface DistributionBreakdown {
  grossProfitRM: Decimal
  bankFeeRM: Decimal
  zakatRM: Decimal          // 2.5% of bank fee — always
  depositorPoolRM: Decimal
  valid: boolean
  errors: string[]
}

const ZAKAT_RATE = new Decimal('0.025')
const MAX_BANK_FEE_PCT = new Decimal('0.40')

export function calculateDistributionBreakdown(
  input: ProfitDistribution
): DistributionBreakdown {
  const errors: string[] = []

  if (input.bankFeeCapPct.gt(MAX_BANK_FEE_PCT)) {
    errors.push(`Bank fee ${input.bankFeeCapPct} exceeds maximum ${MAX_BANK_FEE_PCT}`)
  }

  const bankFeeRM = input.grossProfitRM.mul(input.bankFeeCapPct).toDecimalPlaces(2)
  const zakatRM = bankFeeRM.mul(ZAKAT_RATE).toDecimalPlaces(2)
  const depositorPoolRM = input.grossProfitRM.minus(bankFeeRM).toDecimalPlaces(2)

  return {
    grossProfitRM: input.grossProfitRM,
    bankFeeRM,
    zakatRM,
    depositorPoolRM,
    valid: errors.length === 0,
    errors,
  }
}
