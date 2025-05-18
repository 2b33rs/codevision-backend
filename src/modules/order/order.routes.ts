import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { createOrderZ, listOrdersQueryZ, schemas } from './order.schema'
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  getOrdersWithPositionStatus,
  PositionInput,
} from './order.service'
import { POSITION_STATUS } from '../../../generated/prisma'

export default async function orderRoutes(fastify: FastifyInstance) {
  /* ───────── POST /orders ───────── */
  fastify.post<{
    Body: z.infer<typeof createOrderZ>
  }>(
    '/',
    {
      schema: {
        tags: ['Order'],
        summary: 'Create a new order with positions',
        body: schemas.bodyCreate,
        response: { 200: schemas.orderResponse },
      },
    },
    async (req, reply) => {
      const { customerId, positions } = req.body
      try {
        const order = await createOrder(
          customerId,
          positions as PositionInput[],
        )

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

  /* ───────── GET /order/:id ───────── */
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['Order'],
        summary: 'Get a single order by ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: schemas.orderResponse,
          404: {
            type: 'object',
            properties: { message: { type: 'string' } },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        const order = await getOrderById(req.params.id)
        return order
          ? reply.send(order)
          : reply.status(404).send({ message: 'Order not found' })
      } catch (err: any) {
        console.error('❌ Fehler in GET /order/:id:', err)
        return reply.status(500).send({
          message: 'Fehler beim Abrufen der Order',
          detail: err.message,
        })
      }
    },
  )

  /* ───────── GET /order ───────── */
  fastify.get<{
    Querystring: z.infer<typeof listOrdersQueryZ>
  }>(
    '/',
    {
      schema: {
        tags: ['Order'],
        summary: 'List all orders or filter by customer ID',
        querystring: schemas.queryList,
        response: {
          200: {
            type: 'array',
            items: schemas.orderResponse,
          },
          400: {
            type: 'object',
            properties: { message: { type: 'string' } },
          },
          404: {
            type: 'object',
            properties: { message: { type: 'string' } },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        const { customerId } = req.query

        if (customerId) {
          return reply.send(await getOrdersByCustomer(customerId))
        }
        const orders = await getAllOrders()
        return reply.send(orders)
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

  /* ───────── GET /order/status/:status ───────── */
  fastify.get<{
    Params: { status: POSITION_STATUS }
  }>(
    '/status/:status',
    {
      schema: {
        tags: ['Order'],
        summary:
          'Get all orders with at least one position with the given status',
        params: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: Object.values(POSITION_STATUS) },
          },
          required: ['status'],
        },
        response: {
          200: {
            type: 'array',
            items: schemas.orderResponse,
          },
          500: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const { status } = request.params
      try {
        const orders = await getOrdersWithPositionStatus(status)
        reply.send(orders)
      } catch (error) {
        console.error('❌ Fehler in GET /order/status/:status:', error)
        reply.status(500).send({ error: 'Interner Serverfehler' })
      }
    },
  )
}
