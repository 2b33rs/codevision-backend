import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { $Enums } from '../../../generated/prisma'

export const createProductionOrderZ = z.object({
  positionId: z.string().uuid(),
  amount: z.number().int().positive(),
  designUrl: z.string(),
  orderType: z.string(),
  dyeingNecessary: z.boolean(),
  materialId: z.number(),
  productTemplate: z.any(),
  Status: z.nativeEnum($Enums.PRODUCTION_ORDER_STATUS).optional(),
  deletedAt: z.string().datetime().nullable().optional(),
})