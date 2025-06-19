import { prisma } from '../../plugins/prisma'
import { $Enums } from '../../../generated/prisma'
import { updatePositionStatusByBusinessKey } from '../position/position.service'
import { createOrderForComplaint } from '../order/order.service'
import { getProductionOrdersByPositionId } from '../production-order/production-order.service'
import { deleteProductionOrder } from '../../external/production.service'

type ComplaintReason = $Enums.ComplaintReason
type ComplaintKind = $Enums.ComplaintKind

export async function createComplaint(input: {
  positionId: string
  ComplaintReason: ComplaintReason
  ComplaintKind: ComplaintKind
  createNewOrder: boolean
}) {
  // Position aus der Datenbank abrufen
  const position = await prisma.position.findUnique({
    where: { id: input.positionId },
    include: { order: true, productionOrders: true },
  })

  if (!position) throw new Error('Position not found')

  const compositeId = `${position.order.orderNumber}.${position.pos_number}`
  let newOrderId: string | undefined = undefined

  // === Neue Order erzeugen, wenn Flag aktiv ===
  if (input.createNewOrder) {
    // Verwende die createOrderForComplaint Funktion statt direkter DB-Erstellung
    const newOrderResult = await createOrderForComplaint(
      position.order.customerId,
      {
        name: position.name,
        amount: position.amount,
        price: position.price.toString(),
        productCategory: position.productCategory,
        design: position.design,
        color: position.color || '',
        shirtSize: position.shirtSize || '',
        description: position.description || undefined,
        standardProductId: position.standardProductId || undefined,
        typ: position.typ,
      },
    )

    newOrderId = newOrderResult.id
  }

  await updatePositionStatusByBusinessKey(compositeId, 'CANCELLED')

  // Get all production orders for this position and delete them
  const productionOrders = position.productionOrders
  for (const productionOrder of productionOrders) {
    const orderIdPositionsId = `${position.order.orderNumber}.${position.pos_number}.${productionOrder.productionorder_number}`
    await deleteProductionOrder(orderIdPositionsId)
  }

  //

  // === Beschwerde mit optionaler Verknüpfung zur neuen Order erstellen ===
  return prisma.complaint.create({
    data: {
      positionId: input.positionId,
      ComplaintReason: input.ComplaintReason,
      ComplaintKind: input.ComplaintKind,
      createNewOrder: input.createNewOrder,
      newOrderId,
    },
    include: {
      position: {
        include: {
          order: {
            include: {
              customer: true,
            },
          },
        },
      },
    },
  })
}
