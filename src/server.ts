import Fastify from 'fastify'
import cors from '@fastify/cors'
import { registerPlugins } from './plugins/register-plugins'
import { registerModules } from './modules/register-modules'

export function createServer() {
  const app = Fastify({ ignoreTrailingSlash: true, logger: true })

  app.register(cors, {
    origin: [
      'http://localhost:5173',
      'https://codevision.up.railway.app',
      'https://white-dune-0347c7a03.6.azurestaticapps.net',
      'http://localhost:80',
      'https://backend-your-shirt-gmbh-production.up.railway.app',
      'https://frontend-your-shirt-gmbh.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })

  registerPlugins(app)
  registerModules(app)

  return app
}
