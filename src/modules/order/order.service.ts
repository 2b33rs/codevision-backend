import { prisma } from '../../plugins/prisma'

export const getAllOrders = () => prisma.order.findMany()