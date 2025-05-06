import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createComplaint } from './complaint.service'
import { prisma } from '../../plugins/prisma'
import { zodToJsonSchema } from 'zod-to-json-schema'

const complaintPostSchema = z.object({
  positionId: z.string().uuid(),
  Reason: z.enum([
    'WRONG_SIZE',
    'WRONG_COLOR',
    'PRINT_INCORRECT',
    'PRINT_OFF_CENTER',
    'DAMAGED_ITEM',
    'STAINED',
    'LATE_DELIVERY',
    'WRONG_PRODUCT',
    'MISSING_ITEM',
    'BAD_QUALITY',
    'NOT_AS_DESCRIBED',
    'OTHER',
  ]),
  ComplaintKind: z.enum(['INTERN', 'EXTERN']),
})

const complaintQuerySchema = z.object({
  positionId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
})

export default async function complaintRoutes(fastify: FastifyInstance) {
  // GET /complaints
  fastify.get('/', {
    schema: {
      tags: ['Complaint'],
      summary: 'Get complaints',
      description:
        'Returns complaints, filtered by positionId, orderId or customerId',
      querystring: zodToJsonSchema(complaintQuerySchema),
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              deletedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              positionId: { type: 'string' },
              Reason: {
                type: 'string',
                enum: [
                  'WRONG_SIZE',
                  'WRONG_COLOR',
                  'PRINT_INCORRECT',
                  'PRINT_OFF_CENTER',
                  'DAMAGED_ITEM',
                  'STAINED',
                  'LATE_DELIVERY',
                  'WRONG_PRODUCT',
                  'MISSING_ITEM',
                  'BAD_QUALITY',
                  'NOT_AS_DESCRIBED',
                  'OTHER',
                ],
              },
              ComplaintKind: { type: 'string', enum: ['INTERN', 'EXTERN'] },
            },
            required: [
              'id',
              'createdAt',
              'updatedAt',
              'positionId',
              'Reason',
              'ComplaintKind',
            ],
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const query = complaintQuerySchema.parse(request.query)

        // Filter: positionId
        if (query.positionId) {
          const complaints = await prisma.complaint.findMany({
            where: { positionId: query.positionId },
          })
          return reply.send(complaints)
        }

        // Filter: orderId
        if (query.orderId) {
          const complaints = await prisma.complaint.findMany({
            where: {
              position: {
                orderId: query.orderId,
              },
            },
          })
          return reply.send(complaints)
        }

        // Filter: customerId
        if (query.customerId) {
          const complaints = await prisma.complaint.findMany({
            where: {
              position: {
                order: {
                  customerId: query.customerId,
                },
              },
            },
          })
          return reply.send(complaints)
        }

        // Kein Filter → alle Complaints
        const all = await prisma.complaint.findMany()
        return reply.send(all)
      } catch (err) {
        console.error(err)
        return reply.status(500).send({ message: 'Server error' })
      }
    },
  })

  // POST /complaints
  fastify.post('/', {
    schema: {
      tags: ['Complaint'],
      summary: 'Create complaint',
      description: 'Creates a new complaint for a given position',
      body: zodToJsonSchema(complaintPostSchema),
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
            positionId: { type: 'string' },
            Reason: {
              type: 'string',
              enum: [
                'WRONG_SIZE',
                'WRONG_COLOR',
                'PRINT_INCORRECT',
                'PRINT_OFF_CENTER',
                'DAMAGED_ITEM',
                'STAINED',
                'LATE_DELIVERY',
                'WRONG_PRODUCT',
                'MISSING_ITEM',
                'BAD_QUALITY',
                'NOT_AS_DESCRIBED',
                'OTHER',
              ],
            },
            ComplaintKind: { type: 'string', enum: ['INTERN', 'EXTERN'] },
          },
          required: [
            'id',
            'createdAt',
            'updatedAt',
            'positionId',
            'Reason',
            'ComplaintKind',
          ],
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            issues: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const data = complaintPostSchema.parse(request.body)
        const result = await createComplaint(data)
        return reply.send(result)
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ message: 'Validation error', issues: err.errors })
        }
        console.error(err)
        return reply.status(500).send({ message: 'Server error' })
      }
    },
  })
}
