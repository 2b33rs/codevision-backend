import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import {
  schemas,
  createOrderZ,
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
        body:     schemas.bodyCreate,
        response: { 200: schemas.orderResponse },
      },
    },
    async (req, reply) => {
      const { customerId, positions } = req.body
      try {
        const order = await createOrder(customerId, positions as PositionInput[])

        // 📤 Debug-Log vor Rückgabe
        console.log('📤 Response an Client:', JSON.stringify(order, null, 2))

        // Optional: Quickfix zur Vermeidung von Problemen mit Date/BigInt
        const clean = JSON.parse(JSON.stringify(order))
        return reply.send(clean)

      } catch (err: any) {
        console.error('❌ Fehler in order POST /orders:')
        console.error(err)

        if (err.validation) {
          console.error('🧪 Zod-/AJV-ValidationError:', err.validation)
        }

        return reply.status(500).send({
          message: 'Interner Fehler beim Erstellen der Order',
          detail: err.message,
        })
      }
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
        querystring: schemas.queryList,
        response: {
          200: { oneOf: [schemas.orderResponse, schemas.ordersResponse] },
          400: { type: 'object', properties: { message: { type: 'string' } } },
          404: { type: 'object', properties: { message: { type: 'string' } } },
        },
      },
    },
    async (req, reply) => {
      try {
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
      } catch (err: any) {
        console.error('❌ Fehler in order GET /orders:')
        console.error(err)

        return reply.status(500).send({
          message: 'Fehler beim Abrufen von Orders',
          detail: err.message,
        })
      }
    },
  )
}
