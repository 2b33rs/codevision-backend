import { FastifyInstance } from 'fastify'
import positionRoutes from './position/position.routes'
import customerRoutes from './customer/customer.routes'
import productRoutes from './product/product.routes'
import orderRoutes from './order/order.routes'
import complaintRoutes from './complaint/complaint.routes'


export async function registerModules(app: FastifyInstance) {
  app.register(positionRoutes, { prefix: '/position' })
  app.register(customerRoutes, { prefix: '/customer' })
  app.register(productRoutes, { prefix: '/product' })
  app.register(orderRoutes, { prefix: '/order' })
  app.register(complaintRoutes, { prefix: '/complaints' })
}
