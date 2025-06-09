import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { $Enums } from '../../../generated/prisma'

export const productTemplateZ = z.object({
  kategorie: z.string(),
  groesse: z.string(),
  typ: z.string(),
  farbcode: z.object({
    cyan: z.number(),
    magenta: z.number(),
    yellow: z.number(),
    black: z.number(),
  }),
  // artikelnummer ist optional im Request, wird aber im Service gesetzt
  artikelnummer: z.number().optional(),
})

export const createProductionOrderZ = z.object({
  positionId: z.string().uuid().optional(),
  amount: z.number().int().positive(),
  designUrl: z.string(),
  orderType: z.string(),
  dyeingNecessary: z.boolean(),
  materialId: z.number(), // <-- Pflichtfeld!
  productTemplate: productTemplateZ,
  Status: z.nativeEnum($Enums.PRODUCTION_ORDER_STATUS).optional(),
  deletedAt: z.string().datetime().nullable().optional(),
})


export const productionOrderResponseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
  positionId: z.string().uuid(),
  amount: z.number().int().positive(),
  designUrl: z.string(),
  orderType: z.string(),
  dyeingNecessary: z.boolean(),
  materialId: z.number(),
  productTemplate: productTemplateZ,
  Status: z.nativeEnum($Enums.PRODUCTION_ORDER_STATUS),
  productionorder_number: z.number().int().positive(),
})

export const productionOrderApiResponseSchema = z.object({
  status: z.literal('ok'),
  message: z.string(),
  productionOrder: productionOrderResponseSchema,
})

export const schemas = {
  create: zodToJsonSchema(createProductionOrderZ),
  response: zodToJsonSchema(productionOrderApiResponseSchema),
}