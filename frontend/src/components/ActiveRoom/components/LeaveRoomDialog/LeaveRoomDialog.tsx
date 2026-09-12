import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { leaveRoom } from '@/api/room'
import handleError from '@/utils/handleError'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type ILeaveRoomDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: string
  roomName: string
  onSuccess: () => void
}

const LeaveRoomDialog = ({
  open,
  onOpenChange,
  roomId,
  roomName,
  onSuccess,
}: ILeaveRoomDialogProps) => {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async (event: React.MouseEvent) => {
    event.preventDefault()
    if (loading) return

    try {
      setLoading(true)
      await leaveRoom(roomId)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (loading) return
        onOpenChange(next)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Выйти из комнаты?</AlertDialogTitle>
          <AlertDialogDescription>
            Вы покинете комнату{' '}
            <span className='font-medium text-foreground'>«{roomName}»</span>. История
            сообщений сохранится, но вы перестанете получать новые и видеть участников,
            пока не присоединитесь снова.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Отмена</AlertDialogCancel>

          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/40'
          >
            {loading && <Loader2 className='mr-2 size-4 animate-spin' />}
            Выйти
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default LeaveRoomDialog