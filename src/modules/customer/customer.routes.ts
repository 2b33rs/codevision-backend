import { zodToJsonSchema } from 'zod-to-json-schema'
import { createCustomer } from './customer.service'
import { z } from 'zod'
import { FastifyInstance } from 'fastify'

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
    schema: {
      body: zodToJsonSchema(createCustomerSchema.body),
      response: {
        200: zodToJsonSchema(createCustomerSchema.body), // falls Response gleich dem Input
      },
    },
    handler: async (request, reply) => {
      const { name, email, phone, customerType } =
        createCustomerSchema.body.parse(request.body)

      const newCustomer = await createCustomer(name, email, phone, customerType)

      reply.send(newCustomer)
    },
  })
}
