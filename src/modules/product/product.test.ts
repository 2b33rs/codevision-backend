import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest'
import Fastify from 'fastify'
import { registerPlugins } from '../../plugins/register-plugins'
import { registerModules } from '../register-modules'
import { prisma } from '../../plugins/prisma'

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
        MinAmount: 1,
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
        MinAmount: 2,
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
        MinAmount: 3,
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
        MinAmount: 4,
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
        MinAmount: 1,
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
        MinAmount: 5,
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
})
