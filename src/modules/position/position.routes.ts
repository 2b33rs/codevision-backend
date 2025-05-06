import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createPosition,
  updatePositionStatusByBusinessKey,
} from './position.service'
import { zodToJsonSchema } from 'zod-to-json-schema'

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
  fastify.patch('/:compositeId', {
    schema: {
      tags: ['Position'],
      description:
        'Update the status of an existing position using a composite business key',
      body: zodToJsonSchema(patchSchema.body),
      response: {
        200: {
          type: 'string',
          example: 'Updated position status successfully to SHIPPED',
        },
      },
    },
    handler: async (request, reply) => {
      const { compositeId } = patchSchema.params.parse(request.params)

      const { status } = patchSchema.body.parse(request.body)

      const updated = await updatePositionStatusByBusinessKey(
        compositeId,
        status,
      )
      reply.send('Updated position status successfully to ' + updated.Status)
    },
  })

  //Create new position
  const createSchema = {
    body: z.object({
      orderId: z.string(),
      description: z.string().optional().nullable(),
      amount: z.number(),
      pos_number: z.number(),
      name: z.string(),
      productCategory: z.enum(['T_SHIRT']),
      design: z.string(),
      color: z
        .string()
        .refine(
          (s) =>
            /^cmyk\(\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/.test(
              s,
            ) &&
            [...s.matchAll(/\d{1,3}/g)].every(
              (m) => Number(m[0]) >= 0 && Number(m[0]) <= 100,
            ),
          { message: 'Invalid CMYK value' },
        ), //wir erwarten hier CMYK values
      shirtSize: z.enum(['S', 'M', 'L', 'XL']),
    }),
  }
  fastify.post('/', {
    schema: {
      tags: ['Position'],
      description: 'Create a new production position',
      body: zodToJsonSchema(createSchema.body),
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
            orderId: { type: 'string' },
            pos_number: { type: 'number' },
            description: { type: 'string', nullable: true },
            Status: {
              type: 'string',
              enum: [
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
              ],
            },
            amount: { type: 'number' },
            name: { type: 'string' },
            color: { type: 'object', nullable: true }, // ggf. genauer, je nach Struktur
            shirtSize: {
              type: 'string',
              enum: ['S', 'M', 'L', 'XL'],
              nullable: true,
            },
            prodCategory: {
              type: 'string',
              enum: ['T_SHIRT'], // ggf. erweitern
            },
            design: { type: 'string' },
          },
          required: [
            'id',
            'createdAt',
            'updatedAt',
            'orderId',
            'pos_number',
            'Status',
            'amount',
            'name',
            'prodCategory',
            'design',
          ],
        },
      },
    }, // only for docs
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
      } = createSchema.body.parse(request.body)

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
