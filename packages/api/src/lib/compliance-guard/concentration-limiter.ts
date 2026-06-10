import type { PrismaClient } from '@prisma/client'
import { Decimal } from 'decimal.js'

export interface ConcentrationResult {
  allowed: boolean
  reason?: string
}

const MAX_SINGLE_BUSINESS_PCT = new Decimal('0.05')   // 5%
const MAX_SINGLE_SECTOR_PCT   = new Decimal('0.50')   // 50%

export async function checkConcentration(
  prisma: PrismaClient,
  depositorId: string,
  targetInvestmentId: string,
  amountRM: Decimal,
): Promise<ConcentrationResult> {
  const depositor = await prisma.depositor.findUniqueOrThrow({ where: { id: depositorId } })
  const totalBalance = new Decimal(depositor.walletBalance.toString()).plus(amountRM)

  const allocations = await prisma.depositAllocation.findMany({
    where: { depositorId, status: 'ACTIVE' },
    include: { investment: true },
  })

  // Check single-business concentration
  const toThisBusiness = allocations
    .filter(a => a.investmentId === targetInvestmentId)
    .reduce((sum, a) => sum.plus(a.amountRM.toString()), new Decimal(0))
    .plus(amountRM)

  if (toThisBusiness.div(totalBalance).gt(MAX_SINGLE_BUSINESS_PCT)) {
    return { allowed: false, reason: `Would exceed 5% single-business concentration limit` }
  }

  // Check single-sector concentration
  const targetInvestment = await prisma.investmentContract.findUniqueOrThrow({ where: { id: targetInvestmentId } })
  const toThisSector = allocations
    .filter(a => a.investment.sector === targetInvestment.sector)
    .reduce((sum, a) => sum.plus(a.amountRM.toString()), new Decimal(0))
    .plus(amountRM)

  if (toThisSector.div(totalBalance).gt(MAX_SINGLE_SECTOR_PCT)) {
    return { allowed: false, reason: `Would exceed 50% single-sector concentration limit` }
  }

  return { allowed: true }
}
