import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'
import { createPosition } from '../position/position.service'
import { $Enums } from '../../../generated/prisma'

type ProductCategory = $Enums.ProductCategory
type ShirtSize       = $Enums.ShirtSize

/* ---------- Eingabetyp ---------- */
export interface PositionInput {
  amount:          number
  pos_number:      number
  name:            string
  productCategory: ProductCategory
  design:          string
  color:           string
  shirtSize:       ShirtSize
  description?:    string
}

/* ---------- Order anlegen ---------- */
export async function createOrder(
  customerId: string,
  positions: PositionInput[],
) {
  // fortlaufende Nummer YY_N
  const yearPrefix = new Date().getFullYear().toString().slice(2) + '_'
  let sequence = 1
  let order: { id: string; orderNumber: string } | null = null

  while (!order) {
    try {
      order = await prisma.order.create({
        data: {
          id: randomUUID(),
          orderNumber: yearPrefix + sequence,
          customer: { connect: { id: customerId } },
          deletedAt: null,
        },
      })
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('orderNumber')) {
        sequence++
        continue
      }
      throw e
    }
  }

  const createdPositions = await Promise.all(
    positions.map((p) =>
      createPosition(
        order!.id,
        p.amount,
        p.pos_number,
        p.name,
        p.productCategory,
        p.design,
        p.color,
        p.shirtSize,
        p.description,
      ),
    ),
  )

  return { id: order!.id, orderNumber: order!.orderNumber, positions: createdPositions }
}

/* ---------- Abfragen ---------- */
export const getOrderById = (id: string) =>
  prisma.order.findUnique({ where: { id }, include: { positions: true } })

export const getOrdersByCustomer = (customerId: string) =>
  prisma.order.findMany({ where: { customerId }, include: { positions: true } })

export const getAllOrders = () =>
  prisma.order.findMany({ include: { positions: true } })
