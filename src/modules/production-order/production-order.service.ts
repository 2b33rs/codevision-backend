import {
  $Enums,
  PRODUCTION_ORDER_STATUS,
  ProductionOrder,
} from '../../../generated/prisma'
import { prisma } from '../../plugins/prisma'
import { createProductionOrderZ } from './production-order.schema'
import { sendProductionOrder } from '../../external/production.service'

export async function createProductionOrder(input: unknown) {
  // Input validieren und parsen
  const parsed = createProductionOrderZ.parse(input)

  if (!parsed.materialId) {
    throw new Error('materialId darf nicht undefined sein.')
  }

  // Produktionsauftrag anlegen, jetzt mit materialId
  const currentCount = await prisma.productionOrder.count({
    where: { positionId: parsed.positionId || null },
  })
  const nextNumber = currentCount + 1

  // materialId als artikelnummer ins productTemplate übernehmen
  const productTemplateWithArtikelnummer = {
    ...parsed.productTemplate,
    artikelnummer: parsed.materialId,
  }

  // ProductionOrder in der DB anlegen
  const productionOrder = await prisma.productionOrder.create({
    data: {
      positionId: parsed.positionId || null, // Explizit null setzen wenn undefined
      amount: parsed.amount,
      designUrl: parsed.designUrl,
      orderType: parsed.orderType,
      dyeingNecessary: parsed.dyeingNecessary,
      materialId: parsed.materialId,
      productTemplate: productTemplateWithArtikelnummer,
      Status: parsed.Status ?? $Enums.PRODUCTION_ORDER_STATUS.ORDER_RECEIVED,
      productionorder_number: nextNumber,
    },
  })

  console.log(productionOrder)

  // An Produktions-API senden nur wenn positionId vorhanden ist
  if (productionOrder.positionId) {
    await sendProductionOrder(productionOrder)
  } else {
    console.log(
      'Produktionsauftrag ohne Position erstellt - kein API-Call an Produktions-Service',
    )
  }

  return {
    status: 'ok' as const,
    message: `Produktionsauftrag #${productionOrder.productionorder_number} über ${parsed.amount} Stück ausgelöst`,
    productionOrder,
  }
}

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
