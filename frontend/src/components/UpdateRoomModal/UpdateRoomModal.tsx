import { useEffect, useState } from 'react'
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
import { updateRoom, type IUpdateRoom } from '@/api/room'
import type { IRoom } from '@/types/models'
import handleError from '@/utils/handleError'

const editRoomSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  description: z
    .string()
    .max(200, 'Description must be at most 200 characters')
    .optional(),
})

type IEditRoomFormInput = z.input<typeof editRoomSchema>
type IEditRoomFormOutput = z.output<typeof editRoomSchema>

type EditRoomModalProps = {
  open: boolean
  room: IRoom
  onClose: () => void
  onSuccess?: (data: IRoom) => void
}

const EditRoomModal = ({
  open,
  room,
  onClose,
  onSuccess,
}: EditRoomModalProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IEditRoomFormInput, any, IEditRoomFormOutput>({
    resolver: zodResolver(editRoomSchema),
    defaultValues: {
      name: room.name,
      description: room.description ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: room.name,
        description: room.description ?? '',
      })
      setError(null)
    }
  }, [open, room, reset])

  const handleClose = () => {
    if (loading) return
    setError(null)
    onClose()
  }

  const onEditRoom = async (data: IEditRoomFormOutput) => {
    setLoading(true)
    setError(null)

    try {
      const payload: IUpdateRoom = {
        name: data.name.trim(),
        description: data.description?.trim() || '',
      }

      const res = await updateRoom(room.id, payload)

      onClose()
      onSuccess?.(res)
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to update room'

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
          <DialogTitle>Edit room</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onEditRoom)}
          className='flex flex-col gap-4'
        >
          <div className='space-y-1.5'>
            <Label htmlFor='edit-name'>Name</Label>
            <Input
              id='edit-name'
              placeholder='Room name'
              disabled={loading}
              autoComplete='off'
              {...register('name')}
            />
            {errors.name && (
              <p className='text-xs text-destructive'>{errors.name.message}</p>
            )}
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='edit-description'>Description</Label>
            <Input
              id='edit-description'
              placeholder='Optional description'
              disabled={loading}
              autoComplete='off'
              {...register('description')}
            />
            {errors.description && (
              <p className='text-xs text-destructive'>
                {errors.description.message}
              </p>
            )}
          </div>

          {error && (
            <p className='rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive'>
              {error}
            </p>
          )}

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditRoomModal
