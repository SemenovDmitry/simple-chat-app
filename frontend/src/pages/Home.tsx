import { useState } from 'react'

import Rooms from '@/components/Rooms'
import ActiveRoom from '@/components/ActiveRoom'

function Home() {
  const [roomId, setRoomId] = useState<string | null>(null)

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4 p-4">
      <aside className="flex w-64 shrink-0 flex-col rounded-xl border bg-card p-4 shadow-sm">
        <Rooms roomId={roomId} setRoomId={setRoomId} />
      </aside>

      <main className="flex flex-1 flex-col rounded-xl border bg-card p-4 shadow-sm">
        {roomId ? (
          <ActiveRoom roomId={roomId} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
            <p className="text-sm font-medium">Select a room</p>
            <p className="text-xs">or create a new one</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default Home