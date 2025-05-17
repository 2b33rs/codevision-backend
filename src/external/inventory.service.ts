import { ShirtSize } from '../../generated/prisma'
import { z } from 'zod'
import { prisma } from '../plugins/prisma'

export type InventoryCheckInput = {
  color: string | null
  shirtSize: ShirtSize | null
  design?: string
}

export async function getInventoryCount({
  color,
  shirtSize,
  design,
}: InventoryCheckInput): Promise<number> {
  // TODO: später MaWi HTTP-Call hier einbauen
  console.log(`Mock inventory check for color=${color}, size=${shirtSize}`)
  return Math.floor(Math.random() * 101)
}

export const createProductionOrderZ = z.object({
  positionId: z.string().uuid(),
  amount: z.number().int().positive(),
  color: z.string().nullable(),
  shirtSize: z.enum(['S', 'M', 'L', 'XL']).nullable(),
  design: z.string().optional(),
})

export type CreateProductionOrderInput = z.infer<typeof createProductionOrderZ>

export async function createProductionOrder(input: unknown) {
  const parsed = createProductionOrderZ.parse(input)

  console.log(
    `[MOCK] ProductionOrder: Produkt=${parsed.positionId}, Menge=${parsed.amount}, Farbe=${parsed.color}, Größe=${parsed.shirtSize}, Design=${parsed.design}`
  )

  // === Neue Logik: amountInProduction hochzählen ===
  await prisma.standardProduct.update({
    where: { id: parsed.positionId },
    data: {
      amountInProduction: {
        increment: parsed.amount,
      },
    },
  })

  return {
    status: 'ok' as const,
    message: `Produktionsauftrag über ${parsed.amount} Stück ausgelöst`,
    ...parsed,
  }
}
