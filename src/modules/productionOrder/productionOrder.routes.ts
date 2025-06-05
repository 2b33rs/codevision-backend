import { FastifyInstance } from 'fastify'
import { createProductionOrderZ } from './productionOrder.schema'
import { productionOrderResponseZ } from '../product/product.schema'
import { createProductionOrder } from './productionOrder.service'

export async function productionOrderRoutes(fastify: FastifyInstance) {
  fastify.post('/:id/production-order', {
    schema: {
      tags: ['ProductionOrder'],
      description: 'Erstellt einen Produktionsauftrag für ein Produkt',
      params: {
        id: { type: 'string', description: 'Positions-ID' },
      },
      body: createProductionOrderZ,
      response: {
        200: productionOrderResponseZ,
      },
    },
    handler: createProductionOrder,
  })
}
