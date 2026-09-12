import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Settings } from 'lucide-react'

import { getRoom, getRoomMembers } from '@/api/room'
import {
  createMessage,
  getMessages,
  type IMessageWithUser,
} from '@/api/message'
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
import { useSocket } from '@/contexts/SocketContext'

import EditRoomModal from '../UpdateRoomModal'
import DeleteRoomDialog from './components/DeleteRoomDialog'
import JoinRoomButton from './components/JoinRoomButton'
import LeaveRoomDialog from './components/LeaveRoomDialog'
import MessageInput from './components/MessageInput'
import MessageList from './components/MessageList'


type ActiveRoomProps = {
  roomId: string
  setRoomId: React.Dispatch<React.SetStateAction<string | null>>
  fetchRooms: () => void
}

const PAGE_SIZE = 20
const NEAR_BOTTOM_PX = 80

const ActiveRoom = ({ roomId, setRoomId, fetchRooms }: ActiveRoomProps) => {
  const { user } = useAuth()
  const { socket, connected } = useSocket()

  const [room, setRoom] = useState<IRoom | null>(null)
  const [members, setMembers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [messages, setMessages] = useState<IMessageWithUser[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)

  const isOwner = room?.owner_id === user?.id
  const isMember = user ? members.includes(user.id) : false

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)
  const snapshotRef = useRef<{ height: number; top: number } | null>(null)

  const isNearBottom = () => {
    const el = scrollRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
  }

  // ---- Загрузка комнаты и участников ----
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

  // ---- Загрузка истории сообщений ----
  useEffect(() => {
    if (!isMember) {
      setMessages([])
      setHasMore(false)
      return
    }

    let ignore = false
    setMessagesLoading(true)
    setMessages([])

    getMessages(roomId, { limit: PAGE_SIZE })
      .then(({ items, hasMore }) => {
        if (ignore) return
        // На всякий случай сортируем — на случай race REST vs socket
        items.sort((a, b) => a.created_at.localeCompare(b.created_at))
        setMessages(items)
        setHasMore(hasMore)
        atBottomRef.current = true
      })
      .catch((err) => {
        if (!ignore) handleError(err)
      })
      .finally(() => {
        if (!ignore) setMessagesLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [roomId, isMember])

  // ---- Socket: join/leave комнаты ----
  useEffect(() => {
    if (!socket || !isMember) return

    const join = () => {
      socket.emit('room:join', roomId, (res) => {
        if (!res?.ok) console.warn('[socket] room:join failed:', res?.error)
      })
    }

    join()
    socket.on('connect', join)

    return () => {
      socket.off('connect', join)
      socket.emit('room:leave', roomId)
    }
  }, [socket, isMember, roomId])

  // ---- Socket: приём новых сообщений ----
  useEffect(() => {
    if (!socket) return

    const onNew = (msg: IMessageWithUser) => {
      const fromMe = msg.user_id === user?.id
      if (!fromMe) atBottomRef.current = isNearBottom()

      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        const next = [...prev, msg]
        next.sort((a, b) => a.created_at.localeCompare(b.created_at))
        return next
      })
    }

    socket.on('message:new', onNew)
    return () => {
      socket.off('message:new', onNew)
    }
  }, [socket, user?.id])

  // ---- Скролл: вниз при новом, восстановление позиции при prepend ----
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return

    if (snapshotRef.current) {
      const delta = el.scrollHeight - snapshotRef.current.height
      el.scrollTop = snapshotRef.current.top + delta
      snapshotRef.current = null
      return
    }

    if (atBottomRef.current) {
      el.scrollTop = el.scrollHeight
      bottomRef.current?.scrollIntoView({ behavior: 'auto' })
    }
  }, [messages.length])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return

    atBottomRef.current = isNearBottom()

    if (el.scrollTop < 60 && hasMore && !loadingOlder && !messagesLoading && messages.length) {
      handleLoadOlder()
    }
  }

  const handleLoadOlder = useCallback(async () => {
    const el = scrollRef.current
    if (!el || !messages.length) return

    snapshotRef.current = { height: el.scrollHeight, top: el.scrollTop }
    setLoadingOlder(true)
    try {
      const { items, hasMore } = await getMessages(roomId, {
        before: messages[0].created_at,
        limit: PAGE_SIZE,
      })
      setMessages((prev) => {
        const map = new Map(prev.map((m) => [m.id, m]))
        for (const m of items) if (!map.has(m.id)) map.set(m.id, m)
        const next = [...map.values()]
        next.sort((a, b) => a.created_at.localeCompare(b.created_at))
        return next
      })
      setHasMore(hasMore)
    } catch (err) {
      snapshotRef.current = null
      handleError(err)
    } finally {
      setLoadingOlder(false)
    }
  }, [messages, roomId])

  const handleSend = async (content: string) => {
    try {
      const created = await createMessage(roomId, content)
      atBottomRef.current = true
      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev
        const next = [...prev, created]
        next.sort((a, b) => a.created_at.localeCompare(b.created_at))
        return next
      })
    } catch (err) {
      handleError(err)
      throw err
    }
  }

  const refreshMembership = () => {
    getRoomMembers(roomId)
      .then((m) => setMembers(m.map((x) => x.user_id)))
      .catch(handleError)
  }

  // ---- Ранние возвраты ----
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

  return (
    <div className='flex h-full min-h-0 flex-col'>
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

            {isMember && (
              <span
                className={
                  connected
                    ? 'inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600'
                    : 'inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground'
                }
                title={connected ? 'Connected' : 'Connecting…'}
              >
                <span
                  className={
                    connected
                      ? 'size-1.5 rounded-full bg-emerald-500'
                      : 'size-1.5 rounded-full bg-muted-foreground'
                  }
                />
                {connected ? 'live' : 'offline'}
              </span>
            )}
          </div>

          {room.description && (
            <p className='line-clamp-2 text-sm text-muted-foreground'>{room.description}</p>
          )}
        </div>

        {canJoin && <JoinRoomButton roomId={room.id} onSuccess={refreshMembership} />}

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
              {isOwner ? (
                <>
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className='text-destructive focus:text-destructive'
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              ) : (
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
        onSuccess={(updated) =>
          setRoom((prev) => (prev ? { ...prev, ...updated } : updated))
        }
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
        onSuccess={() => {
          setRoomId(null)
          fetchRooms()
        }}
      />

      {/* Messages */}
      {isMember ? (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className='flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-4 pr-1'
        >
          {messagesLoading ? (
            <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
              Loading messages...
            </div>
          ) : !messages.length ? (
            <div className='flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground'>
              <p className='text-sm font-medium'>No messages yet</p>
              <p className='text-xs'>Start the conversation</p>
            </div>
          ) : (
            <>
              {loadingOlder && (
                <div className='py-1 text-center text-xs text-muted-foreground'>
                  Loading older…
                </div>
              )}
              {!hasMore && messages.length > PAGE_SIZE && (
                <div className='py-1 text-center text-xs text-muted-foreground'>
                  Beginning of the conversation
                </div>
              )}
              <MessageList messages={messages} currentUserId={user?.id ?? null} />
            </>
          )}
          <div ref={bottomRef} />
        </div>
      ) : (
        <div className='flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground'>
          <p className='text-sm font-medium'>
            {room.is_private ? 'Private room' : 'Join the room to read messages'}
          </p>
          <p className='text-xs'>
            {room.is_private
              ? 'Ask the owner for an invite'
              : 'Press Join to become a member'}
          </p>
        </div>
      )}

      {isMember && <MessageInput onSend={handleSend} disabled={!connected} />}
    </div>
  )
}

export default ActiveRoom