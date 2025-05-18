import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest'
import Fastify from 'fastify'
import { registerPlugins } from '../../plugins/register-plugins'
import { registerModules } from '../register-modules'
import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'

// Alle Endpoints laut customer.routes.ts: POST /customer, GET /customer, GET /customer/:id, PUT /customer/:id,
// GET /customer/:id/meta, DELETE /customer/:id :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}

let app: ReturnType<typeof Fastify>

beforeAll(async () => {
  app = Fastify()
  await registerPlugins(app)
  await registerModules(app)
})

afterAll(async () => {
  await app.close()
})

beforeEach(async () => {
  // Transaktion starten, damit jeder Test isoliert ist
  await prisma.$executeRawUnsafe('BEGIN')
})

afterEach(async () => {
  // Zurückrollen
  await prisma.$executeRawUnsafe('ROLLBACK')
})

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
    await prisma.customer.create({
      data: {
        name: 'List Kunde',
        email: `list-${randomUUID()}@mail.com`,
        phone: '987654321',
        addr_country: 'DE',
        addr_city: 'Hamburg',
        addr_zip: '20095',
        addr_street: 'Beispielstraße',
        addr_line1: 'Haus 2',
        addr_line2: 'Etage 4',
        customerType: 'BUSINESS',
      },
    })
    const res = await app.inject({ method: 'GET', url: '/customer' })
    expect(res.statusCode).toBe(200)
    const list = res.json()
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThan(0)
  })

  it('GET    /customer/:id               – get existing customer', async () => {
    const created = await prisma.customer.create({
      data: {
        name: 'Single Kunde',
        email: `single-${randomUUID()}@mail.com`,
        phone: '456789123',
        addr_country: 'DE',
        addr_city: 'Munich',
        addr_zip: '80331',
        addr_street: 'Hauptstraße',
        addr_line1: 'Haus 3',
        addr_line2: 'Etage 5',
        customerType: 'WEBSHOP',
      },
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
    const created = await prisma.customer.create({
      data: {
        name: 'Up Kunde',
        email: `up-${randomUUID()}@mail.com`,
        phone: '111222333',
        addr_country: 'DE',
        addr_city: 'Leipzig',
        addr_zip: '04109',
        addr_street: 'Markt',
        addr_line1: 'Haus 10',
        addr_line2: 'Etage 2',
        customerType: 'BUSINESS',
      },
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
    const created = await prisma.customer.create({
      data: {
        name: 'Meta Kunde',
        email: `meta-${randomUUID()}@mail.com`,
        phone: '555666777',
        addr_country: 'DE',
        addr_city: 'Stuttgart',
        addr_zip: '70173',
        addr_street: 'Königstraße',
        addr_line1: 'Haus 1',
        addr_line2: '',
        customerType: 'WEBSHOP',
      },
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
    const created = await prisma.customer.create({
      data: {
        name: 'Del Kunde',
        email: `del-${randomUUID()}@mail.com`,
        phone: '444555666',
        addr_country: 'DE',
        addr_city: 'Dresden',
        addr_zip: '01067',
        addr_street: 'Prager Straße',
        addr_line1: 'Haus 5',
        addr_line2: '',
        customerType: 'BUSINESS',
      },
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
