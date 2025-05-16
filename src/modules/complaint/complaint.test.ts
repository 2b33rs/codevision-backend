import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '../../plugins/prisma'
import { createComplaint, getAllComplaints, getComplaintsByCustomer, getComplaintsByOrder, getComplaintsByPosition } from './complaint.service'
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
        id: randomUUID(),
        name: 'Unit Kunde',
        email: `unit-${Date.now()}@mail.com`,
        phone: '12345',
        customerType: 'WEBSHOP',
      },
    })

    const order = await prisma.order.create({
      data: {
        id: randomUUID(),
        orderNumber: '25_999',
        customerId: customer.id,
        deletedAt: null,
      },
    })

    const position = await prisma.position.create({
      data: {
        id: randomUUID(),
        orderId: order.id,
        pos_number: 99,
        name: 'Unit Pos',
        amount: 1,
        prodCategory: 'T_SHIRT',
        design: 'Unit Design',
        Status: 'PRODUCTION_COMPLETED',
        shirtSize: 'M',
      },
    })

    const complaint = await createComplaint({
      positionId: position.id,
      ComplaintReason: 'WRONG_PRODUCT', //bearbeitet
      ComplaintKind: 'EXTERN',
      RestartProcess: true, //bearbeitet
    })

    expect(complaint).toHaveProperty('id')

    const updatedPosition = await prisma.position.findUnique({ where: { id: position.id } })
    expect(updatedPosition?.Status).toBe('OPEN')
  })
//bearbeitet
  it('should create a complaint and set position status to CANCELLED when RestartProcess is false', async () => {
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
        id: randomUUID(),
        orderId: order.id,
        pos_number: 77,
        name: 'Cancel Pos',
        amount: 1,
        prodCategory: 'T_SHIRT',
        design: 'Cancel Design',
        Status: 'PRODUCTION_COMPLETED',
        shirtSize: 'L',
      },
    })

    const complaint = await createComplaint({
      positionId: position.id,
      ComplaintReason: 'WRONG_COLOR', // Enum-Wert ungleich 'OTHER'
      ComplaintKind: 'INTERN',
      RestartProcess: false, // Bedingung für CANCELLED
    })

    expect(complaint).toHaveProperty('id')

    const updatedPosition = await prisma.position.findUnique({ where: { id: position.id } })
    expect(updatedPosition?.Status).toBe('CANCELLED') // Überprüfung auf CANCELLED
  })
//bearbeitet Ende

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
        id: randomUUID(),
        orderId: order.id,
        pos_number: 88,
        name: 'Query Pos',
        amount: 2,
        prodCategory: 'T_SHIRT',
        design: 'Query Design',
        Status: 'OPEN',
        shirtSize: 'S',
      },
    })

    const complaint = await prisma.complaint.create({
      data: {
        id: randomUUID(),
        positionId: position.id,
        ComplaintReason: 'BAD_QUALITY', //bearbeitet
        ComplaintKind: 'INTERN',
        RestartProcess: true, //bearbeitet
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