import { z } from 'zod'

// Enum-Definitionen
export const ShirtSizeEnum = z.enum(['S', 'M', 'L', 'XL'])
export const ProductCategoryEnum = z.enum(['T_SHIRT'])
export const PositionStatusEnum = z.enum([
  'IN_PROGRESS',
  'READY_FOR_INSPECTION',
  'INSPECTED',
  'READY_FOR_SHIPMENT',
  'COMPLETED',
  'CANCELLED',
])

// Schema für Route-Parameter /:compositeId
export const positionParamsSchema = z.object({
  compositeId: z.string().regex(/^[^.]+\.\d+$/, {
    message: 'compositeId muss im Format "orderNumber.pos_number" sein',
  }),
})

// Schema für PATCH /:compositeId
export const positionStatusPatchSchema = z.object({
  params: positionParamsSchema,
  body: z.object({
    status: PositionStatusEnum,
  }),
})

// Schema für POST / (Position anlegen)
export const positionCreateSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    description: z.string().optional().nullable(),
    amount: z.number().int().positive(),
    pos_number: z.number().int().positive(),
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

// Neues Response-Schema für Position (alle zurückgegebenen Felder)
export const positionResponseSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  amount: z.number().int().positive(),
  pos_number: z.number().int().positive(),
  name: z.string(),
  productCategory: ProductCategoryEnum,
  design: z.string(),
  color: z.string(),
  shirtSize: ShirtSizeEnum,
  description: z.string().nullable().optional(),
  standardProductId: z.string().uuid().nullable().optional(),
  Status: PositionStatusEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
})
