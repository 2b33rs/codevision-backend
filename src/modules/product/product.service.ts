import { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../plugins/prisma'
import {
  $Enums,
  Prisma,
  ShirtSize,
  StandardProduct,
} from '../../../generated/prisma'
import { getInventoryCount } from '../../external/mawi.service'

type IdParam = { id: string }
type CreateBody = Prisma.StandardProductCreateInput
type UpdateBody = Prisma.StandardProductUpdateInput

export async function create(
  req: FastifyRequest<{ Body: CreateBody }>,
  res: FastifyReply,
) {
  try {
    console.log('🧪 Create payload:', req.body) // <--- NEU
    const product = await prisma.standardProduct.create({ data: req.body })
    res.send(product)
  } catch (err) {
    console.error('❌ Create product failed:', JSON.stringify(err, null, 2))
    res.status(500).send({ error: 'Internal Server Error' })
  }
}

export async function read(
  req: FastifyRequest<{ Params: IdParam }>,
  res: FastifyReply,
) {
  const product = await prisma.standardProduct.findUnique({
    where: { id: req.params.id },
  })

  if (!product) return res.code(404).send()

  const inventoryCountResponse = await getInventoryCount({
    design: null,
    category: product.productCategory,
    typ: product.typ?.[0],
    color: product.color,
    shirtSize: product.shirtSize as ShirtSize,
  })

  const currentStock = inventoryCountResponse.anzahl
  res.send({
    ...product,
    currentStock,
  })
}

export async function createProductionOrder(
  req: FastifyRequest<{ Params: { id: string }; Body: { amount: number } }>,
  reply: FastifyReply,
) {
  const { id } = req.params
  const { amount } = req.body

  console.log(`Produktionsauftrag für Produkt ${id}, Menge: ${amount}`)

  // Beispiel: Produkt mit inProduction-Feld hochzählen
  return {
    status: 'ok',
    message: `Produktionsauftrag für ${amount} Stück wurde erstellt`,
    productId: id,
    amount,
  }
}

export async function list(
  req: FastifyRequest<{ Querystring: { query?: string } }>,
  res: FastifyReply,
) {
  const { query } = req.query
  let products: StandardProduct[]

  if (!query) {
    products = await prisma.standardProduct.findMany({
      where: { deletedAt: null },
    })
  } else {
    products = (await prisma.$queryRawUnsafe(
      `
        SELECT * FROM "StandardProduct"
        WHERE "deletedAt" IS NULL
        AND to_tsvector('simple',
          coalesce("name", '') || ' ' ||
          coalesce("color", '') || ' ' ||
          coalesce("shirtSize"::text, '')
        ) @@ plainto_tsquery('simple', $1)
      `,
      query,
    )) as StandardProduct[]
  }

  const enriched = await Promise.all(
    products.map(async (product: any) => {
      const inventoryCountResponse = await getInventoryCount({
        design: null,
        category: product.productCategory,
        typ: product.typ?.[0],
        color: product.color,
        shirtSize: product.shirtSize as ShirtSize,
      })
      const currentStock = inventoryCountResponse.anzahl
      const restbestand =
        currentStock + product.amountInProduction - product.minAmount

      return {
        ...product,
        currentStock,
        restbestand,
      }
    }),
  )

  // sort by restbestand
  enriched.sort((a, b) => a.restbestand - b.restbestand)

  res.send(enriched)
}

export async function update(
  req: FastifyRequest<{
    Params: IdParam
    Body: UpdateBody
  }>,
  res: FastifyReply,
) {
  const { id } = req.params
  const body = req.body
  const updated = await prisma.standardProduct.update({
    where: { id },
    data: body,
  })
  res.send(updated)
}

export async function remove(
  req: FastifyRequest<{ Params: IdParam }>,
  res: FastifyReply,
) {
  const { id } = req.params
  const deleted = await prisma.standardProduct.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  res.send(deleted)
}
