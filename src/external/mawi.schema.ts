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

export const requestFinishedGoodsZ = z.object({
  material_ID: z.number(),
  anzahl: z.number(),
  bestellposition: z.string(),
})

export type RequestFinishedGoodsInput = z.infer<typeof requestFinishedGoodsZ>

export type RequestFinishedGoodsResponse = {
  status: string
}

export type InventoryStock = {
  anzahl: number
  material_ID?: number | null
}
