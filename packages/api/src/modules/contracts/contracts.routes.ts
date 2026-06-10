import type { FastifyPluginAsync } from 'fastify'
import { CreateContractBody } from './contracts.schema.js'
import { createContract, listContracts, watchlistContract } from './contracts.service.js'

export const contractRoutes: FastifyPluginAsync = async (app) => {

  // All authenticated users can list contracts (depositors need this to allocate)
  app.get('/', { onRequest: [app.authenticate] }, async (request) => {
    const { status } = request.query as { status?: string }
    return listContracts(app.prisma, status)
  })

  app.post('/', { onRequest: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { sub: string; role: string }
    if (user.role !== 'ADMIN') {
      reply.code(403)
      return { error: 'Admin access required' }
    }

    const parsed = CreateContractBody.safeParse(request.body)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'Validation error', issues: parsed.error.issues }
    }

    const result = await createContract(app.prisma, parsed.data, user.sub)
    reply.code(201)
    return result
  })

  app.patch('/:id/watchlist', { onRequest: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { sub: string; role: string }
    if (user.role !== 'ADMIN') {
      reply.code(403)
      return { error: 'Admin access required' }
    }

    const { id } = request.params as { id: string }
    return watchlistContract(app.prisma, id, user.sub)
  })
}
