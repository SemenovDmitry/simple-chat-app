import React, { createContext, useContext, useState, useEffect } from 'react'

import { BASE_URL } from '@/consts/api'

interface User {
  id: string
  email: string
  metadata?: Record<string, any>
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Функция запроса данных пользователя с бэкенда
  const checkAuth = async () => {
    const token = localStorage.getItem('my_app_token')

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
        // Если токен невалиден или просрочен — чистим данные
        localStorage.removeItem('my_app_token')
        setUser(null)
      }
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (token: string) => {
    localStorage.setItem('my_app_token', token)
  }

  const logout = () => {
    localStorage.removeItem('my_app_token')
    setUser(null)
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
