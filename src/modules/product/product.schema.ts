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
  shirtSize: z.string().nullable(),
  productCategory: z.string(),
  minAmount: z.number(),
  currentStock: z.number(),
  typ: z.array(z.string()),
})

export const createProductZ = standardProductZ.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  currentStock: true,
})

export const updateProductZ = createProductZ.partial()

export const createProductionOrderZ = z.object({
  amount: z.number().int().positive(),
})

export const productionOrderResponseZ = z.object({
  status: z.literal('ok'),
  message: z.string(),
  productId: z.string().uuid(),
  amount: z.number(),
})

export const schemas = {
  params: zodToJsonSchema(idParam),
  create: zodToJsonSchema(createProductZ),
  update: zodToJsonSchema(updateProductZ),
  product: zodToJsonSchema(standardProductZ),
  list: { type: 'array' as const, items: zodToJsonSchema(standardProductZ) },
  productionOrder: zodToJsonSchema(createProductionOrderZ),
  productionOrderResponse: zodToJsonSchema(productionOrderResponseZ),
}
