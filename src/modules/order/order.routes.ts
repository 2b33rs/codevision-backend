import { FastifyInstance } from 'fastify'
import { getAllOrders, getSampleOrder } from './order.service'
import { mapToOpenAPISchema } from '../../utils/openapi-schema'

type GetAllOrdersResponse = Awaited<ReturnType<typeof getAllOrders>>

export default async function orderRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Reply: GetAllOrdersResponse
  }>(
    '',
    {
      schema: {
        response: {
          200: {
            description: 'List of orders',
            content: {
              'application/json': {
                schema: mapToOpenAPISchema([getSampleOrder()]),
              },
            },
          },
        },
      },
    },
    async (_, reply) => {
      const orders = await getAllOrders()
      reply.send(orders)
    },
  )
}
