import express from 'express'
import cors from 'cors'

import healthRouter from './routes/health.js'

export function createServer() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  // Routes
  app.use(healthRouter)

  // 404
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Not found' })
  })

  // Error handler
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error(err)
      res.status(500).json({ success: false, error: 'Internal server error' })
    },
  )

  return app
}
