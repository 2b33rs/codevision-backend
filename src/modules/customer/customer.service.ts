import { $Enums } from '../../../generated/prisma'
import { prisma } from '../../plugins/prisma'
import CustomerType = $Enums.CustomerType

export async function createCustomer(
  name: string,
  email: string,
  phone: string,
  customerType: CustomerType,
) {
  // Create a new customer in the database
  return prisma.customer.create({
    data: {
      name,
      email,
      phone,
      customerType,
    },
  })
}
