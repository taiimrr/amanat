import type { ContractType } from '@prisma/client'

export interface ContractInput {
  contractType: ContractType
  bankFeeCapPct: number
  depositorSplitPct: number
  markupFixedAtSigning?: boolean
  markupAccruesOverTime?: boolean
  lateFeeGoesToCharity?: boolean
  // MUSHARAKA — both parties must declare their capital contribution
  bankCapitalRM?: number
  businessCapitalRM?: number
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

const ALLOWED_TYPES: ContractType[] = [
  'MUDARABA', 'MUSHARAKA', 'MURABAHA', 'IJARA', 'SALAM', 'WAKALA',
]

export function validateContract(input: ContractInput): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!ALLOWED_TYPES.includes(input.contractType)) {
    errors.push(`Contract type "${input.contractType}" is not a recognised Shariah-compliant instrument`)
  }

  // Bank fee cap: never more than 40% of profit
  if (input.bankFeeCapPct > 0.40) {
    errors.push(`Bank fee cap ${input.bankFeeCapPct} exceeds maximum allowed 0.40 (40%)`)
  }

  // Splits must sum to 1.0
  const sum = input.bankFeeCapPct + input.depositorSplitPct
  if (Math.abs(sum - 1.0) > 0.0001) {
    errors.push(
      `bankFeeCapPct (${input.bankFeeCapPct}) + depositorSplitPct (${input.depositorSplitPct}) must equal 1.0, got ${sum}`,
    )
  }

  if (input.contractType === 'MURABAHA') {
    if (input.markupFixedAtSigning !== true) {
      errors.push('MURABAHA: markup must be fixed at signing')
    }
    if (input.markupAccruesOverTime === true) {
      errors.push('MURABAHA: markup must not accrue over time (constitutes riba)')
    }
    if (input.lateFeeGoesToCharity !== true) {
      errors.push('MURABAHA: late fees must go to charity, not retained by the bank')
    }
  }

  if (input.contractType === 'MUDARABA') {
    if (input.bankFeeCapPct > 0.40) {
      errors.push('MUDARABA: bank profit share cannot exceed 40%')
    }
  }

  if (input.contractType === 'MUSHARAKA') {
    if (!input.bankCapitalRM || input.bankCapitalRM <= 0) {
      errors.push('MUSHARAKA: bank capital contribution (bankCapitalRM) must be declared and > 0')
    }
    if (!input.businessCapitalRM || input.businessCapitalRM <= 0) {
      errors.push('MUSHARAKA: business capital contribution (businessCapitalRM) must be declared and > 0')
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}
