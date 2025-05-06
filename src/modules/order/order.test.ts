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
  import { randomUUID } from 'crypto'
  
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
  
  describe('Order Routes E2E', () => {
    it('should create an order with formatted orderNumber', async () => {
      const customer = await prisma.customer.create({
        data: {
          id: randomUUID(),
          name: 'E2E Kunde',
          email: `e2e-${Date.now()}@mail.com`,
          phone: '0000',
          customerType: 'WEBSHOP',
        },
      })
  
      const res = await app.inject({
        method: 'POST',
        url: '/order',
        payload: {
          customerId: customer.id,
        },
      })
  
      expect(res.statusCode).toBe(200)
      const order = JSON.parse(res.body)
      expect(order).toHaveProperty('id')
      expect(order.customerId).toBe(customer.id)
  
      // Prüfe Format: z.B. "25_1"
      expect(order.orderNumber).toMatch(/^\d{2}_\d+$/)
    })
  
    it('should list all order', async () => {
      const customer = await prisma.customer.create({
        data: {
          id: randomUUID(),
          name: 'Listen-Kunde',
          email: `list-${Date.now()}@mail.com`,
          phone: '123',
          customerType: 'WEBSHOP',
        },
      })
  
      await prisma.order.create({
        data: {
          id: randomUUID(),
          orderNumber: '25_999',
          customerId: customer.id,
          deletedAt: null,
        },
      })
  
      const res = await app.inject({
        method: 'GET',
        url: '/order',
      })
  
      expect(res.statusCode).toBe(200)
      const order = JSON.parse(res.body)
      expect(Array.isArray(order)).toBe(true)
      expect(order.length).toBeGreaterThan(0)
    })
  
    it('should get order by customerId', async () => {
      const customer = await prisma.customer.create({
        data: {
          id: randomUUID(),
          name: 'Filter-Kunde',
          email: `filter-${Date.now()}@mail.com`,
          phone: '456',
          customerType: 'WEBSHOP',
        },
      })
  
      await prisma.order.create({
        data: {
          id: randomUUID(),
          orderNumber: '25_123',
          customerId: customer.id,
          deletedAt: null,
        },
      })
  
      const res = await app.inject({
        method: 'GET',
        url: `/order?customerId=${customer.id}`,
      })
  
      expect(res.statusCode).toBe(200)
      const order = JSON.parse(res.body)
      expect(Array.isArray(order)).toBe(true)
      expect(order[0].customerId).toBe(customer.id)
    })
  
    it('should get order by orderId', async () => {
      const customer = await prisma.customer.create({
        data: {
          id: randomUUID(),
          name: 'Einzel-Kunde',
          email: `single-${Date.now()}@mail.com`,
          phone: '789',
          customerType: 'BUSINESS',
        },
      })
  
      const order = await prisma.order.create({
        data: {
          id: randomUUID(),
          orderNumber: '25_456',
          customerId: customer.id,
          deletedAt: null,
        },
      })
  
      const res = await app.inject({
        method: 'GET',
        url: `/order?orderId=${order.id}`,
      })
  
      expect(res.statusCode).toBe(200)
      const result = JSON.parse(res.body)
      expect(result.id).toBe(order.id)
    })
  })
  