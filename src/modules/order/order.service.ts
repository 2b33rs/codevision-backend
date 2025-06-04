import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'
import { createPosition } from '../position/position.service'
import { $Enums, Order, Position } from '../../../generated/prisma'
import {
  createProductionOrder,
  getInventoryCount,
} from '../../external/inventory.service'
import POSITION_STATUS = $Enums.POSITION_STATUS

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

export async function createOrder(
  customerId: string,
  positions: PositionInput[],
) {
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

    // Für jede Position ermitteln wir den nächsten pos_number dynamisch
    const createdPositions = await Promise.all(
      positions.map(async (p, index) => {
        // Anzahl schon vorhandener Positionen für diese Order ermitteln
        const existingPosCount = await prisma.position.count({
          where: { orderId: order.id },
        })
        const nextPosNumber = existingPosCount + 1

        console.log(`📌 Neue Position #${nextPosNumber} für Order: ${order.orderNumber}`)

        // createPosition aufrufen und den berechneten nextPosNumber übergeben
        return createPosition(
          order.id,
          p.amount,
          nextPosNumber,
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
        // 1. Prüfe Bestand für Farbe + Design
        const stockWithDesign = await getInventoryCount({
          color: pos.color,
          shirtSize: pos.shirtSize,
          design: pos.design,
          category: pos.productCategory,
          typ: 'V-Ausschnitt',
        })

        let remaining = pos.amount - stockWithDesign.anzahl

        if (remaining <= 0) {
          // Alles ist schon fertig auf Lager, keine Produktion nötig -> Hier MaWi Reservierung einbringen
          return
        }

        // 2. Prüfe Bestand für Farbe (ohne Design)
        const stockWithoutDesign = await getInventoryCount({
          color: pos.color,
          shirtSize: pos.shirtSize,
          category: pos.productCategory,
          typ: 'V-Ausschnitt',
        })

        // Verfügbare "nur gefärbte" T-Shirts, die noch bedruckt werden können
        const availableForPrint = Math.max(0, stockWithoutDesign.anzahl)

        // 3. Produktionsaufträge auslösen

        // a) Bedrucken: Falls "nur gefärbte" Shirts vorhanden sind, aber noch nicht bedruckt/ Was ist hier richtig? Spaltenbenennung wie Prod oder wie bei uns im Modell?
        if (availableForPrint > 0) {
          const toPrint = Math.min(remaining, availableForPrint)
          await createProductionOrder({
            positionId: pos.id,
            amount:     toPrint,
            designUrl:  pos.design,
            orderType:  'BEDRUCKEN',
            dyeingNecessary: false,
            productTemplate: {
              kategorie:     pos.productCategory,
              artikelnummer: stockWithoutDesign.material_ID ?? '',
              groesse:       pos.shirtSize,
              farbcode:      parseCmykString(pos.color) ?? {}, // <-- hier Objekt statt String
              typ:           'V-Ausschnitt',
            },
            Status: 'ORDER_RECEIVED',
          })
          remaining -= toPrint
        }

        // b) Färben + Bedrucken: Falls immer noch Bedarf besteht
        if (remaining > 0) {
          // Weißes, unbedrucktes Shirt abfragen
          const stockWhite = await getInventoryCount({
            color: 'cmyk(0%,0%,0%,0%)', // Weiß
            shirtSize: pos.shirtSize,
            category: pos.productCategory,
            typ: 'V-Ausschnitt',
          })

          await createProductionOrder({
            positionId: pos.id,
            amount:     remaining,
            designUrl:  pos.design,
            orderType:  'FAERBEN_UND_BEDRUCKEN',
            dyeingNecessary: true,
            productTemplate: {
              kategorie:     pos.productCategory,
              artikelnummer: stockWhite.material_ID ?? '', // jetzt die weiße Rohware!
              groesse:       pos.shirtSize,
              farbcode:      parseCmykString(pos.color) ?? {},
              typ:           'V-Ausschnitt',
            },
            Status: 'ORDER_RECEIVED',
          })
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
  prisma.order.findUnique({
    where: { id },
    include: {
      positions: {
        include: {
          productionOrders: true,
        },
      },
    },
  })

export const getOrdersByCustomer = (customerId: string) =>
  prisma.order.findMany({
    where: { customerId },
    include: {
      positions: {
        include: {
          productionOrders: true,
        },
      },
    },
  })

export const getAllOrders = async () => {
  try {
    let newVar = await prisma.order.findMany({
      include: {
        positions: {
          include: {
            productionOrders: true,
          },
        },
      },
    })
    return newVar
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
        positions: {
          include: {
            productionOrders: true,
          },
        },
      },
    })
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Orders mit Position-Status:', err)
    throw err
  }
}

export function parseCmykString(color: string | null) {
  if (!color) return null

  const cmyk = color
    .replace('cmyk(', '')
    .replace(')', '')
    .split(',')
    .map((value) => parseFloat(value.trim()))

  if (cmyk.length !== 4) return null

  const [cyan, magenta, yellow, black] = cmyk

  return { cyan, magenta, yellow, black }
}
