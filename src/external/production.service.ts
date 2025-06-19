import axios from 'axios'
import { prisma } from '../plugins/prisma'
import { ProductionOrder } from '../../generated/prisma'

const PRODUCTION_API_URL = process.env.PRODUCTION_API_URL as string

interface ProductionApiRequest {
  orderIdPositionsId: string
  anzahlTShirts: number
  motivUrl: string
  auftragstyp: string
  faerbereiErforderlich: boolean
  artikelTemplate: {
    kategorie: string
    artikelnummer: string
    groesse: string
    farbcode: Record<string, number>
    typ: string
  }
}

export async function sendProductionOrder(
  productionOrder: ProductionOrder,
): Promise<void> {
  if (process.env.VITEST === 'true') {
    console.log('Skipping production API call (VITEST === true)')
    return
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

  const requestBody: ProductionApiRequest[] = [
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
    const status = error.response?.status ?? 'unbekannt'
    const statusText = error.response?.statusText ?? ''
    const data = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message
    throw new Error(`Produktions-API-Fehler: ${status} ${statusText} - ${data}`)
  }
}

export async function deleteProductionOrder(
  orderIdPositionsId: string,
): Promise<void> {
  if (process.env.VITEST === 'true') {
    console.log('Skipping production API call (VITEST === true)')
    return
  }

  console.log(`Deleting production order with ID: ${orderIdPositionsId}`)

  try {
    const response = await axios.patch(
      `${PRODUCTION_API_URL}/fertigungsauftraege/${orderIdPositionsId}/loeschen`,
      { headers: { 'Content-Type': 'application/json' } },
    )

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Produktions-API-Fehler: ${response.status} ${response.statusText} - ${JSON.stringify(response.data)}`,
      )
    }
  } catch (error: any) {
    const status = error.response?.status ?? 'unbekannt'
    const statusText = error.response?.statusText ?? ''
    const data = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message
    throw new Error(`Produktions-API-Fehler: ${status} ${statusText} - ${data}`)
  }
}
