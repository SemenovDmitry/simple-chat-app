import 'dotenv/config'
import http from 'node:http'

import { createServer } from './server.js'
import { initSocket } from './lib/socket.js'

const PORT = Number(process.env.PORT) || 10000

const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const app = createServer()
const server = http.createServer(app)

// Socket.io на том же HTTP-сервере, что и Express
initSocket(server, CORS_ORIGINS)

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`)
})