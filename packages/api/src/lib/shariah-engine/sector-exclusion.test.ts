import { describe, test, expect } from 'bun:test'
import { checkSectorExclusion } from './sector-exclusion'

describe('checkSectorExclusion', () => {
  describe('blocked sector enum', () => {
    const clean = 'A legitimate halal business providing ethical services.'

    test.each([
      'ALCOHOL', 'TOBACCO', 'WEAPONS', 'GAMBLING', 'PORNOGRAPHY', 'CONVENTIONAL_INTEREST',
    ])('blocks declared sector %s', (sector) => {
      const result = checkSectorExclusion(sector, clean)
      expect(result.blocked).toBe(true)
      expect(result.reason).toContain(sector)
    })

    test('allows clean sectors', () => {
      const allowedSectors = ['GREEN_ENERGY', 'SME_FINANCING', 'AFFORDABLE_HOUSING', 'TRADE_FINANCE', 'AGRICULTURE']
      for (const sector of allowedSectors) {
        const result = checkSectorExclusion(sector, clean)
        expect(result.blocked).toBe(false)
      }
    })
  })

  describe('keyword scanning in description', () => {
    const cleanSector = 'GREEN_ENERGY'

    test.each([
      ['alcohol', 'sells alcohol to restaurants'],
      ['liquor', 'distributes liquor across the region'],
      ['beer', 'beer production facility'],
      ['tobacco', 'tobacco farming operations'],
      ['gambling', 'online gambling platform'],
      ['casino', 'operates a casino and hotel'],
      ['weapons', 'manufactures weapons for export'],
      ['pornography', 'hosts pornography websites'],
      ['interest income', 'earns interest income from loans'],
      ['conventional bank', 'a conventional bank branch'],
      ['pork', 'pork processing plant'],
    ])('blocks description containing "%s"', (keyword, description) => {
      const result = checkSectorExclusion(cleanSector, description)
      expect(result.blocked).toBe(true)
      expect(result.reason).toContain(keyword)
    })

    test('allows clean description', () => {
      const result = checkSectorExclusion('SME_FINANCING', 'A halal food manufacturer producing ethical packaged goods.')
      expect(result.blocked).toBe(false)
      expect(result.reason).toBeUndefined()
    })

    test('keyword check is case-insensitive', () => {
      const result = checkSectorExclusion(cleanSector, 'Produces ALCOHOL-based sanitisers')
      expect(result.blocked).toBe(true)
    })
  })

  describe('sector enum check takes priority', () => {
    test('blocks on sector even with a clean description', () => {
      const result = checkSectorExclusion('GAMBLING', 'Technology solutions for retail clients')
      expect(result.blocked).toBe(true)
      expect(result.reason).toContain('GAMBLING')
    })
  })
})
