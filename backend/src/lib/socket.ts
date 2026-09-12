import type { Server as HttpServer } from 'http'
import { Server, type Socket } from 'socket.io'

import { supabase } from './supabase.js'

type ServerToClientEvents = {
  'message:new': (payload: unknown) => void
}

type ClientToServerEvents = {
  'room:join': (roomId: string, ack?: (res: { ok: boolean; error?: string }) => void) => void
  'room:leave': (roomId: string, ack?: (res: { ok: boolean }) => void) => void
}

type SocketData = {
  userId: string
}

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>

let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null

export function getIo() {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

async function getUserIdFromToken(token: string): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

async function isMember(roomId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return false
  return !!data
}

export function initSocket(httpServer: HttpServer, corsOrigin: string | string[]) {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    ...(corsOrigin && corsOrigin.length ? { cors: { origin: corsOrigin, credentials: true } } : {}),
  })

  // Auth-middleware: читаем токен из handshake.auth.token
  io.use(async (socket: AppSocket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '') as string | undefined)

      if (!token) return next(new Error('UNAUTHORIZED'))

      const userId = await getUserIdFromToken(token)
      if (!userId) return next(new Error('UNAUTHORIZED'))

      socket.data.userId = userId
      next()
    } catch {
      next(new Error('UNAUTHORIZED'))
    }
  })

  io.on('connection', (socket: AppSocket) => {
    const { userId } = socket.data

    socket.on('room:join', async (roomId, ack) => {
      try {
        if (typeof roomId !== 'string' || !roomId) {
          return ack?.({ ok: false, error: 'INVALID_ROOM' })
        }
        if (!(await isMember(roomId, userId))) {
          return ack?.({ ok: false, error: 'FORBIDDEN' })
        }
        await socket.join(roomId)
        ack?.({ ok: true })
      } catch {
        ack?.({ ok: false, error: 'INTERNAL' })
      }
    })

    socket.on('room:leave', async (roomId, ack) => {
      if (typeof roomId === 'string') await socket.leave(roomId)
      ack?.({ ok: true })
    })
  })

  return io
}
