import { PrismaClient, Role, SectorType, ContractType, ContractStatus, BusinessStatus, VerificationStatus, DistributionStatus, AuditAction, ZakatType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { Decimal } from 'decimal.js'

const prisma = new PrismaClient()

const BCRYPT_ROUNDS = 12
const ZAKAT_RATE = new Decimal('0.025')

async function hash(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

function dec(value: string | number) {
  return new Decimal(value)
}

async function main() {
  console.log('Seeding database...')

  // ─── Users ──────────────────────────────────────────────────────────────────

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@amanat.dev' },
    update: {},
    create: {
      email: 'admin@amanat.dev',
      passwordHash: await hash('Admin1234!'),
      role: Role.ADMIN,
    },
  })

  const dep1User = await prisma.user.upsert({
    where: { email: 'depositor1@amanat.dev' },
    update: {},
    create: {
      email: 'depositor1@amanat.dev',
      passwordHash: await hash('Test1234!'),
      role: Role.DEPOSITOR,
    },
  })

  const dep2User = await prisma.user.upsert({
    where: { email: 'depositor2@amanat.dev' },
    update: {},
    create: {
      email: 'depositor2@amanat.dev',
      passwordHash: await hash('Test1234!'),
      role: Role.DEPOSITOR,
    },
  })

  const dep3User = await prisma.user.upsert({
    where: { email: 'depositor3@amanat.dev' },
    update: {},
    create: {
      email: 'depositor3@amanat.dev',
      passwordHash: await hash('Test1234!'),
      role: Role.DEPOSITOR,
    },
  })

  const solarUser = await prisma.user.upsert({
    where: { email: 'sabahsolar@amanat.dev' },
    update: {},
    create: {
      email: 'sabahsolar@amanat.dev',
      passwordHash: await hash('Test1234!'),
      role: Role.BUSINESS,
    },
  })

  const smeUser = await prisma.user.upsert({
    where: { email: 'klsme@amanat.dev' },
    update: {},
    create: {
      email: 'klsme@amanat.dev',
      passwordHash: await hash('Test1234!'),
      role: Role.BUSINESS,
    },
  })

  const housingUser = await prisma.user.upsert({
    where: { email: 'selangorhousing@amanat.dev' },
    update: {},
    create: {
      email: 'selangorhousing@amanat.dev',
      passwordHash: await hash('Test1234!'),
      role: Role.BUSINESS,
    },
  })

  // ─── Depositors ─────────────────────────────────────────────────────────────

  const dep1 = await prisma.depositor.upsert({
    where: { userId: dep1User.id },
    update: {},
    create: {
      userId: dep1User.id,
      displayName: 'Ahmad Razif',
      walletBalance: dec('5000.00'),
    },
  })

  const dep2 = await prisma.depositor.upsert({
    where: { userId: dep2User.id },
    update: {},
    create: {
      userId: dep2User.id,
      displayName: 'Siti Norzahirah',
      walletBalance: dec('25000.00'),
    },
  })

  const dep3 = await prisma.depositor.upsert({
    where: { userId: dep3User.id },
    update: {},
    create: {
      userId: dep3User.id,
      displayName: 'Dato Khairul Anuar',
      walletBalance: dec('100000.00'),
    },
  })

  // ─── Businesses ─────────────────────────────────────────────────────────────

  const solarBiz = await prisma.business.upsert({
    where: { userId: solarUser.id },
    update: {},
    create: {
      userId: solarUser.id,
      legalName: 'Sabah Solar Farm Sdn Bhd',
      registrationNumber: 'SSF-2022-001',
      sector: SectorType.GREEN_ENERGY,
      description: 'Utility-scale solar photovoltaic farm in Sabah providing clean energy to rural communities and reducing reliance on diesel generators.',
      dueDiligenceScore: 85,
      status: BusinessStatus.ACTIVE,
    },
  })

  const smeBiz = await prisma.business.upsert({
    where: { userId: smeUser.id },
    update: {},
    create: {
      userId: smeUser.id,
      legalName: 'KL SME Growth Fund Sdn Bhd',
      registrationNumber: 'KSG-2021-088',
      sector: SectorType.SME_FINANCING,
      description: 'Provides working capital financing to halal-certified small and medium enterprises in the Klang Valley food and beverage sector.',
      dueDiligenceScore: 78,
      status: BusinessStatus.ACTIVE,
    },
  })

  const housingBiz = await prisma.business.upsert({
    where: { userId: housingUser.id },
    update: {},
    create: {
      userId: housingUser.id,
      legalName: 'Selangor Affordable Homes Bhd',
      registrationNumber: 'SAH-2023-045',
      sector: SectorType.AFFORDABLE_HOUSING,
      description: 'Develops affordable housing units for B40 households in Selangor under the state government\'s Rumah Selangorku programme.',
      dueDiligenceScore: 82,
      status: BusinessStatus.ACTIVE,
    },
  })

  // ─── Contracts ───────────────────────────────────────────────────────────────

  const solarContract = await prisma.investmentContract.upsert({
    where: { id: 'c-solar-001' },
    update: {},
    create: {
      id: 'c-solar-001',
      businessId: solarBiz.id,
      contractType: ContractType.MUSHARAKA,
      principalRM: dec('2000000.00'),
      bankFeeCapPct: dec('0.2200'),
      depositorSplitPct: dec('0.7800'),
      sector: SectorType.GREEN_ENERGY,
      startDate: new Date('2024-01-01'),
      status: ContractStatus.ACTIVE,
    },
  })

  const smeContract = await prisma.investmentContract.upsert({
    where: { id: 'c-sme-001' },
    update: {},
    create: {
      id: 'c-sme-001',
      businessId: smeBiz.id,
      contractType: ContractType.MUDARABA,
      principalRM: dec('800000.00'),
      bankFeeCapPct: dec('0.2500'),
      depositorSplitPct: dec('0.7500'),
      sector: SectorType.SME_FINANCING,
      startDate: new Date('2024-02-01'),
      status: ContractStatus.ACTIVE,
    },
  })

  const housingContract = await prisma.investmentContract.upsert({
    where: { id: 'c-housing-001' },
    update: {},
    create: {
      id: 'c-housing-001',
      businessId: housingBiz.id,
      contractType: ContractType.MURABAHA,
      principalRM: dec('1500000.00'),
      bankFeeCapPct: dec('0.2000'),
      depositorSplitPct: dec('0.8000'),
      sector: SectorType.AFFORDABLE_HOUSING,
      startDate: new Date('2024-03-01'),
      status: ContractStatus.ACTIVE,
    },
  })

  // ─── Allocations ─────────────────────────────────────────────────────────────
  // Solar pool total from seed depositors: 2000 + 10000 + 40000 = 52000
  // SME pool total: 1500 + 7500 + 30000 = 39000
  // Housing pool total: 1500 + 7500 + 30000 = 39000

  // Depositor 1 — solar
  await prisma.depositAllocation.upsert({
    where: { id: 'a-d1-solar' },
    update: {},
    create: {
      id: 'a-d1-solar',
      depositorId: dep1.id,
      investmentId: solarContract.id,
      amountRM: dec('2000.00'),
      sharePercent: dec('0.03846154'), // 2000 / 52000
    },
  })

  // Depositor 1 — SME
  await prisma.depositAllocation.upsert({
    where: { id: 'a-d1-sme' },
    update: {},
    create: {
      id: 'a-d1-sme',
      depositorId: dep1.id,
      investmentId: smeContract.id,
      amountRM: dec('1500.00'),
      sharePercent: dec('0.03846154'), // 1500 / 39000
    },
  })

  // Depositor 1 — Housing
  await prisma.depositAllocation.upsert({
    where: { id: 'a-d1-housing' },
    update: {},
    create: {
      id: 'a-d1-housing',
      depositorId: dep1.id,
      investmentId: housingContract.id,
      amountRM: dec('1500.00'),
      sharePercent: dec('0.03846154'),
    },
  })

  // Depositor 2 — solar
  await prisma.depositAllocation.upsert({
    where: { id: 'a-d2-solar' },
    update: {},
    create: {
      id: 'a-d2-solar',
      depositorId: dep2.id,
      investmentId: solarContract.id,
      amountRM: dec('10000.00'),
      sharePercent: dec('0.19230769'), // 10000 / 52000
    },
  })

  // Depositor 2 — SME
  await prisma.depositAllocation.upsert({
    where: { id: 'a-d2-sme' },
    update: {},
    create: {
      id: 'a-d2-sme',
      depositorId: dep2.id,
      investmentId: smeContract.id,
      amountRM: dec('7500.00'),
      sharePercent: dec('0.19230769'),
    },
  })

  // Depositor 2 — Housing
  await prisma.depositAllocation.upsert({
    where: { id: 'a-d2-housing' },
    update: {},
    create: {
      id: 'a-d2-housing',
      depositorId: dep2.id,
      investmentId: housingContract.id,
      amountRM: dec('7500.00'),
      sharePercent: dec('0.19230769'),
    },
  })

  // Depositor 3 — solar
  await prisma.depositAllocation.upsert({
    where: { id: 'a-d3-solar' },
    update: {},
    create: {
      id: 'a-d3-solar',
      depositorId: dep3.id,
      investmentId: solarContract.id,
      amountRM: dec('40000.00'),
      sharePercent: dec('0.76923077'), // 40000 / 52000
    },
  })

  // Depositor 3 — SME
  await prisma.depositAllocation.upsert({
    where: { id: 'a-d3-sme' },
    update: {},
    create: {
      id: 'a-d3-sme',
      depositorId: dep3.id,
      investmentId: smeContract.id,
      amountRM: dec('30000.00'),
      sharePercent: dec('0.76923077'),
    },
  })

  // Depositor 3 — Housing
  await prisma.depositAllocation.upsert({
    where: { id: 'a-d3-housing' },
    update: {},
    create: {
      id: 'a-d3-housing',
      depositorId: dep3.id,
      investmentId: housingContract.id,
      amountRM: dec('30000.00'),
      sharePercent: dec('0.76923077'),
    },
  })

  // ─── Outcome Reports & Distributions ─────────────────────────────────────────
  // 3 verified reports per contract, last 3 months

  const periods = [
    { start: new Date('2026-03-01'), end: new Date('2026-03-31') },
    { start: new Date('2026-04-01'), end: new Date('2026-04-30') },
    { start: new Date('2026-05-01'), end: new Date('2026-05-31') },
  ]

  // Solar reports — realistic green energy financials
  const solarReportData = [
    { revenue: '185000.00', expenses: '62000.00', jobs: 24, co2: '320.50' },
    { revenue: '192000.00', expenses: '58000.00', jobs: 24, co2: '335.20' },
    { revenue: '178000.00', expenses: '61000.00', jobs: 26, co2: '298.80' },
  ]

  // SME reports
  const smeReportData = [
    { revenue: '95000.00', expenses: '41000.00', jobs: 38, co2: null },
    { revenue: '102000.00', expenses: '44000.00', jobs: 40, co2: null },
    { revenue: '88000.00', expenses: '39000.00', jobs: 37, co2: null },
  ]

  // Housing reports
  const housingReportData = [
    { revenue: '145000.00', expenses: '82000.00', jobs: 55, co2: '18.50' },
    { revenue: '158000.00', expenses: '89000.00', jobs: 58, co2: '20.10' },
    { revenue: '139000.00', expenses: '78000.00', jobs: 52, co2: '17.30' },
  ]

  type ReportRow = { revenue: string; expenses: string; jobs: number; co2: string | null }

  async function seedReportsAndDistributions(
    contractId: string,
    businessId: string,
    bankFeeCapPct: Decimal,
    depositorSplitPct: Decimal,
    reportRows: ReportRow[],
    depositorShares: { depositorId: string; sharePercent: Decimal }[],
    prefix: string,
  ) {
    for (let i = 0; i < 3; i++) {
      const period = periods[i]
      const row = reportRows[i]
      const grossProfit = dec(row.revenue).minus(dec(row.expenses))

      const reportId = `r-${prefix}-${i + 1}`
      const distId = `d-${prefix}-${i + 1}`

      await prisma.outcomeReport.upsert({
        where: { id: reportId },
        update: {},
        create: {
          id: reportId,
          contractId,
          businessId,
          periodStart: period.start,
          periodEnd: period.end,
          revenueRM: dec(row.revenue),
          expensesRM: dec(row.expenses),
          grossProfitRM: grossProfit,
          jobsSupported: row.jobs,
          co2AvoidedTonnes: row.co2 ? dec(row.co2) : null,
          verificationStatus: VerificationStatus.VERIFIED,
          verifiedByAdminId: adminUser.id,
          verifiedAt: new Date(period.end.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      })

      const bankFeeRM = grossProfit.mul(bankFeeCapPct).toDecimalPlaces(2)
      const zakatRM = bankFeeRM.mul(ZAKAT_RATE).toDecimalPlaces(2)
      const depositorPoolRM = grossProfit.minus(bankFeeRM).toDecimalPlaces(2)

      await prisma.distribution.upsert({
        where: { id: distId },
        update: {},
        create: {
          id: distId,
          contractId,
          reportId,
          grossProfitRM: grossProfit,
          bankFeeRM,
          zakatRM,
          depositorPoolRM,
          status: DistributionStatus.EXECUTED,
          executedAt: new Date(period.end.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      // Zakat ledger entry
      await prisma.zakatLedger.upsert({
        where: { id: `z-${prefix}-${i + 1}` },
        update: {},
        create: {
          id: `z-${prefix}-${i + 1}`,
          sourceId: distId,
          amountRM: zakatRM,
          type: ZakatType.COLLECTED,
          note: `Auto-collected from distribution ${distId}`,
        },
      })

      // Per-depositor credits
      for (const ds of depositorShares) {
        const creditId = `dc-${prefix}-${i + 1}-${ds.depositorId.slice(0, 8)}`
        const creditAmount = depositorPoolRM.mul(ds.sharePercent).toDecimalPlaces(2)

        await prisma.distributionCredit.upsert({
          where: { id: creditId },
          update: {},
          create: {
            id: creditId,
            distributionId: distId,
            depositorId: ds.depositorId,
            amountRM: creditAmount,
          },
        })
      }
    }
  }

  await seedReportsAndDistributions(
    solarContract.id,
    solarBiz.id,
    dec('0.2200'),
    dec('0.7800'),
    solarReportData,
    [
      { depositorId: dep1.id, sharePercent: dec('0.03846154') },
      { depositorId: dep2.id, sharePercent: dec('0.19230769') },
      { depositorId: dep3.id, sharePercent: dec('0.76923077') },
    ],
    'solar',
  )

  await seedReportsAndDistributions(
    smeContract.id,
    smeBiz.id,
    dec('0.2500'),
    dec('0.7500'),
    smeReportData,
    [
      { depositorId: dep1.id, sharePercent: dec('0.03846154') },
      { depositorId: dep2.id, sharePercent: dec('0.19230769') },
      { depositorId: dep3.id, sharePercent: dec('0.76923077') },
    ],
    'sme',
  )

  await seedReportsAndDistributions(
    housingContract.id,
    housingBiz.id,
    dec('0.2000'),
    dec('0.8000'),
    housingReportData,
    [
      { depositorId: dep1.id, sharePercent: dec('0.03846154') },
      { depositorId: dep2.id, sharePercent: dec('0.19230769') },
      { depositorId: dep3.id, sharePercent: dec('0.76923077') },
    ],
    'housing',
  )

  // ─── Update wallet balances ───────────────────────────────────────────────────
  // Sum all DistributionCredit amounts for each depositor and add to wallet

  for (const dep of [dep1, dep2, dep3]) {
    const credits = await prisma.distributionCredit.aggregate({
      where: { depositorId: dep.id },
      _sum: { amountRM: true },
    })
    const totalEarned = credits._sum.amountRM ?? dec('0')
    await prisma.depositor.update({
      where: { id: dep.id },
      data: {
        walletBalance: {
          increment: totalEarned,
        },
      },
    })
  }

  // ─── Audit log entries ────────────────────────────────────────────────────────

  const auditEntries = [
    { action: AuditAction.USER_REGISTERED, entityType: 'User', entityId: adminUser.id, payload: { email: adminUser.email } },
    { action: AuditAction.USER_REGISTERED, entityType: 'User', entityId: dep1User.id, payload: { email: dep1User.email } },
    { action: AuditAction.USER_REGISTERED, entityType: 'User', entityId: dep2User.id, payload: { email: dep2User.email } },
    { action: AuditAction.USER_REGISTERED, entityType: 'User', entityId: dep3User.id, payload: { email: dep3User.email } },
    { action: AuditAction.BUSINESS_APPROVED, entityType: 'Business', entityId: solarBiz.id, payload: { legalName: solarBiz.legalName } },
    { action: AuditAction.BUSINESS_APPROVED, entityType: 'Business', entityId: smeBiz.id, payload: { legalName: smeBiz.legalName } },
    { action: AuditAction.BUSINESS_APPROVED, entityType: 'Business', entityId: housingBiz.id, payload: { legalName: housingBiz.legalName } },
    { action: AuditAction.CONTRACT_CREATED, entityType: 'InvestmentContract', entityId: solarContract.id, payload: { contractType: 'MUSHARAKA' } },
    { action: AuditAction.CONTRACT_CREATED, entityType: 'InvestmentContract', entityId: smeContract.id, payload: { contractType: 'MUDARABA' } },
    { action: AuditAction.CONTRACT_CREATED, entityType: 'InvestmentContract', entityId: housingContract.id, payload: { contractType: 'MURABAHA' } },
  ]

  for (const entry of auditEntries) {
    await prisma.auditLog.create({
      data: {
        actorId: adminUser.id,
        actorRole: 'ADMIN',
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        payload: entry.payload,
      },
    })
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
