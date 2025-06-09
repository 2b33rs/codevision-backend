import { randomUUID } from 'crypto'
import { prisma } from '../plugins/prisma'
import { PRODUCTION_ORDER_STATUS } from '../../generated/prisma'

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
      price: '9.99',
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

export async function makeProductionOrder(
  positionId: string,
  overrides: {
    amount?: number
    designUrl?: string
    orderType?: string
    dyeingNecessary?: boolean
    materialId?: number
    productTemplate?: any // Typ anpassen, wenn du eine spezifische Struktur hast
    status?: PRODUCTION_ORDER_STATUS // Typ anpassen, wenn du eine spezifische Struktur hast
    productionorder_number?: number
  } = {},
) {
  return prisma.productionOrder.create({
    data: {
      position: { connect: { id: positionId } },
      amount: overrides.amount ?? 1, // Standardwert 1, wenn nicht überschrieben
      designUrl: overrides.designUrl ?? '', // Standardwert leerer String
      orderType: overrides.orderType ?? '', // Standardwert leerer String
      dyeingNecessary: overrides.dyeingNecessary ?? false, // Standardwert false
      materialId: overrides.materialId ?? 0, // Standardwert 0, wenn nicht überschrieben
      productTemplate: overrides.productTemplate ?? {}, // Standardwert leeres Objekt
      Status: overrides.status ?? 'ORDER_RECEIVED', // Standardwert, falls definiert
      productionorder_number: overrides.productionorder_number ?? 0, // Standardwert 0
    },
  })
}
