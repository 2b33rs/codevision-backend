import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '../../plugins/prisma'
import {
  createComplaint,
  getAllComplaints,
  getComplaintsByCustomer,
  getComplaintsByOrder,
  getComplaintsByPosition,
} from './complaint.service'
import { randomUUID } from 'crypto'

beforeEach(async () => {
  await prisma.$executeRawUnsafe('BEGIN')
})

afterEach(async () => {
  await prisma.$executeRawUnsafe('ROLLBACK')
})

describe('Complaint Service Unit Tests', () => {
  it('should create a complaint and update position status (unless OTHER)', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Unit Kunde',
        email: `unit-${Date.now()}@mail.com`,
        phone: '12345',
        customerType: 'WEBSHOP',
      },
    })

    const order = await prisma.order.create({
      data: {
        orderNumber: '25_999',
        customerId: customer.id,
        deletedAt: null,
      },
    })

    const position = await prisma.position.create({
      data: {
        orderId: order.id,
        pos_number: 99,
        name: 'Unit Pos',
        amount: 1,
        productCategory: 'T_SHIRT',
        design: 'Unit Design',
        Status: 'COMPLETED',
        shirtSize: 'M',
      },
    })

    const complaint = await createComplaint({
      positionId: position.id,
      ComplaintReason: 'WRONG_PRODUCT',
      ComplaintKind: 'EXTERN',
      createNewOrder: true,
    })

    expect(complaint).toHaveProperty('id')

    const updatedPosition = await prisma.position.findUnique({
      where: { id: position.id },
    })
    expect(updatedPosition?.Status).toBe('IN_PROGRESS')
  })

  it('should create a complaint and set position status to CANCELLED when createNewOrder is false', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'Cancel Kunde',
        email: `cancel-${Date.now()}@mail.com`,
        phone: '54321',
        customerType: 'WEBSHOP',
      },
    })

    const order = await prisma.order.create({
      data: {
        id: randomUUID(),
        orderNumber: '25_997',
        customerId: customer.id,
        deletedAt: null,
      },
    })

    const position = await prisma.position.create({
      data: {
        orderId: order.id,
        pos_number: 77,
        name: 'Cancel Pos',
        amount: 1,
        productCategory: 'T_SHIRT',
        design: 'Cancel Design',
        Status: 'IN_PROGRESS',
        shirtSize: 'L',
      },
    })

    const complaint = await createComplaint({
      positionId: position.id,
      ComplaintReason: 'WRONG_COLOR',
      ComplaintKind: 'INTERN',
      createNewOrder: false,
    })

    expect(complaint).toHaveProperty('id')

    const updatedPosition = await prisma.position.findUnique({
      where: { id: position.id },
    })
    expect(updatedPosition?.Status).toBe('CANCELLED')
  })

  it('should create a new order when createNewOrder is true and link it to the complaint', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'Reorder Kunde',
        email: `reorder-${Date.now()}@mail.com`,
        phone: '44444',
        customerType: 'BUSINESS',
      },
    })

    const order = await prisma.order.create({
      data: {
        id: randomUUID(),
        orderNumber: '25_996',
        customerId: customer.id,
        deletedAt: null,
      },
    })

    const position = await prisma.position.create({
      data: {
        id: randomUUID(),
        orderId: order.id,
        pos_number: 11,
        name: 'Reorder Pos',
        amount: 3,
        productCategory: 'T_SHIRT',
        design: 'Reorder Design',
        Status: 'COMPLETED',
        shirtSize: 'L',
      },
    })

    const complaint = await createComplaint({
      positionId: position.id,
      ComplaintReason: 'MISSING_ITEM',
      ComplaintKind: 'INTERN',
      createNewOrder: true,
    })

    expect(complaint).toHaveProperty('newOrderId')
    expect(typeof complaint.newOrderId).toBe('string')

    const newOrder = await prisma.order.findUnique({
      where: { id: complaint.newOrderId! },
    })

    expect(newOrder).not.toBeNull()
    expect(newOrder?.customerId).toBe(customer.id)
  })

  it('should fetch complaints by positionId, orderId, and customerId', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'Query Kunde',
        email: `query-${Date.now()}@mail.com`,
        phone: '67890',
        customerType: 'BUSINESS',
      },
    })

    const order = await prisma.order.create({
      data: {
        id: randomUUID(),
        orderNumber: '25_998',
        customerId: customer.id,
        deletedAt: null,
      },
    })

    const position = await prisma.position.create({
      data: {
        orderId: order.id,
        pos_number: 88,
        name: 'Query Pos',
        amount: 2,
        productCategory: 'T_SHIRT',
        design: 'Query Design',
        shirtSize: 'S',
      },
    })

    const complaint = await prisma.complaint.create({
      data: {
        positionId: position.id,
        ComplaintReason: 'BAD_QUALITY',
        ComplaintKind: 'INTERN',
        createNewOrder: true,
      },
    })

    const byPosition = await getComplaintsByPosition(position.id)
    expect(byPosition.length).toBe(1)
    expect(byPosition[0].id).toBe(complaint.id)

    const byOrder = await getComplaintsByOrder(order.id)
    expect(byOrder.length).toBe(1)
    expect(byOrder[0].id).toBe(complaint.id)

    const byCustomer = await getComplaintsByCustomer(customer.id)
    expect(byCustomer.length).toBe(1)
    expect(byCustomer[0].id).toBe(complaint.id)
  })

  it('should return all complaints', async () => {
    const complaints = await getAllComplaints()
    expect(Array.isArray(complaints)).toBe(true)
  })
})
