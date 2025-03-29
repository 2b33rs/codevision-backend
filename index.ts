import fastify from 'fastify'
import {Order, PrismaClient} from "./generated/prisma";

const prisma = new PrismaClient()
const server = fastify()

server.get<{
    Reply: Order[]
}>('/orders', async (request, reply) => {
    return prisma.order.findMany();
})


server.listen({ port: 8080 }, (err, address) => {
    if (err) {
        console.error(err)
        process.exit(1)
    }
    console.log(`Server is listening to ${address}`)
})