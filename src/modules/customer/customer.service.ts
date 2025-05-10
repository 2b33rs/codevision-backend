import { Prisma } from '../../../generated/prisma'
import { prisma } from '../../plugins/prisma'

export function createCustomer(data: Prisma.CustomerCreateInput) {
  return prisma.customer.create({ data })
}
export function listCustomers() {
  return prisma.customer.findMany({ orderBy: { updatedAt: 'desc' } })
}
export function getCustomerById(id: string) {
  return prisma.customer.findUnique({ where: { id } })
}
export function updateCustomerById(
  id: string,
  data: Prisma.CustomerUpdateInput,
) {
  return prisma.customer.update({ where: { id }, data })
}
export function deleteCustomerById(id: string) {
  return prisma.customer.delete({ where: { id } })
}
export async function getCustomerByIdWithCount(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  })
}
