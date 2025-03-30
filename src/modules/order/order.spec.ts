import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import { registerPlugins } from '../../plugins/register-plugins'
import { registerModules } from '../register-modules'

let app: ReturnType<typeof Fastify>

beforeAll(async () => {
  app = Fastify()
  await registerPlugins(app)
  await registerModules(app)
})

afterAll(async () => {
  await app.close()
})

describe('Order Routes', () => {
  it('should return all orders', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/orders',
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toBeInstanceOf(Array)
  })
})
