import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

export const idParam = z.object({ id: z.string().uuid() })

export const standardProductZ = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  name: z.string(),
  color: z.string().nullable(),
  shirtSize: z.enum(['S', 'M', 'L', 'XL']).nullable(),
  productCategory: z.enum(['T_SHIRT']),
  minAmount: z.number(),
  currentStock: z.number(),
})

export const createProductZ = standardProductZ.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  currentStock: true
})

export const updateProductZ = createProductZ.partial()

export const schemas = {
  params: zodToJsonSchema(idParam),
  create: zodToJsonSchema(createProductZ),
  update: zodToJsonSchema(updateProductZ),
  product: zodToJsonSchema(standardProductZ),
  list: { type: 'array' as const, items: zodToJsonSchema(standardProductZ) },
}
