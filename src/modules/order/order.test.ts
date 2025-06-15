import { describe, expect, it } from 'vitest'
import { app } from '../../vitest.setup'
import { makeCustomer, makeOrder, makePosition } from '../../utils/test.factory'
import { createOrder } from './order.service'
import { setTimeout } from 'timers/promises'
import { PositionInput } from './order.schema'
import {
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  getOrdersWithPositionStatus,
} from './order.repo'

describe('Order Service Unit Tests (mit Positionen)', () => {
  it('should create a new order with positions and incremented order number', async () => {
    const customer = await makeCustomer()

    const positions: PositionInput[] = [
      {
        amount: 3,
        price: '19.90',
        pos_number: 1,
        name: 'Gold-Shirt',
        productCategory: 'T-Shirt',
        design: 'A',
        color: 'cmyk(0%,50%,100%,0%)',
        shirtSize: 'S',
        description: 'Goldenes',
      },
      {
        amount: 2,
        price: '14.00',
        pos_number: 2,
        name: 'Blau-Shirt',
        productCategory: 'T-Shirt',
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
    const customer = await makeCustomer()
    const positions: PositionInput[] = [
      {
        amount: 1,
        price: '12.50',
        pos_number: 1,
        name: 'Grün-Shirt',
        productCategory: 'T-Shirt',
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
    const customer = await makeCustomer()
    const positions: PositionInput[] = [
      {
        amount: 1,
        price: '9.99',
        pos_number: 1,
        name: 'A1',
        productCategory: 'T-Shirt',
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
    const customer = await makeCustomer()
    const positions: PositionInput[] = [
      {
        amount: 1,
        price: '5.00',
        pos_number: 1,
        name: 'X1',
        productCategory: 'T-Shirt',
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
    const customer = await makeCustomer({
      name: 'RouteTest1',
      phone: '1111',
      customerType: 'WEBSHOP',
    })
    const positions: PositionInput[] = [
      {
        amount: 2,
        price: '11.11',
        pos_number: 1,
        name: 'R1',
        productCategory: 'T-Shirt',
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
    const customer = await makeCustomer({
      name: 'RouteTest2',
      phone: '2222',
      customerType: 'BUSINESS',
    })
    const order = await makeOrder(customer.id)
    await makePosition(order.id)
    const res = await app.inject({
      method: 'GET',
      url: `/order/${order.id}`,
    })
    expect(res.statusCode).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(order.id)
    expect(body.customer.addr_country).toBe('DE')
    expect(body.positions).toHaveLength(1)
  })

  it('GET    /order                 – list all orders', async () => {
    const res = await app.inject({ method: 'GET', url: '/order' })
    expect(res.statusCode).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('GET    /order?customerId=...  – filter by customerId', async () => {
    const customer = await makeCustomer({
      name: 'RouteTest3',
      phone: '3333',
      customerType: 'WEBSHOP',
    })
    const order = await makeOrder(customer.id)
    const res = await app.inject({
      method: 'GET',
      url: `/order?customerId=${customer.id}`,
    })
    expect(res.statusCode).toBe(200)
    const body = await res.json()
    expect(body.every((o: any) => o.customerId === customer.id)).toBe(true)
  })

  it('GET    /order/status/:status  – filter by position status', async () => {
    const customer = await makeCustomer({
      name: 'RouteTest4',
      phone: '4444',
      customerType: 'BUSINESS',
    })
    const order = await makeOrder(customer.id)
    await makePosition(order.id)
    const res = await app.inject({
      method: 'GET',
      url: `/order/status/IN_PROGRESS`,
    })
    expect(res.statusCode).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.some((o: any) => o.id === order.id)).toBe(true)
  })
})
