import {
  PRODUCTION_ORDER_STATUS,
  ProductionOrder,
} from '../../../generated/prisma'
import { prisma } from '../../plugins/prisma'

export async function getProductionOrdersByPositionId(
  positionId: string,
): Promise<ProductionOrder[]> {
  return prisma.productionOrder.findMany({
    where: {
      positionId: positionId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
}

// todo: for kevin later
export async function updateProductionOrderStatus(
  id: string,
  status: PRODUCTION_ORDER_STATUS,
): Promise<ProductionOrder> {
  return prisma.productionOrder.update({
    where: { id },
    data: {
      Status: status,
      updatedAt: new Date(),
    },
  })
}
