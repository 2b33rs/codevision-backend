import { FastifyInstance, FastifyRequest } from 'fastify'
import { schemas } from './production-order.schema'
import { createProductionOrder } from './production-order.service'

type ProductionOrderParams = { positionId: string }

export default async function productionOrderRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/:positionId/production-order',
    {
      schema: {
        tags: ['ProductionOrder'],
        summary: 'Create a new production order',
        body: schemas.create,
        response: {
          200: schemas.response,
        },
      },
    },
    async (
      req: FastifyRequest<{ Params: ProductionOrderParams; Body: any }>,
      reply
    ) => {
      try {
        const body = req.body ?? {}
        const bodyWithPositionId = {
          ...body,
          positionId: req.params.positionId,
        }
        const result = await createProductionOrder(bodyWithPositionId)
        reply.send(result)
      } catch (err: any) {
        console.error('Error creating production order:', err)
        reply.status(500).send({ error: err.message })
      }
    }
  )
}