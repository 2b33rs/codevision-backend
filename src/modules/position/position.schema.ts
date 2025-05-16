// src/modules/position/position.schema.ts
import { z } from 'zod'

// Enum-Definitionen ggf. importieren, z.B. von $Enums oder manuell abbilden:
const ShirtSizeEnum = z.enum(['S', 'M', 'L', 'XL'])
const ProductCategoryEnum = z.enum(['T_SHIRT'])
const PositionStatusEnum = z.enum([
  'OPEN',
  'FINISHED_MATERIAL_REQUESTED',
  'PRODUCTION_NOTIFIED',
  'IN_DYEING',
  'IN_PRINTING',
  'PRODUCTION_COMPLETED',
  'FINISHED_MATERIAL_READY_FOR_PICKUP',
  'READY_FOR_SHIPMENT',
  'SHIPPED',
  'COMPLETED',
  'CANCELLED',
])

export const positionCreateSchema = z.object({
  orderId: z.string(),
  description: z.string().optional().nullable(),
  amount: z.number(),
  pos_number: z.number(),
  name: z.string(),
  productCategory: ProductCategoryEnum,
  design: z.string(),
  color: z
    .string()
    .refine(
      (s) =>
        /^cmyk\(\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/.test(s) &&
        [...s.matchAll(/\d{1,3}/g)].every(
          (m) => Number(m[0]) >= 0 && Number(m[0]) <= 100,
        ),
      { message: 'Invalid CMYK value' },
    ),
  shirtSize: ShirtSizeEnum,
})

export const positionStatusPatchSchema = z.object({
  status: PositionStatusEnum,
})

export const positionParamsSchema = z.object({
  compositeId: z.string(),
})
