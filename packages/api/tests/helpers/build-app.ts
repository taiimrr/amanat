import Fastify from 'fastify'
import { prismaPlugin } from '../../src/plugins/prisma.js'
import { redisPlugin } from '../../src/plugins/redis.js'
import { authPlugin } from '../../src/plugins/auth.js'
import { corsPlugin } from '../../src/plugins/cors.js'
import { authRoutes } from '../../src/modules/auth/auth.routes.js'
import type { FastifyInstance } from 'fastify'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })

  app.setErrorHandler((error, _request, reply) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500
    reply.status(status).send({ error: error.message ?? 'Internal Server Error' })
  })

  await app.register(corsPlugin)
  await app.register(prismaPlugin)
  await app.register(redisPlugin)
  await app.register(authPlugin)
  await app.register(authRoutes, { prefix: '/auth' })

  await app.ready()
  return app
}
