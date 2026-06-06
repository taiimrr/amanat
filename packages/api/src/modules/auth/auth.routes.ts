import type { FastifyPluginAsync } from 'fastify'
import { RegisterBody, LoginBody } from './auth.schema.js'
import { register, login, refresh } from './auth.service.js'

const REFRESH_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/auth',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

export const authRoutes: FastifyPluginAsync = async (app) => {

  // In Fastify async handlers: either return payload OR call reply.send() — never both.
  // We use the return-payload pattern so wrapThenable doesn't double-send.

  app.post('/register', async (request, reply) => {
    const parsed = RegisterBody.safeParse(request.body)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'Validation error', issues: parsed.error.issues }
    }
    const result = await register(app, app.prisma, parsed.data)
    reply.setCookie('refreshToken', result.refreshToken, REFRESH_COOKIE)
    reply.code(201)
    return { user: result.user, accessToken: result.accessToken }
  })

  app.post('/login', async (request, reply) => {
    const parsed = LoginBody.safeParse(request.body)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'Validation error', issues: parsed.error.issues }
    }
    const result = await login(app, app.prisma, parsed.data)
    reply.setCookie('refreshToken', result.refreshToken, REFRESH_COOKIE)
    return { user: result.user, accessToken: result.accessToken }
  })

  app.post('/refresh', async (request, reply) => {
    const token = request.cookies['refreshToken']
    if (!token) {
      reply.code(401)
      return { error: 'Missing refresh token' }
    }
    const result = await refresh(app, token)
    reply.setCookie('refreshToken', result.refreshToken, REFRESH_COOKIE)
    return { accessToken: result.accessToken }
  })

  app.post('/logout', async (_request, reply) => {
    reply.clearCookie('refreshToken', { path: '/auth' })
    return { ok: true }
  })

  app.get('/me', { onRequest: [app.authenticate] }, async (request) => {
    const { sub, email, role } = request.user as { sub: string; email: string; role: string }
    return { id: sub, email, role }
  })
}
