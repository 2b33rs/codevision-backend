import Fastify from 'fastify'
import cors from '@fastify/cors'
import { registerPlugins } from './plugins/register-plugins'
import { registerModules } from './modules/register-modules'

export const app = Fastify({ ignoreTrailingSlash: true, logger: true })

app.register(cors, {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
})

registerPlugins(app)
registerModules(app)

app.get('/', () => {
  return 'pong'
})
