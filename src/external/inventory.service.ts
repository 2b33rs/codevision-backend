import { $Enums } from '../../generated/prisma'
import { z } from 'zod'
import { prisma } from '../plugins/prisma'
import { MAWI_API_URL, PRODUCTION_API_URL } from './externalUrls'

// Zod-Schema für die Abfrage
export const getInventoryCountZ = z.object({
  color: z.string().nullable(),
  shirtSize: z.enum(['S', 'M', 'L', 'XL']).nullable(),
  design: z.string().nullable().optional(),
  category: z.string().default('T-Shirt').optional(),
  typ: z.string().default('V-Ausschnitt').optional(),
})

export type GetInventoryCountInput = z.infer<typeof getInventoryCountZ>

// Hilfsfunktion zum Parsen von cmyk-Strings
function parseCmykString(color: string | null) {
  if (!color) return null
  const match = color.match(
    /cmyk\(\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)/i,
  )
  if (!match) return null
  return {
    cyan: Number(match[1]),
    magenta: Number(match[2]),
    yellow: Number(match[3]),
    black: Number(match[4]),
  }
}

/**
 * Internes Produkt-Enum → externer MaWi-String
 */
function mapCategoryForMawi(category: string): string {
  switch (category) {
    case 'T_SHIRT':
      return 'T-Shirt'
    // weitere Abbildungen hier …
    default:
      return category
  }
}

// Die eigentliche Funktion
export async function getInventoryCount(
  input: unknown,
): Promise<{ anzahl: number; material_ID: number | null }> {
  const parsed = getInventoryCountZ.parse(input)
  const farbe_json = parseCmykString(parsed.color)

  // → hier die Übersetzung anwenden:
  const externalCategory = mapCategoryForMawi(parsed.category ?? 'T-Shirt')

  const body = {
    category: externalCategory,
    aufdruck: parsed.design ?? null,
    groesse: parsed.shirtSize ?? '',
    farbe_json,
    typ: parsed.typ ?? 'V-Ausschnitt',
  }

  const response = await fetch(
    `${MAWI_API_URL}/api/versandverkauf/materialbestand`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([body]),
    },
  )

  if (!response.ok) {
    throw new Error(`Inventory API error: ${response.statusText}`)
  }

  const data = await response.json()

  console.log('Inventory count:', data)

  if (Array.isArray(data) && data.length > 0) {
    return {
      anzahl: data[0].anzahl ?? 0,
      material_ID: data[0].material_ID ?? null,
    }
  }

  return { anzahl: 0, material_ID: null }
}

export const createProductionOrderZ = z.object({
  positionId: z.string().uuid(),
  amount: z.number().int().positive(),
  designUrl: z.string(),
  orderType: z.string(),
  dyeingNecessary: z.boolean(),
  productTemplate: z.any(),
  Status: z.nativeEnum($Enums.PRODUCTION_ORDER_STATUS).optional(),
  deletedAt: z.string().datetime().nullable().optional(),
})

export type CreateProductionOrderInput = z.infer<typeof createProductionOrderZ>

export async function createProductionOrder(input: unknown) {
  const parsed = createProductionOrderZ.parse(input)

  // 1. Ermittele die Anzahl vorhandener ProductionOrders für diese Position
  const currentCount = await prisma.productionOrder.count({
    where: { positionId: parsed.positionId },
  })
  const nextNumber = currentCount + 1

  console.log(parsed.positionId)
  // 2. Produktionsauftrag anlegen
  const productionOrder = await prisma.productionOrder.create({
    data: {
      positionId: parsed.positionId,
      amount: parsed.amount,
      designUrl: parsed.designUrl,
      orderType: parsed.orderType,
      dyeingNecessary: parsed.dyeingNecessary,
      productTemplate: parsed.productTemplate,
      Status: parsed.Status ?? $Enums.PRODUCTION_ORDER_STATUS.ORDER_RECEIVED,
      // Neu: fortlaufende Nummer je Position
      productionorder_number: nextNumber,
    },
  })

  // Position inkl. Order auslesen, um orderNumber.pos_number.productionorder_number zu bilden
  const position = await prisma.position.findUnique({
    where: { id: productionOrder.positionId },
    include: { order: true },
  })

  if (!position || !position.order) {
    throw new Error('Position oder zugehörige Order nicht gefunden.')
  }

  console.log('orderNumber:', position.order.orderNumber)
  console.log('pos_number:', position.pos_number)
  // 3. Produktions-API ansprechen
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

  console.log('🔧 Production Request:', JSON.stringify(requestBody, null, 2))
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
    console.error('🔧 Production Response Body:', text)
    throw new Error(
      `Produktions-API-Fehler: ${response.status} ${response.statusText}`,
    )
  }

  return {
    status: 'ok' as const,
    message: `Produktionsauftrag #${productionOrder.productionorder_number} über ${parsed.amount} Stück ausgelöst`,
    productionOrder,
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
    data: {
      Status: 'READY_FOR_INSPECTION',
    },
  })

  return {
    message: `Fertigware für Position ${positionId} wurde erfolgreich angefordert.`,
    newStatus: updated.Status,
  }
}
