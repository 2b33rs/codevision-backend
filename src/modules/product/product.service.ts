import { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../plugins/prisma'
import { Prisma } from '../../../generated/prisma'
import { getInventoryCount } from '../../external/inventory.service'

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

  const currentStock = await getInventoryCount({
    color: product.color,
    shirtSize: product.shirtSize,
  })

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

export async function list(req: FastifyRequest, res: FastifyReply) {
  const products = await prisma.standardProduct.findMany({
    where: { deletedAt: null },
  })

  const enriched = await Promise.all(
    products.map(async (product) => {
      const currentStock = await getInventoryCount({
        color: product.color,
        shirtSize: product.shirtSize,
      })

      return {
        ...product,
        currentStock,
      }
    }),
  )

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
