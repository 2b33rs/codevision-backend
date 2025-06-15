import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { faker } from '@faker-js/faker'
import { prisma } from '../src/plugins/prisma'
import { formatCmyk, hexToCmyk } from '../src/utils/color.util'

async function main() {
  // === 1. Standardprodukte aus JSON importieren ===
  const filePath = path.resolve(__dirname, 'data/standardProducts.json')
  const rawJson = fs.readFileSync(filePath, 'utf-8')
  const rawProducts: Array<{
    color: string
    shirtSize: string
    productCategory: string
    typ: string
  }> = JSON.parse(rawJson)

  for (const p of rawProducts) {
    await prisma.standardProduct.create({
      data: {
        name: `${p.productCategory} ${p.typ}`,
        color: formatCmyk(hexToCmyk(p.color)) || null,
        shirtSize: p.shirtSize || null,
        productCategory: p.productCategory,
        typ: [p.typ],
        minAmount: 0,
        currentStock: 0,
        amountInProduction: 0,
      },
    })
  }

  // === 2. Demo-Kunden erzeugen ===
  const CUSTOMER_COUNT = 10
  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    await prisma.customer.create({
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
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
