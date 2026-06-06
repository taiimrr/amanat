import type { ContractType } from '@prisma/client'

export interface ContractInput {
  contractType: ContractType
  bankFeeCapPct: number
  depositorSplitPct: number
  markupFixedAtSigning?: boolean
  markupAccruesOverTime?: boolean
  lateFeeGoesToCharity?: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateContract(input: ContractInput): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Fee cap: bank cannot take more than 40% of profit
  if (input.bankFeeCapPct > 0.40) {
    errors.push(`Bank fee cap ${input.bankFeeCapPct} exceeds maximum allowed 0.40 (40%)`)
  }

  // Split must sum to 1.0
  const sum = input.bankFeeCapPct + input.depositorSplitPct
  if (Math.abs(sum - 1.0) > 0.0001) {
    errors.push(`bankFeeCapPct (${input.bankFeeCapPct}) + depositorSplitPct (${input.depositorSplitPct}) must equal 1.0, got ${sum}`)
  }

  // Murabaha-specific rules
  if (input.contractType === 'MURABAHA') {
    if (input.markupAccruesOverTime === true) {
      errors.push('MURABAHA: markup must not accrue over time (this would constitute riba)')
    }
    if (input.markupFixedAtSigning !== true) {
      errors.push('MURABAHA: markup must be fixed at signing')
    }
    if (input.lateFeeGoesToCharity !== true) {
      warnings.push('MURABAHA: late fees should go to charity, not the bank')
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}
