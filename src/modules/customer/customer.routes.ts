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

const customerSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    deletedAt: { type: 'string', format: 'date-time', nullable: true },

    email: { type: 'string', nullable: true },
    name: { type: 'string', nullable: true },
    phone: { type: 'string', nullable: true },

    addr_country: { type: 'string', enum: ['DE'], nullable: true },
    addr_city: { type: 'string', nullable: true },
    addr_zip: { type: 'string', nullable: true },
    addr_street: { type: 'string', nullable: true },
    addr_line1: { type: 'string', nullable: true },
    addr_line2: { type: 'string', nullable: true },

    customerType: { type: 'string', enum: ['WEBSHOP', 'BUSINESS'] },

    orders: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          orderNumber: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          deletedAt: { type: 'string', format: 'date-time', nullable: true },
          customerId: { type: 'string', format: 'uuid' },
        },
        required: ['id', 'orderNumber', 'createdAt', 'updatedAt', 'customerId'],
      },
      optional: true,
    },
  },
  required: ['id', 'createdAt', 'updatedAt', 'customerType'],
}

export default async function customerRoutes(fastify: FastifyInstance) {
  fastify.post('/', {
    schema: {
      tags: ['Customer'],
      summary: 'Create a new customer',
      description: 'Creates a new customer record',
      body: zodToJsonSchema(createCustomerSchema.body),
      response: {
        200: customerSchema,
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

      return createCustomer(
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
    },
  })

  // Route to list all customers
  fastify.get('/', {
    schema: {
      tags: ['Customer'],
      summary: 'List all customers',
      description: 'Returns a list of all customers',
      response: {
        200: {
          type: 'array',
          items: customerSchema,
        },
      },
    },
    handler: async (request, reply) => {
      const customers = await listCustomers()
      reply.send(customers)
    },
  })

  // Route to get a customer by ID
  fastify.get('/:id', {
    schema: {
      tags: ['Customer'],
      summary: 'Get a customer by ID',
      description: 'Returns a customer by their unique identifier',
      params: zodToJsonSchema(z.object({ id: z.string() })),
      response: {
        200: customerSchema,
        404: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
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
    schema: {
      tags: ['Customer'],
      summary: 'Update a customer by ID',
      description: 'Updates fields of an existing customer',
      params: zodToJsonSchema(z.object({ id: z.string() })),
      body: zodToJsonSchema(
        z.object({
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
        }),
      ),
      response: {
        200: customerSchema,
        404: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
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
    schema: {
      tags: ['Customer'],
      summary: 'Delete a customer by ID',
      description: 'Deletes the customer with the given ID',
      params: zodToJsonSchema(z.object({ id: z.string() })),
      response: {
        200: customerSchema,
        404: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
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
