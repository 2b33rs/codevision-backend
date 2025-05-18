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

    if (input.ComplaintReason !== 'OTHER') {
      await updatePositionStatusByBusinessKey(compositeId, 'IN_PROGRESS')
    }
  } else {
    // Wenn keine neue Order gewünscht: Storno
    await updatePositionStatusByBusinessKey(compositeId, 'CANCELLED')
  }

  // === Complaint mit optionaler Verknüpfung zur neuen Order ===
  const complaint = await prisma.complaint.create({
    data: {
      positionId: input.positionId,
      ComplaintReason: input.ComplaintReason,
      ComplaintKind: input.ComplaintKind,
      createNewOrder: input.createNewOrder,
      newOrderId,
    },
  })

  return complaint
}

export const getComplaintsByPosition = (positionId: string) =>
  prisma.complaint.findMany({ where: { positionId } })

export const getComplaintsByOrder = (orderId: string) =>
  prisma.complaint.findMany({
    where: { position: { orderId } },
  })

export const getComplaintsByCustomer = (customerId: string) =>
  prisma.complaint.findMany({
    where: { position: { order: { customerId } } },
  })

export const getAllComplaints = () => prisma.complaint.findMany()
