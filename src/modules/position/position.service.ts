import { $Enums, Position, Prisma } from '../../../generated/prisma'
import { prisma } from '../../plugins/prisma'
import { FastifyReply, FastifyRequest } from 'fastify'
import { requestFinishedGoodsSchema } from './position.schema'
import { requestFinishedGoods } from '../../external/mawi.service'
import {
  getProductionOrdersByPositionId,
  updateProductionOrderStatus,
} from '../production-order/production-order.service'
import POSITION_STATUS = $Enums.POSITION_STATUS
import PRODUCTION_ORDER_STATUS = $Enums.PRODUCTION_ORDER_STATUS

/**
 * Aktualisiert den Status einer Position oder eines Fertigungsauftrags über den zusammengesetzten Geschäftsschlüssel.
 *
 * - Für Positionen: "orderNumber.pos_number"
 * - Für Fertigungsaufträge: "orderNumber.pos_number.productionOrderId"
 */
/**
 * Aktualisiert den Status einer Position oder eines Fertigungsauftrags
 * über den zusammengesetzten Geschäftsschlüssel.
 *
 * - Für Positionen: "orderNumber.pos_number"
 * - Für Fertigungsaufträge: "orderNumber.pos_number.productionorder_number"
 */
export async function updatePositionStatusByBusinessKey(
  compositeId: string,
  status: POSITION_STATUS | PRODUCTION_ORDER_STATUS,
): Promise<Position | import('../../../generated/prisma').ProductionOrder> {
  const parts = compositeId.split('.')

  if (parts.length === 2) {
    // Position updaten
    const [orderNumber, posNumberStr] = parts
    const pos_number = parseInt(posNumberStr, 10)

    const position = await prisma.position.findFirst({
      where: { order: { orderNumber }, pos_number },
      include: { order: true },
    })
    if (!position) throw new Error('Position not found')

    // Beim Abschließen Position, amountInProduction reduzieren
    if (status === POSITION_STATUS.COMPLETED && position.standardProductId) {
      await prisma.standardProduct.update({
        where: { id: position.standardProductId },
        data: { amountInProduction: { decrement: position.amount } },
      })
    }

    return prisma.position.update({
      where: { id: position.id },
      data: { Status: status as POSITION_STATUS },
    })
  }

  if (parts.length === 3) {
    // ProductionOrder updaten
    const [orderNumber, posNumberStr, prodNumStr] = parts
    const pos_number = parseInt(posNumberStr, 10)
    const productionorder_number = parseInt(prodNumStr, 10)

    // Position finden
    const position = await prisma.position.findFirst({
      where: { order: { orderNumber }, pos_number },
    })
    if (!position) throw new Error('Position not found')

    // ProductionOrder per Nummer finden
    const prodOrder = await prisma.productionOrder.findFirst({
      where: {
        positionId: position.id,
        productionorder_number,
      },
    })
    if (!prodOrder) throw new Error('ProductionOrder not found')

    // Status-Update der ProductionOrder
    const updatedProdOrder = await updateProductionOrderStatus(
      prodOrder.id,
      status as PRODUCTION_ORDER_STATUS,
    )

    if (status === PRODUCTION_ORDER_STATUS.READY_FOR_PICKUP) {
      const allProductionOrders = await getProductionOrdersByPositionId(
        position.id,
      )

      // Prüfen, ob alle ProductionOrders READY_FOR_PICKUP sind
      const allReadyForPickup = allProductionOrders.every(
        (order) => order.Status === PRODUCTION_ORDER_STATUS.READY_FOR_PICKUP,
      )

      if (allReadyForPickup && allProductionOrders.length > 0) {
        // Position Status auf READY_FOR_PICKUP setzen
        await prisma.position.update({
          where: { id: position.id },
          data: { Status: POSITION_STATUS.READY_FOR_PICKUP },
        })
      }
    }

    return updatedProdOrder
  }

  throw new Error(
    `Invalid compositeId format: ${compositeId}. Expected 2 or 3 parts.`,
  )
}

/**
 * Legt eine neue Position an.
 */
export async function createPosition(
  orderId: string,
  amount: number,
  price: string,
  pos_number: number,
  name: string,
  productCategory: string,
  design: string,
  color: string,
  shirtSize: string,
  description?: string,
  standardProductId?: string,
  typ?: string[],
): Promise<Position> {
  return prisma.position.create({
    data: {
      order: { connect: { id: orderId } },
      pos_number,
      description,
      amount,
      price: new Prisma.Decimal(price),
      name,
      productCategory,
      design,
      color,
      shirtSize,
      Status: POSITION_STATUS.IN_PROGRESS,
      standardProductId,
      typ,
    },
  })
}

/**
 * Batch‐Handler für “Finished Goods” Anforderungen.
 */
export async function requestFinishedGoodsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { orderNumber, positions } =
    requestFinishedGoodsSchema.shape.body.parse(request.body)

  const results: Array<{
    id: string
    message: string
    newStatus: POSITION_STATUS
  }> = []

  for (const pos of positions) {
    try {
      const position = await getPositionById(pos.id)
      if (!position) {
        console.error('keine Position gefunden für ID: ' + pos.id)
        continue
      }

      const productionOrders = await getProductionOrdersByPositionId(pos.id)
      if (productionOrders.length === 0) {
        console.error(
          'keine Fertigungsaufträge für Position (nur Lager): ' + pos.id,
        )
        continue
      }

      for (const order of productionOrders) {
        const businessKey = `${orderNumber}.${position.pos_number}`
        const res = await requestFinishedGoods(
          order.materialId,
          order.amount,
          businessKey,
        )

        results.push({
          id: pos.id,
          message: res.status,
          newStatus: POSITION_STATUS.OUTSOURCING_REQUESTED,
        })
      }
    } catch (error) {
      console.error(`Fehler bei Position ${pos.id}:`, error)
    }
  }

  reply.send({ orderNumber, results })
}

/**
 * Liefert eine Position nach ihrer ID.
 */
export async function getPositionById(id: string): Promise<Position | null> {
  return prisma.position.findUnique({ where: { id } })
}
