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

export default async function productRoutes(fastify: FastifyInstance) {
  fastify.post('/', {
    schema: {
      body: zodToJsonSchema(createProductSchema),
      response: { 200: { type: 'object' } }, // ggf. genaueres Schema
    },
    handler: create,
  })

  fastify.get('/:id', {
    schema: {
      params: zodToJsonSchema(idSchema),
      response: { 200: { type: 'object' }, 404: { type: 'null' } },
    },
    handler: read,
  })

  fastify.get('/', {
    schema: {
      response: { 200: { type: 'array', items: { type: 'object' } } },
    },
    handler: list,
  })

  fastify.put('/:id', {
    schema: {
      params: zodToJsonSchema(idSchema),
      body: zodToJsonSchema(updateProductSchema),
      response: { 200: { type: 'object' } },
    },
    handler: update,
  })

  fastify.delete('/:id', {
    schema: {
      params: zodToJsonSchema(idSchema),
      response: { 200: { type: 'object' } },
    },
    handler: remove,
  })
}
