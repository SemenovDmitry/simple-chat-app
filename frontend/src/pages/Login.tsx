import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BASE_URL } from '@/consts/api'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Некорректный email'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.message || 'Ошибка авторизации')
      }

      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Что-то пошло не так')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Проверьте почту</CardTitle>
            <CardDescription>
              Мы отправили вам ссылку для входа. Перейдите по ней, чтобы продолжить.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsSuccess(false)}
            >
              Отправить ещё раз
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">Вход в чат</CardTitle>
          <CardDescription>
            Введите email — мы пришлём ссылку для входа
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2 mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                disabled={isLoading}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Отправляем...' : 'Получить ссылку'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default Login