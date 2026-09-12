import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createRoom, type ICreateRoom } from '@/api/room'
import handleError from '@/utils/handleError'

const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
})

type ICreateRoomFormInput = z.input<typeof createRoomSchema>
type ICreateRoomFormOutput = z.output<typeof createRoomSchema>

type ICreateRoomModalProps = {
  open: boolean
  onClose: () => void
  onSuccess?: (data: ICreateRoom) => void
}

const CreateRoomModal = ({ open, onClose, onSuccess }: ICreateRoomModalProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ICreateRoomFormInput, any, ICreateRoomFormOutput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
    },
  })

  const handleClose = () => {
    if (loading) return
    reset()
    setError(null)
    onClose()
  }

  const onCreateRoom = async (data: ICreateRoomFormOutput) => {
    setLoading(true)
    setError(null)

    try {
      const payload: ICreateRoom = {
        name: data.name.trim(),
      }

      const res = await createRoom(payload)

      reset()
      onClose()
      onSuccess?.(res)
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to create room'

      setError(message)
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Create room</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onCreateRoom)} className='flex flex-col gap-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              placeholder='Room name'
              autoFocus
              disabled={loading}
              {...register('name')}
            />
            {errors.name && <p className='text-xs text-destructive'>{errors.name.message}</p>}
          </div>

          {error && (
            <p className='rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive'>
              {error}
            </p>
          )}

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button type='button' variant='outline' onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateRoomModal
