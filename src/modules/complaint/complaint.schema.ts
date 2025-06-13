import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { $Enums } from '../../../generated/prisma'

export const ComplaintReasonEnum = Object.values($Enums.ComplaintReason) as [
  $Enums.ComplaintReason,
  ...$Enums.ComplaintReason[],
]
export const ComplaintKindEnum = Object.values($Enums.ComplaintKind) as [
  $Enums.ComplaintKind,
  ...$Enums.ComplaintKind[],
]

export const complaintPostZ = z.object({
  positionId: z.string().uuid(),
  ComplaintReason: z.enum(ComplaintReasonEnum),
  ComplaintKind: z.enum(ComplaintKindEnum),
  createNewOrder: z.boolean(),
})

export const complaintQueryZ = z.object({
  positionId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
})

export const complaintSchemas = {
  bodyPost: zodToJsonSchema(complaintPostZ),
  queryGet: zodToJsonSchema(complaintQueryZ),
}
