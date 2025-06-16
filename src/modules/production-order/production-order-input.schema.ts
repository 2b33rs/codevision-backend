import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { $Enums } from '../../../generated/prisma'
import { productTemplateZ } from './production-order.schema'

// Variant 1: For existing positions
export const createProductionOrderForPositionZ = z.object({
  positionId: z.string().uuid(),
  amount: z.number().int().positive(),
  designUrl: z.string(),
  orderType: z.string(),
  dyeingNecessary: z.boolean(),
  materialId: z.number(),
  productTemplate: productTemplateZ,
  Status: z.nativeEnum($Enums.PRODUCTION_ORDER_STATUS).optional(),
})

// Variant 2: For new products
export const createProductionOrderForProductZ = z.object({
  productId: z.string().uuid(),
  amount: z.number().int().positive(),
})

// Union type that accepts either variant
export const createProductionOrderInputZ = z.union([
  createProductionOrderForPositionZ,
  createProductionOrderForProductZ,
])

// Type for the response
export const productionOrderInputResponseZ = z.object({
  status: z.literal('ok'),
  message: z.string(),
  productionOrder: z.object({
    id: z.string().uuid(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable().optional(),
    positionId: z.string().uuid().optional(),
    amount: z.number().int().positive(),
    designUrl: z.string(),
    orderType: z.string(),
    dyeingNecessary: z.boolean(),
    materialId: z.number(),
    productTemplate: productTemplateZ,
    Status: z.nativeEnum($Enums.PRODUCTION_ORDER_STATUS),
    productionorder_number: z.number().int().positive(),
  }),
  orderId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  orderNumber: z.string().optional(),
})

export const schemas = {
  createForPosition: zodToJsonSchema(createProductionOrderForPositionZ),
  createForProduct: zodToJsonSchema(createProductionOrderForProductZ),
  response: zodToJsonSchema(productionOrderInputResponseZ),
}

// TypeScript type definitions that match the Zod schemas
export type CreateProductionOrderForPosition = z.infer<typeof createProductionOrderForPositionZ>
export type CreateProductionOrderForProduct = z.infer<typeof createProductionOrderForProductZ>
export type CreateProductionOrderInput = z.infer<typeof createProductionOrderInputZ>
export type ProductionOrderInputResponse = z.infer<typeof productionOrderInputResponseZ>
