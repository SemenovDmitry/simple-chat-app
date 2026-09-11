import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase.js'
import { requireAuth, type IAuthRequest } from '../middleware/auth.js'

const roomsRouter = Router()

// ====================== SCHEMAS ======================
const createRoomSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  is_private: z.boolean().default(false),
})

const updateRoomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  is_private: z.boolean().optional(),
})

// ====================== HELPERS ======================
async function isRoomMember(roomId: string, userId: string) {
  const { data } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle()

  return Boolean(data)
}

async function getRoomOrFail(roomId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, owner_id, name, description, is_private, created_at, updated_at')
    .eq('id', roomId)
    .maybeSingle()

  if (error) throw error
  return data
}

// ====================== ROUTES ======================

/**
 * GET /rooms
 * Список комнат (публичные + свои)
 */
roomsRouter.get('/', requireAuth, async (req: IAuthRequest, res) => {
  const userId = req.user!.id

  // Комнаты, где пользователь участник
  const { data: memberRooms, error: memberError } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('user_id', userId)

  if (memberError) {
    return res.status(500).json({ success: false, message: memberError.message })
  }

  const memberRoomIds = (memberRooms || []).map((r) => r.room_id)

  // Публичные ИЛИ свои как owner ИЛИ где состоит
  let query = supabase
    .from('rooms')
    .select('id, owner_id, name, description, is_private, created_at, updated_at')
    .order('created_at', { ascending: false })

  // Проще: все публичные + приватные, где owner или member
  const { data, error } = await query

  if (error) {
    return res.status(500).json({ success: false, message: error.message })
  }

  const filtered = (data || []).filter(
    (room) =>
      !room.is_private ||
      room.owner_id === userId ||
      memberRoomIds.includes(room.id),
  )

  return res.json({
    success: true,
    data: filtered,
  })
})

/**
 * POST /rooms
 * Создать комнату + сразу добавить owner в members
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
      is_private: result.data.is_private,
    })
    .select('id, owner_id, name, description, is_private, created_at, updated_at')
    .single()

  if (error) {
    return res.status(500).json({ success: false, message: error.message })
  }

  // Owner автоматически становится участником
  const { error: memberError } = await supabase.from('room_members').insert({
    room_id: room.id,
    user_id: userId,
  })

  if (memberError) {
    // Откатываем комнату, если не удалось добавить member
    await supabase.from('rooms').delete().eq('id', room.id)
    return res.status(500).json({ success: false, message: memberError.message })
  }

  return res.status(201).json({
    success: true,
    data: room,
  })
})

/**
 * GET /rooms/:id
 */
roomsRouter.get('/:id', requireAuth, async (req: IAuthRequest, res) => {
  const userId = req.user!.id
  const { id } = req.params as { id: string }

  try {
    const room = await getRoomOrFail(id)

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' })
    }

    if (room.is_private) {
      const member = await isRoomMember(id, userId)
      if (room.owner_id !== userId && !member) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }
    }

    return res.json({ success: true, data: room })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return res.status(500).json({ success: false, message })
  }
})

/**
 * PATCH /rooms/:id
 * Только owner
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
    .select('id, owner_id, name, description, is_private, created_at, updated_at')
    .single()

  if (error) {
    return res.status(500).json({ success: false, message: error.message })
  }

  return res.json({ success: true, data })
})

/**
 * DELETE /rooms/:id
 * Только owner
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

/**
 * POST /rooms/:id/join
 * Присоединиться к комнате
 */
roomsRouter.post('/:id/join', requireAuth, async (req: IAuthRequest, res) => {
  const userId = req.user!.id
  const { id } = req.params as { id: string }

  const room = await getRoomOrFail(id)
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }

  // Уже участник?
  if (await isRoomMember(id, userId)) {
    return res.status(409).json({ success: false, message: 'Already a member' })
  }

  // В приватную комнату пока нельзя «просто войти»
  // (позже можно добавить invite-коды)
  if (room.is_private && room.owner_id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Cannot join private room',
    })
  }

  const { error } = await supabase.from('room_members').insert({
    room_id: id,
    user_id: userId,
  })

  if (error) {
    return res.status(500).json({ success: false, message: error.message })
  }

  return res.status(201).json({
    success: true,
    message: 'Joined room',
  })
})

/**
 * POST /rooms/:id/leave
 * Выйти из комнаты
 */
roomsRouter.post('/:id/leave', requireAuth, async (req: IAuthRequest, res) => {
  const userId = req.user!.id
  const { id } = req.params as { id: string }

  const room = await getRoomOrFail(id)
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }

  // Owner не может просто выйти — сначала удали/передай комнату
  if (room.owner_id === userId) {
    return res.status(400).json({
      success: false,
      message: 'Owner cannot leave the room. Delete it instead.',
    })
  }

  const { error } = await supabase
    .from('room_members')
    .delete()
    .eq('room_id', id)
    .eq('user_id', userId)

  if (error) {
    return res.status(500).json({ success: false, message: error.message })
  }

  return res.json({
    success: true,
    message: 'Left room',
  })
})

/**
 * GET /rooms/:id/members
 * Список участников
 */
roomsRouter.get('/:id/members', requireAuth, async (req: IAuthRequest, res) => {
  const userId = req.user!.id
  const { id } = req.params as { id: string }

  const room = await getRoomOrFail(id)
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' })
  }

  const member = await isRoomMember(id, userId)
  if (room.owner_id !== userId && !member) {
    return res.status(403).json({ success: false, message: 'Access denied' })
  }

  const { data, error } = await supabase
    .from('room_members')
    .select(`
      room_id,
      user_id,
      joined_at,
      profile:profiles ( id, username, color )
    `)
    .eq('room_id', id)
    .order('joined_at', { ascending: true })

  if (error) {
    return res.status(500).json({ success: false, message: error.message })
  }

  return res.json({
    success: true,
    data,
  })
})

export default roomsRouter