import type { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod/v3'

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const message = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      res.status(400).json({ success: false, error: `Validation error: ${message}` })
      return
    }
    next()
  }
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      const message = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      res.status(400).json({ success: false, error: `Validation error: ${message}` })
      return
    }
    next()
  }
}
