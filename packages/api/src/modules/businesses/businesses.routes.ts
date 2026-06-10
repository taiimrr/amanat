import type { FastifyPluginAsync } from 'fastify'
import { ApproveBusinessBody } from './businesses.schema.js'
import { listBusinesses, approveBusiness, watchlistBusiness } from './businesses.service.js'

export const businessRoutes: FastifyPluginAsync = async (app) => {

  app.get('/', { onRequest: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { sub: string; role: string }
    if (user.role !== 'ADMIN') {
      reply.code(403)
      return { error: 'Admin access required' }
    }
    const { status } = request.query as { status?: string }
    return listBusinesses(app.prisma, status)
  })

  app.post('/:id/approve', { onRequest: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { sub: string; role: string }
    if (user.role !== 'ADMIN') {
      reply.code(403)
      return { error: 'Admin access required' }
    }

    const { id } = request.params as { id: string }
    const parsed = ApproveBusinessBody.safeParse(request.body)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'Validation error', issues: parsed.error.issues }
    }

    return approveBusiness(app.prisma, id, user.sub, parsed.data)
  })

  app.post('/:id/watchlist', { onRequest: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { sub: string; role: string }
    if (user.role !== 'ADMIN') {
      reply.code(403)
      return { error: 'Admin access required' }
    }

    const { id } = request.params as { id: string }
    return watchlistBusiness(app.prisma, id, user.sub)
  })
}
