import axios from 'axios'

import { parseCMYKForMawi } from '../utils/color.util'
import {
  GetInventoryCountInput,
  GetInventoryCountResponse,
  RequestFinishedGoodsInput,
  RequestFinishedGoodsResponse,
} from './mawi.schema'
import { undefined } from 'zod'

export async function getInventoryCount(
  parsed: GetInventoryCountInput,
  isStandardMaterial: boolean = true, // Default auf true
): Promise<GetInventoryCountResponse> {
  if (process.env.VITEST === 'true') {
    console.log('Returning mocked inventory count (VITEST === true)')
    return {
      standardmaterial: isStandardMaterial,
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
    aufdruck: parsed.design === '' ? null : parsed.design ?? null,
    groesse: parsed.shirtSize ?? '',
    farbe_json,
    typ: parsed.typ ?? 'V-Ausschnitt',
    standardmaterial: isStandardMaterial,
    materialbezeichnung: parsed.name,
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
        standardmaterial: isStandardMaterial,
        anzahl: data[0].anzahl ?? 0,
        material_ID: data[0].material_ID ?? null,
        category: parsed.category,
        groesse: parsed.shirtSize ?? '',
        typ: parsed.typ ?? 'V-Ausschnitt',
        url: data[0].url ?? null, // Assuming the API returns a URL
        farbe: {
          black: data[0].farbe?.black ?? 0,
          cyan: data[0].farbe?.cyan ?? 0,
          magenta: data[0].farbe?.magenta ?? 0,
          yellow: data[0].farbe?.yellow ?? 0,
        },
      }
    }

    return {
      standardmaterial: isStandardMaterial,
      anzahl: 0,
      material_ID: null,
      category: parsed.category,
      groesse: parsed.shirtSize ?? '',
      typ: parsed.typ ?? 'V-Ausschnitt',
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
