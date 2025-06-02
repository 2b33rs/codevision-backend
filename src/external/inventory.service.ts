import { ShirtSize } from '../../generated/prisma'
import { z } from 'zod'
import { prisma } from '../plugins/prisma'
import { $Enums } from '../../generated/prisma'
import { MAWI_API_URL, PRODUCTION_API_URL } from './externalUrls'

// Zod-Schema für die Abfrage
export const getInventoryCountZ = z.object({
  color: z.string().nullable(),
  shirtSize: z.enum(['S', 'M', 'L', 'XL']).nullable(),
  design: z.string().optional(),
  category: z.string().default('Tshirt').optional(),
  typ: z.string().default('Runden-Ausschnitt').optional(),
})

export type GetInventoryCountInput = z.infer<typeof getInventoryCountZ>

// Hilfsfunktion zum Parsen von cmyk-Strings
function parseCmykString(color: string | null) {
  if (!color) return null
  const match = color.match(/cmyk\(\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)/i)
  if (!match) return null
  return {
    cyan: Number(match[1]),
    magenta: Number(match[2]),
    yellow: Number(match[3]),
    black: Number(match[4]),
  }
}

// Die eigentliche Funktion
export async function getInventoryCount(input: unknown): Promise<{ anzahl: number, material_ID: number | null }> {
  const parsed = getInventoryCountZ.parse(input)
  const farbe_json = parseCmykString(parsed.color)
  const body = {
    category: parsed.category ?? 'Tshirt',
    aufdruck: parsed.design ?? '',
    groesse: parsed.shirtSize ?? '',
    farbe_json,
    typ: parsed.typ ?? 'Runden-Ausschnitt',
  }

  const response = await fetch(MAWI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Inventory API error: ${response.statusText}`)
  }

  const data = await response.json()
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

  // 1. Produktionsauftrag anlegen
  const productionOrder = await prisma.productionOrder.create({
    data: {
      positionId: parsed.positionId,
      amount: parsed.amount,
      designUrl: parsed.designUrl,
      orderType: parsed.orderType,
      dyeingNecessary: parsed.dyeingNecessary,
      productTemplate: parsed.productTemplate,
      Status: parsed.Status ?? $Enums.PRODUCTION_ORDER_STATUS.ORDER_RECEIVED,
    },
  })

  // 2. Produktions-API ansprechen
  const requestBody = [
    {
      orderIdPositionsId: productionOrder.id,
      anzahlTShirts: productionOrder.amount,
      motivUrl: productionOrder.designUrl,
      auftragstyp: productionOrder.orderType,
      faerbereiErforderlich: productionOrder.dyeingNecessary,
      artikelTemplate: productionOrder.productTemplate,
    },
  ]

  const response = await fetch(`${PRODUCTION_API_URL}/fertigungsauftraege/fertigungsauftraegeAnlegen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    throw new Error(`Produktions-API-Fehler: ${response.statusText}`)
  }

  return {
    status: 'ok' as const,
    message: `Produktionsauftrag über ${parsed.amount} Stück ausgelöst`,
    productionOrder,
  }
}


export async function requestFinishedGoods(positionId: string) {
  const position = await prisma.position.findUnique({ where: { id: positionId } })

  if (!position) {
    throw new Error(`Position mit ID ${positionId} nicht gefunden.`)
  }

  const updated = await prisma.position.update({
    where: { id: positionId },
    data: {
      Status: 'READY_FOR_INSPECTION'
    },
  })

  return {
    message: `Fertigware für Position ${positionId} wurde erfolgreich angefordert.`,
    newStatus: updated.Status,
  }
}

