import type { IMessageWithUser } from '@/api/message'
import { cn } from '@/lib/utils'

type MessageListProps = {
  messages: IMessageWithUser[]
  currentUserId: string | null
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  return (
    <>
      {messages.map((m) => {
        const isOwn = m.user_id === currentUserId
        return (
          <div
            key={m.id}
            className={cn('flex flex-col gap-0.5', isOwn ? 'items-end' : 'items-start')}
          >
            <div className='flex items-center gap-2 px-1 text-[11px]'>
              <span
                className='font-medium'
                style={m.user?.color ? { color: m.user.color } : undefined}
              >
                {isOwn ? 'You' : m.user?.username ?? 'Unknown'}
              </span>
              <span className='text-muted-foreground'>{formatTime(m.created_at)}</span>
            </div>

            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap',
                isOwn
                  ? 'rounded-br-sm bg-primary text-primary-foreground'
                  : 'rounded-bl-sm bg-muted',
              )}
            >
              {m.content}
            </div>
          </div>
        )
      })}
    </>
  )
}

export default MessageList