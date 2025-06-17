import { prisma } from '../../plugins/prisma'
import { Order, Position } from '../../../generated/prisma'
import {
  getInventoryCount,
  requestFinishedGoods,
} from '../../external/mawi.service'
import { parseCMYKForMawi } from '../../utils/color.util'
import { createProductionOrder } from '../production-order/production-order.service'
import { InventoryStock } from '../../external/mawi.schema'

export async function handlePositionInventoryAndProduction(
  order: Order,
  pos: Position,
) {
  const isStandardMaterial = pos.standardProductId != null

  const stockWithDesign = await getInventoryCount(
    {
      color: pos.color,
      shirtSize: pos.shirtSize ?? undefined,
      design: pos.design,
      category: pos.productCategory,
      typ: pos.typ?.[0],
    },
    isStandardMaterial,
  )

  let remaining = pos.amount - stockWithDesign.anzahl
/* Erstmal Reservierung weglassen
  if (stockWithDesign.anzahl > 0) {
    await reserveFromStockWithDesign(order, pos, stockWithDesign, remaining)
  }
*/
  const stockWithoutDesign = await getInventoryCount(
    {
      color: pos.color,
      shirtSize: pos.shirtSize ?? undefined,
      category: pos.productCategory,
      typ: pos.typ?.[0],
    },
    isStandardMaterial,
  )

  const availableForPrint = Math.max(0, stockWithoutDesign.anzahl)
  if (availableForPrint > 0) {
    const toPrint = Math.min(remaining, availableForPrint)
    await triggerPrintProduction(pos, toPrint, stockWithDesign.material_ID)
    remaining -= toPrint
  }

  if (remaining > 0) {
    const stockWhite = await getInventoryCount(
      {
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: pos.shirtSize ?? undefined,
        category: pos.productCategory,
        typ: pos.typ?.[0],
      },
      isStandardMaterial,
    )
    await triggerDyeAndPrintProduction(
      pos,
      remaining,
      stockWithDesign.material_ID,
    )
  }
}

export async function reserveFromStockWithDesign(
  order: Order,
  pos: Position,
  stock: InventoryStock,
  remaining: number,
) {
  const toReserve = Math.min(stock.anzahl, pos.amount)
  const businessKey = `${order.orderNumber}.${pos.pos_number}`

  if (stock.material_ID) {
    console.log(`🛒 Reserviere fertige Ware:`, {
      material_ID: stock.material_ID,
      toReserve,
      businessKey,
    })
    await requestFinishedGoods(stock.material_ID, toReserve, businessKey)
  } else {
    console.warn(
      `⚠️ Kein material_ID für Position ${pos.pos_number} (${order.orderNumber})`,
    )
  }
}

export async function triggerPrintProduction(
  pos: Position,
  amount: number,
  materialId: number | null,
) {
  if (amount <= 0) return

  console.log(`🖨️ Produktionsauftrag BEDRUCKEN: Menge=${amount}`)
  // Ensure materialId is a number (default to 0 if null)
  const materialIdNumber = materialId ?? 0
  await createProductionOrder({
    positionId: pos.id,
    amount,
    designUrl: pos.design,
    orderType: 'STANDARD',
    dyeingNecessary: false,
    materialId: materialIdNumber,
    productTemplate: {
      kategorie: pos.productCategory,
      artikelnummer: materialIdNumber, // Use number instead of string
      groesse: pos.shirtSize ?? '', // Ensure it's not null
      farbcode: parseCMYKForMawi(pos.color) ?? {
        cyan: 0,
        magenta: 0,
        yellow: 0,
        black: 0,
      },
      typ: pos.typ?.[0],
    },
    Status: 'ORDER_RECEIVED',
  })

  if (pos.standardProductId) {
    await prisma.standardProduct.update({
      where: { id: pos.standardProductId },
      data: { amountInProduction: { increment: amount } },
    })
  }
}

export async function triggerDyeAndPrintProduction(
  pos: Position,
  amount: number,
  materialId: number | null,
) {
  console.log(`🎨 Produktionsauftrag FAERBEN_UND_BEDRUCKEN: Menge=${amount}`)
  // Ensure materialId is a number (default to 0 if null)
  const materialIdNumber = materialId ?? 0
  await createProductionOrder({
    positionId: pos.id,
    amount,
    designUrl: pos.design,
    orderType: 'STANDARD',
    dyeingNecessary: true,
    materialId: materialIdNumber,
    productTemplate: {
      kategorie: pos.productCategory,
      artikelnummer: materialIdNumber, // Use number instead of string
      groesse: pos.shirtSize ?? '', // Ensure it's not null
      farbcode: parseCMYKForMawi(pos.color) ?? {
        cyan: 0,
        magenta: 0,
        yellow: 0,
        black: 0,
      },
      typ: pos.typ?.[0],
    },
    Status: 'ORDER_RECEIVED',
  })

  if (pos.standardProductId) {
    await prisma.standardProduct.update({
      where: { id: pos.standardProductId },
      data: { amountInProduction: { increment: amount } },
    })
  }
}
