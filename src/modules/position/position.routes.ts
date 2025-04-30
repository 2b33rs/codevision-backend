import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { updatePositionStatusByBusinessKey } from './position.service'

const patchSchema = {
  body: z.object({
    status: z.enum([
      'OPEN',
      'FINISHED_MATERIAL_REQUESTED',
      'PRODUCTION_NOTIFIED',
      'IN_DYEING',
      'IN_PRINTING',
      'PRODUCTION_COMPLETED',
      'FINISHED_MATERIAL_READY_FOR_PICKUP',
      'READY_FOR_SHIPMENT',
      'SHIPPED',
      'COMPLETED',
      'CANCELLED',
    ]),
  }),
  params: z.object({
    compositeId: z.string(),
  }),
}

export default async function positionRoutes(fastify: FastifyInstance) {
  // api/positoin/id=BE20251201.1
  fastify.patch('/:compositeId', {
    schema: {},
    handler: async (request, reply) => {
      const { compositeId } = patchSchema.params.parse(request.params)

      const { status } = patchSchema.body.parse(request.body)

      const updated = await updatePositionStatusByBusinessKey(
        compositeId,
        status,
      )
      reply.send('Updated position status successfully to ' + status)
    },
  })
}
