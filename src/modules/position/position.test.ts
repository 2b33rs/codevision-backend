import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '../../plugins/prisma'
import { createPosition, updatePositionStatusByBusinessKey } from './position.service'
import { randomUUID } from 'crypto'
import { $Enums } from '../../../generated/prisma'

type ProductCategory = $Enums.ProductCategory
type ShirtSize = $Enums.ShirtSize
type POSITION_STATUS = $Enums.POSITION_STATUS

describe('Position Service Unit Tests', () => {
  beforeEach(async () => {
    // Reihenfolge wichtig wegen FKs
    await prisma.complaint.deleteMany()
    await prisma.position.deleteMany()
    await prisma.order.deleteMany()
    await prisma.customer.deleteMany()
  })

  it('should create a new position with valid data', async () => {
    // Erstmal Customer & Order anlegen
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
        orderNumber: '20240001', // Muss mit deinem Order-Pattern übereinstimmen
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
      'Testbeschreibung'
    )

    expect(pos).toHaveProperty('id')
    expect(pos.amount).toBe(7)
    expect(pos.name).toBe('Super T-Shirt')
    expect(pos.design).toBe('DesignCool')
    expect(pos.color).toBe('cmyk(10%,20%,30%,40%)')
    expect(pos.shirtSize).toBe('M')
    expect(pos.Status).toBe('OPEN')
    expect(pos.orderId).toBe(order.id)
  })

  it('should update the status of a position by composite key', async () => {
    // Setup: Customer + Order + Position
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

    const pos = await createPosition(
      order.id,
      3,
      2,
      'Update-Shirt',
      'T_SHIRT',
      'UpdateDesign',
      'cmyk(5%,5%,5%,5%)',
      'L'
    )

    // Composite Key: orderNumber.pos_number
    const compositeId = `${order.orderNumber}.${pos.pos_number}`

    const updated = await updatePositionStatusByBusinessKey(compositeId, 'SHIPPED')

    expect(updated.Status).toBe('SHIPPED')
    expect(updated.id).toBe(pos.id)
  })
})
