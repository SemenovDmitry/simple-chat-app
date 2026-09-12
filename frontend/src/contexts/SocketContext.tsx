import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { getAccessToken } from '@/api/utils'
import { connectSocket, disconnectSocket, type AppSocket } from '@/lib/socket'

import { useAuth } from './AuthContext'

type SocketContextValue = {
  socket: AppSocket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
})

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState<AppSocket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!user) {
      disconnectSocket()
      setSocket(null)
      setConnected(false)
      return
    }

    const token = getAccessToken()
    if (!token) return

    const s = connectSocket(token)
    setSocket(s)

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)

    // socket.io-client может уже быть подключён на момент подписки
    if (s.connected) setConnected(true)

    return () => {
      s.off('connect', onConnect)
      s.off('disconnect', onDisconnect)
    }
  }, [user])

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>
}

export function useSocket() {
  return useContext(SocketContext)
}
