import { FastifyInstance } from 'fastify'
import positionRoutes from './position/position.routes'
import customerRoutes from './customer/customer.routes'
import productRoutes from './product/product.routes'
import orderRoutes from './order/order.routes'
import complaintRoutes from './complaint/complaint.routes'

export async function registerModules(app: FastifyInstance) {
  for (const { prefix, plugin } of [
    { prefix: '/position', plugin: positionRoutes },
    { prefix: '/customer', plugin: customerRoutes },
    { prefix: '/product', plugin: productRoutes },
    { prefix: '/order', plugin: orderRoutes },
    { prefix: '/complaints', plugin: complaintRoutes },
  ]) {
    app.register(plugin, { prefix })
  }
}
