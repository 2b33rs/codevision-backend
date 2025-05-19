import { describe, expect, it } from 'vitest'
import { app } from '../../vitest.setup'
import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'

describe('Complaint routes', () => {
  it('POST /complaints should create a new complaint and return it', async () => {
    const order = await prisma.order.create({
      data: {
        customer: {
          create: {
            name: 'Complaint Tester',
            email: `test-${randomUUID()}@example.com`,
            phone: '1234',
            customerType: 'WEBSHOP',
          },
        },
      },
    })

    const position = await prisma.position.create({
      data: {
        orderId: order.id,
        pos_number: 1,
        amount: 1,
        name: 'Testshirt',
        productCategory: 'T_SHIRT',
        design: 'Simple',
        color: 'cmyk(0%,0%,0%,100%)',
        shirtSize: 'M',
        Status: 'IN_PROGRESS',
      },
    })

    const payload = {
      positionId: position.id,
      ComplaintReason: 'WRONG_SIZE',
      ComplaintKind: 'INTERN',
      createNewOrder: true,
    }

    const response = await app.inject({
      method: 'POST',
      url: '/complaints',
      payload,
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.positionId).toBe(position.id)
    expect(body.ComplaintReason).toBe('WRONG_SIZE')
    expect(body.ComplaintKind).toBe('INTERN')
  })

  it('GET /complaints should return all complaints', async () => {
    const complaints = await prisma.complaint.findMany()

    const response = await app.inject({
      method: 'GET',
      url: '/complaints',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.length).toBeGreaterThanOrEqual(complaints.length)
  })

  it('GET /complaints?positionId=ID returns complaints for position', async () => {
    const [complaint] = await prisma.complaint.findMany({ take: 1 })

    const response = await app.inject({
      method: 'GET',
      url: `/complaints?positionId=${complaint.positionId}`,
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.some((c: any) => c.id === complaint.id)).toBe(true)
  })

  it('GET /complaints?orderId=ID returns complaints for order', async () => {
    const [complaint] = await prisma.complaint.findMany({
      include: { position: true },
      take: 1,
    })

    const response = await app.inject({
      method: 'GET',
      url: `/complaints?orderId=${complaint.position.orderId}`,
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.some((c: any) => c.id === complaint.id)).toBe(true)
  })

  it('GET /complaints?customerId=ID returns complaints for customer', async () => {
    const [complaint] = await prisma.complaint.findMany({
      include: { position: { include: { order: true } } },
      take: 1,
    })

    const response = await app.inject({
      method: 'GET',
      url: `/complaints?customerId=${complaint.position.order.customerId}`,
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.some((c: any) => c.id === complaint.id)).toBe(true)
  })
})
