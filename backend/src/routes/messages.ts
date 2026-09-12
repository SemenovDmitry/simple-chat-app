import { Router } from 'express'
import { z } from 'zod'

import { supabase } from '../lib/supabase.js'
import { requireAuth, type IAuthRequest } from '../middleware/auth.js'
import { getIo } from '../lib/socket.js'

const messagesRouter = Router()

const listQuerySchema = z.object({
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

const createBodySchema = z.object({
  content: z.string().trim().min(1).max(2000),
})

type ProfileLite = { id: string; username: string; color: string }

async function attachProfiles<T extends { user_id: string | null }>(rows: T[]) {
  const ids = [...new Set(rows.map((r) => r.user_id).filter((x): x is string => !!x))]
  if (!ids.length) return rows.map((r) => ({ ...r, user: null as ProfileLite | null }))

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, color')
    .in('id', ids)
  if (error) throw error

  const byId = new Map<string, ProfileLite>((profiles ?? []).map((p) => [p.id, p]))
  return rows.map((r) => ({
    ...r,
    user: r.user_id ? byId.get(r.user_id) ?? null : null,
  }))
}

// GET /rooms/:id/messages
messagesRouter.get('/:id/messages', requireAuth, async (req, res) => {
  const roomId = String(req.params.id)

  const parsed = listQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }
  const { before, limit } = parsed.data

  try {
    let query = supabase
      .from('messages')
      .select('id, room_id, user_id, content, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit)

    if (before) query = query.lt('created_at', before)

    const { data, error } = await query
    if (error) throw error

    const withProfiles = await attachProfiles(data ?? [])
    withProfiles.reverse()

    return res.json({
      success: true,
      data: { items: withProfiles, hasMore: withProfiles.length === limit },
    })
  } catch (err) {
    console.error('[messages:list]', err)
    return res.status(500).json({ success: false, message: 'Internal error' })
  }
})

// POST /rooms/:id/messages
messagesRouter.post('/:id/messages', requireAuth, async (req: IAuthRequest, res) => {
  const roomId = String(req.params.id)
  const userId = req.user!.id

  const parsed = createBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    // Комната вообще существует?
    const { data: room } = await supabase
      .from('rooms')
      .select('id')
      .eq('id', roomId)
      .maybeSingle()

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' })
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({ room_id: roomId, user_id: userId, content: parsed.data.content })
      .select('id, room_id, user_id, content, created_at')
      .single()
    if (error) throw error

    const [withProfile] = await attachProfiles([data])

    getIo().to(roomId).emit('message:new', withProfile)

    return res.status(201).json({ success: true, data: withProfile })
  } catch (err) {
    console.error('[messages:create]', err)
    return res.status(500).json({ success: false, message: 'Internal error' })
  }
})

export default messagesRouter