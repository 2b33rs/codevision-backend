import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import Fastify from 'fastify'
import { prisma } from './plugins/prisma'
import { registerPlugins } from './plugins/register-plugins'
import { registerModules } from './modules/register-modules'

export let app: ReturnType<typeof Fastify>

beforeAll(async () => {
  app = Fastify()
  await registerPlugins(app)
  await registerModules(app)
  await app.ready()
})

afterAll(async () => {
  await app.close()
  await prisma.$disconnect()
})

beforeEach(async () => {
  await prisma.$executeRawUnsafe('BEGIN')
})

afterEach(async () => {
  await prisma.$executeRawUnsafe('ROLLBACK')
  vi.clearAllMocks()
})
