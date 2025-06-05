import { FastifyInstance } from 'fastify'

import { productionOrderResponseZ } from '../product/product.schema'
import { createProductionOrder } from './productionOrder.service'
import { createProductionOrderSchema } from './productionOrder.schema'

export async function productionOrderRoutes(fastify: FastifyInstance) {
  fastify.post('/:productId/production-order', {
    schema: {
      tags: ['ProductionOrder'],
      description: 'Erstellt einen Produktionsauftrag für ein Produkt',
      params: {
        productId: { type: 'string', description: 'ID vom Standardprodukt' },
      },
      body: createProductionOrderSchema,
      response: {
        200: productionOrderResponseZ,
      },
    },
    handler: createProductionOrder,
  })
}
