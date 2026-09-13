import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'

const PrivateRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className='flex min-h-[calc(100dvh-8rem)] items-center justify-center'>
        <p className='text-muted-foreground'>App loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' replace />
  }

  if (!user.profile) {
    return <Navigate to='/profile' />
  }

  return <Outlet />
}

export default PrivateRoute