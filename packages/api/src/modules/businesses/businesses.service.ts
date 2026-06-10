import type { PrismaClient } from '@prisma/client'
import { scoreBusiness } from '../../lib/compliance-guard/due-diligence-scorer.js'
import { AppError } from '../../lib/errors.js'
import type { ApproveBusinessBodyType } from './businesses.schema.js'

export async function listBusinesses(prisma: PrismaClient, status?: string) {
  return prisma.business.findMany({
    where: status ? { status: status as 'APPLICANT' | 'APPROVED' | 'ACTIVE' | 'WATCHLIST' | 'EXITED' } : undefined,
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function approveBusiness(
  prisma: PrismaClient,
  businessId: string,
  actorId: string,
  dueDiligenceData: ApproveBusinessBodyType,
) {
  const business = await prisma.business.findUnique({ where: { id: businessId } })
  if (!business) throw new AppError(404, 'Business not found')
  if (business.status !== 'APPLICANT') throw new AppError(409, 'Business must be in APPLICANT status to approve')

  const score = scoreBusiness(dueDiligenceData)
  if (!score.eligible) {
    throw new AppError(422, `Due diligence score ${score.total}/100 is below the minimum 70 required for approval`)
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.business.update({
      where: { id: businessId },
      data: { status: 'APPROVED', dueDiligenceScore: score.total },
    })

    await tx.auditLog.create({
      data: {
        actorId,
        actorRole: 'ADMIN',
        action: 'BUSINESS_APPROVED',
        entityType: 'Business',
        entityId: businessId,
        payload: { score: score.total, eligible: score.eligible, breakdown: score.breakdown },
      },
    })

    return { business: updated, score }
  })
}

export async function watchlistBusiness(
  prisma: PrismaClient,
  businessId: string,
  actorId: string,
) {
  const business = await prisma.business.findUnique({ where: { id: businessId } })
  if (!business) throw new AppError(404, 'Business not found')
  if (business.status === 'EXITED') throw new AppError(409, 'Cannot watchlist an exited business')

  return prisma.$transaction(async (tx) => {
    const updated = await tx.business.update({
      where: { id: businessId },
      data: { status: 'WATCHLIST' },
    })

    await tx.auditLog.create({
      data: {
        actorId,
        actorRole: 'ADMIN',
        action: 'BUSINESS_WATCHLISTED',
        entityType: 'Business',
        entityId: businessId,
        payload: { previousStatus: business.status },
      },
    })

    return updated
  })
}
