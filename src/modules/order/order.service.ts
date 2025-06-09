import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'
import { createPosition } from '../position/position.service'
import { $Enums } from '../../../generated/prisma'
import {
  getInventoryCount,
  requestFinishedGoods,
} from '../../external/mawi.service'
import { createProductionOrder } from '../production-order/production-order.service'
import POSITION_STATUS = $Enums.POSITION_STATUS
import { parseCMYKForMawi } from '../../utils/color.util'

type ShirtSize = $Enums.ShirtSize

export interface PositionInput {
  amount: number
  price: string
  pos_number: number
  name: string
  productCategory: string
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

    const createdPositions = await Promise.all(
      positions.map((p) => {
        console.log(
          `📌 Position ${p.pos_number} mit Standardprodukt:`,
          p.standardProductId,
        )
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
    console.log('🆕 Erstellt Order:', order)
    console.log('🆕 Erstellt Positionen:', createdPositions)

    await Promise.all(
      createdPositions.map(async (pos) => {
        // 1. Prüfe Bestand für Farbe + Design (fertig bedruckt & gefärbt)
        const stockWithDesign = await getInventoryCount({
          color: pos.color,
          shirtSize: pos.shirtSize ?? undefined,
          design: pos.design,
          category: pos.productCategory,
          typ: 'V-Ausschnitt',
        })
        console.log(`📦 Bestand mit Design für Position ${pos.pos_number}:`, stockWithDesign)

        let remaining = pos.amount - stockWithDesign.anzahl

        // NEU: Wenn Bestand mit Design vorhanden, dann requestFinishedGoods aufrufen
        if (stockWithDesign.anzahl > 0) {
          const anzahlZuReservieren =
            stockWithDesign.anzahl >= pos.amount ? pos.amount : stockWithDesign.anzahl
          const businessKey = `${order.orderNumber}.${pos.pos_number}`
          if (stockWithDesign.material_ID !== null && stockWithDesign.material_ID !== undefined) {
            console.log(
              `🛒 Reserviere fertige Ware (requestFinishedGoods): material_ID=${stockWithDesign.material_ID}, anzahl=${anzahlZuReservieren}, businessKey=${businessKey}`,
            )
            await requestFinishedGoods(
              stockWithDesign.material_ID,
              anzahlZuReservieren,
              businessKey,
            )
          } else {
            console.warn(
              `⚠️ Kein material_ID für Bestand mit Design bei Position ${pos.pos_number}, Bestellung ${order.orderNumber}`,
            )
            // Optional: throw new Error('material_ID is null for stockWithDesign');
          }
        }

        // 2. Prüfe Bestand für Farbe (nur gefärbt, noch nicht bedruckt)
        const stockWithoutDesign = await getInventoryCount({
          color: pos.color,
          shirtSize: pos.shirtSize ?? undefined,
          category: pos.productCategory,
          typ: 'V-Ausschnitt',
        })
        console.log(`📦 Bestand ohne Design für Position ${pos.pos_number}:`, stockWithoutDesign)

        const availableForPrint = Math.max(0, stockWithoutDesign.anzahl)

        // 3. Produktionsaufträge auslösen

        // a) Bedrucken: Falls "nur gefärbte" Shirts vorhanden sind
        if (availableForPrint > 0) {
          const toPrint = Math.min(remaining, availableForPrint)
          console.log(
            `🖨️ Produktionsauftrag BEDRUCKEN für Position ${pos.pos_number}: Menge=${toPrint}`,
          )
          if (toPrint > 0) {
            await createProductionOrder({
              positionId: pos.id,
              amount: toPrint,
              designUrl: pos.design,
              orderType: 'STANDARD',
              dyeingNecessary: false,
              materialId: stockWithoutDesign.material_ID, 
              productTemplate: {
                kategorie: pos.productCategory,
                artikelnummer: stockWithoutDesign.material_ID ?? '',
                groesse: pos.shirtSize,
                farbcode: parseCMYKForMawi(pos.color) ?? {},
                typ: 'V-Ausschnitt',
              },
              Status: 'ORDER_RECEIVED',
            })
          }

          // Reservierung/Update Standardprodukt
          if (pos.standardProductId) {
            console.log(
              `🔄 Update amountInProduction für StandardProduct ${pos.standardProductId}`,
            )
            await prisma.standardProduct.update({
              where: { id: pos.standardProductId },
              data: {
                amountInProduction: {
                  increment: toPrint,
                },
              },
            })
          }

          remaining -= toPrint
        }

        // b) Färben + Bedrucken: Falls immer noch Bedarf besteht
        if (remaining > 0) {
          // Weißes, unbedrucktes Shirt abfragen
          const stockWhite = await getInventoryCount({
            color: 'cmyk(0%,0%,0%,0%)', // Weiß
            shirtSize: pos.shirtSize ?? undefined,
            category: pos.productCategory,
            typ: 'V-Ausschnitt',
          })
          console.log(`📦 Weißbestand für Position ${pos.pos_number}:`, stockWhite)

          console.log(
            `🎨 Produktionsauftrag FAERBEN_UND_BEDRUCKEN für Position ${pos.pos_number}: Menge=${remaining}`,
          )

          await createProductionOrder({
            positionId: pos.id,
            amount: remaining,
            designUrl: pos.design,
            orderType: 'STANDARD',
            dyeingNecessary: true,
            materialId: stockWhite.material_ID,
            productTemplate: {
              kategorie: pos.productCategory,
              artikelnummer: stockWhite.material_ID ?? '',
              groesse: pos.shirtSize,
              farbcode: parseCMYKForMawi(pos.color) ?? {},
              typ: 'V-Ausschnitt',
            },
            Status: 'ORDER_RECEIVED',
          })

          // Reservierung/Update Standardprodukt
          if (pos.standardProductId) {
            console.log(
              `🔄 Update amountInProduction für StandardProduct ${pos.standardProductId}`,
            )
            await prisma.standardProduct.update({
              where: { id: pos.standardProductId },
              data: {
                amountInProduction: {
                  increment: remaining,
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
  prisma.order.findUnique({
    where: { id },
    include: { positions: true, customer: true },
  })

export const getOrdersByCustomer = (customerId: string) =>
  prisma.order.findMany({
    where: { customerId },
    include: { positions: true, customer: true },
  })

export const getAllOrders = async () => {
  try {
    return await prisma.order.findMany({
      include: { positions: true, customer: true },
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
    console.error('❌ Fehler in createOrder:', err)
    throw err
  }
}
