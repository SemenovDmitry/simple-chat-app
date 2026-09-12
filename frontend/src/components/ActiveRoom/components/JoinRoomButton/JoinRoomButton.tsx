import { useState } from 'react'
import { Loader2, LogIn } from 'lucide-react'

import { joinRoom } from '@/api/room'
import handleError from '@/utils/handleError'
import { Button } from '@/components/ui/button'

type JoinRoomButtonProps = {
  roomId: string
  onSuccess?: () => void
}

const JoinRoomButton = ({ roomId, onSuccess }: JoinRoomButtonProps) => {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    try {
      setLoading(true)
      await joinRoom(roomId)
      onSuccess?.()
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type='button'
      size='sm'
      onClick={handleClick}
      disabled={loading}
      className='shrink-0 cursor-pointer'
    >
      {loading ? (
        <Loader2 className='mr-2 size-4 animate-spin' />
      ) : (
        <LogIn className='mr-2 size-4' />
      )}
      Join
    </Button>
  )
}

export default JoinRoomButton