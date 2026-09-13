import {
  createContext,
  useContext,
  useState,
  useEffect,
  type PropsWithChildren,
  useCallback,
} from 'react'
import { useNavigate } from 'react-router-dom'

import type { IAuthVerify, IUser, IUserProfile } from '@/types/models'
import { AUTH_ACCESS_KEY } from '@/consts/storage'
import { me } from '@/api/auth'

type IAuthContextType = {
  user: IUser | null
  loading: boolean
  login: (payload: IAuthVerify) => Promise<void>
  logout: () => void
  updateAuthProfile: (profile: IUserProfile) => void
}

const AuthContext = createContext<IAuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate()

  const [user, setUser] = useState<IUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const login = async (payload: IAuthVerify) => {
    setUser(payload.user)
    localStorage.setItem(AUTH_ACCESS_KEY, payload.access_token)

    setTimeout(() => {
      navigate('/')
    }, 1500)
  }

  const logout = () => {
    localStorage.removeItem(AUTH_ACCESS_KEY)
    setUser(null)
  }

  const updateAuthProfile = useCallback((profile: IUserProfile) => {
    setUser((prev) => {
      if (!prev) return prev
      return { ...prev, profile }
    })
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(AUTH_ACCESS_KEY)

    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(AUTH_ACCESS_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, updateAuthProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth should be inside AuthProvider')
  }
  return context
}
