import { describe, expect, it, vi } from 'vitest'
import { app } from '../../vitest.setup'
import { makeProduct } from '../../utils/test.factory'

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
    await makeProduct({
      name: 'List Test',
      minAmount: 2,
    })
    const res = await app.inject({ method: 'GET', url: '/product' })
    expect(res.statusCode).toBe(200)
    const list = res.json()
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThanOrEqual(1)
  })

  it('GET    /product/:id                  – get a single product by id', async () => {
    const product = await makeProduct({
      name: 'Single Get',
      minAmount: 3,
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
    const product = await makeProduct({
      name: 'To Update',
      minAmount: 4,
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
    const product = await makeProduct({
      name: 'To Delete',
      minAmount: 5,
    })
    const res = await app.inject({
      method: 'DELETE',
      url: `/product/${product.id}`,
    })
    expect(res.statusCode).toBe(200)
    const deleted = res.json()
    expect(deleted.deletedAt).not.toBeNull()
  })
})
