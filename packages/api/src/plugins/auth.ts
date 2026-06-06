import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import type { FastifyRequest, FastifyReply } from 'fastify'

// Extend request.user type for access tokens
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      sub:   string
      email: string
      role:  string
    }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export const authPlugin = fp(async (app) => {
  await app.register(fastifyCookie)
  await app.register(fastifyJwt, {
    secret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-in-prod',
  })

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })
})
