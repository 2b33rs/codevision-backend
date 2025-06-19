import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'
import { createPosition } from '../position/position.service'
import { PositionInput } from './order.schema'
import { handlePositionInventoryAndProduction } from './order.helpers'

/**
 * Creates an order for a specific product without a customer
 * Used when a production order is created directly from a product
 */
export async function createOrderForProduct(productId: string, amount: number) {
  try {
    console.log('📝 Starte Auftragserstellung für Produkt:', productId)

    // Get the product
    const product = await prisma.standardProduct.findUnique({
      where: { id: productId },
    })

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`)
    }

    // Create an order without a customer
    const order = await prisma.order.create({
      data: {
        id: randomUUID(),
        deletedAt: null,
      },
    })
    console.log('📦 Neue Ordernummer (DB) ohne Kunde:', order.orderNumber)

    // Create a position for the product
    const position = await createPosition(
      order.id,
      amount,
      '0.00', // Price is 0 for internal orders
      1, // Position number
      product.name,
      product.productCategory,
      '', // Design is empty for standard products
      product.color || '',
      product.shirtSize || '',
      `Internal production order for ${product.name}`,
      product.id,
      product.typ,
    )

    // Handle inventory and production
    await handlePositionInventoryAndProduction(order, position, 'STANDARD')

    // Get production orders for the position
    const productionOrders = await prisma.productionOrder.findMany({
      where: { positionId: position.id },
    })

    const positionWithProductionOrders = {
      ...position,
      productionOrders,
    }

    console.log('✅ Auftrag ohne Kunde erfolgreich erstellt:', order.id)
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      positions: [positionWithProductionOrders],
    }
  } catch (err) {
    console.error('❌ Fehler in createOrderForProduct:', err)
    throw err
  }
}

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
          p.typ,
        ),
      ),
    )

    // Inventory & Produktion
    for (const pos of createdPositions) {
      await handlePositionInventoryAndProduction(order, pos, 'STANDARD')
    }

    // ProductionOrders für jede Position abfragen und anhängen
    const positionsWithProductionOrders = await Promise.all(
      createdPositions.map(async (pos) => {
        const productionOrders = await prisma.productionOrder.findMany({
          where: { positionId: pos.id },
        })
        return {
          ...pos,
          productionOrders, // Fügt ProductionOrders zur Position hinzu
        }
      }),
    )

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

export async function createOrderForComplaint(
  customerId: string | null,
  position: {
    amount: number
    price: string
    name: string
    productCategory: string
    design: string
    color: string
    shirtSize: string
    description?: string
    standardProductId?: string
    typ?: string[]
  },
) {
  try {
    console.log(
      '📝 Starte Auftragserstellung für Complaint mit Customer:',
      customerId,
    )

    // Wir lassen den Trigger seq + orderNumber in der DB setzen
    const order = await prisma.order.create({
      data: {
        id: randomUUID(),
        ...(customerId ? { customer: { connect: { id: customerId } } } : {}),
        deletedAt: null,
      },
    })
    console.log('📦 Neue Ordernummer (DB) für Complaint:', order.orderNumber)

    // Position anlegen
    const createdPosition = await createPosition(
      order.id,
      position.amount,
      position.price,
      1, // pos_number is always 1 for complaint orders
      position.name,
      position.productCategory,
      position.design,
      position.color,
      position.shirtSize,
      position.description,
      position.standardProductId,
      position.typ,
    )

    // Inventory & Produktion
    await handlePositionInventoryAndProduction(
      order,
      createdPosition,
      'COMPLAINT',
    )

    // ProductionOrders für die Position abfragen und anhängen
    const productionOrders = await prisma.productionOrder.findMany({
      where: { positionId: createdPosition.id },
    })

    const positionWithProductionOrders = {
      ...createdPosition,
      productionOrders,
    }

    console.log('✅ Auftrag für Complaint erfolgreich erstellt:', order.id)
    return {
      id: order.id,
      customerId,
      orderNumber: order.orderNumber,
      positions: [positionWithProductionOrders],
    }
  } catch (err) {
    console.error('❌ Fehler in createOrderForComplaint:', err)
    throw err
  }
}
