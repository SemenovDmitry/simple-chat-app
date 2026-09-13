import { useEffect, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { verifyToken } from '@/api/auth'

function VerifyToken() {
  const { login } = useAuth()

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  )

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')

    if (!accessToken) {
      setStatus('error')
      return
    }

    verifyToken(accessToken)
      .then((data) => {
        login(data)
        setStatus('success')
      })
      .catch((err) => {
        console.error('Auth error:', err)
        setStatus('error')
      })
  }, [])

  return (
    <div>
      {status === 'loading' && <p>Signing in… Please wait.</p>}
      {status === 'success' && <p>Signed in successfully! Redirecting…</p>}
      {status === 'error' && (
        <p>Authentication failed. The link has expired or is invalid.</p>
      )}
    </div>
  )
}

export default VerifyToken
