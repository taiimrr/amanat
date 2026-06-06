import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { checkSectorExclusion } from '../../lib/shariah-engine/sector-exclusion.js'
import { AppError } from '../../lib/errors.js'
import type { RegisterBodyType, LoginBodyType } from './auth.schema.js'

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? '12')

export interface TokenPayload {
  sub: string
  email: string
  role: string
}

export interface AuthResult {
  user: { id: string; email: string; role: string }
  accessToken: string
  refreshToken: string
}

// ─── Token utilities ──────────────────────────────────────────────────────────

export function signAccessToken(app: FastifyInstance, payload: TokenPayload): string {
  return app.jwt.sign(
    { sub: payload.sub, email: payload.email, role: payload.role },
    { expiresIn: process.env.JWT_ACCESS_EXPIRY ?? '15m' } as Parameters<typeof app.jwt.sign>[1],
  )
}

function refreshSecret() {
  return new TextEncoder().encode(
    process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-in-prod',
  )
}

export async function signRefreshToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRY ?? '7d')
    .sign(refreshSecret())
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret())
    return {
      sub:   payload.sub as string,
      email: payload['email'] as string,
      role:  payload['role'] as string,
    }
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token')
  }
}

// ─── Auth operations ──────────────────────────────────────────────────────────

export async function register(
  app: FastifyInstance,
  prisma: PrismaClient,
  body: RegisterBodyType,
): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) throw new AppError(409, 'Email already registered')

  if (body.role === 'BUSINESS' && body.description) {
    const exclusion = checkSectorExclusion(body.description)
    if (exclusion.blocked) throw new AppError(422, exclusion.reason ?? 'Business description contains prohibited content')
  }

  const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS)

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email: body.email, passwordHash, role: body.role as 'DEPOSITOR' | 'BUSINESS' },
    })

    if (body.role === 'DEPOSITOR') {
      await tx.depositor.create({
        data: { userId: created.id, displayName: body.displayName!, walletBalance: 0 },
      })
    } else {
      await tx.business.create({
        data: {
          userId: created.id,
          legalName: body.legalName!,
          sector: body.sector! as 'GREEN_ENERGY' | 'SME_FINANCING' | 'AFFORDABLE_HOUSING' | 'TRADE_FINANCE' | 'AGRICULTURE',
          description: body.description!,
          status: 'APPLICANT',
        },
      })
    }

    await tx.auditLog.create({
      data: {
        actorId: created.id,
        actorRole: created.role,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: created.id,
        payload: { email: created.email, role: created.role },
      },
    })

    return created
  })

  const tokenPayload: TokenPayload = { sub: user.id, email: user.email, role: user.role }
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(app, tokenPayload),
    signRefreshToken(tokenPayload),
  ])

  return { user: { id: user.id, email: user.email, role: user.role }, accessToken, refreshToken }
}

export async function login(
  app: FastifyInstance,
  prisma: PrismaClient,
  body: LoginBodyType,
): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: body.email } })
  if (!user) throw new AppError(401, 'Invalid credentials')

  const valid = await bcrypt.compare(body.password, user.passwordHash)
  if (!valid) throw new AppError(401, 'Invalid credentials')

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      payload: { email: user.email },
    },
  })

  const tokenPayload: TokenPayload = { sub: user.id, email: user.email, role: user.role }
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(app, tokenPayload),
    signRefreshToken(tokenPayload),
  ])

  return { user: { id: user.id, email: user.email, role: user.role }, accessToken, refreshToken }
}

export async function refresh(
  app: FastifyInstance,
  token: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = await verifyRefreshToken(token)
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(app, payload),
    signRefreshToken(payload),
  ])
  return { accessToken, refreshToken }
}
