import { FastifyInstance } from 'fastify'
import positionRoutes from './position/position.routes'
import customerRoutes from './customer/customer.routes'
import productRoutes from './product/product.routes'

export async function registerModules(app: FastifyInstance) {
  app.register(positionRoutes, { prefix: '/position' })
  app.register(customerRoutes, { prefix: '/customer' })
  app.register(productRoutes, { prefix: '/product' })
}
