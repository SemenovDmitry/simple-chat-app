import { Request, Response, NextFunction } from 'express'

import { supabase } from '../lib/supabase.js'
import { IUser } from '../types/models.js'

// Расширяем стандартный тип Request в Express, чтобы добавить поле user
declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export interface IAuthRequest extends Request {
  user?: IUser
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token is required (Bearer <token>)',
      })
    }

    // Извлекаем чистый токен
    const token = authHeader.split(' ')[1]

    // Отправляем токен в Supabase для проверки подлинности сессии
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: error?.message || 'Invalid or expired token',
      })
    }

    // Сохраняем пользователя в объект запроса, чтобы использовать в роутах
    req.user = data.user
    next()
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    })
  }
}
