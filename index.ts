import fastify from 'fastify'
import {Order, PrismaClient} from "./generated/prisma";

const prisma = new PrismaClient()
const server = fastify()

server.get<{
    Reply: Order[]
}>('/orders', async (request, reply) => {
    return prisma.order.findMany();
})

interface CreateOrderBody {
    orderNumber: string
    notes?: string
    customerId: number
}

server.post<{
    Body: CreateOrderBody
    Reply: Order
}>('/orders', async (request, reply) => {
    const { orderNumber, notes, customerId } = request.body
    return prisma.order.create({
        data: {
            orderNumber,
            notes,
            customer: {
                connect: {id: customerId},
            },
        },
    });
})

server.listen({ port: 8080 }, (err, address) => {
    if (err) {
        console.error(err)
        process.exit(1)
    }
    console.log(`Server is listening to ${address}`)
})