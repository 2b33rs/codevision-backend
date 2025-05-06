import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createCustomer } from './customer.service'

const createCustomerSchema = {
  body: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    customerType: z.enum(['WEBSHOP', 'BUSINESS']),
  }),
}

export default async function customerRoutes(fastify: FastifyInstance) {
  fastify.post('/', {
    schema: {},
    handler: async (request, reply) => {
      const { name, email, phone, customerType } =
        createCustomerSchema.body.parse(request.body)

      const newCustomer = await createCustomer(name, email, phone, customerType)

      reply.send(newCustomer)
    },
  })
}
