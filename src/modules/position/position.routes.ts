import { FastifyInstance } from 'fastify'
import { zodToJsonSchema } from 'zod-to-json-schema'

import {
  createPosition,
  requestFinishedGoodsHandler,
  updatePositionStatusByBusinessKey,
} from './position.service'

import {
  positionCreateSchema,
  positionResponseSchema,
  positionStatusPatchSchema,
  requestFinishedGoodsSchema,
} from './position.schema'

export default async function positionRoutes(fastify: FastifyInstance) {
  // PATCH /:compositeId
  fastify.patch('/:compositeId', {
    schema: {
      tags: ['Position'],
      description:
        'Update the status of an existing position using a composite business key',
      params: zodToJsonSchema(positionStatusPatchSchema.shape.params),
      body: zodToJsonSchema(positionStatusPatchSchema.shape.body),
      response: {
        200: { type: 'string' },
      },
    },
    handler: async (request, reply) => {
      const { compositeId } = positionStatusPatchSchema.shape.params.parse(
        request.params,
      )
      const { status } = positionStatusPatchSchema.shape.body.parse(
        request.body,
      )
      const updated = await updatePositionStatusByBusinessKey(
        compositeId,
        status,
      )
      reply.send(`Updated position status successfully to ${updated.Status}`)
    },
  })

  // POST / - create new position
  fastify.post('/', {
    schema: {
      tags: ['Position'],
      description: 'Create a new production position',
      body: zodToJsonSchema(positionCreateSchema.shape.body),
      response: {
        200: zodToJsonSchema(positionResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const data = positionCreateSchema.shape.body.parse(request.body)
      const pos = await createPosition(
        data.orderId,
        data.amount,
        data.pos_number,
        data.name,
        data.productCategory,
        data.design,
        data.color,
        data.shirtSize,
        data.description ?? undefined,
      )
      reply.send(pos)
    },
  })

  // POST /request-finished-goods
  fastify.post('/request-finished-goods', {
    schema: {
      tags: ['Position'],
      description:
        'Request finished goods for multiple positions and update statuses',
      body: zodToJsonSchema(requestFinishedGoodsSchema.shape.body),
      response: {
        200: {
          type: 'object',
          properties: {
            orderNumber: { type: 'string' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  message: { type: 'string' },
                  newStatus: { type: 'string' },
                },
                required: ['id', 'message', 'newStatus'],
              },
            },
          },
        },
      },
    },
    handler: requestFinishedGoodsHandler,
  })
}
