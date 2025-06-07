import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type GetInventoryCountInput } from './mawi.schema'
import { getInventoryCount, requestFinishedGoods } from './mawi.service'
import { prisma } from '../plugins/prisma'

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
      anzahl: 100,
      material_ID: 1337, // artikelnummer = material_ID
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

describe('requestFinishedGoods', () => {
  const material_ID = 238
  const anzahl = 10
  const businessKey = '2025.1'

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('should return mocked data when VITEST === true', async () => {
    process.env.VITEST = 'true' // Set the environment variable for testing

    const result = await requestFinishedGoods(material_ID, anzahl, businessKey)

    expect(result).toEqual({
      status: `Fertigware für wurde erfolgreich angefordert.`,
    })
  })

  // For local debugging external API
  it('should call external API and return result when VITEST !== true', async () => {
    process.env.VITEST = 'false' // Set the environment variable to simulate production

    const result = await requestFinishedGoods(material_ID, anzahl, businessKey)

    console.log(result) // Log the result for debugging
    expect(result).toHaveProperty('status') // Check that the response has a 'status' property
  })
})
