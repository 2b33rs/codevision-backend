// src/modules/position/position.schema.ts
import { z } from 'zod'
import { $Enums, POSITION_STATUS } from '../../../generated/prisma'

// Enum-Definitionen ggf. importieren, z.B. von $Enums oder manuell abbilden:
const ShirtSizeEnum = z.enum(['S', 'M', 'L', 'XL'])
const ProductCategoryEnum = z.nativeEnum($Enums.ProductCategory)
const PositionStatusEnum = z.enum(POSITION_STATUS)

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
        /^cmyk\(\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/.test(
          s,
        ) &&
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
