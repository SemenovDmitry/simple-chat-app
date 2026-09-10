import { Router } from 'express'
import { z } from 'zod'

import { supabase } from '../lib/supabase.js'
import { requireAuth, type IAuthRequest } from '../middleware/auth.js'

const profileRouter = Router()

// ====================== SCHEMAS ======================
const createProfileSchema = z.object({
  username: z.string().min(2).max(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be hex, e.g. #6366f1'),
})

const updateProfileSchema = z.object({
  username: z.string().min(2).max(30).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be hex, e.g. #6366f1')
    .optional(),
})

// ====================== ROUTES ======================

/**
 * GET /profile/:id
 * Просмотр профиля — может кто угодно
 */
profileRouter.get('/:id', async (req, res) => {
  const { id } = req.params

  const { data, error } = await supabase
    .from('profiles')
    .select('username, color')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }

  if (!data) {
    return res.status(404).json({
      success: false,
      message: 'Profile not found',
    })
  }

  return res.json({
    success: true,
    data,
  })
})

/**
 * POST /profile
 * Создать свой профиль (только авторизованный)
 */
profileRouter.post('/', requireAuth, async (req: IAuthRequest, res) => {
  const user = req.user!
  const result = createProfileSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    })
  }

  // Проверяем, нет ли уже профиля
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'Profile already exists',
    })
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id, // = auth.users.id
      username: result.data.username,
      color: result.data.color,
    })
    .select('username, color')
    .single()

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }

  return res.status(201).json({
    success: true,
    data,
  })
})

/**
 * PATCH /profile
 * Редактировать только свой профиль
 */
profileRouter.patch('/', requireAuth, async (req: IAuthRequest, res) => {
  const user = req.user!
  const result = updateProfileSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    })
  }

  if (Object.keys(result.data).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Nothing to update',
    })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(result.data)
    .eq('id', user.id) // только свой
    .select('username, color')
    .single()

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }

  if (!data) {
    return res.status(404).json({
      success: false,
      message: 'Profile not found',
    })
  }

  return res.json({
    success: true,
    data,
  })
})

export default profileRouter
