import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'
import { createPosition } from '../position/position.service'
import { $Enums } from '../../../generated/prisma'
import {
  getInventoryCount,
  createProductionOrder,
} from '../../external/inventory.service'

type ProductCategory = $Enums.ProductCategory
type ShirtSize = $Enums.ShirtSize

export interface PositionInput {
  amount: number
  pos_number: number
  name: string
  productCategory: ProductCategory
  design: string
  color: string
  shirtSize: ShirtSize
  description?: string
  standardProductId?: string
}

export async function createOrder(customerId: string, positions: PositionInput[]) {
  try {
    console.log('📝 Starte Auftragserstellung für Customer:', customerId)

    const now = new Date()
    const year = now.getFullYear()

    const countThisYear = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
        },
      },
    })

    const orderNumber = `${year}${(countThisYear + 1).toString().padStart(4, '0')}`
    console.log('📦 Neue Ordernummer:', orderNumber)

    const order = await prisma.order.create({
      data: {
        id: randomUUID(),
        orderNumber,
        customer: { connect: { id: customerId } },
        deletedAt: null,
      },
    })

    const createdPositions = await Promise.all(
      positions.map((p) => {
        console.log(`📌 Position ${p.pos_number} mit Standardprodukt:`, p.standardProductId)
        return createPosition(
          order.id,
          p.amount,
          p.pos_number,
          p.name,
          p.productCategory,
          p.design,
          p.color,
          p.shirtSize,
          p.description,
          p.standardProductId,
        )
      }),
    )

    await Promise.all(
      createdPositions.map(async (pos) => {
        const currentStock = await getInventoryCount({
          color: pos.color,
          shirtSize: pos.shirtSize,
          design: pos.design,
        })

        const needed = pos.amount
        const toProduce = Math.max(0, needed - currentStock)
        console.log(`🧮 Position ${pos.id} braucht ${needed}, Lagerbestand: ${currentStock}, zu produzieren: ${toProduce}`)

        if (toProduce > 0) {
          console.log(`🏭 Produktionsauftrag für Position-ID ${pos.id}`)
          await createProductionOrder({
            productId: pos.id,
            amount: toProduce,
            color: pos.color,
            shirtSize: pos.shirtSize,
            design: pos.design,
          })

          if (pos.standardProductId) {
            console.log(`🔄 Update amountInProduction für StandardProduct ${pos.standardProductId}`)
            await prisma.standardProduct.update({
              where: { id: pos.standardProductId },
              data: {
                amountInProduction: {
                  increment: toProduce,
                },
              },
            })
          }
        }
      }),
    )

    console.log('✅ Auftrag erfolgreich erstellt:', order.id)

    return {
      id: order.id,
      customerId,
      orderNumber: order.orderNumber,
      positions: createdPositions,
    }
  } catch (err) {
    console.error('❌ Fehler in createOrder:', err)
    throw err
  }
}





export const getOrderById = (id: string) =>
  prisma.order.findUnique({ where: { id }, include: { positions: true } })

export const getOrdersByCustomer = (customerId: string) =>
  prisma.order.findMany({ where: { customerId }, include: { positions: true } })

export const getAllOrders = () =>
  prisma.order.findMany({ include: { positions: true } })
