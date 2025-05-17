import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prisma } from '../../plugins/prisma'
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  PositionInput,
} from './order.service'
import { randomUUID } from 'crypto'
import { setTimeout } from 'timers/promises'
import * as inventoryService from '../../external/inventory.service'

// --- MOCK für createProductionOrder ---
beforeEach(async () => {
  await prisma.complaint.deleteMany()
  await prisma.position.deleteMany()
  await prisma.order.deleteMany()
  await prisma.customer.deleteMany()

  vi.restoreAllMocks()
  vi.spyOn(inventoryService, 'createProductionOrder').mockImplementation(
    async (input: any) => ({
      ...input,
      status: 'ok',
      message: `Produktionsauftrag über ${input.amount} Stück ausgelöst`,
    })
  )
})

describe('Order Service Unit Tests (mit Positionen)', () => {
  it('should create a new order with positions and incremented order number', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'Test Kunde',
        email: `test-${Date.now()}@mail.com`,
        phone: '00000',
        customerType: 'WEBSHOP',
      },
    })

    const positions: PositionInput[] = [
      {
        amount: 3,
        pos_number: 1,
        name: 'T-Shirt Gold',
        productCategory: 'T_SHIRT',
        design: 'DesignA',
        color: 'cmyk(0%,50%,100%,0%)',
        shirtSize: 'S',
        description: 'Goldenes T-Shirt',
      },
      {
        amount: 2,
        pos_number: 2,
        name: 'T-Shirt Blau',
        productCategory: 'T_SHIRT',
        design: 'DesignB',
        color: 'cmyk(100%,0%,0%,0%)',
        shirtSize: 'M',
      },
    ]

    const newOrder = await createOrder(customer.id, positions)

    expect(newOrder).toHaveProperty('id')
    expect(newOrder.orderNumber).toMatch(/^\d{8}$/) // <--- 8-stellig!
    expect(Array.isArray(newOrder.positions)).toBe(true)
    expect(newOrder.positions.length).toBe(positions.length)

    newOrder.positions.forEach((pos, idx) => {
      const inp = positions[idx]
      expect(pos.amount).toBe(inp.amount)
      expect(pos.pos_number).toBe(inp.pos_number)
      expect(pos.name).toBe(inp.name)
      expect(pos.productCategory).toBe(inp.productCategory)
      expect(pos.design).toBe(inp.design)
      expect(pos.color).toBe(inp.color)
      expect(pos.shirtSize).toBe(inp.shirtSize)
      expect(pos.description).toBe(inp.description ?? null)
      expect(pos.Status).toBe('OPEN')
      expect(pos.orderId).toBe(newOrder.id)
    })
  })

  // Die anderen Tests bleiben unverändert
  it('should get order by id including positions', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'ID Kunde',
        email: `id-${Date.now()}@mail.com`,
        phone: '12345',
        customerType: 'BUSINESS',
      },
    })

    const positions: PositionInput[] = [
      {
        amount: 1,
        pos_number: 1,
        name: 'Pulli Grün',
        productCategory: 'T_SHIRT',
        design: 'DesignC',
        color: 'cmyk(50%,0%,50%,0%)',
        shirtSize: 'L',
      },
    ]

    const created = await createOrder(customer.id, positions)
    const found = await getOrderById(created.id)

    expect(found).not.toBeNull()
    expect(found?.id).toBe(created.id)
    expect(Array.isArray(found?.positions)).toBe(true)
    expect(found?.positions.length).toBe(positions.length)
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

    const positions: PositionInput[] = [
      {
        amount: 1,
        pos_number: 1,
        name: 'T-Shirt A',
        productCategory: 'T_SHIRT',
        design: 'Design1',
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'S',
      },
    ]

    await createOrder(customer.id, positions)
    await setTimeout(50)
    await createOrder(customer.id, positions)

    const orders = await getOrdersByCustomer(customer.id)
    expect(Array.isArray(orders)).toBe(true)
    expect(orders.length).toBe(2)
    orders.forEach((order) => {
      expect(order.customerId).toBe(customer.id)
      expect(Array.isArray(order.positions)).toBe(true)
      expect(order.positions.length).toBe(positions.length)
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

    const positions: PositionInput[] = [
      {
        amount: 1,
        pos_number: 1,
        name: 'Item1',
        productCategory: 'T_SHIRT',
        design: 'DesignX',
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'XL',
      },
    ]

    await createOrder(customer.id, positions)
    await setTimeout(50)
    await createOrder(customer.id, positions)

    const orders = await getAllOrders()
    expect(Array.isArray(orders)).toBe(true)
    expect(orders.length).toBeGreaterThanOrEqual(2)
    orders.forEach((order) => {
      expect(Array.isArray(order.positions)).toBe(true)
    })
  })
})
