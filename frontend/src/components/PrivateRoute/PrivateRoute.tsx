import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'

const PrivateRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100dvh - 5rem)',
        }}
      >
        <p>Загрузка приложения...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={'/login'} replace />
  }

  if (!user.profile) {
    return <Navigate to={'/profile'} />
  }

  return <Outlet />
}

export default PrivateRoute
