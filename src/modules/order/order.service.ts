import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'
import { createPosition } from '../position/position.service'
import { PositionInput } from './order.schema'
import {
  generateOrderNumber,
  handlePositionInventoryAndProduction,
} from './order.helpers'

export async function createOrder(
  customerId: string,
  positions: PositionInput[],
) {
  try {
    console.log('📝 Starte Auftragserstellung für Customer:', customerId)

    const orderNumber = await generateOrderNumber()
    const order = await prisma.order.create({
      data: {
        id: randomUUID(),
        orderNumber,
        customer: { connect: { id: customerId } },
        deletedAt: null,
      },
    })

    const createdPositions = await Promise.all(
      positions.map((p) =>
        createPosition(
          order.id,
          p.amount,
          p.price,
          p.pos_number,
          p.name,
          p.productCategory,
          p.design,
          p.color,
          p.shirtSize,
          p.description,
          p.standardProductId,
        ),
      ),
    )

    for (const pos of createdPositions) {
      await handlePositionInventoryAndProduction(order, pos)
    }

    console.log('✅ Auftrag erfolgreich erstellt:', order.id)
    return {
      id: order.id,
      customerId,
      orderNumber,
      positions: createdPositions,
    }
  } catch (err) {
    console.error('❌ Fehler in createOrder:', err)
    throw err
  }
}
