import { $Enums } from '../../../generated/prisma'
import { prisma } from '../../plugins/prisma'
import POSITION_STATUS = $Enums.POSITION_STATUS
import ShirtSize = $Enums.ShirtSize

/**
 * Aktualisiert den Status einer Position über den zusammengesetzten Geschäftsschlüssel.
 */
export async function updatePositionStatusByBusinessKey(
  compositeId: string,
  status: POSITION_STATUS,
) {
  const [orderNumber, posNumberStr] = compositeId.split('.')
  const pos_number = parseInt(posNumberStr, 10)

  const position = await prisma.position.findFirst({
    where: {
      order: { orderNumber },
      pos_number,
    },
    include: { order: true },
  })

  if (!position) throw new Error('Position not found')

  // === Neue Logik: amountInProduction runterzählen, wenn Status = PRODUCTION_COMPLETED ===
  if (status === POSITION_STATUS.COMPLETED && position.standardProductId) {
    await prisma.standardProduct.update({
      where: { id: position.standardProductId },
      data: {
        amountInProduction: {
          decrement: position.amount,
        },
      },
    })
  }

  return prisma.position.update({
    where: { id: position.id },
    data: { Status: status },
  })
}

/**
 * Legt eine neue Position an.
 */
export async function createPosition(
  orderId: string,
  amount: number,
  pos_number: number,
  name: string,
  productCategory: string, // ✅ Parameter umbenennen
  design: string,
  color: string,
  shirtSize: ShirtSize,
  description?: string,
  standardProductId?: string,
) {
  return prisma.position.create({
    data: {
      order: { connect: { id: orderId } },
      pos_number,
      description,
      amount,
      name,
      productCategory, // ✅ Feldname korrigiert
      design,
      color,
      shirtSize,
      Status: POSITION_STATUS.IN_PROGRESS,
      standardProductId,
    },
  })
}
