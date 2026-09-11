import { useCallback, useEffect, useState } from 'react'

import { getRooms } from '@/api/room'
import type { IRoom } from '@/types/models'
import handleError from '@/utils/handleError'
import { Button } from '@/components/ui/button'
import CreateRoomModal from '@/components/CreateRoomModal'

import Room from './components/Room'

type IRoomProps = {
  roomId: string | null
  setRoomId: (payload: string | null) => void
}

const Rooms = ({ roomId, setRoomId }: IRoomProps) => {
  const [rooms, setRooms] = useState<IRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState(false)

  const fetchRooms = useCallback(() => {
    return getRooms()
      .then(setRooms)
      .catch(handleError)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  if (loading) {
    return (
      <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
        loading...
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col gap-3'>
      <div className='flex justify-between gap-2'>
        <h2 className="mb-4 text-lg font-semibold">Rooms</h2>
        <Button type='button' size='sm' onClick={() => setEdit(true)}>
          Create
        </Button>
      </div>

      <CreateRoomModal open={edit} onClose={() => setEdit(false)} onSuccess={fetchRooms} />

      {!rooms.length ? (
        <div className='flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground'>
          <p>No rooms yet</p>
          <p className='text-xs'>Create the first one</p>
        </div>
      ) : (
        <ul className='flex flex-1 flex-col gap-2 overflow-y-auto pr-1'>
          {rooms.map((room) => (
            <li key={room.id}>
              <Room room={room} isActive={roomId === room.id} onSelect={setRoomId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Rooms
