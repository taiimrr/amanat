# Amanat — Project Handoff Guide

## What you are building

**Amanat** (Arabic: "trust held in custody") is an Islamic fintech platform that makes ethical finance structurally tamper-resistant — not just policy-compliant. It connects depositors to real businesses through Shariah-compliant partnership contracts, tracks real-world outcomes via a verified data pipeline, and distributes profit transparently with a full audit trail.

The core problem it solves: Islamic banks today cannot tell a depositor exactly where their money went, what it generated, or prove the profit calculation is honest. Amanat makes all three verifiable by design.

This document covers the MVP — a fully working system with real data flows, no blockchain yet (deferred to Phase 4), and no real money movement (simulated balances). The goal is a demonstrable end-to-end system: depositor → bank → investment → business outcome reporting → profit distribution → depositor dashboard showing the full chain.

---

## Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Package manager | **Bun** | Replaces npm/npx everywhere. Use `bun`, `bunx`, `bun run` throughout. |
| Monorepo | Bun workspaces | `packages/*` workspace layout |
| Backend API | Node.js + TypeScript + Fastify | Fast, typed, lightweight |
| Database | PostgreSQL + Prisma ORM | Relational integrity, ACID transactions |
| Background jobs | BullMQ + Redis | Scheduled distributions, async processing |
| Auth | JWT (access token in memory + refresh token in httpOnly cookie) | Three roles: DEPOSITOR, BUSINESS, ADMIN |
| Testing | Bun test runner (`bun test`) | Built-in — no Vitest or Jest needed |
| Frontend | **Vue 3 + TypeScript + Vite** | Composition API + `<script setup>` throughout |
| UI library | **Vuetify 3** | Material Design components — no Tailwind |
| Client state | **Pinia** | Auth, notifications, UI preferences only |
| Routing | **Vue Router 4** | Role-based route guards |
| Server state | **TanStack Vue Query v5** | All API data — never duplicate in Pinia |
| Charts | **vue-apexcharts + ApexCharts** | First-class Vue 3 support |
| HTTP client | **Axios** | With auth interceptor for token injection |
| Money precision | **decimal.js** | Both frontend and backend — never JS float for money |
| Dev environment | Docker Compose | PostgreSQL 16 + Redis 7 |

---

## Repository structure

```
amanat/
├── packages/
│   ├── api/                         # Fastify backend (Bun runtime)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── depositors/
│   │   │   │   ├── businesses/
│   │   │   │   ├── contracts/
│   │   │   │   ├── allocations/
│   │   │   │   ├── oracle/
│   │   │   │   ├── distributions/
│   │   │   │   └── impact/
│   │   │   ├── lib/
│   │   │   │   ├── shariah-engine/
│   │   │   │   ├── compliance-guard/
│   │   │   │   └── audit-logger/
│   │   │   ├── jobs/
│   │   │   ├── plugins/
│   │   │   │   ├── prisma.ts
│   │   │   │   ├── redis.ts
│   │   │   │   ├── auth.ts
│   │   │   │   └── cors.ts
│   │   │   ├── hooks/
│   │   │   │   └── authenticate.ts
│   │   │   └── app.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── tests/
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                         # Vue 3 + Vuetify frontend
│       ├── src/
│       │   ├── plugins/
│       │   │   ├── vuetify.ts       # theme + component registration
│       │   │   ├── query.ts         # Vue Query client config
│       │   │   └── router.ts        # Vue Router + route guards
│       │   ├── stores/              # Pinia — client state ONLY
│       │   │   ├── auth.ts
│       │   │   ├── notifications.ts
│       │   │   └── preferences.ts
│       │   ├── composables/         # Vue Query hooks — all server state
│       │   │   ├── usePortfolio.ts
│       │   │   ├── useImpact.ts
│       │   │   ├── useDistributions.ts
│       │   │   ├── useAuditTrail.ts
│       │   │   ├── useContracts.ts
│       │   │   └── useReports.ts
│       │   ├── layouts/
│       │   │   ├── DepositorLayout.vue
│       │   │   ├── BusinessLayout.vue
│       │   │   └── AdminLayout.vue
│       │   ├── pages/
│       │   │   ├── auth/
│       │   │   │   └── LoginPage.vue
│       │   │   ├── depositor/
│       │   │   │   ├── DashboardPage.vue
│       │   │   │   ├── PortfolioPage.vue
│       │   │   │   ├── ImpactPage.vue
│       │   │   │   └── AuditPage.vue
│       │   │   ├── business/
│       │   │   │   ├── DashboardPage.vue
│       │   │   │   ├── ReportNewPage.vue
│       │   │   │   └── ReportsPage.vue
│       │   │   └── admin/
│       │   │       ├── ApplicationsPage.vue
│       │   │       ├── ContractsPage.vue
│       │   │       ├── ReportQueuePage.vue
│       │   │       ├── DistributionsPage.vue
│       │   │       └── ZakatPage.vue
│       │   ├── components/
│       │   │   ├── portfolio/
│       │   │   │   ├── AllocationTable.vue
│       │   │   │   └── InvestmentDrawer.vue
│       │   │   ├── impact/
│       │   │   │   ├── ProfitChain.vue
│       │   │   │   ├── ImpactMetrics.vue
│       │   │   │   └── VerificationBadges.vue
│       │   │   └── shared/
│       │   │       ├── AppSnackbar.vue   # global notification outlet
│       │   │       ├── RmAmount.vue      # formatted RM display
│       │   │       └── StatusChip.vue    # reusable status badge
│       │   ├── api/
│       │   │   ├── client.ts             # axios instance + interceptors
│       │   │   └── endpoints/
│       │   ├── assets/
│       │   │   └── main.css
│       │   ├── App.vue
│       │   └── main.ts
│       ├── index.html
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── package.json
├── bunfig.toml
├── docker-compose.yml
├── package.json                     # root — bun workspace scripts
└── README.md
```

---

## Bun commands reference

Always use `bun` / `bunx` — never `npm`, `npx`, or `node` directly.

```bash
# Install all dependencies across workspaces
bun install

# Run scripts
bun run dev:api          # start backend
bun run dev:web          # start frontend
bun run test             # run backend tests (bun test)
bun run db:migrate       # prisma migrate dev
bun run db:seed          # run seed script
bun run db:studio        # prisma studio

# Inside packages/api directly
bunx prisma generate
bunx prisma migrate dev --name <name>
bunx prisma studio

# Run a single test file
bun test src/lib/shariah-engine/contract-validator.test.ts
```

Root `package.json` scripts use `--cwd` not `--workspace`:
```json
{
  "scripts": {
    "dev:api": "bun run dev --cwd packages/api",
    "dev:web": "bun run dev --cwd packages/web",
    "db:migrate": "bun run db:migrate --cwd packages/api",
    "db:seed": "bun run db:seed --cwd packages/api",
    "db:studio": "bun run db:studio --cwd packages/api",
    "test": "bun run test --cwd packages/api"
  }
}
```

API `package.json` scripts:
```json
{
  "scripts": {
    "dev": "bun run --watch src/app.ts",
    "build": "bun build src/app.ts --outdir dist --target bun",
    "start": "bun run dist/app.js",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "db:migrate": "bunx prisma migrate dev",
    "db:seed": "bun run prisma/seed.ts",
    "db:studio": "bunx prisma studio",
    "db:generate": "bunx prisma generate"
  }
}
```

---

## Backend dependencies (`packages/api`)

```json
{
  "dependencies": {
    "@prisma/client": "^5.15.0",
    "fastify": "^4.28.0",
    "@fastify/jwt": "^8.0.0",
    "@fastify/cookie": "^9.4.0",
    "@fastify/cors": "^9.0.0",
    "@fastify/helmet": "^11.1.0",
    "@fastify/multipart": "^8.3.0",
    "@fastify/rate-limit": "^9.1.0",
    "fastify-plugin": "^4.5.1",
    "bullmq": "^5.12.0",
    "ioredis": "^5.4.1",
    "bcryptjs": "^2.4.3",
    "decimal.js": "^10.4.3",
    "zod": "^3.23.8",
    "pino": "^9.3.1",
    "pino-pretty": "^11.2.1"
  },
  "devDependencies": {
    "prisma": "^5.15.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/bun": "latest"
  }
}
```

Note: No `typescript`, `tsx`, or `vitest` in devDependencies — Bun handles TypeScript natively and has a built-in test runner.

---

## Frontend dependencies (`packages/web`)

```json
{
  "dependencies": {
    "vue": "^3.4.31",
    "vue-router": "^4.3.3",
    "pinia": "^2.1.7",
    "pinia-plugin-persistedstate": "^3.2.1",
    "vuetify": "^3.6.11",
    "@mdi/font": "^7.4.47",
    "@tanstack/vue-query": "^5.51.1",
    "vue-apexcharts": "^1.8.0",
    "apexcharts": "^3.54.0",
    "axios": "^1.7.2",
    "decimal.js": "^10.4.3"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.2",
    "vite": "^5.3.5",
    "vite-plugin-vuetify": "^2.0.4",
    "typescript": "^5.5.3",
    "vue-tsc": "^2.0.29"
  }
}
```

Note: No `aws-amplify` in MVP — Cognito integration is deferred to Phase 6 (real money / regulatory sandbox). Auth is JWT-based for MVP.

---

## Database schema (Prisma)

The full canonical schema. Implement exactly as written. The `AuditLog` table is append-only — enforce with a Postgres trigger that blocks UPDATE and DELETE at the database level, not just application level.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ────────────────────────────────────────────────────────────────────

enum Role {
  DEPOSITOR
  BUSINESS
  ADMIN
}

enum SectorType {
  GREEN_ENERGY
  SME_FINANCING
  AFFORDABLE_HOUSING
  TRADE_FINANCE
  AGRICULTURE
}

enum ContractType {
  MUDARABA
  MUSHARAKA
  MURABAHA
  IJARA
  SALAM
  WAKALA
}

enum ContractStatus {
  ACTIVE
  COMPLETED
  DEFAULTED
  WATCHLIST
}

enum AllocationStatus {
  ACTIVE
  EXITED
  WATCHLIST
}

enum BusinessStatus {
  APPLICANT
  APPROVED
  ACTIVE
  WATCHLIST
  EXITED
}

enum VerificationStatus {
  PENDING
  VERIFIED
  DISPUTED
  REJECTED
}

enum DistributionStatus {
  PENDING
  EXECUTED
  FAILED
}

enum ZakatType {
  COLLECTED
  DISBURSED
}

enum AuditAction {
  CONTRACT_CREATED
  CONTRACT_WATCHLISTED
  CONTRACT_COMPLETED
  ALLOCATION_CREATED
  ALLOCATION_EXITED
  REPORT_SUBMITTED
  REPORT_VERIFIED
  REPORT_DISPUTED
  REPORT_REJECTED
  DISTRIBUTION_CALCULATED
  DISTRIBUTION_EXECUTED
  DISTRIBUTION_FAILED
  ZAKAT_COLLECTED
  ZAKAT_DISBURSED
  BUSINESS_APPROVED
  BUSINESS_WATCHLISTED
  SHARIAH_FLAG_RAISED
  TAWARRUQ_FLAG_RAISED
  USER_REGISTERED
  USER_LOGIN
}

// ─── Core user models ─────────────────────────────────────────────────────────

model User {
  id           String     @id @default(uuid())
  email        String     @unique
  passwordHash String
  role         Role
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  depositor    Depositor?
  business     Business?
  auditLogs    AuditLog[]

  @@index([email])
}

model Depositor {
  id            String               @id @default(uuid())
  userId        String               @unique
  user          User                 @relation(fields: [userId], references: [id])
  displayName   String
  walletBalance Decimal              @default(0) @db.Decimal(18, 2)
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt
  allocations   DepositAllocation[]
  credits       DistributionCredit[]
}

model Business {
  id                 String               @id @default(uuid())
  userId             String               @unique
  user               User                 @relation(fields: [userId], references: [id])
  legalName          String
  registrationNumber String?
  sector             SectorType
  description        String               @db.Text
  dueDiligenceScore  Int                  @default(0)
  status             BusinessStatus       @default(APPLICANT)
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt
  contracts          InvestmentContract[]
  reports            OutcomeReport[]
}

// ─── Investment models ────────────────────────────────────────────────────────

model InvestmentContract {
  id                String               @id @default(uuid())
  businessId        String
  business          Business             @relation(fields: [businessId], references: [id])
  contractType      ContractType
  principalRM       Decimal              @db.Decimal(18, 2)
  bankFeeCapPct     Decimal              @db.Decimal(5, 4)    // e.g. 0.2200 = 22%
  depositorSplitPct Decimal              @db.Decimal(5, 4)    // e.g. 0.7800 = 78%
  sector            SectorType
  startDate         DateTime
  endDate           DateTime?
  status            ContractStatus       @default(ACTIVE)
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  allocations       DepositAllocation[]
  reports           OutcomeReport[]
  distributions     Distribution[]
}

model DepositAllocation {
  id           String             @id @default(uuid())
  depositorId  String
  depositor    Depositor          @relation(fields: [depositorId], references: [id])
  investmentId String
  investment   InvestmentContract @relation(fields: [investmentId], references: [id])
  amountRM     Decimal            @db.Decimal(18, 2)
  sharePercent Decimal            @db.Decimal(10, 8)   // depositor's % of this pool
  status       AllocationStatus   @default(ACTIVE)
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt

  @@index([depositorId])
  @@index([investmentId])
}

// ─── Oracle / outcome reporting ───────────────────────────────────────────────

model OutcomeReport {
  id                 String             @id @default(uuid())
  contractId         String
  contract           InvestmentContract @relation(fields: [contractId], references: [id])
  businessId         String
  business           Business           @relation(fields: [businessId], references: [id])
  periodStart        DateTime
  periodEnd          DateTime
  revenueRM          Decimal            @db.Decimal(18, 2)
  expensesRM         Decimal            @db.Decimal(18, 2)
  grossProfitRM      Decimal            @db.Decimal(18, 2)   // always = revenue - expenses, computed on write
  jobsSupported      Int                @default(0)
  co2AvoidedTonnes   Decimal?           @db.Decimal(10, 4)   // green energy sector
  documentS3Keys     String[]           @default([])          // supporting document references
  verificationStatus VerificationStatus @default(PENDING)
  verifiedByAdminId  String?
  verifiedAt         DateTime?
  disputeReason      String?            @db.Text
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  distribution       Distribution?

  @@index([contractId])
  @@index([verificationStatus])
}

// ─── Distribution models ──────────────────────────────────────────────────────

model Distribution {
  id              String             @id @default(uuid())
  contractId      String
  contract        InvestmentContract @relation(fields: [contractId], references: [id])
  reportId        String             @unique
  report          OutcomeReport      @relation(fields: [reportId], references: [id])
  grossProfitRM   Decimal            @db.Decimal(18, 2)
  bankFeeRM       Decimal            @db.Decimal(18, 2)
  zakatRM         Decimal            @db.Decimal(18, 2)    // 2.5% of bank fee — always
  depositorPoolRM Decimal            @db.Decimal(18, 2)
  status          DistributionStatus @default(PENDING)
  calculatedAt    DateTime           @default(now())
  executedAt      DateTime?
  failureReason   String?            @db.Text
  credits         DistributionCredit[]

  @@index([status])
}

model DistributionCredit {
  id             String       @id @default(uuid())
  distributionId String
  distribution   Distribution @relation(fields: [distributionId], references: [id])
  depositorId    String
  depositor      Depositor    @relation(fields: [depositorId], references: [id])
  amountRM       Decimal      @db.Decimal(18, 2)
  createdAt      DateTime     @default(now())

  @@index([depositorId])
}

// ─── Zakat ────────────────────────────────────────────────────────────────────

model ZakatLedger {
  id        String    @id @default(uuid())
  sourceId  String                          // distributionId (COLLECTED) or reference (DISBURSED)
  amountRM  Decimal   @db.Decimal(18, 2)
  type      ZakatType
  note      String?   @db.Text
  createdAt DateTime  @default(now())
}

// ─── Audit log — APPEND ONLY. No updates. No deletes. Ever. ──────────────────

model AuditLog {
  id         String      @id @default(uuid())
  actorId    String
  actor      User        @relation(fields: [actorId], references: [id])
  actorRole  Role
  action     AuditAction
  entityType String
  entityId   String
  payload    Json
  createdAt  DateTime    @default(now())

  @@index([entityType, entityId])
  @@index([actorId])
  @@index([action])
  @@index([createdAt])
}
```

After applying the schema, add a Postgres trigger to enforce append-only on AuditLog at the database level:

```sql
-- Run this after prisma migrate dev
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only. Updates and deletes are not permitted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
```

---

## Module 1 — Shariah engine (`packages/api/src/lib/shariah-engine/`)

The core compliance brain. Runs before any contract or allocation write. Never bypass it.

### `contract-validator.ts`

```typescript
import type { ContractType } from '@prisma/client'

export interface ContractInput {
  contractType: ContractType
  bankFeeCapPct: number
  depositorSplitPct: number
  markupFixedAtSigning?: boolean
  markupAccruesOverTime?: boolean
  lateFeeGoesToCharity?: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateContract(input: ContractInput): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (input.bankFeeCapPct > 0.40) {
    errors.push(`Bank fee cap ${input.bankFeeCapPct} exceeds maximum allowed 0.40 (40%)`)
  }

  const sum = input.bankFeeCapPct + input.depositorSplitPct
  if (Math.abs(sum - 1.0) > 0.0001) {
    errors.push(`bankFeeCapPct + depositorSplitPct must equal 1.0, got ${sum}`)
  }

  if (input.contractType === 'MURABAHA') {
    if (input.markupAccruesOverTime === true)
      errors.push('MURABAHA: markup must not accrue over time (this would constitute riba)')
    if (input.markupFixedAtSigning !== true)
      errors.push('MURABAHA: markup must be fixed at signing')
    if (input.lateFeeGoesToCharity !== true)
      warnings.push('MURABAHA: late fees should go to charity, not the bank')
  }

  return { valid: errors.length === 0, errors, warnings }
}
```

### `sector-exclusion.ts`

```typescript
export interface ExclusionResult {
  blocked: boolean
  reason?: string
}

const BLOCKED_KEYWORDS = [
  'alcohol', 'liquor', 'beer', 'wine', 'spirits', 'brewery',
  'tobacco', 'cigarette', 'vaping',
  'gambling', 'casino', 'betting', 'lottery',
  'weapons', 'ammunition', 'firearms',
  'pornography', 'adult content',
  'interest', 'conventional bank', 'moneylending',
  'pork', 'swine',
]

export function checkSectorExclusion(description: string): ExclusionResult {
  const lower = description.toLowerCase()
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { blocked: true, reason: `Prohibited term found: "${keyword}"` }
    }
  }
  return { blocked: false }
}
```

### `tawarruq-detector.ts`

```typescript
export interface TawarruqFlag {
  flagged: boolean
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  evidence: string
}

interface Transaction {
  businessId: string
  counterpartyId: string
  commodity: string
  amountRM: number
  timestamp: Date
  direction: 'BUY' | 'SELL'
}

export function detectTawarruqPattern(transactions: Transaction[]): TawarruqFlag {
  const WINDOW_HOURS = 48
  const AMOUNT_TOLERANCE = 0.02  // 2%

  for (let i = 0; i < transactions.length; i++) {
    const buy = transactions[i]
    if (buy.direction !== 'BUY') continue

    for (let j = i + 1; j < transactions.length; j++) {
      const sell = transactions[j]
      if (sell.direction !== 'SELL') continue
      if (sell.commodity !== buy.commodity) continue
      if (sell.counterpartyId !== buy.businessId) continue

      const hoursDiff = (sell.timestamp.getTime() - buy.timestamp.getTime()) / 3_600_000
      if (hoursDiff > WINDOW_HOURS) continue

      const amountDiff = Math.abs(sell.amountRM - buy.amountRM) / buy.amountRM
      if (amountDiff <= AMOUNT_TOLERANCE) {
        return {
          flagged: true,
          confidence: hoursDiff < 2 ? 'HIGH' : 'MEDIUM',
          evidence: `Same commodity "${buy.commodity}" bought and sold back within ${hoursDiff.toFixed(1)}h, amounts within ${(amountDiff * 100).toFixed(1)}%`,
        }
      }
    }
  }

  return { flagged: false, confidence: 'LOW', evidence: 'No Tawarruq pattern detected' }
}
```

### `profit-ratio-guard.ts`

```typescript
import { Decimal } from 'decimal.js'

export interface ProfitDistribution {
  grossProfitRM: Decimal
  bankFeeCapPct: Decimal
}

export interface DistributionBreakdown {
  grossProfitRM: Decimal
  bankFeeRM: Decimal
  zakatRM: Decimal
  depositorPoolRM: Decimal
  valid: boolean
  errors: string[]
}

const ZAKAT_RATE = new Decimal('0.025')
const MAX_BANK_FEE_PCT = new Decimal('0.40')

export function calculateDistributionBreakdown(input: ProfitDistribution): DistributionBreakdown {
  const errors: string[] = []

  if (input.bankFeeCapPct.gt(MAX_BANK_FEE_PCT)) {
    errors.push(`Bank fee ${input.bankFeeCapPct} exceeds maximum ${MAX_BANK_FEE_PCT}`)
  }

  const bankFeeRM = input.grossProfitRM.mul(input.bankFeeCapPct).toDecimalPlaces(2)
  const zakatRM = bankFeeRM.mul(ZAKAT_RATE).toDecimalPlaces(2)
  const depositorPoolRM = input.grossProfitRM.minus(bankFeeRM).toDecimalPlaces(2)

  return { grossProfitRM: input.grossProfitRM, bankFeeRM, zakatRM, depositorPoolRM, valid: errors.length === 0, errors }
}
```

---

## Module 2 — Compliance guard (`packages/api/src/lib/compliance-guard/`)

### `concentration-limiter.ts`

```typescript
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
  amountRM: Decimal
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
```

### `due-diligence-scorer.ts`

Five dimensions, each 0–20, total 0–100. Eligible if score ≥ 70.

```typescript
export interface BusinessApplication {
  yearsInOperation: number
  hasDefaultHistory: boolean
  annualRevenueRM: number
  debtToEquityRatio: number
  jobsPerMillionRM: number
  revenueGrowthPct: number
  sectorImpactScore: number   // manually assessed 0–20
  hasExcludedRevenueSources: boolean
  carbonIntensityScore: number // 0–20, higher = lower carbon
}

export interface DueDiligenceScore {
  total: number
  breakdown: {
    financialViability: number
    managementTrackRecord: number
    sectorImpactPotential: number
    shariahCompliance: number
    environmentalFootprint: number
  }
  eligible: boolean
}

export function scoreBusiness(app: BusinessApplication): DueDiligenceScore {
  const financialViability = Math.min(20,
    (app.annualRevenueRM > 500_000 ? 8 : 4) +
    (app.debtToEquityRatio < 1 ? 6 : app.debtToEquityRatio < 2 ? 3 : 0) +
    (app.revenueGrowthPct > 10 ? 6 : app.revenueGrowthPct > 0 ? 3 : 0)
  )

  const managementTrackRecord = Math.min(20,
    Math.min(app.yearsInOperation * 3, 15) +
    (app.hasDefaultHistory ? 0 : 5)
  )

  const sectorImpactPotential = Math.min(20,
    Math.min(app.jobsPerMillionRM * 2, 10) +
    Math.min(app.sectorImpactScore, 10)
  )

  const shariahCompliance = app.hasExcludedRevenueSources ? 0 : 20

  const environmentalFootprint = Math.min(20, app.carbonIntensityScore)

  const breakdown = { financialViability, managementTrackRecord, sectorImpactPotential, shariahCompliance, environmentalFootprint }
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0)

  return { total, breakdown, eligible: total >= 70 }
}
```

---

## Module 3 — Audit logger (`packages/api/src/lib/audit-logger/index.ts`)

Every mutating operation calls this. Always pass the active Prisma transaction client.

```typescript
import type { PrismaClient, Role, AuditAction } from '@prisma/client'

interface LogParams {
  prisma: PrismaClient
  actorId: string
  actorRole: Role
  action: AuditAction
  entityType: string
  entityId: string
  payload: Record<string, unknown>
}

export async function logAction({ prisma, actorId, actorRole, action, entityType, entityId, payload }: LogParams): Promise<void> {
  await (prisma as PrismaClient).auditLog.create({
    data: { actorId, actorRole, action, entityType, entityId, payload },
  })
}
```

---

## Module 4 — Distribution engine

The most critical module. All steps must be atomic — use a Postgres transaction wrapping all writes.

### Calculation (pure function — no DB writes)

```typescript
import { Decimal } from 'decimal.js'
import { calculateDistributionBreakdown } from '../lib/shariah-engine/profit-ratio-guard'

export async function calculateDistribution(prisma: PrismaClient, reportId: string) {
  const report = await prisma.outcomeReport.findUniqueOrThrow({
    where: { id: reportId },
    include: { contract: { include: { allocations: { where: { status: 'ACTIVE' } } } } },
  })

  const breakdown = calculateDistributionBreakdown({
    grossProfitRM: new Decimal(report.grossProfitRM.toString()),
    bankFeeCapPct: new Decimal(report.contract.bankFeeCapPct.toString()),
  })

  if (!breakdown.valid) throw new Error(`Distribution invalid: ${breakdown.errors.join(', ')}`)

  const credits = report.contract.allocations.map(allocation => ({
    depositorId: allocation.depositorId,
    amountRM: breakdown.depositorPoolRM
      .mul(new Decimal(allocation.sharePercent.toString()))
      .toDecimalPlaces(2),
  }))

  // Verify credits sum matches depositorPool (within RM 0.01 rounding tolerance)
  const creditSum = credits.reduce((sum, c) => sum.plus(c.amountRM), new Decimal(0))
  if (breakdown.depositorPoolRM.minus(creditSum).abs().gt(new Decimal('0.01'))) {
    throw new Error(`Credit sum ${creditSum} does not match depositorPool ${breakdown.depositorPoolRM}`)
  }

  return { breakdown, credits, report }
}
```

### Execution (atomic Postgres transaction)

```typescript
export async function executeDistribution(prisma: PrismaClient, reportId: string, actorId: string) {
  const { breakdown, credits, report } = await calculateDistribution(prisma, reportId)

  return await prisma.$transaction(async (tx) => {
    // 1. Create Distribution record
    const distribution = await tx.distribution.create({
      data: {
        contractId: report.contractId,
        reportId,
        grossProfitRM: breakdown.grossProfitRM.toFixed(2),
        bankFeeRM: breakdown.bankFeeRM.toFixed(2),
        zakatRM: breakdown.zakatRM.toFixed(2),
        depositorPoolRM: breakdown.depositorPoolRM.toFixed(2),
        status: 'PENDING',
      },
    })

    // 2. Create credits + increment depositor balances
    for (const credit of credits) {
      await tx.distributionCredit.create({
        data: { distributionId: distribution.id, depositorId: credit.depositorId, amountRM: credit.amountRM.toFixed(2) },
      })
      await tx.depositor.update({
        where: { id: credit.depositorId },
        data: { walletBalance: { increment: credit.amountRM.toNumber() } },
      })
    }

    // 3. Zakat ledger entry
    await tx.zakatLedger.create({
      data: { sourceId: distribution.id, amountRM: breakdown.zakatRM.toFixed(2), type: 'COLLECTED', note: `Auto from distribution ${distribution.id}` },
    })

    // 4. Mark distribution executed
    await tx.distribution.update({
      where: { id: distribution.id },
      data: { status: 'EXECUTED', executedAt: new Date() },
    })

    // 5. Audit log (inside the same transaction)
    await tx.auditLog.create({
      data: {
        actorId,
        actorRole: 'ADMIN',
        action: 'DISTRIBUTION_EXECUTED',
        entityType: 'Distribution',
        entityId: distribution.id,
        payload: { reportId, grossProfitRM: breakdown.grossProfitRM.toFixed(2), bankFeeRM: breakdown.bankFeeRM.toFixed(2), zakatRM: breakdown.zakatRM.toFixed(2), depositorPoolRM: breakdown.depositorPoolRM.toFixed(2), creditCount: credits.length },
      },
    })

    return distribution
  })
}
```

---

## API routes reference

### Auth
- `POST /api/auth/register` — create user (role in body: DEPOSITOR | BUSINESS | ADMIN)
- `POST /api/auth/login` — returns access token in JSON + sets refresh token in httpOnly cookie
- `POST /api/auth/refresh` — reads refresh cookie, returns new access token
- `POST /api/auth/logout` — clears refresh cookie

### Depositor
- `GET /api/depositor/me/portfolio` — balance, allocations, health per contract
- `GET /api/depositor/me/impact` — financial + social + environmental metrics, verification badges
- `GET /api/depositor/me/distributions` — paginated distribution history with full profit chain
- `GET /api/depositor/me/audit-trail` — paginated audit log for this depositor

### Investments (admin)
- `POST /api/contracts` — create contract (runs Shariah engine validation)
- `GET /api/contracts` — list all contracts with status and health
- `PATCH /api/contracts/:id/watchlist` — flag a contract

### Allocations (depositor)
- `POST /api/allocations` — allocate funds (runs concentration check)
- `DELETE /api/allocations/:id` — exit an allocation

### Oracle (business + admin)
- `POST /api/reports` — business submits monthly outcome report
- `GET /api/reports?status=PENDING` — admin fetches unverified queue
- `POST /api/reports/:id/verify` — admin verifies → triggers distribution automatically
- `POST /api/reports/:id/dispute` — admin disputes with reason

### Businesses (admin)
- `GET /api/businesses?status=APPLICANT` — review queue
- `POST /api/businesses/:id/approve` — approve with due diligence score
- `POST /api/businesses/:id/watchlist` — flag business

### Distributions (admin)
- `GET /api/distributions` — paginated list with status
- `GET /api/distributions/:id` — full breakdown + per-depositor credits

### Zakat (admin)
- `GET /api/zakat` — ledger with running balance
- `POST /api/zakat/disburse` — record a disbursement

---

## Frontend — Vue 3 + Vuetify 3 + Pinia

### Core rules

1. **Server state in Vue Query, client state in Pinia — never cross them.** API response data never goes into Pinia stores. If two components need the same API data, they both call the same `useQuery` composable — Vue Query deduplicates and caches.

2. **Never use `parseFloat()` or JS `number` for money.** Parse all monetary input with `new Decimal(value)` (decimal.js). Display with a global `formatRM(value)` composable using `Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' })`.

3. **Token in memory only.** `accessToken` in Pinia auth store is never written to localStorage or sessionStorage. Axios interceptor attaches it to requests. Refresh token lives in an httpOnly cookie set by the server.

4. **Vuetify tree-shaking is required.** `vite-plugin-vuetify` with `autoImport: true` must be configured in `vite.config.ts`. Without it the Vuetify bundle is ~1.5MB uncompressed.

5. **Server-side pagination for all large tables.** `v-data-table` with `:items-length="totalCount"` + `@update:options` handler. Never load all rows into the DOM.

### Vuetify theme

```typescript
// src/plugins/vuetify.ts
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

export const vuetify = createVuetify({
  icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  theme: {
    defaultTheme: 'amanatLight',
    themes: {
      amanatLight: {
        dark: false,
        colors: {
          primary:    '#1A6B4A',   // deep green — trust
          secondary:  '#C8960C',   // gold — prosperity
          success:    '#2D7A4F',
          warning:    '#B86A00',
          error:      '#C0392B',
          info:       '#1A5F8A',
          surface:    '#FAFAF8',
          background: '#F4F4F0',
        },
      },
    },
  },
  defaults: {
    VCard:      { elevation: 1, rounded: 'lg' },
    VBtn:       { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect:    { variant: 'outlined', density: 'comfortable' },
    VDataTable: { hover: true },
  },
})
```

### Pinia stores

```typescript
// stores/auth.ts — Composition API style
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AuthUser {
  id: string
  email: string
  role: 'DEPOSITOR' | 'BUSINESS' | 'ADMIN'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(null)  // memory only

  const isAuthenticated = computed(() => !!user.value && !!accessToken.value)
  const isDepositor = computed(() => user.value?.role === 'DEPOSITOR')
  const isBusiness  = computed(() => user.value?.role === 'BUSINESS')
  const isAdmin     = computed(() => user.value?.role === 'ADMIN')

  function setAuth(userData: AuthUser, token: string) {
    user.value = userData
    accessToken.value = token
  }

  function clearAuth() {
    user.value = null
    accessToken.value = null
  }

  return { user, accessToken, isAuthenticated, isDepositor, isBusiness, isAdmin, setAuth, clearAuth }
})

// stores/notifications.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

type NotificationType = 'success' | 'error' | 'warning' | 'info'
interface Notification { id: string; message: string; type: NotificationType }

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<Notification[]>([])

  function push(message: string, type: NotificationType, durationMs = 4000) {
    const id = crypto.randomUUID()
    items.value.push({ id, message, type })
    if (durationMs > 0) setTimeout(() => dismiss(id), durationMs)
    return id
  }

  const success = (msg: string) => push(msg, 'success')
  const error   = (msg: string) => push(msg, 'error', 6000)
  const warn    = (msg: string) => push(msg, 'warning')
  const info    = (msg: string) => push(msg, 'info')

  function dismiss(id: string) { items.value = items.value.filter(n => n.id !== id) }

  return { items, success, error, warn, info, dismiss }
})

// stores/preferences.ts — persisted to localStorage (UI prefs only, nothing financial)
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePreferencesStore = defineStore('preferences', () => {
  const selectedPeriod = ref('current')
  const sidebarOpen    = ref(true)
  return { selectedPeriod, sidebarOpen }
}, { persist: true })
```

### Axios client

```typescript
// api/client.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,  // httpOnly refresh token cookie
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) config.headers.Authorization = `Bearer ${auth.accessToken}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore().clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### Vue Query composables pattern

```typescript
// composables/usePortfolio.ts
import { useQuery } from '@tanstack/vue-query'
import { apiClient } from '@/api/client'

export function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data } = await apiClient.get('/depositor/me/portfolio')
      return data
    },
    staleTime: 30_000,
  })
}

// composables/useImpact.ts
import type { Ref } from 'vue'

export function useImpactStatement(period: Ref<string>) {
  return useQuery({
    queryKey: ['impact', period],   // reactive — query re-runs when period changes
    queryFn: async () => {
      const { data } = await apiClient.get(`/depositor/me/impact?period=${period.value}`)
      return data
    },
  })
}
```

### Vuetify component map

| UI element | Vuetify component | Key props / notes |
|---|---|---|
| Portfolio table | `v-data-table` | `:items-length` + `@update:options` for server pagination |
| Investment detail panel | `v-navigation-drawer` | `temporary` + right side — opens on row click |
| Status badges | `v-chip` | `color="success/warning/error"` per status |
| Distribution workflow | `v-stepper` | Calculate → Validate → Execute → Credit stages |
| Audit timeline | `v-timeline` | MDI icon per action type, alternating sides |
| Report form | `v-form` + `v-text-field` | Built-in `:rules` — no extra validation library |
| Global notifications | `v-snackbar` | One outlet in `App.vue`, driven by `useNotificationStore` |
| Loading skeletons | `v-skeleton-loader` | Driven by Vue Query `isLoading` flag |
| Summary cards | `v-card` in `v-row`/`v-col` | `cols="12" sm="6" md="3"` responsive grid |
| Sector breakdown chart | `VueApexCharts` donut | Inside a `v-card` |
| Document upload | `v-file-input` | Progress via `v-progress-linear` |

### Vue Router with role guards

```typescript
// plugins/router.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/pages/auth/LoginPage.vue'), meta: { public: true } },
    {
      path: '/depositor',
      component: () => import('@/layouts/DepositorLayout.vue'),
      meta: { role: 'DEPOSITOR' },
      children: [
        { path: '', redirect: '/depositor/dashboard' },
        { path: 'dashboard', name: 'depositor-dashboard', component: () => import('@/pages/depositor/DashboardPage.vue') },
        { path: 'portfolio',  name: 'depositor-portfolio', component: () => import('@/pages/depositor/PortfolioPage.vue') },
        { path: 'impact',     name: 'depositor-impact',    component: () => import('@/pages/depositor/ImpactPage.vue') },
        { path: 'audit',      name: 'depositor-audit',     component: () => import('@/pages/depositor/AuditPage.vue') },
      ],
    },
    {
      path: '/business',
      component: () => import('@/layouts/BusinessLayout.vue'),
      meta: { role: 'BUSINESS' },
      children: [
        { path: '', redirect: '/business/dashboard' },
        { path: 'dashboard',  name: 'business-dashboard',   component: () => import('@/pages/business/DashboardPage.vue') },
        { path: 'reports',    name: 'business-reports',     component: () => import('@/pages/business/ReportsPage.vue') },
        { path: 'reports/new', name: 'business-report-new', component: () => import('@/pages/business/ReportNewPage.vue') },
      ],
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { role: 'ADMIN' },
      children: [
        { path: '', redirect: '/admin/applications' },
        { path: 'applications',  name: 'admin-applications',  component: () => import('@/pages/admin/ApplicationsPage.vue') },
        { path: 'contracts',     name: 'admin-contracts',     component: () => import('@/pages/admin/ContractsPage.vue') },
        { path: 'reports',       name: 'admin-reports',       component: () => import('@/pages/admin/ReportQueuePage.vue') },
        { path: 'distributions', name: 'admin-distributions', component: () => import('@/pages/admin/DistributionsPage.vue') },
        { path: 'zakat',         name: 'admin-zakat',         component: () => import('@/pages/admin/ZakatPage.vue') },
      ],
    },
    { path: '/', redirect: '/login' },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) return true
  if (!auth.isAuthenticated) return '/login'
  const required = to.meta.role as string | undefined
  if (required && auth.user?.role !== required) return '/login'
  return true
})

export default router
```

---

## Critical implementation rules

These are non-negotiable. They are what makes Amanat different from a normal CRUD app.

1. **Shariah engine runs before every contract or allocation write.** If validation fails, return 400 with the full `errors` array. Never silently skip validation.

2. **AuditLog is append-only at the database level.** The Postgres trigger (see schema section) blocks UPDATE and DELETE. The application-level check is a second layer, not the only layer.

3. **Distribution execution is a single Postgres transaction.** All depositor credits happen atomically. A partial distribution (some depositors credited, others not) must be impossible.

4. **Bank fee cap is read from the contract record, never from request parameters.** The distribution calculator reads `contract.bankFeeCapPct` — it does not accept it as an input parameter at distribution time.

5. **Never use JS `number` for money.** Use `Decimal` from decimal.js on both frontend and backend. Prisma returns Decimal objects — always call `.toString()` before passing to `new Decimal()`.

6. **No soft deletes on financial records.** Contracts, allocations, reports, distributions — status fields change, records stay forever.

7. **Always pass the Prisma transaction client to `logAction`.** If the audit log write fails, the whole transaction rolls back. This is intentional — a financial operation without an audit record must not be committed.

8. **Bun only.** Never use `npm`, `npx`, or `node` in scripts or documentation. Always `bun`, `bunx`, `bun run`.

---

## Seed data

`packages/api/prisma/seed.ts` — run with `bun run db:seed`.

**Credentials:**

| Email | Password | Role |
|---|---|---|
| `admin@amanat.dev` | `Admin1234!` | ADMIN |
| `depositor1@amanat.dev` | `Test1234!` | DEPOSITOR — RM 5,000 |
| `depositor2@amanat.dev` | `Test1234!` | DEPOSITOR — RM 25,000 |
| `depositor3@amanat.dev` | `Test1234!` | DEPOSITOR — RM 100,000 |
| `sabahsolar@amanat.dev` | `Test1234!` | BUSINESS — GREEN_ENERGY, score 85 |
| `klsme@amanat.dev` | `Test1234!` | BUSINESS — SME_FINANCING, score 78 |
| `selangorhousing@amanat.dev` | `Test1234!` | BUSINESS — AFFORDABLE_HOUSING, score 82 |

**Contracts:**

| Business | Type | Principal | Bank fee | Depositor split |
|---|---|---|---|---|
| Sabah Solar Farm | MUSHARAKA | RM 2,000,000 | 22% | 78% |
| KL SME Fund | MUDARABA | RM 800,000 | 25% | 75% |
| Selangor Housing | MURABAHA | RM 1,500,000 | 20% | 80% |

**Allocations** (respect concentration limits):
- Depositor 1: RM 2,000 solar / RM 1,500 SME / RM 1,500 housing
- Depositor 2: RM 10,000 solar / RM 7,500 SME / RM 7,500 housing
- Depositor 3: RM 40,000 solar / RM 30,000 SME / RM 30,000 housing

**Reports:** 3 verified reports per contract (last 3 months), with executed distributions. Depositor wallet balances must reflect accumulated profit — do not leave balances at starting values.

---

## Suggested session sequence

| Session | Goal |
|---|---|
| 1 | Scaffold + database + health check (covered by initial prompt) |
| 2 | Auth module — register, login, refresh token, route guards |
| 3 | Shariah engine — full `bun test` unit tests for all four modules |
| 4 | Contracts + allocations API with all guards enforced |
| 5 | Oracle module — report submit + admin verify → distribution trigger |
| 6 | Distribution engine — atomic execution + zakat ledger |
| 7 | Depositor portfolio + audit trail API endpoints |
| 8 | Vue depositor dashboard + portfolio page |
| 9 | Vue impact statement page |
| 10 | Vue business reporting portal |
| 11 | Vue admin panel |
| 12 | End-to-end demo run — full flow, all roles |

**Start each session** with:
> "We are building Amanat. Here is the full project context: [paste this document]. Today is session N — [goal]. The project is already running. Read the existing code structure before writing anything."

---

## AWS cloud-native architecture (Phase 2+)

The MVP runs locally on Docker Compose. AWS services are introduced after the local MVP is validated.

### Service map

| AWS Service | Replaces | Amanat purpose |
|---|---|---|
| ECS Fargate | Docker Compose | Runs Fastify API — scales to zero |
| Lambda | BullMQ workers | Distribution execution, watchlist scan |
| RDS PostgreSQL | Local Postgres | Primary data store |
| **QLDB** | AuditLog table | Cryptographically verifiable append-only ledger |
| ElastiCache Redis | Local Redis | Session cache, rate limiting |
| S3 | Local file storage | Business document uploads |
| **EventBridge** | BullMQ event bus | ReportVerified → auto-triggers distribution Lambda |
| SQS + DLQ | BullMQ queues | Failed distributions never silently disappear |
| SNS | Custom notifications | Fan-out: email + dashboard push on distribution |
| **Cognito** | Custom JWT auth | MFA, token management — required for BNM sandbox |
| **KMS** | Nothing (gap) | Encrypt PII + financial data at rest |
| Secrets Manager | `.env` files | Rotate DB credentials automatically |
| CloudFront + S3 | Vite dev server | React/Vue app global CDN |
| API Gateway | Manual routing | Rate limiting, auth verification |
| CloudTrail | Nothing | Every AWS API call logged — infrastructure audit |
| **CDK** | Manual console | All infrastructure as TypeScript — version controlled |
| CodePipeline + CodeBuild | Manual deploys | Every deploy automated, logged, reversible |
| CloudWatch | Console logs | Centralised logs, alarms on DLQ and Lambda failures |

**Bold** = services unique to this stack that provide regulatory or anti-exploitation value you cannot replicate yourself.

### Distribution event flow (AWS)

```
Admin verifies OutcomeReport
  → EventBridge: { type: "REPORT_VERIFIED", reportId }
  → Lambda: distribution-calculator
      reads report + contract from RDS
      calculates breakdown
      writes Distribution (PENDING) to RDS
      writes proof to QLDB
  → EventBridge: { type: "DISTRIBUTION_CALCULATED" }
  → Lambda: distribution-executor
      Postgres transaction: credits + balance updates
      QLDB: execution proof
      Distribution status → EXECUTED
  → SNS: fan-out
      SES → depositor email
      API Gateway WebSocket → dashboard update
      CloudWatch → metric

On any Lambda failure → SQS DLQ → CloudWatch alarm → alert within 60s
```

### Deploy region

**ap-southeast-1 (Singapore)** — BNM data residency compliance. Do not use ap-southeast-3 as primary.

### MVP cost estimate

| Service | Monthly |
|---|---|
| ECS Fargate (2 tasks) | ~$18 |
| RDS PostgreSQL t4g.micro | ~$15 |
| QLDB | ~$5 |
| ElastiCache t4g.micro | ~$12 |
| Lambda + EventBridge + SQS | ~$1 |
| CloudFront + S3 | ~$1 |
| Cognito (< 50k MAU) | $0 |
| CloudWatch + CloudTrail + KMS | ~$8 |
| **Total** | **~$60/month** |

Apply for AWS Activate startup credits ($5k–$100k). At $60/month, $5k covers ~7 years of MVP infrastructure.

---

## Future phases

| Phase | What gets built |
|---|---|
| 4 | Blockchain / QLDB migration — AuditLog tables sync to Hyperledger Fabric |
| 5 | Real oracle nodes — replace admin-approval with 2-of-3 auditor consensus |
| 6 | Real payment rails — DuitNow / FPX replaces simulated wallet balances |
| 7 | Cognito + KMS — production auth and encryption for BNM sandbox application |
| 8 | ML anomaly detection — trained on AuditLog data to flag unusual patterns |
| 9 | Mobile app — Vue/Capacitor wrapper around the web frontend |