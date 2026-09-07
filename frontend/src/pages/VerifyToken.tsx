import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'
import { BASE_URL } from '@/consts/api'

function VerifyToken() {
  const { login } = useAuth()

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash.substring(1)

    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const type = params.get('type') 

    if (!accessToken || !type) {
      console.error('Необходимые параметры отсутствуют в URL')
      setStatus('error')
      return
    }

    // 3. Отправляем запрос на ваш бэкенд
    const verifyToken = async () => {
      try {
        const response = await fetch(`${BASE_URL}/auth/verify`, {
          // укажите ваш порт бэкенда
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token_hash: accessToken, // передаем токен как hash
            type: type === 'magiclink' ? 'email' : type, // корректируем тип под Zod схему, если нужно ('email')
          }),
        })

        const result = await response.json()

        if (response.ok && result.success) {
          setStatus('success')
          console.log('Успешная авторизация:', result.data)
          login(result.data.access_token)
          navigate('/')
        } else {
          console.error('Ошибка бэкенда:', result.message)
          setStatus('error')
        }
      } catch (err) {
        console.error('Ошибка сети:', err)
        setStatus('error')
      }
    }

    verifyToken()
  }, [])

  return (
    <div>
      {status === 'loading' && <p>Авторизация... Пожалуйста, подождите.</p>}
      {status === 'success' && <p>Вход успешно выполнен! Перенаправление...</p>}
      {status === 'error' && <p>Ошибка авторизации. Ссылка устарела или недействительна.</p>}
    </div>
  )
}

export default VerifyToken
