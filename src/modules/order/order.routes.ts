import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  getOrderById,
  getOrdersByCustomer,
  getAllOrders,
} from './order.service'
import { createOrder } from './order.service'
import { prisma } from '../../plugins/prisma'
import { zodToJsonSchema } from 'zod-to-json-schema'

const createOrderSchema = z.object({
  customerId: z.string().uuid(),
})

const getOrderQuerySchema = z.object({
  orderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
})

export default async function orderRoutes(fastify: FastifyInstance) {
  fastify.post('/', {
    schema: {
      tags: ['Order'],
      summary: 'Create a new order',
      description: 'Creates a new order and assigns it to a given customer',
      body: zodToJsonSchema(createOrderSchema),
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
            orderNumber: { type: 'string' },
            customerId: { type: 'string', format: 'uuid' },
          },
          required: [
            'id',
            'createdAt',
            'updatedAt',
            'orderNumber',
            'customerId',
          ],
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            issues: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { customerId } = createOrderSchema.parse(request.body)
        const newOrder = await createOrder(customerId)
        return reply.send(newOrder)
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ message: 'Validation error', issues: err.errors })
        }
        console.error(err)
        return reply.status(500).send({ message: 'Internal Server Error' })
      }
    },
  })

  fastify.get('/', {
    schema: {
      tags: ['Order'],
      summary: 'List orders or get by customer/order ID',
      description:
        'Returns a specific order, all orders for a customer, or all orders',
      querystring: zodToJsonSchema(getOrderQuerySchema),
      response: {
        200: {
          oneOf: [
            {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                deletedAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                },
                orderNumber: { type: 'string' },
                customerId: { type: 'string', format: 'uuid' },
              },
              required: [
                'id',
                'createdAt',
                'updatedAt',
                'orderNumber',
                'customerId',
              ],
            },
            {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  deletedAt: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                  },
                  orderNumber: { type: 'string' },
                  customerId: { type: 'string', format: 'uuid' },
                },
                required: [
                  'id',
                  'createdAt',
                  'updatedAt',
                  'orderNumber',
                  'customerId',
                ],
              },
            },
          ],
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            issues: { type: 'array', items: { type: 'object' } },
          },
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const query = getOrderQuerySchema.parse(request.query)

        if (query.orderId) {
          const order = await getOrderById(query.orderId)
          if (!order) {
            return reply.status(404).send({ message: 'Order not found' })
          }
          return reply.send(order)
        }

        if (query.customerId) {
          const orders = await getOrdersByCustomer(query.customerId)
          return reply.send(orders)
        }

        const allOrders = await getAllOrders()
        return reply.send(allOrders)
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ message: 'Invalid query', issues: err.errors })
        }
        console.error(err)
        return reply.status(500).send({ message: 'Internal Server Error' })
      }
    },
  })
}
