import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type GetInventoryCountInput } from './mawi.schema'
import { getInventoryCount } from './mawi.service'

describe('getInventoryCount', () => {
  const input: GetInventoryCountInput = {
    color: 'cmyk(0%, 0%, 0%, 30%)',
    category: 'T-Shirts',
    design: 'Test-Print',
    shirtSize: 'L',
    typ: 'Rundhals',
  }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('should return mocked data when VITEST === true', async () => {
    const result = await getInventoryCount(input)

    expect(result).toEqual({
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
    })
  })

  // // for local debugging external API
  // it('should call external API and return result when VITEST !== true', async () => {
  //   process.env.VITEST = 'false'
  //
  //   const result = await getInventoryCount(input)
  //
  //   console.log(result)
  //   expect(result).toHaveProperty('anzahl')
  // })
})
