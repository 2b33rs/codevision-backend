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

// ✅ erweitert: alle relevanten Felder für einen Produktionsauftrag
export const createProductionOrderZ = z.object({
  positionId: z.string().uuid().optional(), // ✅ optional, da aus URL gezogen
  amount: z.number().int().positive(),
  designUrl: z.string().url().optional(),
  orderType: z.string().optional(),
  dyeingNecessary: z.boolean().optional(),
  materialId: z.number().int(),
  productTemplate: z.object({
    kategorie: z.string(),
    groesse: z.string(),
    typ: z.string(),
    farbcode: z.object({
      cyan: z.number().min(0).max(100),
      magenta: z.number().min(0).max(100),
      yellow: z.number().min(0).max(100),
      black: z.number().min(0).max(100),
    }),
  }),
})

export const productionOrderResponseZ = z.object({
  status: z.literal('ok'),
  message: z.string(),
  productionOrder: z.any(), // optional: z.object(...) für exakte Struktur
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
