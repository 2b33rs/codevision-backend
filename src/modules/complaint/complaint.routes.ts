import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createComplaint } from './complaint.service'
import { prisma } from '../../plugins/prisma'

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
})

export default async function complaintRoutes(fastify: FastifyInstance) {
  // GET /complaints
  fastify.get('/', {
    handler: async (request, reply) => {
      try {
        const query = complaintQuerySchema.parse(request.query)

        if (query.positionId) {
          const complaints = await prisma.complaint.findMany({
            where: { positionId: query.positionId },
          })
          return reply.send(complaints)
        }

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
