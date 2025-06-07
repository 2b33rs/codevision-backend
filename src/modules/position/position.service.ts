import { $Enums, Position } from '../../../generated/prisma'
import { prisma } from '../../plugins/prisma'
import { FastifyReply, FastifyRequest } from 'fastify'
import { requestFinishedGoodsSchema } from './position.schema'
import { requestFinishedGoods } from '../../external/mawi.service'
import { getProductionOrdersByPositionId } from '../production-order/production-order.service'
import POSITION_STATUS = $Enums.POSITION_STATUS
import ShirtSize = $Enums.ShirtSize

/**
 * Aktualisiert den Status einer Position über den zusammengesetzten Geschäftsschlüssel.
 */
export async function updatePositionStatusByBusinessKey(
  compositeId: string,
  status: POSITION_STATUS,
) {
  const [orderNumber, posNumberStr] = compositeId.split('.')
  const pos_number = parseInt(posNumberStr, 10)

  const position = await prisma.position.findFirst({
    where: {
      order: { orderNumber },
      pos_number,
    },
    include: { order: true },
  })

  if (!position) throw new Error('Position not found')

  // === Neue Logik: amountInProduction runterzählen, wenn Status = PRODUCTION_COMPLETED ===
  if (status === POSITION_STATUS.COMPLETED && position.standardProductId) {
    await prisma.standardProduct.update({
      where: { id: position.standardProductId },
      data: {
        amountInProduction: {
          decrement: position.amount,
        },
      },
    })
  }

  return prisma.position.update({
    where: { id: position.id },
    data: { Status: status },
  })
}

/**
 * Legt eine neue Position an.
 */
export async function createPosition(
  orderId: string,
  amount: number,
  pos_number: number,
  name: string,
  productCategory: string,
  design: string,
  color: string,
  shirtSize: ShirtSize,
  description?: string,
  standardProductId?: string,
) {
  return prisma.position.create({
    data: {
      order: { connect: { id: orderId } },
      pos_number,
      description,
      amount,
      name,
      productCategory,
      design,
      color,
      shirtSize,
      Status: POSITION_STATUS.IN_PROGRESS,
      standardProductId,
    },
  })
}

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
      // Position laden
      const position = await getPositionById(pos.id)
      if (!position) {
        console.error(
          'keine Position in der Datenbank gefunden zur pos ID: ' + pos.id,
        )
        continue
      }

      // Fertigungsaufträge für diese Position laden
      const productionOrders = await getProductionOrdersByPositionId(pos.id)

      if (productionOrders.length === 0) {
        console.error(
          'Die Position hat keine Fertigungsauftrag war nur ein lagerauftrag und ist demnach schon ausgelagert.. ' +
            pos.id,
        )
        continue
      }

      // Für jeden Fertigungsauftrag die Fertigware anfordern
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
          newStatus: 'OUTSOURCING_REQUESTED',
        })
      }
    } catch (error) {
      console.error(`Fehler bei Position ${pos.id}:`, error)
    }
  }

  reply.send({ orderNumber, results })
}

export async function getPositionById(id: string): Promise<Position | null> {
  return prisma.position.findFirst({ where: { id: id } })
}
