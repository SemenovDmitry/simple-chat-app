export type IUserStatus = 'online' | 'offline'

export type IUser = {
  id: string
  email: string
  profile?: IUserProfile | null
}

export type IUserProfile = {
  id: string
  username: string
  color: string
  created_at: string
  updated_at: string
}

export type IRoom = {
  id: string
  owner_id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export type IMessage = {
  id: string
  room_id: string
  user_id: string | null
  content: string
  created_at: string
}

export type IApiResponse<T> = {
  data: T
  message?: string
}
