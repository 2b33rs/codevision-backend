import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'

// Explizit .env Datei laden
dotenv.config()

export default defineConfig({
  test: {
    sequence: {
      concurrent: false,
    },
    fileParallelism: false,
    globals: true,
    environment: 'node',
    setupFiles: ['./src/vitest.setup.ts'],
    isolate: false,
  },
})
