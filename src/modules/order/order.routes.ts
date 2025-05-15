import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import {
  schemas,
  createOrderZ,        // Zod-Schemas explizit importieren
  listOrdersQueryZ,
} from './order.schema'
import {
  createOrder,
  getOrderById,
  getOrdersByCustomer,
  getAllOrders,
  PositionInput,
} from './order.service'

export default async function orderRoutes (fastify: FastifyInstance) {
  /* ───────── POST /orders ───────── */
  fastify.post<{
    Body: z.infer<typeof createOrderZ>;
  }>(
    '/',
    {
      schema: {
        tags: ['Order'],
        summary: 'Create a new order with positions',
        body:     schemas.bodyCreate,      // JSON-Schema
        response: { 200: schemas.orderResponse },
      },
    },
    async (req, reply) => {
      // req.body ist jetzt stark typisiert
      const { customerId, positions } = req.body
      const order = await createOrder(customerId, positions as PositionInput[])
      return reply.send(order)
    },
  )

  /* ───────── GET /orders ───────── */
  fastify.get<{
    Querystring: z.infer<typeof listOrdersQueryZ>;
  }>(
    '/',
    {
      schema: {
        tags: ['Order'],
        summary: 'List orders or get by customer/order ID',
        querystring: schemas.queryList,    // JSON-Schema
        response: {
          200: { oneOf: [schemas.orderResponse, schemas.ordersResponse] },
          400: { type: 'object', properties: { message: { type: 'string' } } },
          404: { type: 'object', properties: { message: { type: 'string' } } },
        },
      },
    },
    async (req, reply) => {
      const { orderId, customerId } = req.query

      if (orderId) {
        const order = await getOrderById(orderId)
        return order
          ? reply.send(order)
          : reply.status(404).send({ message: 'Order not found' })
      }

      if (customerId) {
        return reply.send(await getOrdersByCustomer(customerId))
      }

      return reply.send(await getAllOrders())
    },
  )
}
