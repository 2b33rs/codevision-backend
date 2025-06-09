import { describe, expect, it } from 'vitest'
import { prisma } from '../../plugins/prisma'
import {
  createPosition,
  updatePositionStatusByBusinessKey,
} from './position.service'
import { $Enums } from '../../../generated/prisma'
import { app } from '../../vitest.setup'
import {
  makeCustomer,
  makeOrder,
  makePosition,
  makeProductionOrder,
} from '../../utils/test.factory'

type ProductCategory = string
type ShirtSize = $Enums.ShirtSize
type POSITION_STATUS = $Enums.POSITION_STATUS

describe('Position Service Unit Tests', () => {
  it('should create a new position with valid data', async () => {
    const customer = await makeCustomer()
    const order = await makeOrder(customer.id)

    const pos = await createPosition(
      order.id,
      7,
      '9.99',              // new price parameter as string
      1,
      'Super T-Shirt',
      'T_SHIRT',
      'DesignCool',
      'cmyk(10%,20%,30%,40%)',
      'M',
      'Testbeschreibung',
    )

    expect(pos).toHaveProperty('id')
    expect(pos.amount).toBe(7)
    expect(pos.price.toString()).toBe('9.99')           // assert price
    expect(pos.name).toBe('Super T-Shirt')
    expect(pos.design).toBe('DesignCool')
    expect(pos.color).toBe('cmyk(10%,20%,30%,40%)')
    expect(pos.shirtSize).toBe('M')
    expect(pos.Status).toBe('IN_PROGRESS')
    expect(pos.orderId).toBe(order.id)
  })

  it('should update the status of a position by composite key', async () => {
    const customer = await makeCustomer()
    const order = await makeOrder(customer.id)

    const product = await prisma.standardProduct.create({
      data: {
        name: 'Produkt für Status-Test',
        productCategory: 'T_SHIRT',
        minAmount: 1,
        color: 'cmyk(1%,1%,1%,1%)',
        shirtSize: 'M',
        amountInProduction: 5,
      },
    })

    const pos = await makePosition(order.id, {
      pos_number: 2,
      amount: 3,
      name: 'Status-Test-Posi',
      productCategory: 'T_SHIRT',
      design: 'DesignA',
      color: 'cmyk(1%,1%,1%,1%)',
      shirtSize: 'M',
      Status: 'IN_PROGRESS',
      standardProductId: product.id,
    })

    const compositeId = `${order.orderNumber}.${pos.pos_number}`

    const updated = await updatePositionStatusByBusinessKey(
      compositeId,
      'COMPLETED',
    )

    expect(updated.Status).toBe('COMPLETED')

    const productAfter = await prisma.standardProduct.findUniqueOrThrow({
      where: { id: product.id },
    })

    expect(productAfter.amountInProduction).toBe(2)
  })

  it('should update the status of a production order by composite key', async () => {
    const customer = await makeCustomer()
    const order = await makeOrder(customer.id)
    const pos = await makePosition(order.id, { pos_number: 3 })
    const prodOrder = await makeProductionOrder(pos.id)

    const compositeId = `${order.orderNumber}.${pos.pos_number}.${prodOrder.id}`

    const updatedOrder = await updatePositionStatusByBusinessKey(
      compositeId,
      'COMPLETED',
    )

    expect(updatedOrder.Status).toBe('COMPLETED')
  })
})

describe('Position Routes', () => {
  it('POST /position – create new position', async () => {
    // Seed Customer + Order
    const customer = await makeCustomer()
    const order = await makeOrder(customer.id)

    const payload = {
      orderId: order.id,
      amount: 4,
      price: '12.50',             // include new price field
      pos_number: 1,
      name: 'Test Shirt',
      productCategory: 'T_SHIRT' as ProductCategory,
      design: 'TestDesign',
      color: 'cmyk(10%,20%,30%,40%)',
      shirtSize: 'L' as ShirtSize,
      description: 'Test description',
    }

    const res = await app.inject({
      method: 'POST',
      url: '/position',
      payload,
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('id')
    expect(body).toMatchObject({
      orderId: order.id,
      amount: 4,
      price: '12.5',             // assert price in response
      pos_number: 1,
      name: 'Test Shirt',
      productCategory: 'T_SHIRT',
      design: 'TestDesign',
      color: 'cmyk(10%,20%,30%,40%)',
      shirtSize: 'L',
      description: 'Test description',
      Status: 'IN_PROGRESS',
    })
  })

  it('PATCH /position/:compositeId – update status', async () => {
    // Seed Customer + Order + Position
    const customer = await makeCustomer()
    const order = await makeOrder(customer.id)
    const pos = await makePosition(order.id, { pos_number: 5 })

    const compositeId = `${order.orderNumber}.${pos.pos_number}`

    const res = await app.inject({
      method: 'PATCH',
      url: `/position/${compositeId}`,
      payload: { status: 'COMPLETED' as POSITION_STATUS },
    })

    expect(res.statusCode).toBe(200)
    expect(res.body).toBe(`Updated position status successfully to COMPLETED`)

    const updatedPos = await prisma.position.findUniqueOrThrow({
      where: { id: pos.id },
    })
    expect(updatedPos.Status).toBe('COMPLETED')
  })

  it('PATCH /position/:compositeId – update production order status', async () => {
    // Seed Customer + Order + Position + ProductionOrder
    const customer = await makeCustomer()
    const order = await makeOrder(customer.id)
    const pos = await makePosition(order.id, { pos_number: 6 })
    const prodOrder = await makeProductionOrder(pos.id)

    const compositeId = `${order.orderNumber}.${pos.pos_number}.${prodOrder.id}`

    const res = await app.inject({
      method: 'PATCH',
      url: `/position/${compositeId}`,
      payload: { status: 'COMPLETED' as POSITION_STATUS },
    })

    expect(res.statusCode).toBe(200)
    expect(res.body).toBe(`Updated position status successfully to COMPLETED`)

    const updated = await prisma.productionOrder.findUniqueOrThrow({
      where: { id: prodOrder.id },
    })
    expect(updated.Status).toBe('COMPLETED')
  })

  it('POST /position/request-finished-goods – batch request', async () => {
    // Seed Customer + Order + zwei Positionen
    const customer = await makeCustomer()
    const order = await makeOrder(customer.id)
    const pos1 = await makePosition(order.id, {
      pos_number: 1,
      Status: 'READY_FOR_SHIPMENT',
    })
    await makeProductionOrder(pos1.id)
    const pos2 = await makePosition(order.id, {
      pos_number: 2,
      Status: 'READY_FOR_SHIPMENT',
    })
    await makeProductionOrder(pos2.id)

    // Endpoint aufrufen
    const res = await app.inject({
      method: 'POST',
      url: '/position/request-finished-goods',
      payload: {
        orderNumber: order.orderNumber,
        positions: [{ id: pos1.id }, { id: pos2.id }],
      },
    })

    // Assertions
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.orderNumber).toBe(order.orderNumber)
    expect(body.results).toHaveLength(2)
    for (const result of body.results) {
      expect(result.newStatus).toBe('OUTSOURCING_REQUESTED')
      expect(result.id).toBeDefined()
    }
  })
})
