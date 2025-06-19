import { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../plugins/prisma'
import { Prisma, ShirtSize, StandardProduct } from '../../../generated/prisma'
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

    // Get inventory count
    const inventoryCountResponse = await getInventoryCount(
      {
        design: null,
        category: product.productCategory,
        typ: product.typ?.[0],
        color: product.color,
        shirtSize: product.shirtSize as ShirtSize,
        name: product.name,
      },
      true,
    )
    const currentStock = inventoryCountResponse.anzahl

    // Get related positions for this product (will be empty for a new product)
    const positions = await prisma.position.findMany({
      where: {
        standardProductId: product.id,
        deletedAt: null,
      },
      include: {
        order: true,
        productionOrders: true,
      },
    })

    // Group positions by order
    const orderMap = new Map()
    positions.forEach((position) => {
      if (position.order) {
        if (!orderMap.has(position.order.id)) {
          orderMap.set(position.order.id, {
            ...position.order,
            positions: [],
          })
        }
        // Add position to the order
        orderMap.get(position.order.id).positions.push(position)
      }
    })

    // Convert map to array
    const orders = orderMap.size > 0 ? Array.from(orderMap.values()) : []

    // Sort orders by creation date (newest first)
    orders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    res.send({
      ...product,
      currentStock,
      orders,
    })
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
      name: product.name,
    },
    true,
  ) // Immer true für StandardProducts

  const currentStock = inventoryCountResponse.anzahl

  // Get related positions for this product
  const positions = await prisma.position.findMany({
    where: {
      standardProductId: product.id,
      deletedAt: null,
    },
    include: {
      order: true,
      productionOrders: true,
    },
  })

  // Group positions by order
  const orderMap = new Map()
  positions.forEach((position) => {
    if (position.order) {
      if (!orderMap.has(position.order.id)) {
        orderMap.set(position.order.id, {
          ...position.order,
          positions: [],
        })
      }
      // Add position to the order
      orderMap.get(position.order.id).positions.push(position)
    }
  })

  // Convert map to array
  const orders = orderMap.size > 0 ? Array.from(orderMap.values()) : []

  // Sort orders by creation date (newest first)
  orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  res.send({
    ...product,
    currentStock,
    orders,
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
    products.map(async (product: StandardProduct) => {
      const inventoryCountResponse = await getInventoryCount(
        {
          design: null,
          category: product.productCategory,
          typ: product.typ?.[0],
          color: product.color,
          shirtSize: product.shirtSize as ShirtSize,
          name: product.name,
        },
        true,
      ) // Immer true für StandardProducts
      const currentStock = inventoryCountResponse.anzahl
      const restbestand =
        currentStock + product.amountInProduction - product.minAmount

      // Get related positions for this product
      const positions = await prisma.position.findMany({
        where: {
          standardProductId: product.id,
          deletedAt: null,
        },
        include: {
          order: true,
          productionOrders: true,
        },
      })

      // Group positions by order
      const orderMap = new Map()
      positions.forEach((position) => {
        if (position.order) {
          if (!orderMap.has(position.order.id)) {
            orderMap.set(position.order.id, {
              ...position.order,
              positions: [],
            })
          }
          // Add position to the order
          orderMap.get(position.order.id).positions.push(position)
        }
      })

      // Convert map to array
      const orders = orderMap.size > 0 ? Array.from(orderMap.values()) : []

      // Sort orders by creation date (newest first)
      orders.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )

      return {
        ...product,
        currentStock,
        restbestand,
        orders,
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

  // Get inventory count
  const inventoryCountResponse = await getInventoryCount(
    {
      design: null,
      category: updated.productCategory,
      typ: updated.typ?.[0],
      color: updated.color,
      shirtSize: updated.shirtSize as ShirtSize,
    },
    true,
  )
  const currentStock = inventoryCountResponse.anzahl

  // Get related positions for this product
  const positions = await prisma.position.findMany({
    where: {
      standardProductId: updated.id,
      deletedAt: null,
    },
    include: {
      order: true,
      productionOrders: true,
    },
  })

  // Group positions by order
  const orderMap = new Map()
  positions.forEach((position) => {
    if (position.order) {
      if (!orderMap.has(position.order.id)) {
        orderMap.set(position.order.id, {
          ...position.order,
          positions: [],
        })
      }
      // Add position to the order
      orderMap.get(position.order.id).positions.push(position)
    }
  })

  // Convert map to array
  const orders = orderMap.size > 0 ? Array.from(orderMap.values()) : []

  // Sort orders by creation date (newest first)
  orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  res.send({
    ...updated,
    currentStock,
    orders,
  })
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

  // Get inventory count
  const inventoryCountResponse = await getInventoryCount(
    {
      design: null,
      category: deleted.productCategory,
      typ: deleted.typ?.[0],
      color: deleted.color,
      shirtSize: deleted.shirtSize as ShirtSize,
    },
    true,
  )
  const currentStock = inventoryCountResponse.anzahl

  // Get related positions for this product
  const positions = await prisma.position.findMany({
    where: {
      standardProductId: deleted.id,
      deletedAt: null,
    },
    include: {
      order: true,
      productionOrders: true,
    },
  })

  // Group positions by order
  const orderMap = new Map()
  positions.forEach((position) => {
    if (position.order) {
      if (!orderMap.has(position.order.id)) {
        orderMap.set(position.order.id, {
          ...position.order,
          positions: [],
        })
      }
      // Add position to the order
      orderMap.get(position.order.id).positions.push(position)
    }
  })

  // Convert map to array
  const orders = orderMap.size > 0 ? Array.from(orderMap.values()) : []

  // Sort orders by creation date (newest first)
  orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  res.send({
    ...deleted,
    currentStock,
    orders,
  })
}
