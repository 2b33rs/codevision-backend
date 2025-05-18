import { FastifyInstance } from 'fastify'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { updatePositionStatusByBusinessKey } from './position.service'
import {
  positionParamsSchema,
  positionStatusPatchSchema,
} from './position.schema'
import { $Enums } from '../../../generated/prisma'
import POSITION_STATUS = $Enums.POSITION_STATUS

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
      const updated = await updatePositionStatusByBusinessKey(
        compositeId,
        status as POSITION_STATUS,
      )
      reply.send('Updated position status successfully to ' + updated.Status)
    },
  })
}
