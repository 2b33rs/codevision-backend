import { describe, it, expect } from 'vitest'
import { app } from '../../vitest.setup'

describe('POST /production/:positionId/production-order', () => {
  it('should create a production order successfully', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/production/123/production-order',
      payload: {
        amount: 100,
        designUrl: 'https://example.com/design.svg',
        orderType: 'standard',
        dyeingNecessary: true,
        productTemplate: {
          kategorie: 'T-Shirt',
          artikelnummer: 98765,
          groesse: 'L',
          farbcode: {
            cyan: 10,
            magenta: 20,
            yellow: 30,
            black: 40,
          },
          typ: 'V-Ausschnitt',
        },
      },
    })

    expect(response.statusCode).toBe(200) // oder 201, je nach Implementierung
    const body = response.json()
    expect(body).toHaveProperty('id')
    expect(body).toMatchObject({
      amount: 100,
      designUrl: 'https://example.com/design.svg',
      orderType: 'standard',
      dyeingNecessary: true,
      productTemplate: {
        kategorie: 'T-Shirt',
        artikelnummer: 98765,
        groesse: 'L',
        farbcode: {
          cyan: 10,
          magenta: 20,
          yellow: 30,
          black: 40,
        },
        typ: 'V-Ausschnitt',
      },
    })
  })
})
