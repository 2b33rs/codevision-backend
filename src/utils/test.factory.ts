import { randomUUID } from 'crypto'
import { prisma } from '../plugins/prisma'

export async function makeCustomer(overrides = {}) {
  return prisma.customer.create({
    data: {
      name: `Test-${randomUUID()}`,
      email: `test-${randomUUID()}@example.com`,
      phone: '00000',
      customerType: 'WEBSHOP',
      ...overrides,
    },
  })
}

export async function makeOrder(customerId: string, overrides: any = {}) {
  return prisma.order.create({
    data: {
      customer: { connect: { id: customerId } },
      ...overrides,
    },
  })
}

export async function makePosition(orderId: string, overrides: any = {}) {
  return prisma.position.create({
    data: {
      order: { connect: { id: orderId } },
      pos_number: 1,
      amount: 1,
      name: `TestPosition-${randomUUID()}`,
      productCategory: 'T_SHIRT',
      design: 'TestDesign',
      color: 'cmyk(0%,0%,0%,0%)',
      shirtSize: 'M',
      Status: 'IN_PROGRESS',
      ...overrides,
    },
  })
}

export async function makeComplaint(positionId: string, overrides: any = {}) {
  return prisma.complaint.create({
    data: {
      position: { connect: { id: positionId } },
      ComplaintReason: 'WRONG_SIZE',
      ComplaintKind: 'INTERN',
      createNewOrder: false,
      ...overrides,
    },
  })
}

export async function makeProduct(overrides: any = {}) {
  return prisma.standardProduct.create({
    data: {
      name: `TestProduct-${randomUUID()}`,
      productCategory: 'T_SHIRT',
      minAmount: 1,
      color: 'cmyk(0%,0%,0%,0%)',
      shirtSize: 'M',
      ...overrides,
    },
  })
}
