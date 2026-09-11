import type { IRoom } from '@/types/models'

type RoomProps = {
  room: IRoom
  isActive: boolean
  onSelect: (id: string) => void
}

const Room = ({ room, isActive, onSelect }: RoomProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(room.id)}
      className={`
        group relative flex w-full cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2.5
        text-left transition-all duration-200
        ${
          isActive
            ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20'
            : room.is_private
              ? 'border-dashed border-muted-foreground/40 hover:border-muted-foreground/70 hover:bg-muted/40'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }
      `}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary" />
      )}

      {room.is_private && (
        <span className="absolute -right-1 -top-1 inline-flex items-center rounded-full border border-muted-foreground/30 bg-background px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground shadow-sm">
          private
        </span>
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