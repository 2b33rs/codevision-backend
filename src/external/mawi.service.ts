import { z } from 'zod'
import { prisma } from '../plugins/prisma'
import axios from 'axios'

import { parseCMYKForMawi } from '../utils/color.util'
import {
  GetInventoryCountInput,
  GetInventoryCountResponse,
  RequestFinishedGoodsInput,
  RequestFinishedGoodsResponse,
} from './mawi.schema'

export async function getInventoryCount(
  parsed: GetInventoryCountInput,
): Promise<GetInventoryCountResponse> {
  if (process.env.VITEST === 'true') {
    console.log('Returning mocked inventory count (VITEST === true)')
    return {
      category: 'T-Shirt',
      typ: 'V-Ausschnitt',
      anzahl: 69,
      material_ID: 1337,
      groesse: 'L',
      url: 'https://this-is.mocked',
      farbe: {
        black: 0,
        cyan: 12,
        magenta: 21,
        yellow: 1,
      },
    }
  }

  const farbe_json = parseCMYKForMawi(parsed.color ?? null)
  if (!farbe_json) {
    throw new Error('Invalid CMYK color format')
  }

  const body = {
    category: parsed.category,
    aufdruck: parsed.design ?? null,
    groesse: parsed.shirtSize ?? '',
    farbe_json,
    typ: parsed.typ ?? 'V-Ausschnitt',
  }

  try {
    const response = await axios.post(
      `${process.env.MAWI_API_URL}/api/versandverkauf/materialbestand`,
      [body],
      { headers: { 'Content-Type': 'application/json' } },
    )

    const data = response.data

    if (Array.isArray(data) && data.length > 0) {
      return {
        anzahl: data[0].anzahl ?? 0,
        material_ID: data[0].material_ID ?? null,
        category: parsed.category,
        groesse: parsed.shirtSize ?? '',
        typ: parsed.typ ?? 'V-Ausschnitt',
        url: data[0].url ?? '', // Assuming the API returns a URL
        farbe: {
          black: data[0].farbe?.black ?? 0,
          cyan: data[0].farbe?.cyan ?? 0,
          magenta: data[0].farbe?.magenta ?? 0,
          yellow: data[0].farbe?.yellow ?? 0,
        },
      }
    }

    return {
      anzahl: 0,
      material_ID: null,
      category: parsed.category,
      groesse: parsed.shirtSize ?? '',
      typ: parsed.typ ?? 'V-Ausschnitt',
      url: '', // Default URL if not found
      farbe: {
        black: 0,
        cyan: 0,
        magenta: 0,
        yellow: 0,
      },
    }
  } catch (error) {
    console.error('Inventory API error:', error)
    throw new Error('Inventory API request failed')
  }
}

export async function requestFinishedGoods(
  material_ID: number,
  anzahl: number,
  businessKey: string,
): Promise<RequestFinishedGoodsResponse> {
  if (process.env.VITEST === 'true') {
    console.log('Returning mocked finished goods request (VITEST === true)')
    return {
      status: `Fertigware für wurde erfolgreich angefordert.`,
    }
  }

  const body: RequestFinishedGoodsInput = {
    material_ID: material_ID,
    anzahl: anzahl,
    bestellposition: businessKey,
  }

  try {
    const response = await axios.post(
      `${process.env.MAWI_API_URL}/api/versandverkauf/auslagerung`,
      [body],
      { headers: { 'Content-Type': 'application/json' } },
    )

    return {
      status: `Fertigware für  wurde erfolgreich angefordert.`,
    }
  } catch (error) {
    console.error('Finished goods API error:', error)
    throw new Error('Finished goods API request failed')
  }
}

// TODO: remove
export const createProductionOrderZ = z.object({
  positionId: z.string().uuid(),
  amount: z.number().int().positive(),
  color: z.string().nullable(),
  shirtSize: z.enum(['S', 'M', 'L', 'XL']).nullable(),
  design: z.string().optional(),
})

export type CreateProductionOrderInput = z.infer<typeof createProductionOrderZ>

export async function createProductionOrder(input: unknown) {
  const parsed = createProductionOrderZ.parse(input)

  console.log(
    `[MOCK] ProductionOrder: Produkt=${parsed.positionId}, Menge=${parsed.amount}, Farbe=${parsed.color}, Größe=${parsed.shirtSize}, Design=${parsed.design}`,
  )

  // === Neue Logik: amountInProduction hochzählen ===
  await prisma.standardProduct.update({
    where: { id: parsed.positionId },
    data: {
      amountInProduction: {
        increment: parsed.amount,
      },
    },
  })

  return {
    status: 'ok' as const,
    message: `Produktionsauftrag über ${parsed.amount} Stück ausgelöst`,
    ...parsed,
  }
}
