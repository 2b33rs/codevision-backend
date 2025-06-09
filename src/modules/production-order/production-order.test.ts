import { describe, it, expect } from 'vitest'
import { app } from '../../vitest.setup'
import { makeCustomer, makeOrder, makePosition } from '../../utils/test.factory'

describe('POST /production/:positionId/production-order', () => {
  it('should create a production order successfully', async () => {
    // 1. Customer anlegen
    const customer = await makeCustomer()
    // 2. Order anlegen
    const order = await makeOrder(customer.id)
    // 3. Position anlegen
    const position = await makePosition(order.id, {
      amount: 100,
      pos_number: 1,
      name: 'Test Shirt',
      productCategory: 'T_SHIRT',
      design: 'TestDesign',
      color: 'cmyk(10%,20%,30%,40%)',
      shirtSize: 'L',
      description: 'Test description',
    })

    // 4. Produktionsauftrag für die Position anlegen
    const response = await app.inject({
      method: 'POST',
      url: `/production/${position.id}/production-order`,
      payload: {
        amount: 100,
        designUrl: 'https://example.com/design.svg',
        orderType: 'standard',
        dyeingNecessary: true,
        materialId: 98765, // <-- Pflichtfeld!
        productTemplate: {
          kategorie: 'T-Shirt',
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
    

    expect(response.statusCode).toBe(200)
    const body = response.json()
    console.log(body)
    expect(body).toHaveProperty('productionOrder')
    expect(body.productionOrder).toHaveProperty('id')
    // ...weitere Assertions...
  })
})
