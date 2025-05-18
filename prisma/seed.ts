import { faker } from '@faker-js/faker'
import {
  $Enums,
  ComplaintReason,
  ComplaintKind,
  ProductCategory,
} from '../generated/prisma'
import { prisma } from '../src/plugins/prisma'

async function main() {
  // Enum-Werte aus $Enums holen
  const {
    POSITION_STATUS,
    ShirtSize,
    CustomerType,
    addr_Land
  } = $Enums

  const sizes = Object.values(ShirtSize)
  const statuses = Object.values(POSITION_STATUS)
  const reasons = Object.values(ComplaintReason)
  const kinds = Object.values(ComplaintKind)
  const customerTypes = Object.values(CustomerType)

  // === 1. Erzeuge Standardprodukte ===
  const standardProducts = await prisma.standardProduct.createMany({
    data: Array.from({ length: 5 }).map(() => ({
      name: faker.commerce.productName(),
      minAmount: faker.number.int({ min: 1, max: 20 }),
      color: `cmyk(${Array.from({ length: 4 })
        .map(() => `${faker.number.int({ min: 0, max: 100 })}%`)
        .join(',')})`,
      shirtSize: faker.helpers.arrayElement(sizes),
      productCategory: ProductCategory.T_SHIRT,
      amountInProduction: faker.number.int({ min: 0, max: 50 }),
    })),
  })

  const allStandardProducts = await prisma.standardProduct.findMany()

  // === 2. Erzeuge Kunden, Orders, Positionen ===
  for (let i = 0; i < 10; i++) {
    try {
      const customer = await prisma.customer.create({
        data: {
          email: faker.internet.email(),
          name: faker.person.fullName(),
          phone: faker.phone.number(),
          addr_country: addr_Land.DE, // Enum verwenden
          addr_city: faker.location.city(),
          addr_zip: faker.location.zipCode(),
          addr_street: faker.location.streetAddress(),
          addr_line1: faker.location.buildingNumber(),
          customerType: faker.helpers.arrayElement(customerTypes), // Korrigierte Enum-Referenz
        },
      })

      const orderCount = faker.number.int({ min: 1, max: 3 })
      for (let j = 0; j < orderCount; j++) {
        const order = await prisma.order.create({
          data: {
            customerId: customer.id,
            // orderNumber wird automatisch generiert
          },
        })

        const posCount = faker.number.int({ min: 1, max: 4 })
        for (let k = 0; k < posCount; k++) {
          await prisma.position.create({
            data: {
              orderId: order.id,
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
              standardProductId: faker.helpers.arrayElement(allStandardProducts)?.id,
              complaints: {
                create: faker.datatype.boolean() ? {
                  ComplaintReason: faker.helpers.arrayElement(reasons),
                  ComplaintKind: faker.helpers.arrayElement(kinds),
                  createNewOrder: faker.datatype.boolean(),
                } : undefined
              }
            },
          })
        }
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Testdaten:', error)
    }
  }

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})