import { io, type Socket } from 'socket.io-client'

import { getAccessToken } from '@/api/utils'
import type { IMessageWithUser } from '@/api/message'

const API_URL = import.meta.env.VITE_API_URL as string

type ServerToClientEvents = {
  'message:new': (msg: IMessageWithUser) => void
}

type ClientToServerEvents = {
  'room:join': (
    roomId: string,
    ack?: (res: { ok: boolean; error?: string }) => void,
  ) => void
  'room:leave': (roomId: string, ack?: (res: { ok: boolean }) => void) => void
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: AppSocket | null = null

export function connectSocket(token: string): AppSocket {
  if (socket?.connected) {
    socket.auth = { token }
    return socket
  }

  if (socket) {
    socket.auth = { token }
    socket.connect()
    return socket
  }

  socket = io(API_URL, {
    path: '/socket.io',
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
  })

  socket.io.on('reconnect_attempt', () => {
    const fresh = getAccessToken()
    if (fresh && socket) socket.auth = { token: fresh }
  })

  return socket
}

export function getSocket(): AppSocket | null {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}