import { prisma } from '../../plugins/prisma'
import { faker } from '@faker-js/faker'
import { OrderStatus } from '../../../generated/prisma'

export const getAllOrders = () => prisma.order.findMany()

export const getSampleOrder = () => ({
  id: faker.string.uuid(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  deletedAt: null,
  orderNumber: faker.string.alphanumeric(8),
  status: faker.helpers.arrayElement([
    'PENDING',
    'CONFIRMED',
    'SHIPPED',
    'DELIVERED',
  ]) as OrderStatus,
  customerId: faker.string.uuid(),
})
