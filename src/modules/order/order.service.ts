import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'
import { createPosition } from '../position/position.service'
import { PositionInput } from './order.schema'
import { handlePositionInventoryAndProduction } from './order.helpers'

export async function createOrder(
  customerId: string,
  positions: PositionInput[],
) {
  try {
    console.log('📝 Starte Auftragserstellung für Customer:', customerId)

    // Wir lassen den Trigger seq + orderNumber in der DB setzen
    const order = await prisma.order.create({
      data: {
        id: randomUUID(),
        customer: { connect: { id: customerId } },
        deletedAt: null,
      },
    })
    console.log('📦 Neue Ordernummer (DB):', order.orderNumber)

    // Positionen anlegen
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

    // Inventory & Produktion
    for (const pos of createdPositions) {
      await handlePositionInventoryAndProduction(order, pos)
    }

    // ProductionOrders für jede Position abfragen und anhängen
    const positionsWithProductionOrders = await Promise.all(
      createdPositions.map(async (pos) => {
        const productionOrders = await prisma.productionOrder.findMany({
          where: { positionId: pos.id },
        });
        return {
          ...pos,
          productionOrders, // Fügt ProductionOrders zur Position hinzu
        };
      })
    );

    console.log('✅ Auftrag erfolgreich erstellt:', order.id)
    return {
      id: order.id,
      customerId,
      orderNumber: order.orderNumber,
      positions: positionsWithProductionOrders, // Verwendet die erweiterten Positionen
    }
  } catch (err) {
    console.error('❌ Fehler in createOrder:', err)
    throw err
  }
}