import type { IRoom } from '@/types/models'

type RoomProps = {
  room: IRoom
  isActive: boolean
  onSelect: (id: string) => void
}

const Room = ({ room, isActive, onSelect }: RoomProps) => {
  return (
    <button
      type='button'
      onClick={() => onSelect(room.id)}
      className={`
        group relative flex w-full cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2.5
        text-left transition-all duration-200
        ${
          isActive
            ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }
      `}
    >
      {isActive && (
        <div className='absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary' />
      )}

      <span
        className={`min-w-0 flex-1 truncate text-sm font-medium ${
          isActive ? 'text-primary' : ''
        }`}
      >
        {room.name}
      </span>
    </button>
  )
}

export default Room
