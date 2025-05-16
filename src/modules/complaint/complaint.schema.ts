import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

// Enum-Werte direkt verwenden
export const ComplaintReasonEnum = [
  'WRONG_SIZE', 'WRONG_COLOR', 'PRINT_INCORRECT', 'PRINT_OFF_CENTER',
  'DAMAGED_ITEM', 'STAINED', 'LATE_DELIVERY', 'WRONG_PRODUCT',
  'MISSING_ITEM', 'BAD_QUALITY', 'NOT_AS_DESCRIBED', 'OTHER',
] as const

export const ComplaintKindEnum = ['INTERN', 'EXTERN'] as const

export const complaintPostZ = z.object({
  positionId: z.string().uuid(),
  ComplaintReason: z.enum(ComplaintReasonEnum),
  ComplaintKind: z.enum(ComplaintKindEnum),
  RestartProcess: z.boolean(),
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
