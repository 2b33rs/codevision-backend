import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'
import { $Enums } from '../../../generated/prisma'
import { updatePositionStatusByBusinessKey } from '../position/position.service'

type ComplaintReason = $Enums.ComplaintReason
type ComplaintKind   = $Enums.ComplaintKind

export async function createComplaint(input: {
  positionId: string
  ComplaintReason: ComplaintReason
  ComplaintKind: ComplaintKind
  RestartProcess: boolean
}) {
  const complaint = await prisma.complaint.create({
    data: {
      id: randomUUID(),
      positionId: input.positionId,
      ComplaintReason: input.ComplaintReason,
      ComplaintKind: input.ComplaintKind,
      RestartProcess: input.RestartProcess,
    },
  })

  const position = await prisma.position.findUnique({
    where: { id: input.positionId },
    include: { order: true },
  })

  if (!position) throw new Error('Position not found')

  const compositeId = `${position.order.orderNumber}.${position.pos_number}`

  if (input.RestartProcess === true && input.ComplaintReason !== 'OTHER') {
    await updatePositionStatusByBusinessKey(compositeId, 'OPEN')
  }

  if (input.RestartProcess === false) {
    await updatePositionStatusByBusinessKey(compositeId, 'CANCELLED')
  }

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

export const getAllComplaints = () =>
  prisma.complaint.findMany()
