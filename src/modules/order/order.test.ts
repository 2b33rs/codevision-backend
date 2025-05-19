import { describe, expect, it } from 'vitest'
import { app } from '../../vitest.setup'
import { prisma } from '../../plugins/prisma'
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  getOrdersWithPositionStatus,
  PositionInput,
} from './order.service'
import { randomUUID } from 'crypto'
import { setTimeout } from 'timers/promises'

describe('Order Service Unit Tests (mit Positionen)', () => {
  it('should create a new order with positions and incremented order number', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'ServiceTest',
        email: `${randomUUID()}@mail.com`,
        phone: '00000',
        customerType: 'WEBSHOP',
      },
    })

    const positions: PositionInput[] = [
      {
        amount: 3,
        pos_number: 1,
        name: 'Gold-Shirt',
        productCategory: 'T_SHIRT',
        design: 'A',
        color: 'cmyk(0%,50%,100%,0%)',
        shirtSize: 'S',
        description: 'Goldenes',
      },
      {
        amount: 2,
        pos_number: 2,
        name: 'Blau-Shirt',
        productCategory: 'T_SHIRT',
        design: 'B',
        color: 'cmyk(100%,0%,0%,0%)',
        shirtSize: 'M',
      },
    ]

    const order = await createOrder(customer.id, positions)
    expect(order).toHaveProperty('id')
    expect(order.orderNumber).toMatch(/^\d{8}$/)
    expect(order.positions).toHaveLength(2)
    order.positions.forEach((p, i) => {
      expect(p.pos_number).toBe(positions[i].pos_number)
      expect(p.amount).toBe(positions[i].amount)
      expect(p.Status).toBe('IN_PROGRESS')
      expect(p.orderId).toBe(order.id)
    })
  })

  it('should get order by id including positions', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'ServiceTest2',
        email: `${randomUUID()}@mail.com`,
        phone: '12345',
        customerType: 'BUSINESS',
      },
    })
    const positions: PositionInput[] = [
      {
        amount: 1,
        pos_number: 1,
        name: 'Grün-Shirt',
        productCategory: 'T_SHIRT',
        design: 'C',
        color: 'cmyk(50%,0%,50%,0%)',
        shirtSize: 'L',
      },
    ]
    const created = await createOrder(customer.id, positions)
    const found = await getOrderById(created.id)
    expect(found).not.toBeNull()
    expect(found!.positions).toHaveLength(1)
  })

  it('should list all orders for a customer', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'ServiceTest3',
        email: `${randomUUID()}@mail.com`,
        phone: '67890',
        customerType: 'BUSINESS',
      },
    })
    const positions: PositionInput[] = [
      {
        amount: 1,
        pos_number: 1,
        name: 'A1',
        productCategory: 'T_SHIRT',
        design: 'D1',
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'S',
      },
    ]
    await createOrder(customer.id, positions)
    await setTimeout(10)
    await createOrder(customer.id, positions)
    const list = await getOrdersByCustomer(customer.id)
    expect(list).toHaveLength(2)
    list.forEach((o) => {
      expect(o.customerId).toBe(customer.id)
      expect(o.positions).toHaveLength(1)
    })
  })

  it('should retrieve all orders in system', async () => {
    const all = await getAllOrders()
    expect(Array.isArray(all)).toBe(true)
  })

  it('should get orders by position status', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'ServiceTest4',
        email: `${randomUUID()}@mail.com`,
        phone: '54321',
        customerType: 'WEBSHOP',
      },
    })
    const positions: PositionInput[] = [
      {
        amount: 1,
        pos_number: 1,
        name: 'X1',
        productCategory: 'T_SHIRT',
        design: 'DX',
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'M',
      },
    ]
    const o = await createOrder(customer.id, positions)
    const filtered = await getOrdersWithPositionStatus('IN_PROGRESS')
    expect(filtered.some((f) => f.id === o.id)).toBe(true)
  })
})

describe('Order Routes', () => {
  it('POST   /order                – create new order', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'RouteTest1',
        email: `${randomUUID()}@mail.com`,
        phone: '1111',
        customerType: 'WEBSHOP',
      },
    })
    const positions: PositionInput[] = [
      {
        amount: 2,
        pos_number: 1,
        name: 'R1',
        productCategory: 'T_SHIRT',
        design: 'DR1',
        color: 'cmyk(10%,20%,30%,40%)',
        shirtSize: 'M',
      },
    ]
    const res = await app.inject({
      method: 'POST',
      url: '/order',
      payload: { customerId: customer.id, positions },
    })
    expect(res.statusCode).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('id')
    expect(body.customerId).toBe(customer.id)
    expect(body.positions).toHaveLength(1)
  })

  it('GET    /order/:id            – retrieve single order', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'RouteTest2',
        email: `${randomUUID()}@mail.com`,
        phone: '2222',
        customerType: 'BUSINESS',
      },
    })
    const positions: PositionInput[] = [
      {
        amount: 1,
        pos_number: 1,
        name: 'R2',
        productCategory: 'T_SHIRT',
        design: 'DR2',
        color: 'cmyk(5%,5%,5%,5%)',
        shirtSize: 'S',
      },
    ]
    const created = await createOrder(customer.id, positions)
    const res = await app.inject({
      method: 'GET',
      url: `/order/${created.id}`,
    })
    expect(res.statusCode).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(created.id)
    expect(body.positions).toHaveLength(1)
  })

  it('GET    /order                 – list all orders', async () => {
    const res = await app.inject({ method: 'GET', url: '/order' })
    expect(res.statusCode).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('GET    /order?customerId=...  – filter by customerId', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'RouteTest3',
        email: `${randomUUID()}@mail.com`,
        phone: '3333',
        customerType: 'WEBSHOP',
      },
    })
    await createOrder(customer.id, [
      {
        amount: 1,
        pos_number: 1,
        name: 'F3',
        productCategory: 'T_SHIRT',
        design: 'DF3',
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'L',
      },
    ])
    const res = await app.inject({
      method: 'GET',
      url: `/order?customerId=${customer.id}`,
    })
    expect(res.statusCode).toBe(200)
    const body = await res.json()
    expect(body.every((o: any) => o.customerId === customer.id)).toBe(true)
  })

  it('GET    /order/status/:status  – filter by position status', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'RouteTest4',
        email: `${randomUUID()}@mail.com`,
        phone: '4444',
        customerType: 'BUSINESS',
      },
    })
    const created = await createOrder(customer.id, [
      {
        amount: 1,
        pos_number: 1,
        name: 'S4',
        productCategory: 'T_SHIRT',
        design: 'DS4',
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'S',
      },
    ])
    const res = await app.inject({
      method: 'GET',
      url: `/order/status/IN_PROGRESS`,
    })
    expect(res.statusCode).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.some((o: any) => o.id === created.id)).toBe(true)
  })
})
