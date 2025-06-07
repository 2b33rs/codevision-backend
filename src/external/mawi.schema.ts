import { z } from 'zod'

export const getInventoryCountZ = z.object({
  category: z.string(),
  design: z.string().nullable().optional(),
  shirtSize: z.string().optional(),
  color: z.string().nullable().optional(),
  typ: z.string().optional(),
})

export type GetInventoryCountInput = z.infer<typeof getInventoryCountZ>

export type GetInventoryCountResponse = {
  material_ID: number | null
  category: string
  url?: string
  groesse: string
  farbe: {
    cyan: number
    magenta: number
    yellow: number
    black: number
  }
  typ: string
  anzahl: number
}
