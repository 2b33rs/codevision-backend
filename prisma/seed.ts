import { faker } from '@faker-js/faker'
import {
  $Enums,
  ComplaintReason,
  ComplaintKind,
  ProductCategory,
} from '../generated/prisma'
import { prisma } from '../src/plugins/prisma'
import POSITION_STATUS = $Enums.POSITION_STATUS
import ShirtSize = $Enums.ShirtSize

async function main() {
  const sizes = Object.values(ShirtSize)
  const statuses = Object.values(POSITION_STATUS)
  const reasons = Object.values(ComplaintReason)
  const kinds = Object.values(ComplaintKind)

  // Aktuelles Jahr als vierstellig (z.B. "2024")
  const yearPrefix = new Date().getFullYear().toString()
  let orderSequence = 1

  // === 1. Erzeuge Standardprodukte ===
  const standardProducts = await prisma.standardProduct.createMany({
    data: Array.from({ length: 5 }).map(() => ({
      name: faker.commerce.productName(),
      minAmount: faker.number.int({ min: 1, max: 20 }),
      color: [0, 0, 0, 0].map(() => faker.number.int({ min: 0, max: 100 })).join(','),
      shirtSize: faker.helpers.arrayElement(sizes),
      productCategory: ProductCategory.T_SHIRT,
      amountInProduction: faker.number.int({ min: 0, max: 50 }),
    })),
  })

  // Hole die erzeugten Standardprodukte inkl. IDs
  const allStandardProducts = await prisma.standardProduct.findMany()

  // === 2. Erzeuge Kunden, Orders, Positionen ===
  for (let i = 0; i < 10; i++) {
    const customer = await prisma.customer.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        addr_city: faker.location.city(),
        addr_zip: faker.location.zipCode(),
        addr_street: faker.location.street(),
        addr_line1: faker.location.buildingNumber(),
        customerType: faker.helpers.arrayElement(['WEBSHOP', 'BUSINESS']),
      },
    })

    const orderCount = faker.number.int({ min: 1, max: 5 })
    for (let j = 0; j < orderCount; j++) {
      const orderNumber = `${yearPrefix}${orderSequence.toString().padStart(4, '0')}`
      orderSequence++

      const order = await prisma.order.create({
        data: {
          customerId: customer.id,
          orderNumber,
          deletedAt: null,
        },
      })

      const posCount = faker.number.int({ min: 1, max: 4 })
      for (let k = 0; k < posCount; k++) {
        const hasComplaint = faker.datatype.boolean()
        const maybeStandardProduct = faker.helpers.maybe(() =>
          faker.helpers.arrayElement(allStandardProducts),
        )

        await prisma.position.create({
          data: {
            orderId: order.id,
            pos_number: k + 1,
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            amount: faker.number.int({ min: 1, max: 10 }),
            design: faker.lorem.word(),
            color: [0, 0, 0, 0]
              .map(() => faker.number.int({ min: 0, max: 100 }))
              .join(','),
            shirtSize: faker.helpers.arrayElement(sizes),
            productCategory: ProductCategory.T_SHIRT,
            Status: faker.helpers.arrayElement(statuses),
            standardProductId: maybeStandardProduct?.id ?? null,
            ...(hasComplaint && {
              complaints: {
                create: {
                  ComplaintReason: faker.helpers.arrayElement(reasons),
                  ComplaintKind: faker.helpers.arrayElement(kinds),
                  createNewOrder: faker.datatype.boolean(),
                },
              },
            }),
          },
        })
      }
    }
  }

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
