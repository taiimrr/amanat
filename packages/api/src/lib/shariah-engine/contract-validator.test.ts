import { describe, test, expect } from 'bun:test'
import { validateContract } from './contract-validator'

describe('validateContract', () => {
  const base = {
    bankFeeCapPct: 0.20,
    depositorSplitPct: 0.80,
  }

  describe('contractType validation', () => {
    test('accepts all valid contract types', () => {
      const types = ['MUDARABA', 'MUSHARAKA', 'MURABAHA', 'IJARA', 'SALAM', 'WAKALA'] as const
      for (const contractType of types) {
        const result = validateContract({
          ...base,
          contractType,
          ...(contractType === 'MURABAHA' ? { markupFixedAtSigning: true, markupAccruesOverTime: false, lateFeeGoesToCharity: true } : {}),
          ...(contractType === 'MUSHARAKA' ? { bankCapitalRM: 10000, businessCapitalRM: 5000 } : {}),
        })
        expect(result.errors.filter(e => e.includes('not a recognised'))).toHaveLength(0)
      }
    })

    test('rejects unknown contract type', () => {
      const result = validateContract({ ...base, contractType: 'HARAM_LOAN' as any })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('not a recognised'))).toBe(true)
    })
  })

  describe('fee cap rules', () => {
    test('rejects bankFeeCapPct > 0.40', () => {
      const result = validateContract({ ...base, contractType: 'IJARA', bankFeeCapPct: 0.41, depositorSplitPct: 0.59 })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('exceeds maximum'))).toBe(true)
    })

    test('accepts bankFeeCapPct === 0.40', () => {
      const result = validateContract({ ...base, contractType: 'IJARA', bankFeeCapPct: 0.40, depositorSplitPct: 0.60 })
      expect(result.errors.filter(e => e.includes('exceeds maximum'))).toHaveLength(0)
    })
  })

  describe('split sum validation', () => {
    test('rejects splits that do not sum to 1.0', () => {
      const result = validateContract({ ...base, contractType: 'SALAM', bankFeeCapPct: 0.20, depositorSplitPct: 0.75 })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('must equal 1.0'))).toBe(true)
    })

    test('accepts splits that sum to exactly 1.0', () => {
      const result = validateContract({ ...base, contractType: 'SALAM', bankFeeCapPct: 0.20, depositorSplitPct: 0.80 })
      expect(result.errors.filter(e => e.includes('must equal 1.0'))).toHaveLength(0)
    })
  })

  describe('MURABAHA rules', () => {
    const murabaha = { ...base, contractType: 'MURABAHA' as const }

    test('valid MURABAHA passes', () => {
      const result = validateContract({
        ...murabaha,
        markupFixedAtSigning: true,
        markupAccruesOverTime: false,
        lateFeeGoesToCharity: true,
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('rejects when markup not fixed at signing', () => {
      const result = validateContract({ ...murabaha, markupFixedAtSigning: false, markupAccruesOverTime: false, lateFeeGoesToCharity: true })
      expect(result.errors.some(e => e.includes('fixed at signing'))).toBe(true)
    })

    test('rejects when markup accrues over time', () => {
      const result = validateContract({ ...murabaha, markupFixedAtSigning: true, markupAccruesOverTime: true, lateFeeGoesToCharity: true })
      expect(result.errors.some(e => e.includes('must not accrue over time'))).toBe(true)
    })

    test('rejects when late fees do not go to charity', () => {
      const result = validateContract({ ...murabaha, markupFixedAtSigning: true, markupAccruesOverTime: false, lateFeeGoesToCharity: false })
      expect(result.errors.some(e => e.includes('late fees must go to charity'))).toBe(true)
    })
  })

  describe('MUSHARAKA rules', () => {
    const musharaka = { ...base, contractType: 'MUSHARAKA' as const }

    test('valid MUSHARAKA passes with both capital contributions', () => {
      const result = validateContract({ ...musharaka, bankCapitalRM: 50000, businessCapitalRM: 30000 })
      expect(result.valid).toBe(true)
    })

    test('rejects when bank capital contribution is missing', () => {
      const result = validateContract({ ...musharaka, businessCapitalRM: 30000 })
      expect(result.errors.some(e => e.includes('bankCapitalRM'))).toBe(true)
    })

    test('rejects when business capital contribution is missing', () => {
      const result = validateContract({ ...musharaka, bankCapitalRM: 50000 })
      expect(result.errors.some(e => e.includes('businessCapitalRM'))).toBe(true)
    })

    test('rejects when both capital contributions are missing', () => {
      const result = validateContract({ ...musharaka })
      expect(result.valid).toBe(false)
      expect(result.errors.filter(e => e.includes('capital contribution'))).toHaveLength(2)
    })
  })
})
