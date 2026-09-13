import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'
import { createProfile, updateProfile } from '@/api/profile'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import handleError from '@/utils/handleError'

const profileSchema = z.object({
  username: z
    .string()
    .min(2, 'At least 2 characters')
    .max(30, 'At most 30 characters'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be in #RRGGBB format'),
})

type IProfileFormValues = z.infer<typeof profileSchema>

function Profile() {
  const navigate = useNavigate()

  const { user, updateAuthProfile } = useAuth()

  const isEdit = Boolean(user?.profile)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const defaultValues = useMemo(() => {
    return user?.profile
      ? {
          username: user?.profile.username,
          color: user?.profile.color,
        }
      : {
          username: user?.email.split('@')[0] || '',
          color: '#6366f1',
        }
  }, [user])

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<IProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: defaultValues,
  })

  const color = useWatch({ control, name: 'color' })
  const username = useWatch({ control, name: 'username' })

  const onSubmit = async (values: IProfileFormValues) => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (isEdit) {
        await updateProfile(values).then(updateAuthProfile).catch(handleError)
        setSuccess('Profile updated')
      } else {
        await createProfile(values)
        setSuccess('Profile created')
        setTimeout(() => navigate('/'), 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <p className='text-muted-foreground'>Sign in to manage your profile</p>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-md'>
      <Card>
        <CardHeader className='text-center'>
          <div className='mb-4 flex justify-center'>
            <Avatar className='h-15 w-15'>
              <AvatarFallback className='text-xl text-white'>
                {(username || '?').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle>{isEdit ? 'Edit profile' : 'Create profile'}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className='mb-4 space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='username'>Username</Label>
              <Input
                id='username'
                placeholder='username'
                disabled={saving}
                autoComplete='off'
                {...register('username')}
              />
              {errors.username && (
                <p className='text-sm text-destructive'>
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='color'>Color</Label>
              <div className='flex items-center gap-3'>
                <Input
                  id='color-picker'
                  type='color'
                  value={color}
                  onChange={(e) =>
                    setValue('color', e.target.value, { shouldValidate: true })
                  }
                  className='h-10 w-14 cursor-pointer p-1'
                  disabled={saving}
                />
                <Input
                  id='color'
                  placeholder='#6366f1'
                  disabled={saving}
                  {...register('color')}
                />
              </div>
              {errors.color && (
                <p className='text-sm text-destructive'>
                  {errors.color.message}
                </p>
              )}
            </div>

            {error && (
              <p className='text-center text-sm text-destructive'>{error}</p>
            )}
            {success && (
              <p className='text-center text-sm text-green-600'>{success}</p>
            )}
          </CardContent>

          <CardFooter className='flex flex-col gap-2'>
            <Button type='submit' className='w-full' disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save' : 'Create profile'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default Profile
