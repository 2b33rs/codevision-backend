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
  orderType: string = 'STANDARD',
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
    await triggerPrintProduction(pos, toPrint, stockWithDesign.material_ID, orderType)
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
      orderType
    )
  }
}

export async function triggerPrintProduction(
  pos: Position,
  amount: number,
  materialId: number | null,
  orderType: string = 'STANDARD',
) {
  if (amount <= 0) return

  console.log(`🖨️ Produktionsauftrag BEDRUCKEN: Menge=${amount}`)
  // Ensure materialId is a number (default to 0 if null)
  const materialIdNumber = materialId ?? 0
  await createProductionOrder({
    positionId: pos.id,
    amount,
    designUrl: pos.design,
    orderType,
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
  orderType: string = 'STANDARD',
) {
  console.log(`🎨 Produktionsauftrag FAERBEN_UND_BEDRUCKEN: Menge=${amount}`)
  // Ensure materialId is a number (default to 0 if null)
  const materialIdNumber = materialId ?? 0
  await createProductionOrder({
    positionId: pos.id,
    amount,
    designUrl: pos.design,
    orderType,
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
