import { z } from 'zod'

export const getInventoryCountZ = z.object({
  color: z.string().nullable(),
  shirtSize: z.string().nullable(),
  design: z.string().nullable().optional(),
  category: z.string().default('T-Shirt').optional(),
  typ: z.string().default('V-Ausschnitt').optional(),
})

export const productionTemplateZ = z.object({
  kategorie: z.string(),
  artikelnummer: z.string(),
  groesse: z.string(),
  farbcode: z.record(z.number()),
  typ: z.string(),
})

export type ProductionTemplate = z.infer<typeof productionTemplateZ>

export const productionApiPayloadZ = z.object({
  productionOrderId: z.string(),
  anzahlTShirts: z.number(),
  motivUrl: z.string(),
  auftragstyp: z.string(),
  faerbereiErforderlich: z.boolean(),
  artikelTemplate: productionTemplateZ,
})

export type ProductionApiPayload = z.infer<typeof productionApiPayloadZ>
