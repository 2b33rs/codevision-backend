import 'dotenv/config'
import { faker } from '@faker-js/faker'
import { prisma } from '../src/plugins/prisma'
import {
  $Enums,
  ComplaintReason,
  ComplaintKind,
  ProductCategory,
} from '../generated/prisma'
import POSITION_STATUS = $Enums.POSITION_STATUS
import ShirtSize = $Enums.ShirtSize
import CustomerType = $Enums.CustomerType
import addr_Land = $Enums.addr_Land

async function main() {
  console.log('Starting nested‐write seed script…')

  // Enums vorbereiten
  const sizes = Object.values(ShirtSize) as ShirtSize[]
  const statuses = Object.values(POSITION_STATUS) as POSITION_STATUS[]
  const reasons = Object.values(ComplaintReason) as ComplaintReason[]
  const kinds = Object.values(ComplaintKind) as ComplaintKind[]
  const customerTypes = Object.values(CustomerType) as CustomerType[]

  // 1) Standardprodukte anlegen
  const standardProductsData = Array.from({ length: 5 }).map(() => ({
    name: faker.commerce.productName(),
    minAmount: faker.number.int({ min: 1, max: 20 }),
    color: `cmyk(${Array.from({ length: 4 })
      .map(() => `${faker.number.int({ min: 0, max: 100 })}%`)
      .join(',')})`,
    shirtSize: faker.helpers.arrayElement(sizes),
    productCategory: ProductCategory.T_SHIRT,
    amountInProduction: faker.number.int({ min: 0, max: 50 }),
  }))
  await prisma.standardProduct.createMany({ data: standardProductsData })
  const allStandard = await prisma.standardProduct.findMany()
  if (allStandard.length === 0) {
    console.error('Keine Standardprodukte gefunden – Seed abgebrochen.')
    process.exit(1)
  }

  // 2) Kunden + Orders + Positions via Nested Writes
  for (let i = 0; i < 10; i++) {
    // Customer‐Daten
    const customerData = {
      email: faker.internet.email(),
      name: faker.person.fullName(),
      phone: faker.phone.number(),
      addr_country: addr_Land.DE,
      addr_city: faker.location.city(),
      addr_zip: faker.location.zipCode(),
      addr_street: faker.location.streetAddress(),
      addr_line1: faker.location.buildingNumber(),
      customerType: faker.helpers.arrayElement(customerTypes),
    }

    // Jede Iteration: 1 Customer + mehrere Orders inklusive Positions
    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        orders: {
          create: Array.from({
            length: faker.number.int({ min: 1, max: 5 }),
          }).map(() => {
            // pro Order
            const posCount = faker.number.int({ min: 1, max: 6 })
            return {
              // orderNumber wird per Trigger/dbgenerated
              deletedAt: null,
              positions: {
                create: Array.from({ length: posCount }).map((_, k) => {
                  const hasComplaint = faker.datatype.boolean()
                  const base: any = {
                    pos_number: k + 1,
                    name: faker.commerce.productName(),
                    description: faker.commerce.productDescription(),
                    amount: faker.number.int({ min: 1, max: 10 }),
                    design: faker.lorem.word(),
                    color: `cmyk(${Array.from({ length: 4 })
                      .map(() => `${faker.number.int({ min: 0, max: 100 })}%`)
                      .join(',')})`,
                    shirtSize: faker.helpers.arrayElement(sizes),
                    productCategory: ProductCategory.T_SHIRT,
                    Status: faker.helpers.arrayElement(statuses),
                    standardProductId: faker.helpers.arrayElement(allStandard).id,
                  }
                  if (hasComplaint) {
                    base.complaints = {
                      create: {
                        ComplaintReason: faker.helpers.arrayElement(reasons),
                        ComplaintKind: faker.helpers.arrayElement(kinds),
                        createNewOrder: faker.datatype.boolean(),
                      },
                    }
                  }
                  return base
                }),
              },
            }
          }),
        },
      },
      include: {
        orders: {
          include: { positions: true },
        },
      },
    })

    console.log(
      `Created customer ${customer.id} with ${customer.orders.length} orders,` +
      ` first order has ${customer.orders[0]?.positions.length} positions`
    )
  }

  console.log('Nested‐write seed completed.')
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
