import { faker } from '@faker-js/faker'
import {
  $Enums,
  COMPLAINT_REASON,
  ComplaintKind,
  ProductCategory,
} from '../generated/prisma'
import { prisma } from '../src/plugins/prisma'
import POSITION_STATUS = $Enums.POSITION_STATUS
import ShirtSize = $Enums.ShirtSize

async function main() {
  const sizes = Object.values(ShirtSize)
  const statuses = Object.values(POSITION_STATUS)
  const reasons = Object.values(COMPLAINT_REASON)
  const kinds = Object.values(ComplaintKind)

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
      const order = await prisma.order.create({
        data: { customerId: customer.id },
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
            color: [0, 0, 0, 0]
              .map(() => faker.number.int({ min: 0, max: 100 }))
              .join(','),
            shirtSize: faker.helpers.arrayElement(sizes),
            prodCategory: ProductCategory.T_SHIRT,
            Status: faker.helpers.arrayElement(statuses),
            complaints: {
              create: faker.datatype.boolean()
                ? {
                    Reason: faker.helpers.arrayElement(reasons),
                    ComplaintKind: faker.helpers.arrayElement(kinds),
                  }
                : undefined,
            },
          },
        })
      }
    }
  }

  await prisma.standardProduct.createMany({
    data: Array.from({ length: 5 }).map(() => ({
      name: faker.commerce.productName(),
      MinAmount: faker.number.int({ min: 1, max: 20 }),
      color: [0, 0, 0, 0]
        .map(() => faker.number.int({ min: 0, max: 100 }))
        .join(','),
      shirtSize: faker.helpers.arrayElement(sizes),
      productCategory: ProductCategory.T_SHIRT,
    })),
  })

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
