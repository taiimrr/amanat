-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DEPOSITOR', 'BUSINESS', 'ADMIN');

-- CreateEnum
CREATE TYPE "SectorType" AS ENUM ('GREEN_ENERGY', 'SME_FINANCING', 'AFFORDABLE_HOUSING', 'TRADE_FINANCE', 'AGRICULTURE');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('MUDARABA', 'MUSHARAKA', 'MURABAHA', 'IJARA', 'SALAM', 'WAKALA');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DEFAULTED', 'WATCHLIST');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('ACTIVE', 'EXITED', 'WATCHLIST');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('APPLICANT', 'APPROVED', 'ACTIVE', 'WATCHLIST', 'EXITED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'DISPUTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('PENDING', 'EXECUTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ZakatType" AS ENUM ('COLLECTED', 'DISBURSED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CONTRACT_CREATED', 'CONTRACT_WATCHLISTED', 'CONTRACT_COMPLETED', 'ALLOCATION_CREATED', 'ALLOCATION_EXITED', 'REPORT_SUBMITTED', 'REPORT_VERIFIED', 'REPORT_DISPUTED', 'REPORT_REJECTED', 'DISTRIBUTION_CALCULATED', 'DISTRIBUTION_EXECUTED', 'DISTRIBUTION_FAILED', 'ZAKAT_COLLECTED', 'ZAKAT_DISBURSED', 'BUSINESS_APPROVED', 'BUSINESS_WATCHLISTED', 'SHARIAH_FLAG_RAISED', 'TAWARRUQ_FLAG_RAISED', 'USER_REGISTERED', 'USER_LOGIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Depositor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "walletBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Depositor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "sector" "SectorType" NOT NULL,
    "description" TEXT NOT NULL,
    "dueDiligenceScore" INTEGER NOT NULL DEFAULT 0,
    "status" "BusinessStatus" NOT NULL DEFAULT 'APPLICANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentContract" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "principalRM" DECIMAL(18,2) NOT NULL,
    "bankFeeCapPct" DECIMAL(5,4) NOT NULL,
    "depositorSplitPct" DECIMAL(5,4) NOT NULL,
    "sector" "SectorType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositAllocation" (
    "id" TEXT NOT NULL,
    "depositorId" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "amountRM" DECIMAL(18,2) NOT NULL,
    "sharePercent" DECIMAL(10,8) NOT NULL,
    "status" "AllocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutcomeReport" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "revenueRM" DECIMAL(18,2) NOT NULL,
    "expensesRM" DECIMAL(18,2) NOT NULL,
    "grossProfitRM" DECIMAL(18,2) NOT NULL,
    "jobsSupported" INTEGER NOT NULL DEFAULT 0,
    "co2AvoidedTonnes" DECIMAL(10,4),
    "documentS3Keys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedByAdminId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "disputeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutcomeReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "grossProfitRM" DECIMAL(18,2) NOT NULL,
    "bankFeeRM" DECIMAL(18,2) NOT NULL,
    "zakatRM" DECIMAL(18,2) NOT NULL,
    "depositorPoolRM" DECIMAL(18,2) NOT NULL,
    "status" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),
    "failureReason" TEXT,

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionCredit" (
    "id" TEXT NOT NULL,
    "distributionId" TEXT NOT NULL,
    "depositorId" TEXT NOT NULL,
    "amountRM" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistributionCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZakatLedger" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "amountRM" DECIMAL(18,2) NOT NULL,
    "type" "ZakatType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZakatLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" "Role" NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Depositor_userId_key" ON "Depositor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Business_userId_key" ON "Business"("userId");

-- CreateIndex
CREATE INDEX "DepositAllocation_depositorId_idx" ON "DepositAllocation"("depositorId");

-- CreateIndex
CREATE INDEX "DepositAllocation_investmentId_idx" ON "DepositAllocation"("investmentId");

-- CreateIndex
CREATE INDEX "OutcomeReport_contractId_idx" ON "OutcomeReport"("contractId");

-- CreateIndex
CREATE INDEX "OutcomeReport_verificationStatus_idx" ON "OutcomeReport"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Distribution_reportId_key" ON "Distribution"("reportId");

-- CreateIndex
CREATE INDEX "Distribution_status_idx" ON "Distribution"("status");

-- CreateIndex
CREATE INDEX "DistributionCredit_depositorId_idx" ON "DistributionCredit"("depositorId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Depositor" ADD CONSTRAINT "Depositor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentContract" ADD CONSTRAINT "InvestmentContract_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositAllocation" ADD CONSTRAINT "DepositAllocation_depositorId_fkey" FOREIGN KEY ("depositorId") REFERENCES "Depositor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositAllocation" ADD CONSTRAINT "DepositAllocation_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "InvestmentContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutcomeReport" ADD CONSTRAINT "OutcomeReport_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "InvestmentContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutcomeReport" ADD CONSTRAINT "OutcomeReport_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "InvestmentContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "OutcomeReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionCredit" ADD CONSTRAINT "DistributionCredit_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "Distribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionCredit" ADD CONSTRAINT "DistributionCredit_depositorId_fkey" FOREIGN KEY ("depositorId") REFERENCES "Depositor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
