import { FastifyInstance } from 'fastify'
import { getAllOrders } from './order.service'

export default async function orderRoutes(fastify: FastifyInstance) {
    fastify.get('', async () => getAllOrders())
}