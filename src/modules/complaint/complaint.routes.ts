import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createComplaint,
  getAllComplaints,
  getComplaintsByCustomer,
  getComplaintsByOrder,
  getComplaintsByPosition,
} from './complaint.service'
import { zodToJsonSchema } from 'zod-to-json-schema'

const complaintPostSchema = z.object({
  positionId: z.string().uuid(),
  Reason: z.enum([
    'WRONG_SIZE', 'WRONG_COLOR', 'PRINT_INCORRECT', 'PRINT_OFF_CENTER',
    'DAMAGED_ITEM', 'STAINED', 'LATE_DELIVERY', 'WRONG_PRODUCT',
    'MISSING_ITEM', 'BAD_QUALITY', 'NOT_AS_DESCRIBED', 'OTHER',
  ]),
  ComplaintKind: z.enum(['INTERN', 'EXTERN']),
})

const complaintQuerySchema = z.object({
  positionId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
})

export default async function complaintRoutes(fastify: FastifyInstance) {
  fastify.get('/', {
    schema: {
      tags: ['Complaint'],
      summary: 'Get complaints',
      description: 'Returns complaints, filtered by positionId, orderId or customerId',
      querystring: zodToJsonSchema(complaintQuerySchema),
    },
    handler: async (request, reply) => {
      try {
        const query = complaintQuerySchema.parse(request.query)

        if (query.positionId)
          return reply.send(await getComplaintsByPosition(query.positionId))

        if (query.orderId)
          return reply.send(await getComplaintsByOrder(query.orderId))

        if (query.customerId)
          return reply.send(await getComplaintsByCustomer(query.customerId))

        return reply.send(await getAllComplaints())
      } catch (err) {
        console.error(err)
        return reply.status(500).send({ message: 'Server error' })
      }
    },
  })

  fastify.post('/', {
    schema: {
      tags: ['Complaint'],
      summary: 'Create complaint',
      description: 'Creates a new complaint for a given position',
      body: zodToJsonSchema(complaintPostSchema),
    },
    handler: async (request, reply) => {
      try {
        const data = complaintPostSchema.parse(request.body)
        const result = await createComplaint(data)
        return reply.send(result)
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.status(400).send({ message: 'Validation error', issues: err.errors })
        }
        console.error(err)
        return reply.status(500).send({ message: 'Server error' })
      }
    },
  })
}
