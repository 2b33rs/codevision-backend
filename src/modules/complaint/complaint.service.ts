import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'
import { $Enums } from '../../../generated/prisma'
import { updatePositionStatusByBusinessKey } from '../position/position.service'

type ComplaintReason = $Enums.ComplaintReason
type ComplaintKind = $Enums.ComplaintKind

export async function createComplaint(input: {
  positionId: string
  ComplaintReason: ComplaintReason
  ComplaintKind: ComplaintKind
  createNewOrder: boolean
}) {
  // Position aus der Datenbank abrufen
  const position = await prisma.position.findUnique({
    where: { id: input.positionId },
    include: { order: true },
  })

  if (!position) throw new Error('Position not found')

  const compositeId = `${position.order.orderNumber}.${position.pos_number}`
  let newOrderId: string | undefined = undefined

  // === Neue Order erzeugen, wenn Flag aktiv ===
  if (input.createNewOrder) {
    const newOrder = await prisma.order.create({
      data: {
        customerId: position.order.customerId!,
        positions: {
          create: [
            {
              pos_number: 1,
              name: position.name,
              amount: position.amount,
              productCategory: position.productCategory,
              design: position.design,
              color: position.color,
              shirtSize: position.shirtSize,
              description: position.description,
              standardProductId: position.standardProductId,
            },
          ],
        },
      },
    })

    newOrderId = newOrder.id

    // Status der Position aktualisieren, wenn der Beschwerdegrund nicht 'OTHER' ist
    if (input.ComplaintReason !== 'OTHER') {
      await updatePositionStatusByBusinessKey(compositeId, 'IN_PROGRESS')
    }
  } else {
    // Wenn keine neue Order gewünscht: Storno der Position
    await updatePositionStatusByBusinessKey(compositeId, 'CANCELLED')
  }

  // === Beschwerde mit optionaler Verknüpfung zur neuen Order erstellen ===
  const complaint = await prisma.complaint.create({
    data: {
      positionId: input.positionId,
      ComplaintReason: input.ComplaintReason,
      ComplaintKind: input.ComplaintKind,
      createNewOrder: input.createNewOrder,
      newOrderId,
    },
    include: {
      position: {
        include: {
          order: {
            include: {
              customer: true,
            },
          },
        },
      },
    },
  })

  return complaint
}
