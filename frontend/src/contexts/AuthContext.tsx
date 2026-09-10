import { createContext, useContext, useState, useEffect, type PropsWithChildren } from 'react'

import { BASE_URL } from '@/consts/api'
import type { IUser } from '@/types/models'
import { AUTH_ACCESS_KEY } from '@/consts/storage'

type IAuthContextType = {
  user: IUser | null
  loading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<IAuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<IUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const login = async (token: string) => {
    localStorage.setItem(AUTH_ACCESS_KEY, token)
  }

  const logout = () => {
    localStorage.removeItem(AUTH_ACCESS_KEY)
    setUser(null)
  }

  const checkAuth = async () => {
    const token = localStorage.getItem(AUTH_ACCESS_KEY)

    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setUser(result.data)
      } else {
        localStorage.removeItem(AUTH_ACCESS_KEY)
        setUser(null)
      }
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth должен использоваться внутри AuthProvider')
  }
  return context
}
