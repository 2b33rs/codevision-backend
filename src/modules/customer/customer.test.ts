import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest'
import Fastify from 'fastify'
import { registerPlugins } from '../../plugins/register-plugins'
import { registerModules } from '../register-modules'
import { prisma } from '../../plugins/prisma'
import { randomUUID } from 'crypto'

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
  await prisma.$executeRawUnsafe('BEGIN')
})

afterEach(async () => {
  await prisma.$executeRawUnsafe('ROLLBACK')
})

describe('Customer Routes E2E', () => {
  it('should create a customer', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/customer',
      payload: {
        name: 'Test Kunde',
        email: `test-${Date.now()}@mail.com`,
        phone: '123456789',
        addr_country: 'DE',
        addr_city: 'Berlin',
        addr_zip: '10115',
        addr_street: 'Musterstraße',
        addr_line1: 'Haus 1',
        addr_line2: 'Etage 3',
        customerType: 'WEBSHOP',
      },
    })

    expect(res.statusCode).toBe(200)
    const customer = JSON.parse(res.body)
    expect(customer).toHaveProperty('id')
    expect(customer.name).toBe('Test Kunde')
  })

  it('should list all customers', async () => {
    await prisma.customer.create({
      data: {
        name: 'List Kunde',
        email: `list-${Date.now()}@mail.com`,
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

    const res = await app.inject({
      method: 'GET',
      url: '/customer',
    })

    expect(res.statusCode).toBe(200)
    const customers = JSON.parse(res.body)
    expect(Array.isArray(customers)).toBe(true)
    expect(customers.length).toBeGreaterThan(0)
  })

  it('should get a customer by ID', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Single Kunde',
        email: `single-${Date.now()}@mail.com`,
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
      url: `/customer/${customer.id}`,
    })

    expect(res.statusCode).toBe(200)
    const result = JSON.parse(res.body)
    expect(result.name).toBe(customer.name)
  })

  it('should update a customer by ID', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Update Kunde',
        email: `update-${Date.now()}@mail.com`,
        phone: '123123123',
        addr_country: 'DE',
        addr_city: 'Cologne',
        addr_zip: '50667',
        addr_street: 'Domstraße',
        addr_line1: 'Haus 4',
        addr_line2: 'Etage 6',
        customerType: 'BUSINESS',
      },
    })

    const res = await app.inject({
      method: 'PUT',
      url: `/customer/${customer.id}`,
      payload: {
        name: 'Updated Kunde',
        phone: '321321321',
      },
    })

    expect(res.statusCode).toBe(200)
    const updatedCustomer = JSON.parse(res.body)
    expect(updatedCustomer.name).toBe('Updated Kunde')
    expect(updatedCustomer.phone).toBe('321321321')
  })

  it('should delete a customer by ID', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Delete Kunde',
        email: `delete-${Date.now()}@mail.com`,
        phone: '789789789',
        addr_country: 'DE',
        addr_city: 'Frankfurt',
        addr_zip: '60311',
        addr_street: 'Zeil',
        addr_line1: 'Haus 5',
        addr_line2: 'Etage 7',
        customerType: 'WEBSHOP',
      },
    })

    const res = await app.inject({
      method: 'DELETE',
      url: `/customer/${customer.id}`,
    })

    expect(res.statusCode).toBe(200)
    const deletedCustomer = JSON.parse(res.body)
    expect(deletedCustomer.name).toBe(customer.name)
  })
})
