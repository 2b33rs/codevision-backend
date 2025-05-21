import { FastifyInstance } from 'fastify'
import {
  create,
  createProductionOrder,
  list,
  read,
  remove,
  update,
} from './product.service'
import { schemas } from './product.schema'

export default async function productRoutes(fastify: FastifyInstance) {
  fastify.post('/', {
    schema: {
      tags: ['Product'],
      description: 'Create a new standard product',
      body: schemas.create,
      response: {
        200: schemas.product,
      },
    },
    handler: create,
  })

  fastify.get('/:id', {
    schema: {
      tags: ['Product'],
      description: 'Get a standard product by ID',
      params: schemas.params,
      response: {
        200: schemas.product,
        404: { type: 'null' },
      },
    },
    handler: read,
  })

  fastify.get('/', {
    schema: {
      tags: ['Product'],
      description: 'List all standard products',
      querystring: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
        required: [],
      },
      response: {
        200: schemas.list,
      },
    },
    handler: list,
  })

  fastify.put('/:id', {
    schema: {
      tags: ['Product'],
      description: 'Update an existing standard product by ID',
      params: schemas.params,
      body: schemas.update,
      response: {
        200: schemas.product,
      },
    },
    handler: update,
  })

  fastify.delete('/:id', {
    schema: {
      tags: ['Product'],
      description: 'Delete a standard product by ID',
      params: schemas.params,
      response: {
        200: schemas.product,
      },
    },
    handler: remove,
  })

  fastify.post('/:id/production-order', {
    schema: {
      tags: ['Product'],
      description: 'Erstellt einen Produktionsauftrag für ein Produkt',
      params: schemas.params,
      body: schemas.productionOrder,
      response: {
        200: schemas.productionOrderResponse,
      },
    },
    handler: createProductionOrder,
  })
}
