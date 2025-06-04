import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { $Enums } from '../../../generated/prisma'

type ProductCategory = $Enums.ProductCategory
type ShirtSize = $Enums.ShirtSize
/* ───────── Zod-Schemas (für Typing & Runtime-Validation) ───────── */

export const productionOrderZ = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
  positionId: z.string().uuid(),
  amount: z.number().int(),
  designUrl: z.string(),
  orderType: z.string(),
  dyeingNecessary: z.boolean(),
  productTemplate: z.any(), // Adjust type if you want stricter validation
  Status: z.nativeEnum($Enums.PRODUCTION_ORDER_STATUS),
})

export const positionZ = z.object({
  amount: z.number().int().positive(),
  pos_number: z.number().int().positive().optional(),
  name: z.string(),
  productCategory: z.enum(['T_SHIRT']) as z.ZodType<ProductCategory>,
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
  shirtSize: z.enum(['S', 'M', 'L', 'XL']) as z.ZodType<ShirtSize>,
  description: z.string().nullable().optional(),

  standardProductId: z.string().uuid().optional(),

  id: z.string().uuid().optional(),
  Status: z.nativeEnum($Enums.POSITION_STATUS).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  orderId: z.string().uuid().optional(),

  productionOrders: z.array(productionOrderZ).optional(),
})

export const orderBaseZ = z.object({
  customerId: z.string().uuid(),

  id: z.string().uuid().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
  orderNumber: z.string().optional(),

  positions: z.array(positionZ),
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
      }),
    ),
  })

/* Querystring */
export const listOrdersQueryZ = z.object({
  orderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
})

/* ───────── JSON-Schema (für Fastify/Ajv/Swagger) ───────── */

export const schemas = {
  bodyCreate: zodToJsonSchema(createOrderZ),
  queryList: zodToJsonSchema(listOrdersQueryZ),
  orderResponse: zodToJsonSchema(orderBaseZ),
  ordersResponse: zodToJsonSchema(z.array(orderBaseZ)),
}
