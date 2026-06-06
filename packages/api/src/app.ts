import Fastify from 'fastify'
import { prismaPlugin } from './plugins/prisma.js'
import { redisPlugin } from './plugins/redis.js'
import { authPlugin } from './plugins/auth.js'
import { corsPlugin } from './plugins/cors.js'
import { authRoutes } from './modules/auth/auth.routes.js'

const app = Fastify({
  logger: {
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
})

// Global error handler — 4xx errors expose the user-facing message; 5xx errors log internally and return a generic message
app.setErrorHandler((error, _request, reply) => {
  const status = (error as { statusCode?: number }).statusCode ?? 500
  if (status >= 500) {
    app.log.error(error)
    reply.status(status).send({ error: 'Something went wrong. Please try again later.' })
  } else {
    reply.status(status).send({ error: error.message ?? 'Request failed.' })
  }
})

// Plugins
await app.register(corsPlugin)
await app.register(prismaPlugin)
await app.register(redisPlugin)
await app.register(authPlugin)

// Routes
await app.register(authRoutes, { prefix: '/auth' })

// Health check
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '0.1.0',
}))

// Start
const port = parseInt(process.env.PORT ?? '3001')
try {
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`Amanat API running on http://localhost:${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
