import { app } from './app'

const start = async () => {
  try {
    await app.listen({ port: 8080 })
    console.log('Server is listening on http://localhost:8080')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
