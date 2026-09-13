import { Router } from 'express'
import { z } from 'zod'

import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { FRONTEND_APP_BASENAME, FRONTEND_BASE_URL } from '../consts/api.js'

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
})

export async function getProfileLite(userId: string) {
  return supabase
    .from('profiles')
    .select('username, color')
    .eq('id', userId)
    .maybeSingle()
}

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

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${FRONTEND_BASE_URL}${FRONTEND_APP_BASENAME}/auth/callback`,
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
    return res
      .status(400)
      .json({ success: false, errors: result.error.flatten().fieldErrors })
  }

  const { token_hash } = result.data

  const { data, error } = await supabase.auth.getUser(token_hash)

  if (error || !data.user) {
    return res.status(401).json({
      success: false,
      message: error?.message || 'Invalid or expired session token',
    })
  }

  const user = data.user

  const { data: profile, error: profileError } = await getProfileLite(user.id)

  if (profileError) {
    return res
      .status(500)
      .json({ success: false, message: profileError.message })
  }

  return res.status(200).json({
    success: true,
    message: 'Successfully authenticated',
    data: {
      access_token: token_hash,
      user: {
        id: user.id,
        email: user.email,
        profile,
      },
    },
  })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = req.user

  const { data: profile, error: profileError } = await getProfileLite(user.id)

  if (profileError) {
    return res
      .status(500)
      .json({ success: false, message: profileError.message })
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
