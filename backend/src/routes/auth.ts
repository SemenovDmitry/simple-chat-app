import { Router } from 'express'
import { z } from 'zod'

import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { FRONTEND_BASE_URL } from '../consts/api.js'

const authRouter = Router()

// ====================== SCHEMAS ======================
const loginSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .email('Invalid email format')
    .transform((val) => val.trim().toLowerCase()),
})

const verifySchema = z.object({
  token_hash: z.string().min(1),
  type: z
    .enum(['email', 'magiclink', 'signup', 'invite', 'recovery'])
    .transform((val) => (val === 'magiclink' ? 'email' : val)),
})

// ====================== ROUTES ======================
authRouter.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    })
  }

  const { email } = result.data
  console.log('FRONTEND_BASE_URL :>> ', FRONTEND_BASE_URL);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${FRONTEND_BASE_URL}/auth/callback`,
    },
  })

  if (error) {
    console.error(error)
    return res.status(400).json({
      success: false,
      message: error.message,
    })
  }

  return res.status(200).json({
    success: true,
    message: 'Magic link sent to your email',
    data: { email },
  })
})

authRouter.post('/verify', async (req, res) => {
  const result = verifySchema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).json({ success: false, errors: result.error.flatten().fieldErrors })
  }

  const { token_hash } = result.data // Сюда ваш фронтенд пришлет извлеченный access_token

  const { data, error } = await supabase.auth.getUser(token_hash)

  if (error || !data.user) {
    return res.status(401).json({
      success: false,
      message: error?.message || 'Invalid or expired session token',
    })
  }

  return res.status(200).json({
    success: true,
    message: 'Successfully authenticated',
    data: {
      access_token: token_hash, // отдаем его же обратно
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    },
  })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  // Благодаря middleware, объект пользователя уже лежит в req.user
  const user = req.user

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username, color')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }

  return res.status(200).json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      profile,
    },
  })
})

export default authRouter
