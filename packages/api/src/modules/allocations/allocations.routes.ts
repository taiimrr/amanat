import type { FastifyPluginAsync } from 'fastify'
import { CreateAllocationBody } from './allocations.schema.js'
import { createAllocation, exitAllocation } from './allocations.service.js'

export const allocationRoutes: FastifyPluginAsync = async (app) => {

  app.post('/', { onRequest: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { sub: string; role: string }
    if (user.role !== 'DEPOSITOR') {
      reply.code(403)
      return { error: 'Only depositors can allocate funds' }
    }

    const parsed = CreateAllocationBody.safeParse(request.body)
    if (!parsed.success) {
      reply.code(400)
      return { error: 'Validation error', issues: parsed.error.issues }
    }

    const allocation = await createAllocation(app.prisma, parsed.data, user.sub)
    reply.code(201)
    return allocation
  })

  app.delete('/:id', { onRequest: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { sub: string; role: string }
    if (user.role !== 'DEPOSITOR') {
      reply.code(403)
      return { error: 'Only depositors can exit allocations' }
    }

    const { id } = request.params as { id: string }
    return exitAllocation(app.prisma, id, user.sub)
  })
}
