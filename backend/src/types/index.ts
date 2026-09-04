export type IUserStatus = 'online' | 'offline' | 'away' // where to use?

export type IUser = {
  id: string
  email: string
  username: string
  created_at: string
  updated_at: string
}

export type IRoom = {
  id: string
  owner_id: string
  name: string
  description: string
  is_private: boolean
  created_at: string
}

export type IRoomMember = {
  room_id: string
  user_id: string
}

export type IMessage = {
  id: string
  room_id: string
  user_id: string | null
  content: string
  created_at: string
}

export type IApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total?: number
    nextCursor?: string | null
    hasMore?: boolean
  }
}
