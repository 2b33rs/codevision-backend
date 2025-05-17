import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest'
import Fastify from 'fastify'
import { registerPlugins } from '../../plugins/register-plugins'
import { registerModules } from '../register-modules'
import { prisma } from '../../plugins/prisma'

// ⬇️ Mocks für Lagerbestand & Produktion
vi.mock('../../external/inventory.service', () => ({
  getInventoryCount: vi.fn().mockResolvedValue(0),
  createProductionOrder: vi.fn().mockResolvedValue(undefined),
}))

let app: ReturnType<typeof Fastify>

beforeAll(async () => {
  app = Fastify()
  await registerPlugins(app)
  await registerModules(app)
})

afterAll(async () => {
  await app.close()
})

beforeEach(async () => {
  await prisma.$executeRawUnsafe('BEGIN')
})

afterEach(async () => {
  await prisma.$executeRawUnsafe('ROLLBACK')
})

describe('Product Routes E2E', () => {
  it('should create a product', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/product',
      payload: {
        name: 'E2E Product',
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'M',
        productCategory: 'T_SHIRT',
        minAmount: 1,
      },
    })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('id')
  })

  it('should list products', async () => {
    await prisma.standardProduct.create({
      data: {
        name: 'List Test',
        productCategory: 'T_SHIRT',
        minAmount: 2,
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'M',
      },
    })
    const res = await app.inject({ method: 'GET', url: '/product' })
    expect(res.statusCode).toBe(200)
    const list = JSON.parse(res.body)
    expect(Array.isArray(list)).toBe(true)
  })

  it('should get a single product by id', async () => {
    const product = await prisma.standardProduct.create({
      data: {
        name: 'Single Get',
        productCategory: 'T_SHIRT',
        minAmount: 3,
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'M',
      },
    })
    const res = await app.inject({
      method: 'GET',
      url: `/product/${product.id}`,
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.name).toBe('Single Get')
  })

  it('should update a product', async () => {
    const product = await prisma.standardProduct.create({
      data: {
        name: 'To Update',
        productCategory: 'T_SHIRT',
        minAmount: 4,
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'M',
      },
    })
    const res = await app.inject({
      method: 'PUT',
      url: `/product/${product.id}`,
      payload: {
        name: 'Updated Name',
        productCategory: 'T_SHIRT',
        minAmount: 1,
      },
    })
    expect(res.statusCode).toBe(200)
    const updated = JSON.parse(res.body)
    expect(updated.name).toBe('Updated Name')
  })

  it('should soft delete a product', async () => {
    const product = await prisma.standardProduct.create({
      data: {
        name: 'To Delete',
        productCategory: 'T_SHIRT',
        minAmount: 5,
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'M',
      },
    })
    const res = await app.inject({
      method: 'DELETE',
      url: `/product/${product.id}`,
    })
    expect(res.statusCode).toBe(200)
  })

  it('should increase amountInProduction on production order', async () => {
    const product = await prisma.standardProduct.create({
      data: {
        name: 'ProductionTest',
        minAmount: 1,
        productCategory: 'T_SHIRT',
        color: 'cmyk(10%,20%,30%,40%)',
        shirtSize: 'M',
      },
    })
  
    const customer = await prisma.customer.create({
      data: {
        name: 'Testkunde',
        email: `prodtest+${Date.now()}@example.com`, // dynamisch, um unique zu sein
        phone: '0000',
        customerType: 'WEBSHOP',
      },
    })
  
    const res = await app.inject({
      method: 'POST',
      url: '/order',
      payload: {
        customerId: customer.id,
        positions: [
          {
            pos_number: 1,
            amount: 5,
            name: 'Test-Produktionsauftrag',
            productCategory: 'T_SHIRT',
            design: 'TestDesign',
            color: product.color,
            shirtSize: product.shirtSize,
            standardProductId: product.id,
          },
        ],
      },
    })
  
    if (res.statusCode !== 200) {
      console.error('❌ Fehlerhafte Response:', res.statusCode)
      console.error('📦 Response Body:', res.body)
    }
  
    expect(res.statusCode, res.body).toBe(200)
  
    // optional: Parsen prüfen
    let responseJson
    try {
      responseJson = JSON.parse(res.body)
    } catch (err) {
      console.error('❌ JSON Parse Error:', err)
      console.error('📤 Raw Body:', res.body)
      throw err
    }
  
    console.log('✅ Erfolgreiche Bestellung:', responseJson)
  
    const updated = await prisma.standardProduct.findUniqueOrThrow({
      where: { id: product.id },
    })
  
    expect(updated.amountInProduction).toBe(5)
  })
})
