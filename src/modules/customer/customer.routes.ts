import { FastifyInstance } from 'fastify'
import {
  createCustomerZ,
  idParam,
  schemas,
  updateCustomerZ,
} from './customer.schema'
import * as svc from './customer.service'
import { Prisma } from '../../../generated/prisma'

export default async function customerRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Customer'],
        body: schemas.create,
        response: { 200: schemas.customer },
      },
    },
    async ({ body }) => svc.createCustomer(createCustomerZ.parse(body)),
  )

  fastify.get(
    '/',
    {
      schema: { tags: ['Customer'], response: { 200: schemas.list } },
    },
    async (_, reply) => reply.send(await svc.listCustomers()),
  )

  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Customer'],
        params: schemas.params,
        response: {
          200: schemas.customer,
          404: { type: 'object', properties: { message: { type: 'string' } } },
        },
      },
    },
    async ({ params }, reply) => {
      const { id } = idParam.parse(params)
      const c = await svc.getCustomerById(id)
      if (!c) reply.status(404).send({ message: 'Not found' })
      else return c
    },
  )

  fastify.put(
    '/:id',
    {
      schema: {
        tags: ['Customer'],
        params: schemas.params,
        body: schemas.update,
        response: {
          200: schemas.customer,
          404: { type: 'object', properties: { message: { type: 'string' } } },
        },
      },
    },
    async ({ params, body }, reply) => {
      const { id } = idParam.parse(params)
      const data = updateCustomerZ.parse(body)
      try {
        return await svc.updateCustomerById(id, data)
      } catch {
        reply.status(404).send({ message: 'Not found' })
      }
    },
  )

  fastify.get(
    '/:id/meta',
    {
      schema: {
        tags: ['Customer'],
        params: schemas.params,
        response: {
          200: {
            type: 'object',
            properties: {
              orderCount: { type: 'number' },
              canDelete: { type: 'boolean' },
            },
          },
          404: {
            type: 'object',
            properties: { message: { type: 'string' } },
          },
        },
      },
    },
    async ({ params }, reply) => {
      const { id } = idParam.parse(params)
      const { _count } = (await svc.getCustomerByIdWithCount(id)) ?? {}
      if (_count === undefined)
        return reply.code(404).send({ message: 'Nicht gefunden' })
      return { orderCount: _count.orders, canDelete: _count.orders === 0 }
    },
  )

  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['Customer'],
        params: schemas.params,
        response: {
          200: schemas.customer,
          404: { type: 'object', properties: { message: { type: 'string' } } },
          500: { type: 'object', properties: { message: { type: 'string' } } },
        },
      },
    },
    async (request, reply) => {
      const { id } = idParam.parse(request.params)
      request.log.debug({ id }, 'Deleting customer')
      try {
        const deleted = await svc.deleteCustomerById(id)
        request.log.info({ id }, 'Customer deleted')
        return deleted
      } catch (err) {
        request.log.error({ err, id }, 'Error deleting customer')
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2025'
        ) {
          return reply
            .code(404)
            .send({ message: `Customer mit ID ${id} nicht gefunden` })
        }
        return reply.code(500).send({ message: 'Interner Serverfehler' })
      }
    },
  )
}
