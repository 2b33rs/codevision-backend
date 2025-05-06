import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'
import { $Enums } from '../../../generated/prisma'
import { updatePositionStatusByBusinessKey } from '../position/position.service'
import COMPLAINT_REASON = $Enums.COMPLAINT_REASON
import ComplaintKind = $Enums.ComplaintKind

export async function createComplaint(input: {
  positionId: string
  Reason: COMPLAINT_REASON
  ComplaintKind: ComplaintKind
}) {
  const complaint = await prisma.complaint.create({
    data: {
      id: randomUUID(),
      positionId: input.positionId,
      Reason: input.Reason,
      ComplaintKind: input.ComplaintKind,
    },
  })

  if (input.Reason !== 'OTHER') {
    const position = await prisma.position.findUnique({
      where: { id: input.positionId },
      include: { order: true },
    })

    if (!position) throw new Error('Position not found')

    const compositeId = `${position.order.orderNumber}.${position.pos_number}`
    await updatePositionStatusByBusinessKey(compositeId, 'OPEN')
  }

  return complaint
}
