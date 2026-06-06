import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import type { FastifyInstance } from 'fastify'
import { buildApp } from './helpers/build-app.js'

// Use bcrypt rounds=1 so tests run fast
process.env.BCRYPT_ROUNDS = '1'
process.env.JWT_ACCESS_SECRET  = 'test-access-secret-at-least-32-chars!!'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-chars!'
process.env.JWT_ACCESS_EXPIRY  = '15m'
process.env.JWT_REFRESH_EXPIRY = '7d'

// All test accounts use this suffix so cleanup is scoped
const SUFFIX = '@test.amanat.local'
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
})

afterAll(async () => {
  // Remove all test data in dependency order
  await app.prisma.auditLog.deleteMany({ where: { actor: { email: { endsWith: SUFFIX } } } })
  await app.prisma.depositor.deleteMany({ where: { user: { email: { endsWith: SUFFIX } } } })
  await app.prisma.business.deleteMany({ where: { user: { email: { endsWith: SUFFIX } } } })
  await app.prisma.user.deleteMany({ where: { email: { endsWith: SUFFIX } } })
  await app.close()
})

// ─── Register ─────────────────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  test('creates a DEPOSITOR and returns accessToken + refresh cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      body: { email: `dep-${uid()}${SUFFIX}`, password: 'Test1234!', role: 'DEPOSITOR', displayName: 'Test Depositor' },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.user.role).toBe('DEPOSITOR')
    expect(typeof body.accessToken).toBe('string')
    expect(body.accessToken.length).toBeGreaterThan(10)
    expect(res.headers['set-cookie']).toContain('refreshToken=')
    expect(res.headers['set-cookie']).toContain('HttpOnly')
  })

  test('creates a BUSINESS and returns accessToken', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      body: {
        email: `biz-${uid()}${SUFFIX}`,
        password: 'Test1234!',
        role: 'BUSINESS',
        legalName: 'Test Solar Sdn Bhd',
        sector: 'GREEN_ENERGY',
        description: 'Produces solar panels for rural electrification programmes in East Malaysia.',
      },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().user.role).toBe('BUSINESS')
  })

  test('rejects duplicate email with 409', async () => {
    const email = `dup-${uid()}${SUFFIX}`
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      body: { email, password: 'Test1234!', role: 'DEPOSITOR', displayName: 'First' },
    })
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      body: { email, password: 'Test1234!', role: 'DEPOSITOR', displayName: 'Second' },
    })
    expect(res.statusCode).toBe(409)
  })

  test('rejects password without uppercase with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      body: { email: `pw-${uid()}${SUFFIX}`, password: 'nouppercase1', role: 'DEPOSITOR', displayName: 'X' },
    })
    expect(res.statusCode).toBe(400)
  })

  test('rejects password shorter than 8 chars with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      body: { email: `pw2-${uid()}${SUFFIX}`, password: 'Sh0rt', role: 'DEPOSITOR', displayName: 'X' },
    })
    expect(res.statusCode).toBe(400)
  })

  test('rejects DEPOSITOR missing displayName with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      body: { email: `nd-${uid()}${SUFFIX}`, password: 'Test1234!', role: 'DEPOSITOR' },
    })
    expect(res.statusCode).toBe(400)
  })

  test('rejects BUSINESS missing legalName with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      body: {
        email: `nb-${uid()}${SUFFIX}`,
        password: 'Test1234!',
        role: 'BUSINESS',
        sector: 'GREEN_ENERGY',
        description: 'Solar energy production in East Malaysia for rural communities.',
      },
    })
    expect(res.statusCode).toBe(400)
  })

  test('blocks Shariah-excluded description with 422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      body: {
        email: `excl-${uid()}${SUFFIX}`,
        password: 'Test1234!',
        role: 'BUSINESS',
        legalName: 'Bad Biz Sdn Bhd',
        sector: 'SME_FINANCING',
        description: 'We operate a casino and sell gambling services to tourists.',
      },
    })
    expect(res.statusCode).toBe(422)
  })
})

// ─── Login ────────────────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  const loginEmail = `login-${uid()}${SUFFIX}`

  beforeAll(async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      body: { email: loginEmail, password: 'Test1234!', role: 'DEPOSITOR', displayName: 'Login Test' },
    })
  })

  test('returns accessToken and refresh cookie on success', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: { email: loginEmail, password: 'Test1234!' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(typeof body.accessToken).toBe('string')
    expect(body.user.email).toBe(loginEmail)
    expect(res.headers['set-cookie']).toContain('refreshToken=')
  })

  test('rejects wrong password with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: { email: loginEmail, password: 'WrongPassword1!' },
    })
    expect(res.statusCode).toBe(401)
  })

  test('rejects unknown email with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: { email: 'nobody@ghost.example', password: 'Test1234!' },
    })
    expect(res.statusCode).toBe(401)
  })

  test('does not leak which field was wrong (same 401 for both cases)', async () => {
    const badEmail = await app.inject({
      method: 'POST', url: '/auth/login',
      body: { email: 'ghost@ghost.example', password: 'Test1234!' },
    })
    const badPass = await app.inject({
      method: 'POST', url: '/auth/login',
      body: { email: loginEmail, password: 'WrongPassword1!' },
    })
    expect(badEmail.json().error).toBe(badPass.json().error)
  })
})

// ─── Refresh ──────────────────────────────────────────────────────────────────

describe('POST /auth/refresh', () => {
  let refreshCookie: string

  beforeAll(async () => {
    const email = `refresh-${uid()}${SUFFIX}`
    await app.inject({
      method: 'POST', url: '/auth/register',
      body: { email, password: 'Test1234!', role: 'DEPOSITOR', displayName: 'Refresh Test' },
    })
    const loginRes = await app.inject({
      method: 'POST', url: '/auth/login',
      body: { email, password: 'Test1234!' },
    })
    // Extract the cookie value: "refreshToken=eyJ...; Path=..."
    const setCookie = loginRes.headers['set-cookie'] as string
    refreshCookie = setCookie.split(';')[0] // "refreshToken=eyJ..."
  })

  test('returns a new accessToken and rotates the refresh cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie: refreshCookie },
    })
    expect(res.statusCode).toBe(200)
    expect(typeof res.json().accessToken).toBe('string')
    // Rotated cookie must be present
    expect(res.headers['set-cookie']).toContain('refreshToken=')
  })

  test('rejects request with no cookie with 401', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/refresh' })
    expect(res.statusCode).toBe(401)
  })

  test('rejects a tampered token with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie: 'refreshToken=eyJhbGciOiJIUzI1NiJ9.tampered.signature' },
    })
    expect(res.statusCode).toBe(401)
  })
})

// ─── Me ───────────────────────────────────────────────────────────────────────

describe('GET /auth/me', () => {
  let accessToken: string
  let meEmail: string

  beforeAll(async () => {
    meEmail = `me-${uid()}${SUFFIX}`
    const res = await app.inject({
      method: 'POST', url: '/auth/register',
      body: { email: meEmail, password: 'Test1234!', role: 'DEPOSITOR', displayName: 'Me Test' },
    })
    accessToken = res.json().accessToken
  })

  test('returns id, email, role for a valid access token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.email).toBe(meEmail)
    expect(body.role).toBe('DEPOSITOR')
    expect(typeof body.id).toBe('string')
  })

  test('returns 401 with no token', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/me' })
    expect(res.statusCode).toBe(401)
  })

  test('returns 401 with a malformed token', async () => {
    const res = await app.inject({
      method: 'GET', url: '/auth/me',
      headers: { authorization: 'Bearer not.a.token' },
    })
    expect(res.statusCode).toBe(401)
  })
})

// ─── Logout ───────────────────────────────────────────────────────────────────

describe('POST /auth/logout', () => {
  test('clears the refresh cookie', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/logout' })
    expect(res.statusCode).toBe(200)
    expect(res.json().ok).toBe(true)
    // Cookie should be cleared (value empty, Max-Age=0 or Expires in past)
    const cookie = res.headers['set-cookie'] as string
    expect(cookie).toContain('refreshToken=;')
  })
})
