import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../plugins/prisma'
import {
  createPosition,
  updatePositionStatusByBusinessKey,
} from './position.service'
import { randomUUID } from 'crypto'
import { $Enums } from '../../../generated/prisma'

type ProductCategory = $Enums.ProductCategory
type ShirtSize = $Enums.ShirtSize
type POSITION_STATUS = $Enums.POSITION_STATUS

describe('Position Service Unit Tests', () => {
  beforeEach(async () => {
    await prisma.complaint.deleteMany()
    await prisma.position.deleteMany()
    await prisma.order.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.standardProduct.deleteMany()
  })

  it('should create a new position with valid data', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'Pos-Testkunde',
        email: `pos-test-${Date.now()}@mail.com`,
        phone: '7777',
        customerType: 'WEBSHOP',
      },
    })

    const order = await prisma.order.create({
      data: {
        id: randomUUID(),
        customerId: customer.id,
        orderNumber: '20240001',
      },
    })

    const pos = await createPosition(
      order.id,
      7,
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
    expect(pos.name).toBe('Super T-Shirt')
    expect(pos.design).toBe('DesignCool')
    expect(pos.color).toBe('cmyk(10%,20%,30%,40%)')
    expect(pos.shirtSize).toBe('M')
    expect(pos.Status).toBe('IN_PROGRESS')
    expect(pos.orderId).toBe(order.id)
  })

  it('should update the status of a position by composite key', async () => {
    const customer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        name: 'Update Testkunde',
        email: `update-pos-${Date.now()}@mail.com`,
        phone: '9999',
        customerType: 'WEBSHOP',
      },
    })

    const order = await prisma.order.create({
      data: {
        id: randomUUID(),
        customerId: customer.id,
        orderNumber: '20240002',
      },
    })

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

    const pos = await prisma.position.create({
      data: {
        orderId: order.id,
        pos_number: 2,
        amount: 3,
        name: 'Status-Test-Posi',
        productCategory: 'T_SHIRT',
        design: 'DesignA',
        color: 'cmyk(1%,1%,1%,1%)',
        shirtSize: 'M',
        Status: 'IN_PROGRESS',
        standardProductId: product.id,
      },
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
})
