import {
  createCustomer,
  deleteCustomerById,
  getCustomerById,
  listCustomers,
  updateCustomerById,
} from './customer.service'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'
import { FastifyInstance } from 'fastify'

const createCustomerSchema = {
  body: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    addr_country: z.enum(['DE']),
    addr_city: z.string(),
    addr_zip: z.string(),
    addr_street: z.string(),
    addr_line1: z.string(),
    addr_line2: z.string(),
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
      const {
        name,
        email,
        phone,
        addr_country,
        addr_city,
        addr_zip,
        addr_street,
        addr_line1,
        addr_line2,
        customerType,
      } = createCustomerSchema.body.parse(request.body)

      const newCustomer = await createCustomer(
        name,
        email,
        phone,
        addr_country,
        addr_city,
        addr_zip,
        addr_street,
        addr_line1,
        addr_line2,
        customerType,
      )

      reply.send(newCustomer)
    },
  })

  // Route to list all customers
  fastify.get('/', {
    handler: async (request, reply) => {
      const customers = await listCustomers()
      reply.send(customers)
    },
  })

  // Route to get a customer by ID
  fastify.get('/:id', {
    handler: async (request, reply) => {
      const getSchema = z.object({
        id: z.string(),
      })

      const { id } = getSchema.parse(request.params)
      const customer = await getCustomerById(id)

      if (!customer) {
        reply.status(404).send({ message: 'Customer not found' })
      } else {
        reply.send(customer)
      }
    },
  })

  // Route to update a customer by ID
  fastify.put('/:id', {
    handler: async (request, reply) => {
      const putSchema = z.object({
        id: z.string(),
      })

      const bodySchema = z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        addr_country: z.enum(['DE']).optional(),
        addr_city: z.string().optional(),
        addr_zip: z.string().optional(),
        addr_street: z.string().optional(),
        addr_line1: z.string().optional(),
        addr_line2: z.string().optional(),
        customerType: z.enum(['WEBSHOP', 'BUSINESS']).optional(),
      })

      const { id } = putSchema.parse(request.params)
      const updateData = bodySchema.parse(request.body)

      const updatedCustomer = await updateCustomerById(id, updateData)

      if (!updatedCustomer) {
        reply.status(404).send({ message: 'Customer not found' })
      } else {
        reply.send(updatedCustomer)
      }
    },
  })

  // Route to delete a customer by ID
  fastify.delete('/:id', {
    handler: async (request, reply) => {
      const deleteSchema = z.object({
        id: z.string(),
      })

      const { id } = deleteSchema.parse(request.params)

      try {
        const deletedCustomer = await deleteCustomerById(id)

        reply.send(deletedCustomer)
      } catch (error) {
        reply.status(404).send({ message: 'Customer not found' })
      }
    },
  })
}