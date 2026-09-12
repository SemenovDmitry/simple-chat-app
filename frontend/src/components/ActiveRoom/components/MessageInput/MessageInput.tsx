import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type MessageInputProps = {
  onSend: (content: string) => Promise<void>
  disabled?: boolean
}

const MAX_LEN = 2000

const MessageInput = ({ onSend, disabled }: MessageInputProps) => {
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)

  const canSend = value.trim().length > 0 && !sending && !disabled

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const content = value.trim()
    if (!content || sending || disabled) return

    setSending(true)
    try {
      await onSend(content)
      setValue('')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex items-end gap-2 border-t pt-4'>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_LEN))}
        onKeyDown={handleKeyDown}
        placeholder='Write a message… (Enter — send, Shift+Enter — new line)'
        disabled={sending || disabled}
        rows={1}
        className='max-h-40 min-h-10 flex-1 resize-none'
      />

      <Button
        type='submit'
        size='icon'
        disabled={!canSend}
        className='shrink-0 cursor-pointer'
        aria-label='Send message'
      >
        {sending ? <Loader2 className='size-4 animate-spin' /> : <Send className='size-4' />}
      </Button>
    </form>
  )
}

export default MessageInput