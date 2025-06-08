import {
  PRODUCTION_ORDER_STATUS,
  ProductionOrder,
} from '../../../generated/prisma'
import { prisma } from '../../plugins/prisma'
import { createProductionOrderZ } from './production-order.schema'
import { $Enums } from '../../../generated/prisma'

const PRODUCTION_API_URL = process.env.PRODUCTION_API_URL as string

export async function getProductionOrdersByPositionId(
  positionId: string,
): Promise<ProductionOrder[]> {
  return prisma.productionOrder.findMany({
    where: {
      positionId: positionId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
}

// todo: for kevin later
export async function updateProductionOrderStatus(
  id: string,
  status: PRODUCTION_ORDER_STATUS,
): Promise<ProductionOrder> {
  return prisma.productionOrder.update({
    where: { id },
    data: {
      Status: status,
      updatedAt: new Date(),
    },
  })
}



export async function createProductionOrder(input: unknown) {
  const parsed = createProductionOrderZ.parse(input)

  const currentCount = await prisma.productionOrder.count({
    where: { positionId: parsed.positionId },
  })
  const nextNumber = currentCount + 1

  const productionOrder = await prisma.productionOrder.create({
    data: {
      positionId: parsed.positionId,
      amount: parsed.amount,
      designUrl: parsed.designUrl,
      orderType: parsed.orderType,
      dyeingNecessary: parsed.dyeingNecessary,
      materialId: parsed.materialId,
      productTemplate: parsed.productTemplate,
      Status: parsed.Status ?? $Enums.PRODUCTION_ORDER_STATUS.ORDER_RECEIVED,
      productionorder_number: nextNumber,
    },
  })

  const position = await prisma.position.findUnique({
    where: { id: productionOrder.positionId },
    include: { order: true },
  })

  if (!position || !position.order) {
    throw new Error('Position oder zugehörige Order nicht gefunden.')
  }

  const rawOrderId = position.order.orderNumber.toString()
  const rawPosNumber = position.pos_number.toString()
  const orderIdPositionsId = `${rawOrderId}.${rawPosNumber}`

  const tpl = productionOrder.productTemplate as {
    kategorie: string
    artikelnummer: string
    groesse: string
    farbcode: Record<string, number>
    typ: string
  }

  const requestBody = [
    {
      orderIdPositionsId,
      anzahlTShirts: productionOrder.amount,
      motivUrl: productionOrder.designUrl,
      auftragstyp: productionOrder.orderType,
      faerbereiErforderlich: productionOrder.dyeingNecessary,
      artikelTemplate: {
        kategorie: tpl.kategorie,
        artikelnummer: tpl.artikelnummer,
        groesse: tpl.groesse,
        farbcode: tpl.farbcode,
        typ: tpl.typ,
      },
    },
  ]

  const response = await fetch(
    `${PRODUCTION_API_URL}/fertigungsauftraege/fertigungsauftraegeAnlegen`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    },
  )
  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Produktions-API-Fehler: ${response.status} ${response.statusText} - ${text}`,
    )
  }

  return {
    status: 'ok' as const,
    message: `Produktionsauftrag #${productionOrder.productionorder_number} über ${parsed.amount} Stück ausgelöst`,
    productionOrder,
  }
}
