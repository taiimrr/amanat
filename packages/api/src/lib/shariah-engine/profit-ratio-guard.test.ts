import { describe, test, expect } from 'bun:test'
import { validateProfitSplit } from './profit-ratio-guard'

describe('validateProfitSplit', () => {
  const valid = { bankFeeCapPct: 0.22, depositorSplitPct: 0.78, zakatRate: 0.025 }

  test('passes a valid profit split', () => {
    const result = validateProfitSplit(valid)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  describe('split sum', () => {
    test('rejects when splits do not sum to 1.0', () => {
      const result = validateProfitSplit({ ...valid, bankFeeCapPct: 0.22, depositorSplitPct: 0.75 })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('must equal 1.0'))).toBe(true)
    })

    test('accepts splits that sum to exactly 1.0', () => {
      const result = validateProfitSplit({ ...valid, bankFeeCapPct: 0.30, depositorSplitPct: 0.70 })
      expect(result.valid).toBe(true)
    })
  })

  describe('bank fee cap', () => {
    test('rejects bankFeeCapPct > 0.40', () => {
      const result = validateProfitSplit({ bankFeeCapPct: 0.41, depositorSplitPct: 0.59, zakatRate: 0.025 })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('exceeds maximum'))).toBe(true)
    })

    test('accepts bankFeeCapPct === 0.40', () => {
      const result = validateProfitSplit({ bankFeeCapPct: 0.40, depositorSplitPct: 0.60, zakatRate: 0.025 })
      expect(result.valid).toBe(true)
    })
  })

  describe('zakat rate', () => {
    test('rejects zakatRate !== 0.025', () => {
      const result = validateProfitSplit({ ...valid, zakatRate: 0.03 })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('zakatRate'))).toBe(true)
    })

    test('accepts zakatRate === 0.025', () => {
      const result = validateProfitSplit({ ...valid, zakatRate: 0.025 })
      expect(result.valid).toBe(true)
    })
  })

  test('accumulates multiple errors', () => {
    const result = validateProfitSplit({ bankFeeCapPct: 0.50, depositorSplitPct: 0.40, zakatRate: 0.05 })
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })
})
