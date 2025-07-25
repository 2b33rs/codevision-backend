import { describe, expect, it } from 'vitest'
import { app } from '../../vitest.setup'
import { randomUUID } from 'crypto'
import { makeCustomer } from '../../utils/test.factory'

describe('Customer Routes – vollständige Abdeckung', () => {
  it('POST   /customer                   – create a customer', async () => {
    const payload = {
      name: 'Test Kunde',
      email: `test-${randomUUID()}@mail.com`,
      phone: '123456789',
      addr_country: 'DE',
      addr_city: 'Berlin',
      addr_zip: '10115',
      addr_street: 'Musterstraße',
      addr_line1: 'Haus 1',
      addr_line2: 'Etage 3',
      customerType: 'WEBSHOP',
    }
    const res = await app.inject({
      method: 'POST',
      url: '/customer',
      payload,
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('id')
    expect(body.name).toBe(payload.name)
    expect(body.email).toBe(payload.email)
  })

  it('GET    /customer                   – list all customers', async () => {
    await makeCustomer({
      addr_country: 'DE',
      addr_city: 'Hamburg',
      addr_zip: '20095',
      addr_street: 'Beispielstraße',
      addr_line1: 'Haus 2',
      addr_line2: 'Etage 4',
      customerType: 'BUSINESS',
      phone: '987654321',
      name: 'List Kunde',
      email: `list-${randomUUID()}@mail.com`,
    })
    const res = await app.inject({ method: 'GET', url: '/customer' })
    expect(res.statusCode).toBe(200)
    const list = res.json()
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThan(0)
  })

  it('GET    /customer/:id               – get existing customer', async () => {
    const created = await makeCustomer({
      addr_country: 'DE',
      addr_city: 'Munich',
      addr_zip: '80331',
      addr_street: 'Hauptstraße',
      addr_line1: 'Haus 3',
      addr_line2: 'Etage 5',
      customerType: 'WEBSHOP',
      phone: '456789123',
      name: 'Single Kunde',
      email: `single-${randomUUID()}@mail.com`,
    })
    const res = await app.inject({
      method: 'GET',
      url: `/customer/${created.id}`,
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.id).toBe(created.id)
    expect(body.name).toBe(created.name)
  })

  it('GET    /customer/:id               – 404 for non-existing', async () => {
    const fakeId = randomUUID()
    const res = await app.inject({
      method: 'GET',
      url: `/customer/${fakeId}`,
    })
    expect(res.statusCode).toBe(404)
    const body = res.json()
    expect(body).toHaveProperty('message')
  })

  it('PUT    /customer/:id               – update existing customer', async () => {
    const created = await makeCustomer({
      addr_country: 'DE',
      addr_city: 'Leipzig',
      addr_zip: '04109',
      addr_street: 'Markt',
      addr_line1: 'Haus 10',
      addr_line2: 'Etage 2',
      customerType: 'BUSINESS',
      phone: '111222333',
      name: 'Up Kunde',
      email: `up-${randomUUID()}@mail.com`,
    })
    const res = await app.inject({
      method: 'PUT',
      url: `/customer/${created.id}`,
      payload: { name: 'Updated Kunde', phone: '999888777' },
    })
    expect(res.statusCode).toBe(200)
    const updated = res.json()
    expect(updated.name).toBe('Updated Kunde')
    expect(updated.phone).toBe('999888777')
  })

  it('PUT    /customer/:id               – 404 on update non-existing', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/customer/${randomUUID()}`,
      payload: { name: 'Nope' },
    })
    expect(res.statusCode).toBe(404)
    const body = res.json()
    expect(body).toHaveProperty('message')
  })

  it('GET    /customer/:id/meta          – meta for existing', async () => {
    // Kunde ohne Orders => canDelete: true
    const created = await makeCustomer({
      addr_country: 'DE',
      addr_city: 'Stuttgart',
      addr_zip: '70173',
      addr_street: 'Königstraße',
      addr_line1: 'Haus 1',
      addr_line2: '',
      customerType: 'WEBSHOP',
      phone: '555666777',
      name: 'Meta Kunde',
      email: `meta-${randomUUID()}@mail.com`,
    })
    const res = await app.inject({
      method: 'GET',
      url: `/customer/${created.id}/meta`,
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('orderCount', 0)
    expect(body).toHaveProperty('canDelete', true)
  })

  it('GET    /customer/:id/meta          – 404 for non-existing', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/customer/${randomUUID()}/meta`,
    })
    expect(res.statusCode).toBe(404)
    const body = res.json()
    expect(body).toHaveProperty('message')
  })

  it('DELETE /customer/:id               – delete existing customer', async () => {
    const created = await makeCustomer({
      addr_country: 'DE',
      addr_city: 'Dresden',
      addr_zip: '01067',
      addr_street: 'Prager Straße',
      addr_line1: 'Haus 5',
      addr_line2: '',
      customerType: 'BUSINESS',
      phone: '444555666',
      name: 'Del Kunde',
      email: `del-${randomUUID()}@mail.com`,
    })
    const res = await app.inject({
      method: 'DELETE',
      url: `/customer/${created.id}`,
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.id).toBe(created.id)
  })

  it('DELETE /customer/:id               – 404 for non-existing', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/customer/${randomUUID()}`,
    })
    expect(res.statusCode).toBe(404)
    const body = res.json()
    expect(body).toHaveProperty('message')
  })
})
