import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto' 

export async function createOrder(customerId: string) {
  const lastOrder = await prisma.order.findFirst({
    orderBy: {
      orderNumber: 'desc',
    },
    select: {
      orderNumber: true,
    },
  })


  let newOrderNumber: string
  if (lastOrder?.orderNumber) {
    const asNumber = parseInt(lastOrder.orderNumber, 10)
    newOrderNumber = isNaN(asNumber) ? '1' : (asNumber + 1).toString()
  } else {
    newOrderNumber = '1'
  }

  // UUID generieren
  const id = randomUUID()

  // Order erstellen
  return prisma.order.create({
    data: {
      id,
      orderNumber: newOrderNumber,
      customer: {
        connect: { id: customerId },
      },
      deletedAt: null,
    },
  })
}
