import { describe, test, expect } from 'bun:test'
import { detectTawarruqPattern } from './tawarruq-detector'
import type { Transaction } from './tawarruq-detector'

const now = new Date('2026-06-06T10:00:00Z')
const h = (hours: number) => new Date(now.getTime() + hours * 3_600_000)

const tx = (overrides: Partial<Transaction>): Transaction => ({
  businessId: 'biz-1',
  commodityId: 'palm-oil',
  role: 'BUYER',
  amountRM: 100_000,
  timestamp: now,
  ...overrides,
})

describe('detectTawarruqPattern', () => {
  test('returns no flag for empty transactions', () => {
    const result = detectTawarruqPattern([])
    expect(result.flagged).toBe(false)
    expect(result.confidence).toBe('LOW')
  })

  test('returns no flag when only buyers exist', () => {
    const result = detectTawarruqPattern([
      tx({ role: 'BUYER' }),
      tx({ role: 'BUYER', timestamp: h(2) }),
    ])
    expect(result.flagged).toBe(false)
  })

  test('returns no flag when only sellers exist', () => {
    const result = detectTawarruqPattern([
      tx({ role: 'SELLER' }),
    ])
    expect(result.flagged).toBe(false)
  })

  describe('HIGH confidence — same business, same commodity, within 48h, amounts match within 2%', () => {
    test('flags exact amount match', () => {
      const result = detectTawarruqPattern([
        tx({ role: 'BUYER',  amountRM: 100_000, timestamp: h(0) }),
        tx({ role: 'SELLER', amountRM: 100_000, timestamp: h(12) }),
      ])
      expect(result.flagged).toBe(true)
      expect(result.confidence).toBe('HIGH')
      expect(result.evidence).toContain('biz-1')
    })

    test('flags amounts within 2% tolerance', () => {
      const result = detectTawarruqPattern([
        tx({ role: 'BUYER',  amountRM: 100_000, timestamp: h(0) }),
        tx({ role: 'SELLER', amountRM: 101_500, timestamp: h(6) }),  // 1.5% difference
      ])
      expect(result.flagged).toBe(true)
      expect(result.confidence).toBe('HIGH')
    })

    test('does not flag amounts beyond 2% tolerance as HIGH', () => {
      const result = detectTawarruqPattern([
        tx({ role: 'BUYER',  amountRM: 100_000, timestamp: h(0) }),
        tx({ role: 'SELLER', amountRM: 110_000, timestamp: h(6) }),  // 9% difference
      ])
      if (result.flagged) {
        expect(result.confidence).not.toBe('HIGH')
      }
    })
  })

  describe('MEDIUM confidence — roles match within 48h but amounts differ', () => {
    test('flags with MEDIUM when amounts differ significantly', () => {
      const result = detectTawarruqPattern([
        tx({ role: 'BUYER',  amountRM: 100_000, timestamp: h(0) }),
        tx({ role: 'SELLER', amountRM: 150_000, timestamp: h(24) }),
      ])
      expect(result.flagged).toBe(true)
      expect(result.confidence).toBe('MEDIUM')
    })
  })

  describe('time window', () => {
    test('does not flag buyer+seller beyond 48h window', () => {
      const result = detectTawarruqPattern([
        tx({ role: 'BUYER',  timestamp: h(0) }),
        tx({ role: 'SELLER', timestamp: h(49) }),  // just outside window
      ])
      expect(result.flagged).toBe(false)
    })

    test('flags buyer+seller at exactly 48h boundary', () => {
      const result = detectTawarruqPattern([
        tx({ role: 'BUYER',  amountRM: 100_000, timestamp: h(0) }),
        tx({ role: 'SELLER', amountRM: 100_000, timestamp: h(48) }),
      ])
      expect(result.flagged).toBe(true)
    })
  })

  describe('different business or commodity', () => {
    test('does not cross-flag different businesses', () => {
      const result = detectTawarruqPattern([
        tx({ businessId: 'biz-1', role: 'BUYER',  timestamp: h(0) }),
        tx({ businessId: 'biz-2', role: 'SELLER', timestamp: h(1) }),
      ])
      expect(result.flagged).toBe(false)
    })

    test('does not cross-flag different commodities', () => {
      const result = detectTawarruqPattern([
        tx({ commodityId: 'palm-oil', role: 'BUYER',  timestamp: h(0) }),
        tx({ commodityId: 'crude-oil', role: 'SELLER', timestamp: h(1) }),
      ])
      expect(result.flagged).toBe(false)
    })
  })
})
