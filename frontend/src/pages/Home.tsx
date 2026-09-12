import { useCallback, useEffect, useState } from 'react'

import Rooms from '@/components/Rooms'
import ActiveRoom from '@/components/ActiveRoom'
import type { IRoom } from '@/types/models'
import { getRooms } from '@/api/room'
import handleError from '@/utils/handleError'

function Home() {
  const [roomId, setRoomId] = useState<string | null>(null)

  const [rooms, setRooms] = useState<IRoom[]>([])
  const [roomsLoading, setRroomsLoading] = useState(true)

  const fetchRooms = useCallback(() => {
    getRooms()
      .then(setRooms)
      .catch(handleError)
      .finally(() => setRroomsLoading(false))
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  return (
    <div className='flex h-[calc(100vh-8rem)] gap-4'>
      <aside className='flex w-64 shrink-0 flex-col rounded-xl border bg-card p-4 shadow-sm'>
        <Rooms
          roomId={roomId}
          setRoomId={setRoomId}
          loading={roomsLoading}
          rooms={rooms}
          fetchRooms={fetchRooms}
        />
      </aside>

      <main className='flex flex-1 flex-col rounded-xl border bg-card p-4 shadow-sm'>
        {roomId ? (
          <ActiveRoom roomId={roomId} setRoomId={setRoomId} fetchRooms={fetchRooms} />
        ) : (
          <div className='flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground'>
            <p className='text-sm font-medium'>Select a room</p>
            <p className='text-xs'>or create a new one</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default Home
