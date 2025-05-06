import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'

export async function createOrder(customerId: string) {
  const now = new Date()
  const yearShort = now.getFullYear().toString().slice(2) // z. B. "25"
  const prefix = `${yearShort}_` // z. B. "25_"

  // Finde die höchste Ordernummer mit diesem Jahres-Prefix
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

  const newOrderNumber = `${prefix}${counter}` // z. B. "25_3"

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
