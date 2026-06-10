import type { PrismaClient } from '@prisma/client'
import { Decimal } from 'decimal.js'
import { checkConcentration } from '../../lib/compliance-guard/concentration-limiter.js'
import { AppError } from '../../lib/errors.js'
import type { CreateAllocationBodyType } from './allocations.schema.js'

export async function createAllocation(
  prisma: PrismaClient,
  body: CreateAllocationBodyType,
  userId: string,
) {
  const depositor = await prisma.depositor.findUnique({ where: { userId } })
  if (!depositor) throw new AppError(403, 'Only depositors can allocate funds')

  const investment = await prisma.investmentContract.findUnique({ where: { id: body.investmentId } })
  if (!investment) throw new AppError(404, 'Investment contract not found')
  if (investment.status !== 'ACTIVE') throw new AppError(422, 'Investment contract is not active')

  const amountRM = new Decimal(body.amountRM)

  const concentration = await checkConcentration(prisma, depositor.id, body.investmentId, amountRM)
  if (!concentration.allowed) throw new AppError(422, concentration.reason!)

  return prisma.$transaction(async (tx) => {
    // Recalculate sharePercent for all allocations when a new one is added
    const existing = await tx.depositAllocation.findMany({
      where: { investmentId: body.investmentId, status: 'ACTIVE' },
    })

    const totalAllocated = existing
      .reduce((sum, a) => sum.plus(a.amountRM.toString()), new Decimal(0))
      .plus(amountRM)

    for (const a of existing) {
      await tx.depositAllocation.update({
        where: { id: a.id },
        data: { sharePercent: new Decimal(a.amountRM.toString()).div(totalAllocated).toFixed(8) },
      })
    }

    const allocation = await tx.depositAllocation.create({
      data: {
        depositorId:  depositor.id,
        investmentId: body.investmentId,
        amountRM:     amountRM.toFixed(2),
        sharePercent: amountRM.div(totalAllocated).toFixed(8),
        status:       'ACTIVE',
      },
    })

    await tx.auditLog.create({
      data: {
        actorId:    userId,
        actorRole:  'DEPOSITOR',
        action:     'ALLOCATION_CREATED',
        entityType: 'DepositAllocation',
        entityId:   allocation.id,
        payload: {
          investmentId: body.investmentId,
          amountRM:     amountRM.toFixed(2),
          sharePercent: allocation.sharePercent.toString(),
        },
      },
    })

    return allocation
  })
}

export async function exitAllocation(
  prisma: PrismaClient,
  allocationId: string,
  userId: string,
) {
  const depositor = await prisma.depositor.findUnique({ where: { userId } })
  if (!depositor) throw new AppError(403, 'Only depositors can exit allocations')

  const allocation = await prisma.depositAllocation.findUnique({ where: { id: allocationId } })
  if (!allocation) throw new AppError(404, 'Allocation not found')
  if (allocation.depositorId !== depositor.id) throw new AppError(403, 'You can only exit your own allocations')
  if (allocation.status !== 'ACTIVE') throw new AppError(409, 'Allocation is not active')

  return prisma.$transaction(async (tx) => {
    await tx.depositAllocation.update({
      where: { id: allocationId },
      data: { status: 'EXITED' },
    })

    // Recalculate sharePercents for remaining active allocations
    const remaining = await tx.depositAllocation.findMany({
      where: { investmentId: allocation.investmentId, status: 'ACTIVE' },
    })

    if (remaining.length > 0) {
      const totalRemaining = remaining.reduce((sum, a) => sum.plus(a.amountRM.toString()), new Decimal(0))
      for (const r of remaining) {
        await tx.depositAllocation.update({
          where: { id: r.id },
          data: { sharePercent: new Decimal(r.amountRM.toString()).div(totalRemaining).toFixed(8) },
        })
      }
    }

    await tx.auditLog.create({
      data: {
        actorId:    userId,
        actorRole:  'DEPOSITOR',
        action:     'ALLOCATION_EXITED',
        entityType: 'DepositAllocation',
        entityId:   allocationId,
        payload: {
          investmentId: allocation.investmentId,
          amountRM:     allocation.amountRM.toString(),
        },
      },
    })

    return { ok: true, allocationId }
  })
}
