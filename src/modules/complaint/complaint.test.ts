import { describe, expect, it } from 'vitest'
import { app } from '../../vitest.setup'
import {
  makeComplaint,
  makeCustomer,
  makeOrder,
  makePosition,
} from '../../utils/test.factory'

describe('Complaint routes', () => {
  it('POST /complaints should create a new complaint and return it', async () => {
    // Arrange using factories
    const customer = await makeCustomer()
    const order = await makeOrder(customer.id)
    const position = await makePosition(order.id)

    const response = await app.inject({
      method: 'POST',
      url: '/complaints',
      payload: {
        positionId: position.id,
        ComplaintReason: 'WRONG_SIZE',
        ComplaintKind: 'INTERN',
        createNewOrder: true,
      },
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.positionId).toBe(position.id)
    expect(body.ComplaintReason).toBe('WRONG_SIZE')
    expect(body.ComplaintKind).toBe('INTERN')
  })

  it('GET /complaints should return all complaints', async () => {
    const customer = await makeCustomer()
    const order = await makeOrder(customer.id)
    const position = await makePosition(order.id)
    const complaint = await makeComplaint(position.id)

    const response = await app.inject({
      method: 'GET',
      url: '/complaints',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.some((c: any) => c.id === complaint.id)).toBe(true)
  })

  it('GET /complaints?positionId=ID returns complaints for position', async () => {
    const customer = await makeCustomer()
    const order = await makeOrder(customer.id)
    const position = await makePosition(order.id)
    const complaint = await makeComplaint(position.id)

    const response = await app.inject({
      method: 'GET',
      url: `/complaints?positionId=${position.id}`,
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.some((c: any) => c.id === complaint.id)).toBe(true)
  })

  it('GET /complaints?orderId=ID returns complaints for order', async () => {
    const customer = await makeCustomer()
    const order = await makeOrder(customer.id)
    const position = await makePosition(order.id)
    const complaint = await makeComplaint(position.id)

    const response = await app.inject({
      method: 'GET',
      url: `/complaints?orderId=${order.id}`,
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.some((c: any) => c.id === complaint.id)).toBe(true)
  })

  it('GET /complaints?customerId=ID returns complaints for customer', async () => {
    const customer = await makeCustomer()
    const order = await makeOrder(customer.id)
    const position = await makePosition(order.id)
    const complaint = await makeComplaint(position.id)

    const response = await app.inject({
      method: 'GET',
      url: `/complaints?customerId=${customer.id}`,
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.some((c: any) => c.id === complaint.id)).toBe(true)
  })
})
