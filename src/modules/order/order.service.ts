import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'

export async function createOrder(customerId: string) {
  const now = new Date()
  const yearShort = now.getFullYear().toString().slice(2)
  const prefix = `${yearShort}_`

  const lastOrder = await prisma.order.findFirst({
    where: {
      orderNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      orderNumber: 'desc',
    },
    select: {
      orderNumber: true,
    },
  })

  let counter = 1

  if (lastOrder?.orderNumber) {
    const lastNumberPart = parseInt(lastOrder.orderNumber.split('_')[1], 10)
    counter = isNaN(lastNumberPart) ? 1 : lastNumberPart + 1
  }

  const newOrderNumber = `${prefix}${counter}`

  return prisma.order.create({
    data: {
      id: randomUUID(),
      orderNumber: newOrderNumber,
      customer: {
        connect: { id: customerId },
      },
      deletedAt: null,
    },
  })
}

export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
  })
}

export async function getOrdersByCustomer(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
  })
}

export async function getAllOrders() {
  return prisma.order.findMany()
}
