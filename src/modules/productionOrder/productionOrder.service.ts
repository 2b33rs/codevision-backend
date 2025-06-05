import axios from 'axios'
import { CreateProductionOrderType } from './productionOrder.schema'
import { prisma } from '../../plugins/prisma'
import { $Enums } from '../../../generated/prisma'
import {
  ProductionApiPayload,
  ProductionTemplate,
} from '../../external/mawi.schema'
import { PRODUCTION_API_URL } from '../../external/externalAPIs'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function createProductionOrder(
  req: FastifyRequest<{ Body: CreateProductionOrderType }>,
  res: FastifyReply,
) {
  const body = req.body
  const currentCount = await prisma.productionOrder.count({
    where: { positionId: body.positionId },
  })

  const nextNumber = currentCount + 1

  const productionOrder = await prisma.productionOrder.create({
    data: {
      positionId: body.positionId,
      amount: body.amount,
      designUrl: body.designUrl,
      orderType: body.orderType,
      dyeingNecessary: body.dyeingNecessary,
      productTemplate: body.productTemplate,
      Status: body.Status ?? $Enums.PRODUCTION_ORDER_STATUS.ORDER_RECEIVED,
      productionorder_number: nextNumber,
    },
  })

  const position = await prisma.position.findUnique({
    where: { id: productionOrder.positionId },
    include: { order: true },
  })

  if (!position?.order) {
    throw new Error('Position oder zugehörige Order nicht gefunden.')
  }

  const orderIdPositionsId = `${position.order.orderNumber}.${position.pos_number}`

  const tpl = productionOrder.productTemplate as ProductionTemplate

  const payload: ProductionApiPayload = {
    productionOrderId: orderIdPositionsId,
    anzahlTShirts: productionOrder.amount,
    motivUrl: productionOrder.designUrl,
    auftragstyp: productionOrder.orderType,
    faerbereiErforderlich: productionOrder.dyeingNecessary,
    artikelTemplate: tpl,
  }

  try {
    await axios.post(
      `${PRODUCTION_API_URL}/fertigungsauftraege/fertigungsauftraegeAnlegen`,
      [payload],
      { headers: { 'Content-Type': 'application/json' } },
    )

    return {
      status: 'ok' as const,
      message: `Produktionsauftrag #${productionOrder.productionorder_number} über ${body.amount} Stück ausgelöst`,
      productionOrder,
    }
  } catch (error) {
    throw new Error('Produktions-API-Request fehlgeschlagen')
  }
}

export async function requestFinishedGoods(positionId: string) {
  const position = await prisma.position.findUnique({
    where: { id: positionId },
  })

  if (!position) {
    throw new Error(`Position mit ID ${positionId} nicht gefunden.`)
  }

  const updated = await prisma.position.update({
    where: { id: positionId },
    data: { Status: 'READY_FOR_INSPECTION' },
  })

  return {
    message: `Fertigware für Position ${positionId} wurde erfolgreich angefordert.`,
    newStatus: updated.Status,
  }
}
