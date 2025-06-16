import { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../plugins/prisma'
import {
  $Enums,
  Prisma,
  ShirtSize,
  StandardProduct,
} from '../../../generated/prisma'
import { getInventoryCount } from '../../external/mawi.service'
import { sendProductionOrder } from '../../external/production.service'
import { parseCmykString } from '../../utils/color.util'
import { createProductionOrder } from '../production-order/production-order.service'
import { z } from 'zod'
import { productTemplateZ } from '../production-order/production-order.schema'

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

  const inventoryCountResponse = await getInventoryCount(
    {
      design: null,
      category: product.productCategory,
      typ: product.typ?.[0],
      color: product.color,
      shirtSize: product.shirtSize as ShirtSize,
    },
    true,
  ) // Immer true für StandardProducts

  const currentStock = inventoryCountResponse.anzahl
  res.send({
    ...product,
    currentStock,
  })
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
        SELECT *
        FROM "StandardProduct"
        WHERE "deletedAt" IS NULL
          AND to_tsvector('simple',
                          coalesce("name", '') || ' ' ||
                          coalesce("color", '') || ' ' ||
                          coalesce("shirtSize"::text, '')
              ) @
          @ plainto_tsquery('simple'
            , $1)
      `,
      query,
    )) as StandardProduct[]
  }

  const enriched = await Promise.all(
    products.map(async (product: any) => {
      const inventoryCountResponse = await getInventoryCount(
        {
          design: null,
          category: product.productCategory,
          typ: product.typ?.[0],
          color: product.color,
          shirtSize: product.shirtSize as ShirtSize,
        },
        true,
      ) // Immer true für StandardProducts
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

export async function createProductionOrderFromProductId(
  productId: string,
  amount: number,
) {
  if (!productId || !amount || amount <= 0) {
    throw new Error(
      'Ungültige Eingabe: productId und positiver amount sind erforderlich.',
    )
  }

  const product = await prisma.standardProduct.findUnique({
    where: { id: productId },
  })

  if (!product) {
    throw new Error(`Kein Produkt mit der ID ${productId} gefunden.`)
  }

  const invCount = await getInventoryCount({
    category: product.productCategory,
    design: null,
    typ: product.typ[0],
    color: product.color,
    shirtSize: product.shirtSize ?? '',
  })

  const colorCode = parseCmykString(product.color)
  const productTemplate = {
    kategorie: product.productCategory,
    groesse: product.shirtSize,
    typ: product.typ?.[0] ?? '',
    farbcode: {
      cyan: colorCode?.cyan ?? '',
      magenta: colorCode?.magenta ?? '',
      yellow: colorCode?.yellow ?? '',
      black: colorCode?.black ?? '',
    },
    artikelnummer: invCount.material_ID,
  }

  const productionOrder = await createProductionOrder({
    amount: amount,
    designUrl: '',
    orderType: 'STANDARD',
    dyeingNecessary: product.color !== 'cmyk(0%,0%,0%,0%)',
    materialId: invCount.material_ID, // <-- Pflichtfeld!
    productTemplate,
    Status: 'ORDER_RECEIVED',
  })

  await sendProductionOrder(productionOrder.productionOrder)

  return {
    status: 'ok' as const,
    message: `Produktionsauftrag #${productionOrder.productionOrder.id} über ${amount} Stück erstellt`,
    productionOrder,
  }
}
