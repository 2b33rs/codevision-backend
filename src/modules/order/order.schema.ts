import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { $Enums } from '../../../generated/prisma'
import { customerZ } from '../customer/customer.schema'
import { PRODUCTION_ORDER_STATUS } from '../../../generated/prisma'

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

  // Diese Felder kommen aus der DB
  id: z.string().uuid().optional(),
  Status: z.nativeEnum($Enums.POSITION_STATUS).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  orderId: z.string().uuid().optional(),

  // WICHTIG: ProductionOrders jetzt in positionZ
  productionOrders: z.array(
    z.object({
      id: z.string().uuid(),
      positionId: z.string().uuid(),
      amount: z.number(),
      designUrl: z.string(),
      orderType: z.enum(['STANDARD', 'EXPRESS']),
      dyeingNecessary: z.boolean(),
      materialId: z.number().nullable().optional(),
      productTemplate: z.any().optional(), // Optional für Validierung
      Status: z.nativeEnum(PRODUCTION_ORDER_STATUS),
      createdAt: z.string().datetime().optional(),
      updatedAt: z.string().datetime().optional(),
    }),
  ),
})

export const orderBaseZ = z.object({
  customerId: z.string().uuid(),
  customer: customerZ.optional(),

  // Diese Felder kommen aus der DB
  id: z.string().uuid().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
  orderNumber: z.string().optional(),
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
        // Beim Erstellen nicht mitschicken:
        id: true,
        Status: true,
        createdAt: true,
        updatedAt: true,
        orderId: true,
        productionOrders: true, // Wichtig: Client sendet keine productionOrders
      }),
    ),
  })

/* Querystring */
export const listOrdersQueryZ = z.object({
  orderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
})

/* Response-Schema - JETZT MIT PRODUCTIONORDERS */
export const positionResponseZ = positionZ // Jetzt MIT productionOrders!
export const orderResponseZ = orderBaseZ.extend({
  positions: z.array(positionResponseZ), // Enthält jetzt productionOrders
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