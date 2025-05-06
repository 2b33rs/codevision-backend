import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createOrder,
  getOrderById,
  getOrdersByCustomer,
  getAllOrders,
} from './order.service'

const createOrderSchema = z.object({
  customerId: z.string().uuid(),
})

const getOrderQuerySchema = z.object({
  orderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
})

export default async function orderRoutes(fastify: FastifyInstance) {
  fastify.post('/', {
    handler: async (request, reply) => {
      try {
        const { customerId } = createOrderSchema.parse(request.body)
        const newOrder = await createOrder(customerId)
        return reply.send(newOrder)
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.status(400).send({ message: 'Validation error', issues: err.errors })
        }
        console.error(err)
        return reply.status(500).send({ message: 'Internal Server Error' })
      }
    },
  })

  fastify.get('/', {
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
          return reply.status(400).send({ message: 'Invalid query', issues: err.errors })
        }
        console.error(err)
        return reply.status(500).send({ message: 'Internal Server Error' })
      }
    },
  })
}
