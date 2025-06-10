import {
  $Enums,
  PRODUCTION_ORDER_STATUS,
  ProductionOrder,
} from '../../../generated/prisma'
import { prisma } from '../../plugins/prisma'
import { createProductionOrderZ } from './production-order.schema'
import axios from 'axios'

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
  // Input validieren und parsen
  const parsed = createProductionOrderZ.parse(input)

  if (!parsed.positionId) {
    throw new Error('positionId darf nicht undefined sein.')
  }
  if (!parsed.materialId) {
    throw new Error('materialId darf nicht undefined sein.')
  }

  // Produktionsauftrag anlegen, jetzt mit materialId
  const currentCount = await prisma.productionOrder.count({
    where: { positionId: parsed.positionId },
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
      positionId: parsed.positionId,
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
  // Wenn VITEST auf true steht, Produktions-API-Aufruf überspringen
  if (process.env.VITEST === 'true') {
    return {
      status: 'ok',
      message: `Produktionsauftrag #${productionOrder.productionorder_number} über ${parsed.amount} Stück ausgelöst`,
      productionOrder,
    }
  }

  const position = await prisma.position.findUnique({
    where: { id: productionOrder.positionId },
    include: { order: true },
  })

  if (!position || !position.order) {
    throw new Error('Position oder zugehörige Order nicht gefunden.')
  }

  const rawOrderId = position.order.orderNumber.toString()
  const rawPosNumber = position.pos_number.toString()
  const rawProductionorderNumber =
    productionOrder.productionorder_number.toString()
  const orderIdPositionsId = `${rawOrderId}.${rawPosNumber}.${rawProductionorderNumber}`

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
  console.log('Request Body für Produktions-API:', requestBody)

  // Axios statt fetch verwenden
  try {
    const response = await axios.post(
      `${PRODUCTION_API_URL}/fertigungsauftraege/fertigungsauftraegeAnlegen`,
      requestBody,
      { headers: { 'Content-Type': 'application/json' } },
    )

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Produktions-API-Fehler: ${response.status} ${response.statusText} - ${JSON.stringify(response.data)}`,
      )
    }
  } catch (error: any) {
    // Axios Fehlerbehandlung
    const status = error.response?.status ?? 'unbekannt'
    const statusText = error.response?.statusText ?? ''
    const data = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message
    throw new Error(`Produktions-API-Fehler: ${status} ${statusText} - ${data}`)
  }

  return {
    status: 'ok' as const,
    message: `Produktionsauftrag #${productionOrder.productionorder_number} über ${parsed.amount} Stück ausgelöst`,
    productionOrder,
  }
}
