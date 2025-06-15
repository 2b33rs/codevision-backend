// src/modules/position/position.schema.ts
import { z } from 'zod'
import { $Enums } from '../../../generated/prisma'

// Zod-Enums aus Prisma
const PositionStatusEnum = z.nativeEnum($Enums.POSITION_STATUS)
const ProductionOrderStatusEnum = z.nativeEnum($Enums.PRODUCTION_ORDER_STATUS)

// Erlaubt:
//   orderNumber.posNumber
//   orderNumber.posNumber.productionOrderId
const compositeIdPattern = /^[^.]+\.\d+(?:\.[^.]+)?$/

// Schema für Route-Parameter /:compositeId
export const positionParamsSchema = z.object({
  compositeId: z.string().regex(compositeIdPattern, {
    message:
      'compositeId muss im Format "orderNumber.posNumber" oder "orderNumber.posNumber.productionOrderId" sein',
  }),
})

// Schema für PATCH /:compositeId
export const positionStatusPatchSchema = z.object({
  params: positionParamsSchema,
  body: z.object({
    // erlaubt sowohl Position-Status als auch ProductionOrder-Status
    status: z.union([PositionStatusEnum, ProductionOrderStatusEnum]),
  }),
})

// Schema für POST / (Position anlegen)
export const positionCreateSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    description: z.string().optional().nullable(),
    amount: z.number().int().positive(),
    price: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, { message: 'Invalid price format' }),
    pos_number: z.number().int().positive(),
    name: z.string(),
    productCategory: z.enum(['T-Shirt']),
    design: z.string(),
    color: z
      .string()
      .refine(
        (s) =>
          /^cmyk\(\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/.test(
            s,
          ) &&
          [...s.matchAll(/\d{1,3}/g)].every(
            (m) => Number(m[0]) >= 0 && Number(m[0]) <= 100,
          ),
        { message: 'Invalid CMYK value' },
      ),
    shirtSize: z.enum(['S', 'M', 'L', 'XL']),
    standardProductId: z.string().uuid().optional().nullable(),
    typ: z.array(z.string()).optional(),
  }),
})

// Schema für POST /request-finished-goods
export const requestFinishedGoodsSchema = z.object({
  body: z.object({
    orderNumber: z.string(),
    positions: z.array(
      z.object({
        id: z.string().uuid(),
      }),
    ),
  }),
})

// Response-Schema für Position
export const positionResponseSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  amount: z.number().int().positive(),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, { message: 'Invalid price format' }),
  pos_number: z.number().int().positive(),
  name: z.string(),
  productCategory: z.enum(['T-Shirt']),
  design: z.string(),
  color: z.string(),
  shirtSize: z.enum(['S', 'M', 'L', 'XL']),
  description: z.string().nullable().optional(),
  standardProductId: z.string().uuid().optional().nullable(),
  Status: PositionStatusEnum,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
