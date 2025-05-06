import { FastifyInstance } from 'fastify'
import { create, list, read, remove, update } from './product.service'
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string(),
  color: z.any().optional(),
  shirtSize: z.string().optional(),
  ProdCat: z.string(),
  MinAmount: z.number(),
})

export default async function productRoutes(fastify: FastifyInstance) {
  fastify.post('/', { handler: create })
  fastify.get('/:id', { handler: read })
  fastify.get('/', { handler: list })
  fastify.put('/:id', { handler: update })
  fastify.delete('/:id', { handler: remove })
}
