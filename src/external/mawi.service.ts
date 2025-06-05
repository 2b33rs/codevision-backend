import axios from 'axios'
import { MAWI_API_URL } from './externalAPIs'
import { parseCmykString } from '../utils/color.util'
import { getInventoryCountZ } from './mawi.schema'

export async function getInventoryCount(
  input: unknown,
): Promise<{ anzahl: number; material_ID: number | null }> {
  const parsed = getInventoryCountZ.parse(input)
  const farbe_json = parseCmykString(parsed.color)
  const externalCategory = parsed.category

  const body = {
    category: externalCategory,
    aufdruck: parsed.design ?? null,
    groesse: parsed.shirtSize ?? '',
    farbe_json,
    typ: parsed.typ ?? 'V-Ausschnitt',
  }

  try {
    const response = await axios.post(
      `${MAWI_API_URL}/api/versandverkauf/materialbestand`,
      [body],
      { headers: { 'Content-Type': 'application/json' } },
    )

    const data = response.data
    console.log('Inventory count:', data)

    if (Array.isArray(data) && data.length > 0) {
      return {
        anzahl: data[0].anzahl ?? 0,
        material_ID: data[0].material_ID ?? null,
      }
    }
    return { anzahl: 0, material_ID: null }
  } catch (error) {
    console.error('Inventory API error:', error)
    throw new Error('Inventory API request failed')
  }
}
