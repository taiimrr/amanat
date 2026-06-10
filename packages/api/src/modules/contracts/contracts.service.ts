import type { PrismaClient } from '@prisma/client'
import { Decimal } from 'decimal.js'
import { validateContract } from '../../lib/shariah-engine/contract-validator.js'
import { AppError } from '../../lib/errors.js'
import type { CreateContractBodyType } from './contracts.schema.js'

export async function createContract(
  prisma: PrismaClient,
  body: CreateContractBodyType,
  actorId: string,
) {
  const business = await prisma.business.findUnique({ where: { id: body.businessId } })
  if (!business) throw new AppError(404, 'Business not found')
  if (business.status !== 'APPROVED' && business.status !== 'ACTIVE') {
    throw new AppError(422, 'Business must be APPROVED before a contract can be created')
  }

  const validation = validateContract({
    contractType: body.contractType,
    bankFeeCapPct: body.bankFeeCapPct,
    depositorSplitPct: body.depositorSplitPct,
    markupFixedAtSigning: body.markupFixedAtSigning,
    markupAccruesOverTime: body.markupAccruesOverTime,
    lateFeeGoesToCharity: body.lateFeeGoesToCharity,
  })

  if (!validation.valid) {
    throw new AppError(422, `Shariah validation failed: ${validation.errors.join('; ')}`)
  }

  return prisma.$transaction(async (tx) => {
    const contract = await tx.investmentContract.create({
      data: {
        businessId:        body.businessId,
        contractType:      body.contractType,
        principalRM:       new Decimal(body.principalRM).toFixed(2),
        bankFeeCapPct:     new Decimal(body.bankFeeCapPct).toFixed(4),
        depositorSplitPct: new Decimal(body.depositorSplitPct).toFixed(4),
        sector:            body.sector,
        startDate:         new Date(body.startDate),
        endDate:           body.endDate ? new Date(body.endDate) : undefined,
        status:            'ACTIVE',
      },
      include: { business: { select: { legalName: true } } },
    })

    await tx.auditLog.create({
      data: {
        actorId,
        actorRole: 'ADMIN',
        action:     'CONTRACT_CREATED',
        entityType: 'InvestmentContract',
        entityId:   contract.id,
        payload: {
          contractType:      contract.contractType,
          principalRM:       contract.principalRM.toString(),
          bankFeeCapPct:     contract.bankFeeCapPct.toString(),
          depositorSplitPct: contract.depositorSplitPct.toString(),
          sector:            contract.sector,
          businessId:        contract.businessId,
          warnings:          validation.warnings,
        },
      },
    })

    return { contract, warnings: validation.warnings }
  })
}

export async function listContracts(prisma: PrismaClient, status?: string) {
  return prisma.investmentContract.findMany({
    where: status ? { status: status as 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'WATCHLIST' } : undefined,
    include: {
      business: { select: { legalName: true, sector: true, status: true } },
      _count:   { select: { allocations: true, reports: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function watchlistContract(
  prisma: PrismaClient,
  contractId: string,
  actorId: string,
) {
  const contract = await prisma.investmentContract.findUnique({ where: { id: contractId } })
  if (!contract) throw new AppError(404, 'Contract not found')
  if (contract.status === 'COMPLETED' || contract.status === 'DEFAULTED') {
    throw new AppError(409, 'Cannot watchlist a completed or defaulted contract')
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.investmentContract.update({
      where: { id: contractId },
      data: { status: 'WATCHLIST' },
    })

    await tx.auditLog.create({
      data: {
        actorId,
        actorRole:  'ADMIN',
        action:     'CONTRACT_WATCHLISTED',
        entityType: 'InvestmentContract',
        entityId:   contractId,
        payload:    { previousStatus: contract.status },
      },
    })

    return updated
  })
}
