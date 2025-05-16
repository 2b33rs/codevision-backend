import { FastifyInstance } from 'fastify'
import { zodToJsonSchema } from 'zod-to-json-schema'
import {
  createPosition,
  updatePositionStatusByBusinessKey,
} from './position.service'
import {
  positionCreateSchema,
  positionStatusPatchSchema,
  positionParamsSchema,
} from './position.schema'

export default async function positionRoutes(fastify: FastifyInstance) {
  // PATCH
  fastify.patch('/:compositeId', {
    schema: {
      tags: ['Position'],
      description:
        'Update the status of an existing position using a composite business key',
      body: zodToJsonSchema(positionStatusPatchSchema),
      response: {
        200: {
          type: 'string',
          example: 'Updated position status successfully to SHIPPED',
        },
      },
    },
    handler: async (request, reply) => {
      const { compositeId } = positionParamsSchema.parse(request.params)
      const { status } = positionStatusPatchSchema.parse(request.body)
      const updated = await updatePositionStatusByBusinessKey(compositeId, status)
      reply.send('Updated position status successfully to ' + updated.Status)
    },
  })

  // POST
  fastify.post('/', {
    schema: {
      tags: ['Position'],
      description: 'Create a new production position',
      body: zodToJsonSchema(positionCreateSchema),
      response: {
        200: {
          // ... wie gehabt
        },
      },
    },
    handler: async (request, reply) => {
      const {
        orderId,
        description,
        amount,
        pos_number,
        name,
        productCategory,
        design,
        color,
        shirtSize,
      } = positionCreateSchema.parse(request.body)

      return await createPosition(
        orderId,
        amount,
        pos_number,
        name,
        productCategory,
        design,
        color,
        shirtSize,
        description ?? '',
      )
    },
  })
}
