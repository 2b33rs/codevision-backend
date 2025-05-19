import { describe, expect, it, vi } from 'vitest'
import { prisma } from '../../plugins/prisma'
import { app } from '../../vitest.setup'

// Mock für externen Inventory-Service auf Basis der input-Daten
vi.mock('../../external/inventory.service', () => ({
  getInventoryCount: vi.fn().mockResolvedValue(0),
  createProductionOrder: vi.fn().mockImplementation(async (input: any) => ({
    status: 'ok',
    message: `Produktionsauftrag für ${input.amount} Stück wurde erstellt`,
    productId: input.productId,
    amount: input.amount,
  })),
}))

describe('Product Routes – vollständige Abdeckung', () => {
  it('POST   /product                      – create a product', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/product',
      payload: {
        name: 'E2E Product',
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'M',
        productCategory: 'T_SHIRT',
        minAmount: 1,
      },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('id')
    expect(body.name).toBe('E2E Product')
  })

  it('GET    /product                      – list products', async () => {
    await prisma.standardProduct.create({
      data: {
        name: 'List Test',
        productCategory: 'T_SHIRT',
        minAmount: 2,
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'M',
      },
    })
    const res = await app.inject({ method: 'GET', url: '/product' })
    expect(res.statusCode).toBe(200)
    const list = res.json()
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThanOrEqual(1)
  })

  it('GET    /product/:id                  – get a single product by id', async () => {
    const product = await prisma.standardProduct.create({
      data: {
        name: 'Single Get',
        productCategory: 'T_SHIRT',
        minAmount: 3,
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'M',
      },
    })
    const res = await app.inject({
      method: 'GET',
      url: `/product/${product.id}`,
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.name).toBe('Single Get')
    expect(body).toHaveProperty('currentStock')
  })

  it('PUT    /product/:id                  – update a product', async () => {
    const product = await prisma.standardProduct.create({
      data: {
        name: 'To Update',
        productCategory: 'T_SHIRT',
        minAmount: 4,
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'M',
      },
    })
    const res = await app.inject({
      method: 'PUT',
      url: `/product/${product.id}`,
      payload: {
        name: 'Updated Name',
        productCategory: 'T_SHIRT',
        minAmount: 1,
      },
    })
    expect(res.statusCode).toBe(200)
    const updated = res.json()
    expect(updated.name).toBe('Updated Name')
  })

  it('DELETE /product/:id                  – soft delete a product', async () => {
    const product = await prisma.standardProduct.create({
      data: {
        name: 'To Delete',
        productCategory: 'T_SHIRT',
        minAmount: 5,
        color: 'cmyk(0%,0%,0%,0%)',
        shirtSize: 'M',
      },
    })
    const res = await app.inject({
      method: 'DELETE',
      url: `/product/${product.id}`,
    })
    expect(res.statusCode).toBe(200)
    const deleted = res.json()
    expect(deleted.deletedAt).not.toBeNull()
  })

  it('POST   /product/:id/production-order – create production order', async () => {
    const product = await prisma.standardProduct.create({
      data: {
        name: 'ProdOrderTest',
        productCategory: 'T_SHIRT',
        minAmount: 2,
        color: 'cmyk(10%,20%,30%,40%)',
        shirtSize: 'L',
      },
    })

    const res = await app.inject({
      method: 'POST',
      url: `/product/${product.id}/production-order`,
      payload: { amount: 5 },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.status).toBe('ok')
    expect(body.productId).toBe(product.id)
    expect(body.amount).toBe(5)
  })
})
