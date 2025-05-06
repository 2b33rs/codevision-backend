import {
    describe, it, expect, beforeAll, afterAll, beforeEach, afterEach,
  } from 'vitest'
  import Fastify from 'fastify'
  import { prisma } from '../../plugins/prisma'
  import { registerPlugins } from '../../plugins/register-plugins'
  import { registerModules } from '../register-modules'
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
  
  describe('Complaint Routes E2E', () => {
    it('should create a complaint and update position status (except if OTHER)', async () => {
      const customer = await prisma.customer.create({
        data: {
          id: randomUUID(),
          name: 'Testkunde',
          email: `test-${Date.now()}@mail.com`,
          phone: '00000',
          customerType: 'BUSINESS',
        },
      })
  
      const order = await prisma.order.create({
        data: {
          id: randomUUID(),
          orderNumber: '25_500',
          customerId: customer.id,
          deletedAt: null,
        },
      })
  
      const position = await prisma.position.create({
        data: {
          id: randomUUID(),
          orderId: order.id,
          pos_number: 1,
          name: 'Test Pos',
          amount: 1,
          prodCategory: 'T_SHIRT',
          design: 'Test',
          shirtSize: 'L',
          Status: 'PRODUCTION_COMPLETED',
        },
      })
  
      const res = await app.inject({
        method: 'POST',
        url: '/complaints',
        payload: {
          positionId: position.id,
          Reason: 'WRONG_SIZE',
          ComplaintKind: 'INTERN',
        },
      })
  
      expect(res.statusCode).toBe(200)
      const complaint = JSON.parse(res.body)
      expect(complaint).toHaveProperty('id')
  
      const updatedPos = await prisma.position.findUnique({ where: { id: position.id } })
      expect(updatedPos?.Status).toBe('OPEN')
    })
  
    it('should list complaints by positionId', async () => {
      const customer = await prisma.customer.create({
        data: {
          id: randomUUID(),
          name: 'KundePos',
          email: `pos-${Date.now()}@mail.com`,
          phone: '11111',
          customerType: 'WEBSHOP',
        },
      })
  
      const order = await prisma.order.create({
        data: {
          id: randomUUID(),
          orderNumber: '25_600',
          customerId: customer.id,
          deletedAt: null,
        },
      })
  
      const position = await prisma.position.create({
        data: {
          id: randomUUID(),
          orderId: order.id,
          pos_number: 2,
          name: 'Position X',
          amount: 2,
          prodCategory: 'T_SHIRT',
          design: 'DesignX',
          Status: 'OPEN',
          shirtSize: 'M',
        },
      })
  
      await prisma.complaint.create({
        data: {
          id: randomUUID(),
          positionId: position.id,
          Reason: 'DAMAGED_ITEM',
          ComplaintKind: 'EXTERN',
        },
      })
  
      const res = await app.inject({
        method: 'GET',
        url: `/complaints?positionId=${position.id}`,
      })
  
      expect(res.statusCode).toBe(200)
      const complaints = JSON.parse(res.body)
      expect(Array.isArray(complaints)).toBe(true)
      expect(complaints[0].positionId).toBe(position.id)
    })
  
    it('should list complaints by orderId', async () => {
      const customer = await prisma.customer.create({
        data: {
          id: randomUUID(),
          name: 'KundeOrder',
          email: `order-${Date.now()}@mail.com`,
          phone: '22222',
          customerType: 'WEBSHOP',
        },
      })
  
      const order = await prisma.order.create({
        data: {
          id: randomUUID(),
          orderNumber: '25_700',
          customerId: customer.id,
          deletedAt: null,
        },
      })
  
      const position = await prisma.position.create({
        data: {
          id: randomUUID(),
          orderId: order.id,
          pos_number: 3,
          name: 'Pos Order',
          amount: 1,
          prodCategory: 'T_SHIRT',
          design: 'O-Design',
          Status: 'OPEN',
          shirtSize: 'L',
        },
      })
  
      await prisma.complaint.create({
        data: {
          id: randomUUID(),
          positionId: position.id,
          Reason: 'BAD_QUALITY',
          ComplaintKind: 'EXTERN',
        },
      })
  
      const res = await app.inject({
        method: 'GET',
        url: `/complaints?orderId=${order.id}`,
      })
  
      expect(res.statusCode).toBe(200)
      const complaints = JSON.parse(res.body)
      expect(Array.isArray(complaints)).toBe(true)
      expect(complaints[0].positionId).toBe(position.id)
    })
  
    it('should list complaints by customerId', async () => {
      const customer = await prisma.customer.create({
        data: {
          id: randomUUID(),
          name: 'KundeCustom',
          email: `cust-${Date.now()}@mail.com`,
          phone: '33333',
          customerType: 'BUSINESS',
        },
      })
  
      const order = await prisma.order.create({
        data: {
          id: randomUUID(),
          orderNumber: '25_800',
          customerId: customer.id,
          deletedAt: null,
        },
      })
  
      const position = await prisma.position.create({
        data: {
          id: randomUUID(),
          orderId: order.id,
          pos_number: 4,
          name: 'Pos Customer',
          amount: 1,
          prodCategory: 'T_SHIRT',
          design: 'C-Design',
          Status: 'OPEN',
          shirtSize: 'S',
        },
      })
  
      await prisma.complaint.create({
        data: {
          id: randomUUID(),
          positionId: position.id,
          Reason: 'STAINED',
          ComplaintKind: 'INTERN',
        },
      })
  
      const res = await app.inject({
        method: 'GET',
        url: `/complaints?customerId=${customer.id}`,
      })
  
      expect(res.statusCode).toBe(200)
      const complaints = JSON.parse(res.body)
      expect(Array.isArray(complaints)).toBe(true)
      expect(complaints[0].positionId).toBe(position.id)
    })
  })
  