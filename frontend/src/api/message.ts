import type { IMessage } from '@/types/models'

import { request } from './utils'

export type IMessageUser = {
  id: string
  username: string
  color: string
}

export type IMessageWithUser = IMessage & {
  user: IMessageUser | null
}

export type IMessagesPage = {
  items: IMessageWithUser[]
  hasMore: boolean
}

export function getMessages(
  roomId: string,
  params?: { before?: string; limit?: number }
): Promise<IMessagesPage> {
  const search = new URLSearchParams()
  if (params?.before) search.set('before', params.before)
  if (params?.limit) search.set('limit', String(params.limit))

  const qs = search.toString()
  return request<IMessagesPage>(`/rooms/${roomId}/messages${qs ? `?${qs}` : ''}`)
}

export function createMessage(roomId: string, content: string): Promise<IMessageWithUser> {
  return request<IMessageWithUser>(`/rooms/${roomId}/messages`, {
    method: 'POST',
    body: { content },
  })
}