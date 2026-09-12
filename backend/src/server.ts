import express from 'express'
import cors from 'cors'

import healthRouter from './routes/health.js'
import authRouter from './routes/auth.js'
import profileRouter from './routes/profile.js'
import roomsRouter from './routes/rooms.js'
import messagesRouter from './routes/messages.js'

const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

export function createServer() {
  const app = express()

  app.use(
    cors({
      origin: CORS_ORIGINS.length ? CORS_ORIGINS : true,
      credentials: true,
    })
  )
  app.use(express.json())

  app.use(healthRouter)
  app.use('/auth', authRouter)
  app.use('/profile', profileRouter)
  app.use('/rooms', roomsRouter)
  app.use('/rooms', messagesRouter)

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Not found' })
  })

  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error(err)
      res.status(500).json({ success: false, error: 'Internal server error' })
    },
  )

  return app
}