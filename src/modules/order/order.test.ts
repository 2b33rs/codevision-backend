import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../plugins/prisma'
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
} from './order.service'
import { randomUUID } from 'crypto'
import { setTimeout } from 'timers/promises'

beforeEach(async () => {
  // Testdaten vorher bereinigen
  await prisma.order.deleteMany()
  await prisma.customer.deleteMany()
})

describe('Order Service Unit Tests (cleaned setup)', () => {
  it('should create a new order with incremented order number', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'Test Kunde',
        email: `test-${Date.now()}@mail.com`,
        phone: '00000',
        customerType: 'WEBSHOP',
      },
    })

    const newOrder = await createOrder(customer.id)

    expect(newOrder).toHaveProperty('id')
    expect(newOrder.customerId).toBe(customer.id)
    expect(newOrder.orderNumber).toMatch(/^\d{2}_\d+$/) // z. B. "25_1"
  })

  it('should get order by id', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'ID Kunde',
        email: `id-${Date.now()}@mail.com`,
        phone: '12345',
        customerType: 'BUSINESS',
      },
    })

    const order = await createOrder(customer.id)
    const found = await getOrderById(order.id)

    expect(found).not.toBeNull()
    expect(found?.id).toBe(order.id)
  })

  it('should get all orders for a customer', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'Many Orders',
        email: `multi-${Date.now()}@mail.com`,
        phone: '67890',
        customerType: 'BUSINESS',
      },
    })

    await createOrder(customer.id)
    await setTimeout(50) // Zeitverzögerung für saubere OrderNumber
    await createOrder(customer.id)

    const orders = await getOrdersByCustomer(customer.id)
    expect(Array.isArray(orders)).toBe(true)
    expect(orders.length).toBe(2)
    orders.forEach(order => {
      expect(order.customerId).toBe(customer.id)
    })
  })

  it('should get all orders in system', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'All Orders',
        email: `all-${Date.now()}@mail.com`,
        phone: '99999',
        customerType: 'WEBSHOP',
      },
    })

    await createOrder(customer.id)
    await setTimeout(50)
    await createOrder(customer.id)

    const orders = await getAllOrders()
    expect(Array.isArray(orders)).toBe(true)
    expect(orders.length).toBeGreaterThanOrEqual(2)
  })
})
