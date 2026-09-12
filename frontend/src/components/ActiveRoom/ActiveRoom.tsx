import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'

import { getRoom, getRoomMembers } from '@/api/room'
import type { IRoom } from '@/types/models'
import handleError from '@/utils/handleError'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

import EditRoomModal from '../UpdateRoomModal'
import DeleteRoomDialog from './components/DeleteRoomDialog'
import JoinRoomButton from './components/JoinRoomButton'
import LeaveRoomDialog from './components/LeaveRoomDialog'

type ActiveRoomProps = {
  roomId: string
  setRoomId: React.Dispatch<React.SetStateAction<string | null>>
  fetchRooms: () => void
}

const ActiveRoom = ({ roomId, setRoomId, fetchRooms }: ActiveRoomProps) => {
  const { user } = useAuth()

  const [room, setRoom] = useState<IRoom | null>(null)
  const [members, setMembers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)

  const isOwner = room?.owner_id === user?.id
  const isMember = user ? members.includes(user.id) : false

  useEffect(() => {
    let ignore = false

    setLoading(true)
    setRoom(null)
    setMembers([])
    setError(false)

    Promise.all([getRoom(roomId), getRoomMembers(roomId)])
      .then(([r, m]) => {
        if (ignore) return
        setRoom(r)
        setMembers(m.map((x) => x.user_id))
      })
      .catch((err) => {
        if (ignore) return
        setError(true)
        handleError(err)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [roomId])

  const refreshMembership = () => {
    getRoomMembers(roomId)
      .then((m) => setMembers(m.map((x) => x.user_id)))
      .catch(handleError)
  }

  const handleJoined = () => {
    refreshMembership()
    fetchRooms()
  }

  const handleLeft = () => {
    setRoomId(null)
    fetchRooms()
  }

  if (loading) {
    return (
      <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
        Loading room...
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
        Не удалось загрузить комнату
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

  const canJoin = !isMember && !room.is_private
  const canLeave = isMember && !isOwner

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
            <p className='line-clamp-2 text-sm text-muted-foreground'>{room.description}</p>
          )}
        </div>

        {canJoin && <JoinRoomButton roomId={room.id} onSuccess={handleJoined} />}

        {isMember && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='size-8 shrink-0 cursor-pointer'
                  aria-label='Room settings'
                >
                  <Settings className='size-4' />
                </Button>
              }
            />

            <DropdownMenuContent align='end'>
              {isOwner && (
                <>
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className='text-destructive focus:text-destructive'
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              )}

              {canLeave && (
                <DropdownMenuItem
                  onClick={() => setLeaveOpen(true)}
                  className='text-destructive focus:text-destructive'
                >
                  Leave
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <EditRoomModal
        open={editOpen}
        room={room}
        onClose={() => setEditOpen(false)}
        onSuccess={(updated) => setRoom((prev) => (prev ? { ...prev, ...updated } : updated))}
      />

      <DeleteRoomDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        roomId={room.id}
        roomName={room.name}
        onSuccess={() => {
          setRoomId(null)
          fetchRooms()
        }}
      />

      <LeaveRoomDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        roomId={room.id}
        roomName={room.name}
        onSuccess={handleLeft}
      />

      {/* Messages area */}
      {isMember ? (
        <div className='flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground'>
          <p className='text-sm font-medium'>No messages yet</p>
          <p className='text-xs'>Start the conversation</p>
        </div>
      ) : (
        <div className='flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground'>
          <p className='text-sm font-medium'>
            {room.is_private ? 'Private room' : 'Join the room to read messages'}
          </p>
          <p className='text-xs'>
            {room.is_private ? 'Ask the owner for an invite' : 'Press Join to become a member'}
          </p>
        </div>
      )}

      {/* Input stub — только для участников */}
      {isMember && (
        <div className='border-t pt-4'>
          <div className='pointer-events-none flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'>
            Message input will be here...
          </div>
        </div>
      )}
    </div>
  )
}

export default ActiveRoom
