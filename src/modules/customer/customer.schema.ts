import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

export const idParam = z.object({ id: z.string().uuid() })
export const orderZ = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  customerId: z.string().uuid(),
})
export const customerZ = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  addr_country: z.enum(['DE']).nullable(),
  addr_city: z.string().nullable(),
  addr_zip: z.string().nullable(),
  addr_street: z.string().nullable(),
  addr_line1: z.string().nullable(),
  addr_line2: z.string().nullable(),
  customerType: z.enum(['WEBSHOP', 'BUSINESS']),
  orders: orderZ.array().optional(),
})
export const createCustomerZ = customerZ.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  orders: true,
})
export const updateCustomerZ = createCustomerZ.partial()

export const schemas = {
  params: zodToJsonSchema(idParam),
  create: zodToJsonSchema(createCustomerZ),
  update: zodToJsonSchema(updateCustomerZ),
  customer: zodToJsonSchema(customerZ),
  list: { type: 'array' as const, items: zodToJsonSchema(customerZ) },
}
