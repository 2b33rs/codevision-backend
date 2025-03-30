import Fastify from 'fastify'
import { registerPlugins } from './plugins/register-plugins'
import { registerModules } from './modules/register-modules'

export const app = Fastify({ ignoreTrailingSlash: true })

registerPlugins(app)
registerModules(app)
