import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate } from 'react-router-dom'

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
import { useAuth } from '@/contexts/AuthContext'
import { login } from '@/api/auth'
import getErrorMessage from '@/utils/getErrorMessage'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
})

type ILoginFormValues = z.infer<typeof loginSchema>

function Login() {
  const { user } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ILoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: ILoginFormValues) => {
    setIsLoading(true)
    setError(null)

    login(data)
      .then(() => setIsSuccess(true))
      .catch((err) => setError(getErrorMessage(err, 'Failed to send link')))
      .finally(() => setIsLoading(false))
  }

  if (user) {
    return <Navigate to='/' replace />
  }

  if (isSuccess) {
    return (
      <div className='flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background px-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>Check your email</CardTitle>
            <CardDescription>
              We've sent you a sign-in link. Open it to continue.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant='outline'
              className='w-full'
              onClick={() => setIsSuccess(false)}
            >
              Send again
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className='flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background px-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-2 text-center'>
          <CardTitle className='text-2xl font-bold'>Sign in to chat</CardTitle>
          <CardDescription>
            Enter your email — we'll send you a sign-in link
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className='space-y-4'>
            <div className='mb-4 space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='you@example.com'
                disabled={isLoading}
                {...register('email')}
              />
              {errors.email && (
                <p className='text-sm text-destructive'>
                  {errors.email.message}
                </p>
              )}
            </div>

            {error && (
              <p className='text-center text-sm text-destructive'>{error}</p>
            )}
          </CardContent>

          <CardFooter>
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? 'Sending…' : 'Get link'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default Login
