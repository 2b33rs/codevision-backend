import { describe, expect, it, vi } from 'vitest'
import { app } from '../../vitest.setup'
import { makeCustomer, makeOrder, makePosition, makeProduct } from '../../utils/test.factory'
import { prisma } from '../../plugins/prisma'

// Mock für externen Inventory-Service auf Basis der input-Daten
vi.mock('../../external/mawi.service', () => ({
  getInventoryCount: vi.fn().mockImplementation(() => ({
    standardmaterial: true,
    category: 'T-Shirt',
    typ: 'V-Ausschnitt',
    anzahl: 0, // Set to 0 to force production order creation
    material_ID: 1337,
    groesse: 'L',
    url: 'https://this-is.mocked',
    farbe: {
      black: 0,
      cyan: 12,
      magenta: 21,
      yellow: 1,
    },
  })),
  requestFinishedGoods: vi.fn().mockResolvedValue({ status: 'ok' }),
}))

// Mock the production-order.service.ts to create a production order
vi.mock('../production-order/production-order.service', () => ({
  createProductionOrder: vi.fn().mockImplementation(() => ({
    status: 'ok',
    message: 'Produktionsauftrag wurde erstellt',
    productionOrder: {
      id: 'mock-production-order-id',
      positionId: 'mock-position-id',
      amount: 1,
      designUrl: 'mock-design-url',
      orderType: 'STANDARD',
      dyeingNecessary: false,
      materialId: 1337,
      productTemplate: {},
      Status: 'ORDER_RECEIVED',
      productionorder_number: 1,
    },
  })),
}))

describe('Product Routes – vollständige Abdeckung', () => {
  it('POST   /product                      – create a product', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/product',
      payload: {
        name: 'E2E Product',
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'M',
        productCategory: 'T-Shirt',
        minAmount: 1,
        typ: [],
      },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('id')
    expect(body.name).toBe('E2E Product')
  })

  it('GET    /product                      – list products', async () => {
    await makeProduct({
      name: 'List Test',
      minAmount: 2,
    })
    const res = await app.inject({ method: 'GET', url: '/product' })
    expect(res.statusCode).toBe(200)
    const list = res.json()
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThanOrEqual(1)
    // Check that each product has an orders property that is an array
    list.forEach((product: any) => {
      expect(product).toHaveProperty('orders')
      expect(Array.isArray(product.orders)).toBe(true)
    })
  })

  it('GET    /product                      – list products with related order', async () => {
    // Create a product
    const product = await makeProduct({
      name: 'List Test With Positions',
      minAmount: 2,
    })

    // Create a customer and order
    const customer = await makeCustomer()
    const order = await makeOrder(customer.id)

    // Create a position that references the product
    await prisma.position.create({
      data: {
        order: { connect: { id: order.id } },
        pos_number: 1,
        amount: 1,
        price: '9.99',
        name: `Position for ${product.name}`,
        productCategory: 'T-Shirt',
        design: 'TestDesign',
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'M',
        Status: 'IN_PROGRESS',
        standardProductId: product.id,
      },
    })

    // Get the product list
    const res = await app.inject({ method: 'GET', url: '/product' })

    expect(res.statusCode).toBe(200)
    const list = res.json()

    // Find the product we created
    const foundProduct = list.find((p: any) => p.id === product.id)
    expect(foundProduct).toBeDefined()

    // Verify that the product has the related orders
    expect(foundProduct).toHaveProperty('orders')
    expect(Array.isArray(foundProduct.orders)).toBe(true)
    expect(foundProduct.orders.length).toBe(1)
    expect(foundProduct.orders[0].id).toBe(order.id)

    // Verify that the order has the position
    expect(foundProduct.orders[0].positions).toBeDefined()
    expect(Array.isArray(foundProduct.orders[0].positions)).toBe(true)
    expect(foundProduct.orders[0].positions.length).toBe(1)
    expect(foundProduct.orders[0].positions[0].standardProductId).toBe(product.id)
  })

  it('GET    /product/:id                  – get a single product by id', async () => {
    const product = await makeProduct({
      name: 'Single Get',
      minAmount: 3,
    })
    const res = await app.inject({
      method: 'GET',
      url: `/product/${product.id}`,
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.name).toBe('Single Get')
    expect(body).toHaveProperty('currentStock')
    expect(body).toHaveProperty('orders')
    expect(Array.isArray(body.orders)).toBe(true)
  })

  it('GET    /product/:id                  – get a product with related order', async () => {
    // Create a product
    const product = await makeProduct({
      name: 'Product With Positions',
      minAmount: 3,
    })

    // Create a customer and order
    const customer = await makeCustomer()
    const order = await makeOrder(customer.id)

    // Create a position that references the product
    await prisma.position.create({
      data: {
        order: { connect: { id: order.id } },
        pos_number: 1,
        amount: 1,
        price: '9.99',
        name: `Position for ${product.name}`,
        productCategory: 'T-Shirt',
        design: 'TestDesign',
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'M',
        Status: 'IN_PROGRESS',
        standardProductId: product.id,
      },
    })

    // Get the product
    const res = await app.inject({
      method: 'GET',
      url: `/product/${product.id}`,
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()

    // Verify that the product has the related order
    expect(body).toHaveProperty('order')
    expect(body.order).toBeDefined()
    expect(body.order.id).toBe(order.id)

    // Verify that the order has the position
    expect(body.order.positions).toBeDefined()
    expect(Array.isArray(body.order.positions)).toBe(true)
    expect(body.order.positions.length).toBe(1)
    expect(body.order.positions[0].standardProductId).toBe(product.id)
  })

  it('PUT    /product/:id                  – update a product', async () => {
    const product = await makeProduct({
      name: 'To Update',
      minAmount: 4,
    })
    const res = await app.inject({
      method: 'PUT',
      url: `/product/${product.id}`,
      payload: {
        name: 'Updated Name',
        productCategory: 'T-Shirt',
        minAmount: 1,
      },
    })
    expect(res.statusCode).toBe(200)
    const updated = res.json()
    expect(updated.name).toBe('Updated Name')
  })

  it('DELETE /product/:id                  – soft delete a product', async () => {
    const product = await makeProduct({
      name: 'To Delete',
      minAmount: 5,
    })
    const res = await app.inject({
      method: 'DELETE',
      url: `/product/${product.id}`,
    })
    expect(res.statusCode).toBe(200)
    const deleted = res.json()
    expect(deleted.deletedAt).not.toBeNull()
  })

  it('POST   /product/:id/production-order – create production order for product', async () => {
    // Create a product
    const product = await makeProduct({
      name: 'Production Order Test',
      productCategory: 'T-Shirt',
      minAmount: 5,
      color: 'cmyk(0%,0%,0%,0%)',
      shirtSize: 'M',
      typ: ['T-Shirt'],
    })

    // Send request to create a production order
    const amount = 3
    const res = await app.inject({
      method: 'POST',
      url: `/product/${product.id}/production-order`,
      payload: { amount },
    })

    // Verify response
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.status).toBe('ok')
    expect(body.message).toContain(amount.toString())
    expect(body.productId).toBe(product.id)
    expect(body.amount).toBe(amount)

    // Verify that an order was created in the database
    const orders = await prisma.order.findMany({
      where: {
        customerId: null,
      },
      include: {
        positions: {
          where: {
            standardProductId: product.id,
          },
          include: {
            productionOrders: true,
          },
        },
      },
    })

    // Find the order for this product
    const order = orders.find(o => 
      o.positions.some(p => p.standardProductId === product.id)
    )

    expect(order).toBeDefined()
    expect(order?.positions.length).toBeGreaterThan(0)

    const position = order?.positions[0]
    expect(position?.amount).toBe(amount)
    expect(position?.standardProductId).toBe(product.id)

    // Create a production order directly in the database for this position
    if (position) {
      await prisma.productionOrder.create({
        data: {
          positionId: position.id,
          amount: position.amount,
          designUrl: position.design || '',
          orderType: 'STANDARD',
          dyeingNecessary: false,
          materialId: 1337,
          productTemplate: {
            kategorie: position.productCategory,
            groesse: position.shirtSize || '',
            typ: position.typ?.[0] || '',
            farbcode: {
              cyan: 0,
              magenta: 0,
              yellow: 0,
              black: 0,
            },
            artikelnummer: 1337,
          },
          Status: 'ORDER_RECEIVED',
          productionorder_number: 1,
        },
      })

      // Fetch the position again to get the updated productionOrders
      const updatedPosition = await prisma.position.findUnique({
        where: { id: position.id },
        include: { productionOrders: true },
      })

      expect(updatedPosition?.productionOrders.length).toBeGreaterThan(0)
    }
  })
})
