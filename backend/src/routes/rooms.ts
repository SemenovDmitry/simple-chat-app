import { Router } from 'express'
import { z } from 'zod'

import { supabase } from '../lib/supabase.js'
import { requireAuth, type IAuthRequest } from '../middleware/auth.js'

const roomsRouter = Router()

// ====================== SCHEMAS ======================
const createRoomSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
})

const updateRoomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
})

const ROOM_FIELDS = 'id, owner_id, name, description, created_at, updated_at'

async function getRoomOrFail(roomId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select(ROOM_FIELDS)
    .eq('id', roomId)
    .maybeSingle()

  if (error) throw error
  return data
}

// ====================== ROUTES ======================

/**
 * GET /rooms — get rooms list
 */
roomsRouter.get('/', requireAuth, async (_req, res) => {
  const { data, error } = await supabase
    .from('rooms')
    .select(ROOM_FIELDS)
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ success: false, message: error.message })
  }

  return res.json({ success: true, data })
})

/**
 * POST /rooms — create room
 */
roomsRouter.post('/', requireAuth, async (req: IAuthRequest, res) => {
  const userId = req.user!.id
  const result = createRoomSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    })
  }

  const { data: room, error } = await supabase
    .from('rooms')
    .insert({
      owner_id: userId,
      name: result.data.name,
      description: result.data.description ?? null,
    })
    .select(ROOM_FIELDS)
    .single()

  if (error) {
    return res.status(500).json({ success: false, message: error.message })
  }

  return res.status(201).json({ success: true, data: room })
})

/**
 * GET /rooms/:id — комната доступна любому авторизованному
 */
roomsRouter.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params as { id: string }

  try {
    const room = await getRoomOrFail(id)

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' })
    }

    return res.json({ success: true, data: room })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return res.status(500).json({ success: false, message })
  }
})

/**
 * PATCH /rooms/:id — только owner
 */
roomsRouter.patch('/:id', requireAuth, async (req: IAuthRequest, res) => {
  const userId = req.user!.id
  const { id } = req.params as { id: string }
  const result = updateRoomSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    })
  }

  if (Object.keys(result.data).length === 0) {
    return res.status(400).json({ success: false, message: 'Nothing to update' })
  }

  const room = await getRoomOrFail(id)
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }

  if (room.owner_id !== userId) {
    return res.status(403).json({ success: false, message: 'Only owner can update room' })
  }

  const { data, error } = await supabase
    .from('rooms')
    .update(result.data)
    .eq('id', id)
    .select(ROOM_FIELDS)
    .single()

  if (error) {
    return res.status(500).json({ success: false, message: error.message })
  }

  return res.json({ success: true, data })
})

/**
 * DELETE /rooms/:id — только owner
 */
roomsRouter.delete('/:id', requireAuth, async (req: IAuthRequest, res) => {
  const userId = req.user!.id
  const { id } = req.params as { id: string }

  const room = await getRoomOrFail(id)
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }

  if (room.owner_id !== userId) {
    return res.status(403).json({ success: false, message: 'Only owner can delete room' })
  }

  const { error } = await supabase.from('rooms').delete().eq('id', id)
  if (error) {
    return res.status(500).json({ success: false, message: error.message })
  }

  return res.json({ success: true, data: room })
})

export default roomsRouter