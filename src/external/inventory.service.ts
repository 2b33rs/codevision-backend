import { ShirtSize } from '../../generated/prisma'

type InventoryCheckInput = {
  color: string | null
  shirtSize: ShirtSize | null
  design?: string
}

/**
 * Simuliert einen Lagerbestandsabruf.
 * Später soll hier ein API-Call zu einem echten System erfolgen.
 */
export async function getInventoryCount({
  color,
  shirtSize,
  design,
}: InventoryCheckInput): Promise<number> {
  // TODO: später MaWi HTTP-Call hier einbauen
  console.log(`Mock inventory check for color=${color}, size=${shirtSize}`)

  return Math.floor(Math.random() * 101)
}
