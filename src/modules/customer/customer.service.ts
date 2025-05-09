import { $Enums } from '../../../generated/prisma'
import { prisma } from '../../plugins/prisma'
import CustomerType = $Enums.CustomerType

export async function createCustomer(
  name: string,
  email: string,
  phone: string,
  addr_country: $Enums.addr_Land,
  addr_city: string,
  addr_zip: string,
  addr_street: string,
  addr_line1: string,
  addr_line2: string,
  customerType: CustomerType,
) {
  // Create a new customer in the database
  return prisma.customer.create({
    data: {
      name,
      email,
      phone,
      addr_country: $Enums.addr_Land.DE,
      addr_city,
      addr_zip,
      addr_street,
      addr_line1,
      addr_line2,
      customerType,
    },
  })
}

//List all customers
export async function listCustomers() {
  // Get all customers from the database
  return prisma.customer.findMany({
    orderBy: {
      updatedAt: 'desc',
    },
  })
}

//get customer by id
export async function getCustomerById(customerId: string) {
  // Get a customer by their ID from the database
  return prisma.customer.findUnique({
    where: {
      id: customerId,
    },
  })
}

//update customer by id
export async function updateCustomerById(
  customerId: string,
  updateData: {
    name?: string
    email?: string
    phone?: string
    addr_country?: $Enums.addr_Land
    addr_city?: string
    addr_zip?: string
    addr_street?: string
    addr_line1?: string
    addr_line2?: string
    customerType?: CustomerType
  },
) {
  // Update a customer by their ID in the database
  return prisma.customer.update({
    where: {
      id: customerId,
    },
    data: updateData,
  })
}

//delete customer by id
export async function deleteCustomerById(customerId: string) {
  // Delete a customer by their ID in the database
  return prisma.customer.delete({
    where: {
      id: customerId,
    },
  })
}
