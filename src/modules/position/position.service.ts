import { $Enums } from '../../../generated/prisma'
import POSITION_STATUS = $Enums.POSITION_STATUS
import { prisma } from '../../plugins/prisma'

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

  return prisma.position.update({
    where: { id: position.id },
    data: { Status: status },
  })
}
