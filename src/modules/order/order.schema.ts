import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { $Enums } from '../../../generated/prisma'
import { customerZ } from '../customer/customer.schema'
import { productionOrderResponseSchema } from '../production-order/production-order.schema'

/* ───────── Zod-Schemas (für Typing & Runtime-Validation) ───────── */

export const positionZ = z.object({
  amount: z.number().int().positive(),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, { message: 'Invalid price format' }),
  pos_number: z.number().int().positive(),
  name: z.string(),
  productCategory: z.string(),
  design: z.string(),
  color: z
    .string()
    .refine(
      (s) =>
        /^cmyk\(\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/.test(
          s,
        ) &&
        [...s.matchAll(/\d{1,3}/g)].every((m) => +m[0] >= 0 && +m[0] <= 100),
      { message: 'Invalid CMYK value' },
    ),
  shirtSize: z.string(),
  description: z.string().nullable().optional(),

  standardProductId: z.string().uuid().optional(),

  id: z.string().uuid().optional(),
  Status: z.nativeEnum($Enums.POSITION_STATUS).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  orderId: z.string().uuid().optional(),

  productionOrders: z.array(productionOrderResponseSchema),
})

export const orderBaseZ = z.object({
  customerId: z.string().uuid(),
  customer: customerZ.optional(),

  id: z.string().uuid().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
  orderNumber: z.string().optional(),

  productionOrders: z.array(productionOrderResponseSchema).default([]),
})

/* Eingaben */
export const createOrderZ = orderBaseZ
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    orderNumber: true,
  })
  .extend({
    positions: z.array(
      positionZ.omit({
        id: true,
        Status: true,
        createdAt: true,
        updatedAt: true,
        orderId: true,
        productionOrders: true,
      }),
    ),
  })

/* Querystring */
export const listOrdersQueryZ = z.object({
  orderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
})

/* Response-Schema */
export const positionResponseZ = positionZ.omit({ productionOrders: true })
export const orderResponseZ = orderBaseZ.extend({
  positions: z.array(positionResponseZ),
})

/* ───────── JSON-Schema (für Fastify/Ajv/Swagger) ───────── */
export const schemas = {
  bodyCreate: zodToJsonSchema(createOrderZ),
  queryList: zodToJsonSchema(listOrdersQueryZ),
  orderResponse: zodToJsonSchema(orderResponseZ),
  ordersResponse: zodToJsonSchema(z.array(orderResponseZ)),
}

export interface PositionInput {
  amount: number
  price: string
  pos_number: number
  name: string
  productCategory: string
  design: string
  color: string
  shirtSize: string
  description?: string
  standardProductId?: string
}
