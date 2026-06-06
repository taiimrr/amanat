# Amanat — Claude Code Project Handoff

## What you are building

**Amanat** (Arabic: "trust held in custody") is an Islamic fintech platform that makes ethical finance structurally tamper-resistant — not just policy-compliant. It connects depositors to real businesses through Shariah-compliant partnership contracts, tracks real-world outcomes via a verified data pipeline, and distributes profit transparently with a full audit trail.

The core problem it solves: Islamic banks today cannot tell a depositor exactly where their money went, what it generated, or prove the profit calculation is honest. Amanat makes all three verifiable by design.

This document covers the MVP — a fully working system with real data flows, no blockchain yet (deferred to Phase 4), and no real money movement (simulated balances). The goal is a demonstrable end-to-end system: depositor → bank → investment → business outcome reporting → profit distribution → depositor dashboard showing the full chain.

---

## Tech stack

| Layer | Technology | Reason |
|---|---|---|
| Backend API | Node.js + TypeScript + Fastify | Fast, typed, lightweight |
| Database | PostgreSQL + Prisma ORM | Relational integrity, ACID transactions |
| Background jobs | BullMQ + Redis | Scheduled distributions, async processing |
| Auth | JWT (access + refresh tokens) | Three user roles: depositor, business, admin |
| Frontend | React 18 + Vite + TypeScript | Fast dev, strong ecosystem |
| Styling | Tailwind CSS | Utility-first, consistent |
| Charts | Recharts | React-native, composable |
| Data fetching | TanStack Query v5 | Server state, caching, optimistic updates |
| Testing | Vitest + Supertest | Unit + integration tests from day one |
| Dev environment | Docker Compose | Postgres + Redis local, no global installs |

---

## Repository structure

```
amanat/
├── packages/
│   ├── api/                    # Fastify backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── depositors/
│   │   │   │   ├── investments/
│   │   │   │   ├── contracts/
│   │   │   │   ├── oracle/
│   │   │   │   ├── distributions/
│   │   │   │   └── impact/
│   │   │   ├── lib/
│   │   │   │   ├── shariah-engine/
│   │   │   │   ├── compliance-guard/
│   │   │   │   └── audit-logger/
│   │   │   ├── jobs/
│   │   │   └── prisma/
│   │   │       └── schema.prisma
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── pages/
│       │   │   ├── depositor/
│       │   │   ├── business/
│       │   │   └── admin/
│       │   ├── components/
│       │   └── api/
├── docker-compose.yml
└── README.md
```

---

## Database schema (Prisma)

Build the following models in `schema.prisma`. Every table has a `createdAt` and `updatedAt`. The `AuditLog` table is append-only — no updates, no deletes, ever.

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  role         Role     // DEPOSITOR | BUSINESS | ADMIN
  createdAt    DateTime @default(now())
  depositor    Depositor?
  business     Business?
}

enum Role { DEPOSITOR BUSINESS ADMIN }

model Depositor {
  id            String   @id @default(uuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  displayName   String
  walletBalance Decimal  @default(0)   // simulated balance in RM
  allocations   DepositAllocation[]
  distributions DistributionCredit[]
}

model DepositAllocation {
  id            String            @id @default(uuid())
  depositorId   String
  depositor     Depositor         @relation(fields: [depositorId], references: [id])
  investmentId  String
  investment    InvestmentContract @relation(fields: [investmentId], references: [id])
  amountRM      Decimal
  sharePercent  Decimal           // depositor's % share of this pool
  sectorPref    SectorType[]
  createdAt     DateTime          @default(now())
  status        AllocationStatus  // ACTIVE | EXITED | WATCHLIST
}

enum AllocationStatus { ACTIVE EXITED WATCHLIST }

model Business {
  id             String   @id @default(uuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id])
  legalName      String
  sector         SectorType
  dueDiligenceScore Int   // 0–100, must be >= 70 to be eligible
  status         BusinessStatus  // APPLICANT | APPROVED | ACTIVE | WATCHLIST | EXITED
  contracts      InvestmentContract[]
  reports        OutcomeReport[]
}

enum BusinessStatus { APPLICANT APPROVED ACTIVE WATCHLIST EXITED }

enum SectorType {
  GREEN_ENERGY
  SME_FINANCING
  AFFORDABLE_HOUSING
  TRADE_FINANCE
  AGRICULTURE
}

model InvestmentContract {
  id              String        @id @default(uuid())
  businessId      String
  business        Business      @relation(fields: [businessId], references: [id])
  contractType    ContractType  // MUDARABA | MUSHARAKA | MURABAHA | IJARA | SALAM | WAKALA
  principalRM     Decimal
  bankFeeCapPct   Decimal       // hard cap e.g. 0.22 = 22% of gross profit
  profitSplitPct  Decimal       // depositor pool share e.g. 0.78
  sector          SectorType
  startDate       DateTime
  endDate         DateTime?
  status          ContractStatus
  allocations     DepositAllocation[]
  reports         OutcomeReport[]
  distributions   Distribution[]
}

enum ContractType { MUDARABA MUSHARAKA MURABAHA IJARA SALAM WAKALA }
enum ContractStatus { ACTIVE COMPLETED DEFAULTED WATCHLIST }

model OutcomeReport {
  id                String             @id @default(uuid())
  contractId        String
  contract          InvestmentContract @relation(fields: [contractId], references: [id])
  businessId        String
  business          Business           @relation(fields: [businessId], references: [id])
  periodStart       DateTime
  periodEnd         DateTime
  revenueRM         Decimal
  expensesRM        Decimal
  grossProfitRM     Decimal            // computed: revenue - expenses
  jobsSupported     Int
  co2AvoidedTonnes  Decimal?           // for green energy sector
  verificationStatus VerificationStatus // PENDING | VERIFIED | DISPUTED | REJECTED
  verifiedByAdminId  String?
  verifiedAt         DateTime?
  createdAt          DateTime           @default(now())
  distribution       Distribution?
}

enum VerificationStatus { PENDING VERIFIED DISPUTED REJECTED }

model Distribution {
  id                String        @id @default(uuid())
  contractId        String
  contract          InvestmentContract @relation(fields: [contractId], references: [id])
  reportId          String        @unique
  report            OutcomeReport @relation(fields: [reportId], references: [id])
  grossProfitRM     Decimal
  bankFeeRM         Decimal
  zakatRM           Decimal       // 2.5% of bank fee
  depositorPoolRM   Decimal
  calculatedAt      DateTime      @default(now())
  executedAt        DateTime?
  status            DistributionStatus // PENDING | EXECUTED | FAILED
  credits           DistributionCredit[]
}

enum DistributionStatus { PENDING EXECUTED FAILED }

model DistributionCredit {
  id             String       @id @default(uuid())
  distributionId String
  distribution   Distribution @relation(fields: [distributionId], references: [id])
  depositorId    String
  depositor      Depositor    @relation(fields: [depositorId], references: [id])
  amountRM       Decimal
  createdAt      DateTime     @default(now())
}

model ZakatLedger {
  id          String   @id @default(uuid())
  source      String   // distributionId that generated this zakat
  amountRM    Decimal
  type        ZakatType // COLLECTED | DISBURSED
  createdAt   DateTime @default(now())
  note        String?
}

enum ZakatType { COLLECTED DISBURSED }

// Append-only. No updates. No deletes. Ever.
model AuditLog {
  id         String   @id @default(uuid())
  actorId    String   // userId who triggered action
  actorRole  Role
  action     String   // e.g. "CONTRACT_CREATED", "DISTRIBUTION_EXECUTED", "REPORT_VERIFIED"
  entityType String   // e.g. "InvestmentContract"
  entityId   String
  payload    Json     // full snapshot of relevant data at time of action
  createdAt  DateTime @default(now())
}
```

---

## Module 1 — Shariah engine (`packages/api/src/lib/shariah-engine/`)

This is the core compliance brain. It runs before any transaction is saved to the database.

### Files to build:

**`contract-validator.ts`**
Export a function `validateContract(input: ContractInput): ValidationResult`.
- Check `contractType` is in the allowed enum
- If `MURABAHA`: assert `markupFixedAtSigning === true`, assert `markupAccruesOverTime === false`, assert `lateFeeGoesToCharity === true`
- If `MUDARABA`: assert `bankFeeCapPct <= 0.40` (max 40% of profit)
- If `MUSHARAKA`: assert both parties have declared capital contribution amounts
- Return `{ valid: boolean, errors: string[], warnings: string[] }`

**`sector-exclusion.ts`**
Export a function `checkSectorExclusion(sector: string, businessDescription: string): ExclusionResult`.
- Hard-blocked sectors: `ALCOHOL`, `TOBACCO`, `WEAPONS`, `GAMBLING`, `PORNOGRAPHY`, `CONVENTIONAL_INTEREST`
- Check both the declared sector enum and scan the business description for keywords associated with excluded sectors
- Return `{ blocked: boolean, reason?: string }`

**`tawarruq-detector.ts`**
Export a function `detectTawarruqPattern(recentTransactions: Transaction[]): TawarruqFlag`.
- Pattern: same business appears as both buyer and seller of the same commodity within 48 hours
- Pattern: financing amount matches sale-back amount within 2% tolerance
- Return `{ flagged: boolean, confidence: 'HIGH' | 'MEDIUM' | 'LOW', evidence: string }`

**`profit-ratio-guard.ts`**
Export a function `validateProfitSplit(contract: ContractInput): ValidationResult`.
- Assert `bankFeeCapPct + depositorSplitPct === 1.0` (they must sum to 100%)
- Assert `bankFeeCapPct <= 0.40` (bank can never take more than 40%)
- Assert `zakatRate === 0.025` applied to the bank's fee portion
- Return `{ valid: boolean, errors: string[] }`

---

## Module 2 — Compliance guard (`packages/api/src/lib/compliance-guard/`)

Wraps the Shariah engine and enforces concentration limits at the allocation layer.

**`concentration-limiter.ts`**
Export `checkConcentration(depositorId: string, targetInvestmentId: string, amountRM: number): ConcentrationResult`.
- Query current allocations for depositor
- Block if this allocation would put >5% of depositor's total balance into one business
- Block if this allocation would put >50% into one sector
- Return `{ allowed: boolean, reason?: string, currentConcentration: object }`

**`due-diligence-scorer.ts`**
Export `scoreBusiness(application: BusinessApplication): DueDiligenceScore`.
Five dimensions, each scored 0–20 (total 0–100):
1. Financial viability (revenue history, profitability trend, debt level)
2. Management track record (years in operation, prior defaults)
3. Sector impact potential (jobs per RM invested, growth trajectory)
4. Shariah compliance of business model (sector, revenue sources)
5. Environmental footprint (sector-specific: carbon intensity, waste)
Return `{ total: number, breakdown: Record<string, number>, eligible: boolean }`.
Eligible if `total >= 70`.

---

## Module 3 — Investment allocation engine

### API routes to build:

**`POST /api/investments`** — Admin creates a new investment contract
- Runs `validateContract()`, `checkSectorExclusion()`, `validateProfitSplit()`
- If any check fails, return 400 with detailed errors — never silently ignore
- On success, write to `InvestmentContract` table + `AuditLog`

**`POST /api/allocations`** — Depositor allocates funds to a pool
- Runs `checkConcentration()`
- Deducts from `Depositor.walletBalance`
- Creates `DepositAllocation` record
- Writes to `AuditLog`

**`GET /api/investments/:id/health`** — Returns contract health summary
- Current status, days until next report due, last report summary, watchlist flags

**`POST /api/investments/:id/watchlist`** — Admin flags a contract
- Updates status, notifies affected depositors (write to notification queue)

---

## Module 4 — Oracle (outcome reporting)

This simulates the oracle network for the MVP. The data model is designed so real oracle nodes can replace the admin-approval step later without schema changes.

### API routes:

**`POST /api/reports`** — Business submits monthly outcome report
- Auth: BUSINESS role only
- Validate: `periodEnd - periodStart` must be 28–31 days
- Validate: `grossProfitRM === revenueRM - expensesRM` (computed, not trusted)
- Set `verificationStatus = PENDING`
- Trigger notification to admin queue

**`POST /api/reports/:id/verify`** — Admin verifies a report
- Auth: ADMIN role only
- Sets `verificationStatus = VERIFIED`, records `verifiedByAdminId` and `verifiedAt`
- **Immediately triggers distribution calculation** (see Module 5)
- Writes to `AuditLog`

**`POST /api/reports/:id/dispute`** — Admin disputes a report
- Auth: ADMIN role only
- Sets `verificationStatus = DISPUTED`
- Writes reason to `AuditLog`
- Triggers watchlist flag on the contract

**Data gap detector (BullMQ job)**
Schedule: runs daily at 08:00.
Logic: for every ACTIVE contract, check if a report exists for the previous calendar month. If not, flag the contract to WATCHLIST status and write to AuditLog. This mirrors what real oracle nodes would do with missed data feeds.

---

## Module 5 — Profit distribution engine

This is the most critical module. It must be atomic — a distribution either fully executes for all depositors or fully rolls back. Use a Postgres transaction wrapping all writes.

**`calculateDistribution(reportId: string): DistributionCalculation`**
```
grossProfit        = report.grossProfitRM
bankFee            = grossProfit * contract.bankFeeCapPct
zakatAmount        = bankFee * 0.025
depositorPool      = grossProfit - bankFee
// for each depositor allocation:
depositorCredit[i] = depositorPool * allocation[i].sharePercent
// verify: sum(depositorCredit) === depositorPool (assert within 0.01 RM rounding)
```
Return the full breakdown before writing anything.

**`executeDistribution(calculationId: string): ExecutionResult`**
Inside a single Postgres transaction:
1. Create `Distribution` record (status = PENDING)
2. For each depositor: create `DistributionCredit` + increment `Depositor.walletBalance`
3. Create `ZakatLedger` entry (type = COLLECTED)
4. Update `Distribution.status = EXECUTED`, set `executedAt`
5. Write to `AuditLog` with full payload snapshot
6. If any step fails: rollback entire transaction, set status = FAILED

**Important**: The bank fee is never "paid out" in the MVP — it stays as a line item in the Distribution record. In the real system this would transfer to the bank's operational account. For MVP, tracking the calculation is enough.

---

## Module 6 — Depositor dashboard API

These are the read endpoints that power the frontend.

**`GET /api/depositor/me/portfolio`**
Returns:
```json
{
  "walletBalance": 10459.57,
  "totalDeployed": 10000.00,
  "totalProfitEarned": 459.57,
  "allocations": [
    {
      "investmentId": "...",
      "businessName": "Sabah Solar Farm 3",
      "sector": "GREEN_ENERGY",
      "amountRM": 4200.00,
      "sharePercent": 0.000872,
      "status": "ACTIVE",
      "contractType": "MUSHARAKA",
      "shariahStatus": "COMPLIANT",
      "lastReportPeriod": "2025-Q2",
      "healthStatus": "HEALTHY"
    }
  ]
}
```

**`GET /api/depositor/me/impact`**
Returns aggregated impact across all allocations:
```json
{
  "period": "2025-Q2",
  "financial": {
    "grossProfitGenerated": 2840000,
    "yourShare": 459.57,
    "effectiveAnnualReturn": 0.046,
    "bankFeeCharged": 624800,
    "zakatPaid": 15620
  },
  "social": {
    "jobsSupported": 0.047,
    "smeRevenueGenerated": 18400,
    "defaultRateYourPool": 0.021
  },
  "environmental": {
    "co2AvoidedTonnes": 0.84,
    "cleanEnergyMWh": 2.1
  },
  "verification": {
    "shariahAuditStatus": "COMPLIANT",
    "tawarruqExposurePct": 0,
    "oracleConfirmationRate": 1.0,
    "flagsRaised": 0
  }
}
```

**`GET /api/depositor/me/distributions`**
Paginated list of all past distributions with full profit chain breakdown per distribution.

**`GET /api/depositor/me/audit-trail`**
All AuditLog entries related to the depositor's allocations and distributions. Read-only. This is their right to inspect.

---

## Frontend pages to build

### Depositor app (`/depositor`)

**`/depositor/dashboard`** — Main landing
- Summary cards: wallet balance, total deployed, profit this quarter, impact score
- Allocation breakdown donut chart (by sector)
- Recent distributions list

**`/depositor/portfolio`** — Detailed allocation view
- Table of all investments with: business name, sector badge, amount, contract type, health status, last report date
- Clicking a row opens a side panel with full contract details + recent reports

**`/depositor/impact`** — The impact statement
- Financial return section with full profit chain: gross → fee → your share
- Social impact metrics (jobs, SME revenue, default rate vs industry)
- Environmental metrics (CO₂, energy)
- Verification badges: Shariah compliant, oracle confirmed, Tawarruq 0%

**`/depositor/audit`** — Audit trail
- Chronological log of every action touching their account
- Filterable by type (allocation, distribution, contract update, flag)

### Business portal (`/business`)

**`/business/dashboard`** — Overview of active contracts + reporting status
**`/business/reports/new`** — Submit monthly outcome report form
**`/business/reports`** — History of submitted reports with verification status

### Admin panel (`/admin`)

**`/admin/applications`** — Review business applications, show due diligence score breakdown
**`/admin/contracts`** — All active contracts, watchlist flags, health indicators
**`/admin/reports/pending`** — Queue of unverified outcome reports
**`/admin/distributions`** — Distribution history, pending executions
**`/admin/zakat`** — Zakat ledger: collected vs disbursed
**`/admin/audit`** — Full system-wide audit log

---

## Audit logger (`packages/api/src/lib/audit-logger/`)

Every mutating operation in the system calls this. Never skip it.

```typescript
// audit-logger.ts
export async function logAction(params: {
  actorId: string
  actorRole: Role
  action: AuditAction      // enum of all action types
  entityType: string
  entityId: string
  payload: Record<string, unknown>
  tx: PrismaTransactionClient  // always pass the active transaction
}): Promise<void>
```

`AuditAction` enum must include at minimum:
`CONTRACT_CREATED`, `CONTRACT_WATCHLISTED`, `ALLOCATION_CREATED`, `ALLOCATION_EXITED`,
`REPORT_SUBMITTED`, `REPORT_VERIFIED`, `REPORT_DISPUTED`,
`DISTRIBUTION_CALCULATED`, `DISTRIBUTION_EXECUTED`, `DISTRIBUTION_FAILED`,
`ZAKAT_COLLECTED`, `ZAKAT_DISBURSED`,
`BUSINESS_APPROVED`, `BUSINESS_WATCHLISTED`,
`SHARIAH_FLAG_RAISED`, `TAWARRUQ_FLAG_RAISED`

---

## Critical implementation rules

These are non-negotiable. They are what makes this system different from a normal CRUD app.

1. **Shariah engine runs before every contract or allocation write.** Never bypass it. If a route needs to skip validation for testing, throw an error instead — don't add a bypass flag.

2. **AuditLog is append-only.** Add a Postgres trigger that prevents UPDATE and DELETE on the `AuditLog` table. This is enforced at the database level, not just the application level.

3. **Distribution execution uses a Postgres transaction.** All credits for a distribution happen atomically. A partial distribution (some depositors credited, others not) must never be possible.

4. **Profit calculation is deterministic and recorded.** The `Distribution` record stores the full calculation breakdown. It must be possible to re-derive every depositor's credit from the stored data independently.

5. **Bank fee cap is enforced in code, not config.** The `bankFeeCapPct` on a contract is set at contract creation and never mutated. The distribution calculator reads it from the contract record — it does not accept it as a parameter at distribution time.

6. **No soft deletes on financial records.** Contracts, allocations, reports, distributions — these are never deleted. Status fields change. Records stay.

7. **All monetary values use `Decimal` type** (via `decimal.js` in application code, `Decimal` in Prisma). Never use JavaScript `number` for money. Floating point errors in financial calculations are unacceptable.

---

## Seed data for development

Create a seed script (`prisma/seed.ts`) that generates:
- 3 depositor accounts (small: RM 5k, medium: RM 25k, large: RM 100k)
- 1 admin account
- 5 business accounts across different sectors (2 green energy, 2 SME, 1 housing)
- 3 active investment contracts (one per sector type)
- 6 months of outcome reports for each contract (all verified)
- Corresponding distributions already executed
- Resulting depositor balances reflecting accumulated profit

This means the dashboard works on first launch — never demo on empty state.

---

## Environment variables

```env
DATABASE_URL=postgresql://amanat:amanat@localhost:5432/amanat
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-in-production-minimum-32-chars
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
PORT=3001
NODE_ENV=development
```

---

## Docker Compose (local dev)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: amanat
      POSTGRES_PASSWORD: amanat
      POSTGRES_DB: amanat
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

---

## Build order for Claude Code

Work in this exact sequence. Each step produces something runnable before moving on.

1. `docker-compose up -d` → Postgres + Redis running
2. Scaffold monorepo structure + install dependencies
3. Write `schema.prisma` → run `prisma migrate dev` → verify tables created
4. Build `audit-logger` → unit test it
5. Build `shariah-engine` modules one by one → unit test each
6. Build `compliance-guard` modules → unit test
7. Build auth module (register / login / refresh) → integration test
8. Build investments module (contract CRUD + validation) → integration test
9. Build allocations module → integration test
10. Build oracle module (report submit + verify) → integration test
11. Build distribution engine → integration test with full atomic rollback test
12. Build all read/portfolio/impact API endpoints
13. Run seed script → verify data looks correct via API
14. Build React app shell + routing + auth context
15. Build depositor dashboard page (connect to real API)
16. Build depositor portfolio page
17. Build depositor impact page
18. Build business reporting portal
19. Build admin panel pages
20. End-to-end test: create depositor → allocate funds → submit report → verify → distribute → check dashboard shows correct numbers

---

## What success looks like

At the end of the MVP build, you should be able to do this live demo:

1. Log in as a depositor → see wallet balance, allocation breakdown, impact metrics
2. Navigate to impact statement → see full profit chain with every number traceable
3. Log in as a business → submit a monthly outcome report
4. Log in as admin → verify the report → watch distribution execute automatically
5. Log back in as depositor → see wallet balance increased, new distribution in history, impact metrics updated
6. Navigate to audit trail → show every step that happened, timestamped and immutable

That demo, with real numbers and a clean UI, is what you show to a co-founder, early investor, or BNM sandbox application.

---

## Notes for future phases

- **Phase 4 (blockchain):** The `AuditLog` table structure mirrors what a blockchain ledger would store. Migration path: write a sync job that hashes each `AuditLog` entry and posts it to a Hyperledger Fabric channel. No schema changes needed.
- **Phase 5 (real oracle):** The `verificationStatus` workflow in `OutcomeReport` is already designed for multi-node consensus. Replace the single admin approval with a 2-of-3 oracle node voting contract.
- **Phase 6 (real money):** Swap `Depositor.walletBalance` (simulated) for API calls to DuitNow or FPX. The business logic around distributions does not change.
- **Phase 7 (ML anomaly detection):** The `AuditLog` is your training dataset. Every flag, every unusual pattern, is already recorded. The ML layer reads from this table.

---

## AWS cloud-native architecture

### Core principle
Every AWS service choice maps to a specific Amanat requirement. Nothing is added because it sounds modern.

### Service map

| AWS Service | Replaces | Amanat purpose |
|---|---|---|
| ECS Fargate | Docker Compose | Runs Node.js API — scales to zero, no server management |
| Lambda | BullMQ workers | Event-triggered distribution execution, daily watchlist scan |
| RDS PostgreSQL | Local Postgres | Primary data store — balances, contracts, allocations |
| **QLDB** | AuditLog table | Cryptographically verifiable, append-only ledger — tamper-proof audit trail |
| ElastiCache Redis | Local Redis | Session cache, rate limiting |
| S3 | Local file storage | Business document uploads (financial statements, invoices) |
| **EventBridge** | BullMQ event bus | ReportVerified event → triggers distribution Lambda automatically |
| SQS + DLQ | BullMQ queues | Dead-letter queue — failed distributions never silently disappear |
| SNS | Custom notifications | Fan-out: email depositor + update dashboard on distribution |
| **Cognito** | Custom JWT auth | MFA, token management — required for fintech |
| **KMS** | Nothing (gap) | Encrypt PII and financial data at rest — required for BNM compliance |
| Secrets Manager | .env files | Rotate DB credentials automatically, no secrets in code |
| CloudFront + S3 | Manual frontend hosting | React app — global CDN, SSL, near-zero cost |
| API Gateway | Manual routing | Rate limiting, auth verification, single stable endpoint |
| CloudTrail | Nothing (gap) | Every AWS API call logged — infrastructure-level audit for BNM |
| **CDK** | Manual console | All infrastructure as TypeScript code — version controlled, reproducible |
| CodePipeline + CodeBuild | Manual deploys | Every deploy is automated, logged, reversible |
| CloudWatch | Console.log | Centralised logs, alarms on DLQ messages and Lambda failures |

**Bold** = services unique to this stack that you cannot trivially replicate yourself.

### The distribution event flow (most important)

```
Admin verifies OutcomeReport
        ↓
EventBridge: { type: "REPORT_VERIFIED", reportId, contractId }
        ↓
Lambda: distribution-calculator
  - reads report + contract from RDS
  - calculates: gross → bankFee → zakat → depositorPool → per-depositor credits
  - writes Distribution record to RDS (status: PENDING)
  - writes calculation proof to QLDB
        ↓
Lambda: distribution-executor (triggered by DISTRIBUTION_CALCULATED event)
  - opens Postgres transaction
  - credits each depositor wallet
  - updates Distribution status to EXECUTED
  - closes transaction (atomic)
        ↓
QLDB write: execution proof (hash of all credits)
        ↓
SNS publish: { type: "DISTRIBUTION_EXECUTED", depositorIds[], amounts[] }
        ↓
  → SES: email each depositor
  → WebSocket (API Gateway): push dashboard update
  → CloudWatch: log metric

If any Lambda fails → SQS DLQ catches event → CloudWatch alarm → engineer alerted
```

### Infrastructure as Code (CDK) structure

```
infrastructure/
├── lib/
│   ├── stacks/
│   │   ├── database-stack.ts      # RDS, ElastiCache, QLDB
│   │   ├── compute-stack.ts       # ECS cluster, ECR, Fargate services
│   │   ├── lambda-stack.ts        # All Lambda functions + event mappings
│   │   ├── events-stack.ts        # EventBridge rules, SQS queues, SNS topics
│   │   ├── security-stack.ts      # Cognito, KMS keys, Secrets Manager
│   │   ├── cdn-stack.ts           # CloudFront, S3 frontend bucket
│   │   └── pipeline-stack.ts      # CodePipeline CI/CD
│   └── constructs/
│       ├── amanat-api.ts          # ECS Fargate service + API Gateway
│       ├── distribution-workflow.ts # EventBridge + Lambdas for distribution
│       └── audit-ledger.ts        # QLDB + write helper
└── bin/
    └── amanat.ts                  # CDK app entry point
```

### Updated repository structure (with AWS)

```
amanat/
├── packages/
│   ├── api/                       # Fastify on ECS Fargate (unchanged)
│   ├── web/                       # React on CloudFront/S3 (unchanged)
│   ├── lambdas/                   # NEW: Lambda functions
│   │   ├── distribution-calculator/
│   │   ├── distribution-executor/
│   │   ├── watchlist-scanner/     # daily data-gap detection
│   │   └── zakat-allocator/
│   └── infrastructure/            # NEW: CDK stacks
├── docker-compose.yml             # still used for local dev
└── README.md
```

### QLDB — what to write and when

Replace the Postgres `AuditLog` table with QLDB. Every QLDB document maps to one of these actions:

```typescript
// Each document written to QLDB:
interface LedgerEntry {
  type: AuditAction          // same enum as before
  actorId: string
  actorRole: string
  entityType: string
  entityId: string
  payload: Record<string, unknown>  // full snapshot
  timestamp: string          // ISO 8601
  // QLDB automatically adds: blockAddress, hash, metadata
}
```

The QLDB `GetRevision` API lets you prove to a regulator or court that a specific record existed at a specific time and was never altered — using a cryptographic proof that anyone can verify independently.

### Local dev: still uses Docker Compose

For local development, keep using Docker Compose (Postgres + Redis). AWS services are only used in the deployed environment. Use AWS SAM or LocalStack for local Lambda testing.

### Build order update (AWS additions)

After completing the original build steps 1–20, add:

21. Set up CDK project + database-stack (RDS + QLDB in AWS)
22. Replace Postgres AuditLog with QLDB writes
23. Add Cognito — replace custom JWT auth
24. Deploy API to ECS Fargate via compute-stack
25. Set up EventBridge rule: ReportVerified → distribution-calculator Lambda
26. Implement distribution-calculator Lambda
27. Implement distribution-executor Lambda
28. Set up SQS DLQ + CloudWatch alarm on DLQ
29. Deploy frontend to CloudFront via cdn-stack
30. Set up CodePipeline for automated deploys
31. End-to-end test on AWS: full flow from report verification to depositor wallet credit

### Estimated cost: MVP on AWS

| Service | Monthly cost |
|---|---|
| ECS Fargate (2 tasks) | ~$18 |
| RDS PostgreSQL (t4g.micro) | ~$15 |
| QLDB (low volume) | ~$5 |
| ElastiCache Redis (t4g.micro) | ~$12 |
| Lambda + EventBridge + SQS | ~$1 |
| CloudFront + S3 | ~$1 |
| Cognito (under 50k MAU) | $0 |
| CloudWatch + CloudTrail + KMS | ~$8 |
| **Total** | **~$61/month** |

Apply for AWS Activate startup credits ($5k–$100k depending on stage). At $61/month, even $5k covers the first 6 years of MVP infrastructure.

### Data residency for BNM compliance

Deploy to **ap-southeast-1 (Singapore)**. This is the closest AWS region to Malaysia with the regulatory data residency guarantees BNM requires. Do not use ap-southeast-3 (Jakarta) for the primary region — BNM sandbox applications specifically reference Singapore.


---

## Frontend stack: Vue 3 + Vuetify 3 + Pinia

The backend, AWS architecture, and database schema are unchanged. Only the frontend packages differ from the original spec.

### Package list

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.0",
    "pinia-plugin-persistedstate": "^3.2.0",
    "vuetify": "^3.6.0",
    "@mdi/font": "^7.4.0",
    "@tanstack/vue-query": "^5.40.0",
    "vue-apexcharts": "^1.8.0",
    "apexcharts": "^3.49.0",
    "axios": "^1.7.0",
    "decimal.js": "^10.4.0",
    "aws-amplify": "^6.3.0",
    "@aws-amplify/ui-vue": "^4.1.0"
  },
  "devDependencies": {
    "vite": "^5.3.0",
    "vite-plugin-vuetify": "^2.0.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.4.0",
    "vue-tsc": "^2.0.0"
  }
}
```

### Vuetify theme (Amanat colour palette)

```typescript
// src/plugins/vuetify.ts
import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

export default createVuetify({
  theme: {
    defaultTheme: 'amanatLight',
    themes: {
      amanatLight: {
        colors: {
          primary:    '#1A6B4A',  // deep green
          secondary:  '#C8960C',  // gold
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
})
```

### Pinia stores — three stores, nothing more

**Rule:** server state lives in Vue Query. Pinia holds only auth, UI notifications, and UI preferences. Never put API response data in Pinia.

```typescript
// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)  // memory only — never localStorage

  const isAuthenticated = computed(() => !!user.value)
  const isDepositor = computed(() => user.value?.role === 'DEPOSITOR')
  const isBusiness  = computed(() => user.value?.role === 'BUSINESS')
  const isAdmin     = computed(() => user.value?.role === 'ADMIN')

  async function login(email: string, password: string) {
    const { token, userData } = await authApi.login(email, password)
    accessToken.value = token
    user.value = userData
  }

  function logout() {
    user.value = null
    accessToken.value = null
  }

  return { user, accessToken, isAuthenticated, isDepositor, isBusiness, isAdmin, login, logout }
})

// stores/notifications.ts
export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<Array<{ id: string; message: string; type: 'success'|'error'|'warning'|'info' }>>([])

  function push(message: string, type: typeof items.value[0]['type']) {
    const id = crypto.randomUUID()
    items.value.push({ id, message, type })
    setTimeout(() => dismiss(id), 4000)
  }

  const success = (msg: string) => push(msg, 'success')
  const error   = (msg: string) => push(msg, 'error')
  const warn    = (msg: string) => push(msg, 'warning')

  function dismiss(id: string) {
    items.value = items.value.filter(i => i.id !== id)
  }

  return { items, success, error, warn, dismiss }
})
```

### Vue Query composables (server state)

```typescript
// composables/usePortfolio.ts
import { useQuery } from '@tanstack/vue-query'

export function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.get('/depositor/me/portfolio'),
    staleTime: 30_000,
  })
}

// composables/useImpact.ts
export function useImpactStatement(period: Ref<string>) {
  return useQuery({
    queryKey: ['impact', period],  // reactive — refetches when period changes
    queryFn: () => api.get(`/depositor/me/impact?period=${period.value}`),
  })
}
```

### Key Vuetify component decisions

| UI element | Vuetify component | Notes |
|---|---|---|
| Portfolio table | `v-data-table` | Server-side pagination — pass `:items-length` + handle `@update:options` |
| Investment detail | `v-navigation-drawer` temporary | Right side, opens on row click |
| Status badges | `v-chip` with color prop | VERIFIED=success, PENDING=warning, DISPUTED=error |
| Distribution workflow | `v-stepper` | Shows Calculate → Validate → Execute → Credit stages |
| Audit timeline | `v-timeline` | Chronological log with icon per action type |
| Report form | `v-form` + `v-text-field` | Built-in `:rules` validation — no extra library |
| Global notifications | `v-snackbar` | Driven by `useNotificationStore` — one outlet in App.vue |
| Loading states | `v-skeleton-loader` | Driven by Vue Query `isLoading` — swap out per component |

### Critical implementation rules (Vue-specific)

1. **Never use `parseFloat()` for money.** All monetary inputs parsed with `new Decimal(value)` from decimal.js before API calls. Display with a global `formatRM(value)` composable using `Intl.NumberFormat`.

2. **v-data-table pagination must be server-side** for audit logs and large datasets. Pass `:server-items-length="totalCount"` and handle `@update:options` to call the API with `page` and `itemsPerPage` params.

3. **Token never goes in localStorage.** `accessToken` in Pinia auth store is in-memory only. Use an axios interceptor to attach it to requests. Use a refresh token in an httpOnly cookie for persistence across page loads — configure this server-side.

4. **Vue Query is the cache.** Do not copy API responses into Pinia. If two components need the same data, they both call the same `useQuery` composable — Vue Query deduplicates the request and shares the cache.

5. **Vuetify tree-shaking is required.** Use `vite-plugin-vuetify` with `autoImport: true`. Without this, the full Vuetify bundle is ~1.5MB. With tree-shaking, only used components are bundled.

### File structure

```
packages/web/src/
├── plugins/
│   ├── vuetify.ts
│   ├── query.ts
│   └── router.ts
├── stores/
│   ├── auth.ts
│   ├── notifications.ts
│   └── preferences.ts
├── composables/
│   ├── usePortfolio.ts
│   ├── useImpact.ts
│   ├── useDistributions.ts
│   ├── useAuditTrail.ts
│   ├── useContracts.ts
│   └── useReports.ts
├── layouts/
│   ├── DepositorLayout.vue
│   ├── BusinessLayout.vue
│   └── AdminLayout.vue
├── pages/
│   ├── auth/LoginPage.vue
│   ├── depositor/
│   │   ├── DashboardPage.vue
│   │   ├── PortfolioPage.vue
│   │   ├── ImpactPage.vue
│   │   └── AuditPage.vue
│   ├── business/
│   │   ├── DashboardPage.vue
│   │   ├── ReportNewPage.vue
│   │   └── ReportsPage.vue
│   └── admin/
│       ├── ApplicationsPage.vue
│       ├── ContractsPage.vue
│       ├── ReportQueuePage.vue
│       ├── DistributionsPage.vue
│       └── ZakatPage.vue
├── components/
│   ├── portfolio/AllocationTable.vue
│   ├── portfolio/InvestmentDrawer.vue
│   ├── impact/ProfitChain.vue
│   ├── impact/ImpactMetrics.vue
│   ├── impact/VerificationBadges.vue
│   ├── shared/AppSnackbar.vue
│   ├── shared/RmAmount.vue
│   └── shared/StatusChip.vue
├── api/
│   ├── client.ts
│   └── endpoints/
└── main.ts
```