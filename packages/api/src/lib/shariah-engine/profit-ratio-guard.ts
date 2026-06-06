export interface ProfitSplitInput {
  bankFeeCapPct: number
  depositorSplitPct: number
  zakatRate: number
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

const MAX_BANK_FEE = 0.40
const REQUIRED_ZAKAT_RATE = 0.025

export function validateProfitSplit(contract: ProfitSplitInput): ValidationResult {
  const errors: string[] = []

  // Must sum to exactly 1.0
  const sum = contract.bankFeeCapPct + contract.depositorSplitPct
  if (Math.abs(sum - 1.0) > 0.0001) {
    errors.push(
      `bankFeeCapPct (${contract.bankFeeCapPct}) + depositorSplitPct (${contract.depositorSplitPct}) must equal 1.0, got ${sum}`,
    )
  }

  // Bank can never take more than 40%
  if (contract.bankFeeCapPct > MAX_BANK_FEE) {
    errors.push(
      `bankFeeCapPct ${contract.bankFeeCapPct} exceeds maximum allowed ${MAX_BANK_FEE} (40%)`,
    )
  }

  // Zakat rate on bank fee must be exactly 2.5%
  if (Math.abs(contract.zakatRate - REQUIRED_ZAKAT_RATE) > 0.0001) {
    errors.push(
      `zakatRate must be ${REQUIRED_ZAKAT_RATE} (2.5%), got ${contract.zakatRate}`,
    )
  }

  return { valid: errors.length === 0, errors }
}
