import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createPosition,
  updatePositionStatusByBusinessKey,
} from './position.service'

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
export default async function positionRoutes(fastify: FastifyInstance) {
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

  //Create new position
  fastify.post('/', {
    schema: {}, // only for docs
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

      const newPosition = await createPosition(
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
      reply.send('Created new position: ' + newPosition)
    },
  })
}
