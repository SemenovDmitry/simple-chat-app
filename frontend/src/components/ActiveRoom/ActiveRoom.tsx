import { useEffect, useState } from 'react'
import { getRoom } from '@/api/room'
import type { IRoom } from '@/types/models'
import handleError from '@/utils/handleError'
import { Badge } from '@/components/ui/badge'

type ActiveRoomProps = {
  roomId: string
}

const ActiveRoom = ({ roomId }: ActiveRoomProps) => {
  const [room, setRoom] = useState<IRoom | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setRoom(null)

    getRoom(roomId)
      .then(setRoom)
      .catch(handleError)
      .finally(() => setLoading(false))
  }, [roomId])

  if (loading) {
    return (
      <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
        Loading room...
      </div>
    )
  }

  if (!room) {
    return (
      <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
        Room not found
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col'>
      <header className='flex items-start justify-between gap-3 border-b pb-4'>
        <div className='min-w-0 space-y-1'>
          <div className='flex items-center gap-2'>
            <h2 className='truncate text-lg font-semibold tracking-tight'>{room.name}</h2>

            {room.is_private ? (
              <span className='inline-flex items-center rounded-full border border-dashed border-muted-foreground/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground'>
                private
              </span>
            ) : (
              <span className='inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary'>
                public
              </span>
            )}
          </div>

          {room.description && (
            <p className='text-sm text-muted-foreground line-clamp-2'>{room.description}</p>
          )}
        </div>
      </header>

      <div className='flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground'>
        <p className='text-sm font-medium'>No messages yet</p>
        <p className='text-xs'>Start the conversation</p>
      </div>

      <div className='border-t pt-4'>
        <div className='flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'>
          Message input will be here...
        </div>
      </div>
    </div>
  )
}

export default ActiveRoom
