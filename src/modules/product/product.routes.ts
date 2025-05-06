import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'
import { FastifyInstance } from 'fastify'
import { create, list, read, remove, update } from './product.service'

const idSchema = z.object({ id: z.string().uuid() })

const createProductSchema = z.object({
  name: z.string(),
  color: z.string(),
  shirtSize: z.string().optional(),
  productCategory: z.string(),
  MinAmount: z.number(),
})

const updateProductSchema = createProductSchema.partial()
const standardProductSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    deletedAt: { type: 'string', format: 'date-time', nullable: true },
    name: { type: 'string' },
    color: { type: 'string', nullable: true },
    shirtSize: {
      type: 'string',
      enum: ['S', 'M', 'L', 'XL'],
      nullable: true,
    },
    productCategory: {
      type: 'string',
      enum: ['T_SHIRT'],
    },
    MinAmount: { type: 'number' },
  },
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'name',
    'productCategory',
    'MinAmount',
  ],
}
export default async function productRoutes(fastify: FastifyInstance) {
  fastify.post('/', {
    schema: {
      tags: ['Product'],
      description: 'Create a new standard product',
      body: zodToJsonSchema(createProductSchema),
      response: {
        200: standardProductSchema,
      },
    },
    handler: create,
  })

  fastify.get('/:id', {
    schema: {
      tags: ['Product'],
      description: 'Get a standard product by ID',
      params: zodToJsonSchema(idSchema),
      response: {
        200: standardProductSchema,
        404: { type: 'null' },
      },
    },
    handler: read,
  })

  fastify.get('/', {
    schema: {
      tags: ['Product'],
      description: 'List all standard products',
      response: {
        200: {
          type: 'array',
          items: standardProductSchema,
        },
      },
    },
    handler: list,
  })

  fastify.put('/:id', {
    schema: {
      tags: ['Product'],
      description: 'Update an existing standard product by ID',
      params: zodToJsonSchema(idSchema),
      body: zodToJsonSchema(updateProductSchema),
      response: {
        200: standardProductSchema,
      },
    },
    handler: update,
  })

  fastify.delete('/:id', {
    schema: {
      tags: ['Product'],
      description: 'Delete a standard product by ID',
      params: zodToJsonSchema(idSchema),
      response: {
        200: standardProductSchema,
      },
    },
    handler: remove,
  })
}
