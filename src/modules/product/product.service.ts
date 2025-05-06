import { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../plugins/prisma'
import { Prisma } from '../../../generated/prisma'

type IdParam = { id: string }
type CreateBody = Prisma.StandardProductCreateInput
type UpdateBody = Prisma.StandardProductUpdateInput

export async function create(
  req: FastifyRequest<{ Body: CreateBody }>,
  res: FastifyReply,
) {
  const product = await prisma.standardProduct.create({ data: req.body })
  res.send(product)
}

export async function read(
  req: FastifyRequest<{ Params: IdParam }>,
  res: FastifyReply,
) {
  const product = await prisma.standardProduct.findUnique({
    where: { id: req.params.id },
  })
  if (!product) return res.code(404).send()
  res.send(product)
}

export async function list(req: FastifyRequest<{}>, res: FastifyReply) {
  const products = await prisma.standardProduct.findMany({
    where: { deletedAt: null },
  })
  res.send(products)
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
