import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'
import { createPosition } from '../position/position.service'
import { $Enums } from '../../../generated/prisma'
import { getInventoryCount, createProductionOrder } from '../../external/inventory.service'

type ProductCategory = $Enums.ProductCategory
type ShirtSize      = $Enums.ShirtSize

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

export async function createOrder(
  customerId: string,
  positions: PositionInput[],
) {
  // 1. Jahr holen
  const now = new Date()
  const year = now.getFullYear()
  // 2. Orders für dieses Jahr zählen
  const countThisYear = await prisma.order.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
      },
    },
  })
  // 3. Ordernummer bauen
  const orderNumber = `${year}${(countThisYear + 1).toString().padStart(4, '0')}` // z.B. 20240001

  // 4. Order speichern
  const order = await prisma.order.create({
    data: {
      id: randomUUID(),
      orderNumber,
      customer: { connect: { id: customerId } },
      deletedAt: null,
    },
  })

  // Positionen anlegen
  const createdPositions = await Promise.all(
    positions.map((p) =>
      createPosition(
        order.id,
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

  // Inventory-Abgleich und Produktionsauftrag pro Position
  await Promise.all(
    createdPositions.map(async (pos) => {
      const currentStock = await getInventoryCount({
        color: pos.color,
        shirtSize: pos.shirtSize,
        design: pos.design,
      })

      const needed = pos.amount
      const toProduce = Math.max(0, needed - currentStock)

      if (toProduce > 0) {
        await createProductionOrder({
          productId: pos.id,
          amount: toProduce,
          color: pos.color,
          shirtSize: pos.shirtSize,
          design: pos.design,
        })
      }
    })
  )

  return { id: order.id, orderNumber: order.orderNumber, positions: createdPositions }
}

export const getOrderById = (id: string) =>
  prisma.order.findUnique({ where: { id }, include: { positions: true } })

export const getOrdersByCustomer = (customerId: string) =>
  prisma.order.findMany({ where: { customerId }, include: { positions: true } })

export const getAllOrders = () =>
  prisma.order.findMany({ include: { positions: true } })
