import { prisma } from '../../plugins/prisma'
import { $Enums } from '../../../generated/prisma'
import POSITION_STATUS = $Enums.POSITION_STATUS

export const getOrderById = (id: string) =>
  prisma.order.findUnique({
    where: { id },
    include: { 
      positions: { 
        include: { 
          productionOrders: true 
        } 
      }, 
      customer: true 
    },
  })

export const getOrdersByCustomer = (customerId: string) =>
  prisma.order.findMany({
    where: { customerId },
    include: { 
      positions: { 
        include: { 
          productionOrders: true 
        } 
      }, 
      customer: true 
    },
  })

export const getAllOrders = async () => {
  try {
    return await prisma.order.findMany({
      include: { 
        positions: { 
          include: { 
            productionOrders: true 
          } 
        }, 
        customer: true 
      },
    })
  } catch (err) {
    console.error('❌ Fehler beim Laden der Orders:', err)
    throw err
  }
}

export async function getOrdersWithPositionStatus(status: POSITION_STATUS) {
  try {
    return await prisma.order.findMany({
      where: {
        positions: {
          some: {
            Status: status,
          },
        },
      },
      include: {
        positions: { include: { productionOrders: true } },
        customer: true,
      },
    })
  } catch (err) {
    console.error('❌ Fehler in getOrdersWithPositionStatus:', err)
    throw err
  }
}