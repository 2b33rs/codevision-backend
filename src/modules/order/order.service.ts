import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'

export async function createOrder(customerId: string) {
  const now = new Date()
  const yearShort = now.getFullYear().toString().slice(2)
  const prefix = `${yearShort}_`

  let counter = 1
  let createdOrder = null

  while (!createdOrder) {
    const newOrderNumber = `${prefix}${counter}`

    try {
      createdOrder = await prisma.order.create({
        data: {
          id: randomUUID(),
          orderNumber: newOrderNumber,
          customer: {
            connect: { id: customerId },
          },
          deletedAt: null,
        },
      })
    } catch (error: any) {
      // Prisma unique constraint violation: orderNumber schon vorhanden
      if (error.code === 'P2002' && error.meta?.target?.includes('orderNumber')) {
        counter++
        continue
      }
      throw error // bei anderen Fehlern abbrechen
    }
  }

  return createdOrder
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
