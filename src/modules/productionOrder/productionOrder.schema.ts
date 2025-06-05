import { z } from 'zod'
import { $Enums } from '../../../generated/prisma'
import { zodToJsonSchema } from 'zod-to-json-schema'

export const createProductionOrderZ = z.object({
  positionId: z.string(),
  amount: z.number().min(1),
  designUrl: z.string().url(),
  orderType: z.string(),
  dyeingNecessary: z.boolean(),
  productTemplate: z.object({
    kategorie: z.string(),
    artikelnummer: z.number(),
    groesse: z.string(),
    farbcode: z.record(z.string(), z.number()),
    typ: z.string(),
  }),
  Status: z.nativeEnum($Enums.PRODUCTION_ORDER_STATUS).optional(),
})

export type CreateProductionOrderType = z.infer<typeof createProductionOrderZ>
export const createProductionOrderSchema = {
  ...zodToJsonSchema(createProductionOrderZ),
}
