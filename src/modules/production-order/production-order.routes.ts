import { FastifyInstance } from 'fastify'
import { createProductionOrderZ } from './production-order.schema'
import { createProductionOrder } from './production-order.service'

export default async function productionOrderRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Body: unknown
  }>('/',
    {
      schema: {
        tags: ['ProductionOrder'],
        summary: 'Create a new production order',
        body: createProductionOrderZ,
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              message: { type: 'string' },
              productionOrder: { type: 'object' }, // ggf. genaueres Schema
            },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        const result = await createProductionOrder(req.body)
        reply.send(result)
      } catch (err: any) {
        reply.status(500).send({ error: err.message })
      }
    }
  )
}